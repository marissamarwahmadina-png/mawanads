"""Best-effort scrapers for crowdfunding platforms.

Reality: only sites that server-render campaign data (data present in the initial
HTML) can be scraped with a plain HTTP fetch. Client-rendered or bot-protected
sites need a headless browser or paid scraping API (not available here), so those
return a clear reason and fall back to manual entry.

Coverage:
- raihmimpi.id — __NEXT_DATA__ (httpx)
- niatbaik.id — server-rendered HTML (httpx)
- sharinghappiness.org — __NEXT_DATA__ (httpx)
- kawanbantu — aggressively anti-automation: returns a 404 shell to every
  non-warmed client (plain fetch AND headless/headful Chromium), so it can't be
  auto-scraped server-side. Falls back to manual entry.
"""
import re
import json
from typing import Optional
from urllib.parse import urlparse

import httpx

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def detect_platform(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()
    if "raihmimpi" in host:
        return "raihmimpi"
    if "niatbaik" in host:
        return "niatbaik"
    if "kawanbantu" in host:
        return "kawanbantu"
    if "sharinghappiness" in host:
        return "sharinghappiness"
    if "kitabisa" in host:
        return "kitabisa"
    return "lainnya"


async def _fetch(url: str) -> str:
    async with httpx.AsyncClient(headers=HEADERS, timeout=25, follow_redirects=True) as c:
        r = await c.get(url)
        r.raise_for_status()
        return r.text


def _next_data(html: str) -> Optional[dict]:
    m = re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except Exception:
        return None


def _num(v) -> float:
    try:
        if isinstance(v, str):
            v = re.sub(r"[^\d.]", "", v)
        return float(v or 0)
    except Exception:
        return 0


def _rp(v) -> int:
    """Parse an Indonesian-formatted amount (e.g. 'Rp 30.000.000') to an int.

    Dots are thousand separators here, so strip everything non-digit.
    """
    return int(re.sub(r"[^\d]", "", str(v)) or 0)


async def _scrape_raihmimpi(url: str) -> dict:
    nd = _next_data(await _fetch(url))
    if not nd:
        raise ValueError("Struktur halaman berubah (tidak ada __NEXT_DATA__)")
    camp = (nd.get("props", {}).get("pageProps", {}) or {}).get("campaign")
    if not camp:
        raise ValueError("Data campaign tidak ditemukan — pastikan ini link halaman campaign")
    return {
        "name": camp.get("CAMPAIGN_NAME", ""),
        "raised": _num(camp.get("TOTAL_DONASI")),
        "target": _num(camp.get("TARGET_DONASI_UANG")),
        "donor_count": int(_num(camp.get("TOTAL_DONATUR"))),
        "fundraiser_count": 0,
        "fundraiser": camp.get("NAMA_LENGKAP", "") or "",
    }


async def _scrape_niatbaik(url: str) -> dict:
    """niatbaik.id server-renders campaign figures straight into the HTML."""
    html = await _fetch(url)
    if "Bot Verification" in html or "d_total" not in html:
        raise ValueError("Halaman diproteksi anti-bot / bukan halaman campaign")
    raised = re.search(r'class="d_total"[^>]*>\s*Rp\s*([\d.]+)', html)
    target = re.search(r'd_target_text"[^>]*>.*?Rp\s*([\d.]+)', html, re.S)
    donor = re.search(r'Donatur\s*\(\s*(\d+)\s*\)', html, re.I)
    title = re.search(r'<title>\s*(?:Campaign\s*-\s*)?(.*?)\s*(?:\||</title)', html, re.I | re.S)
    if not raised and not target:
        raise ValueError("Angka donasi tidak ditemukan (struktur halaman berubah)")
    return {
        "name": (title.group(1).strip() if title else ""),
        "raised": _rp(raised.group(1)) if raised else 0,
        "target": _rp(target.group(1)) if target else 0,
        "donor_count": int(donor.group(1)) if donor else 0,
        "fundraiser_count": 0,
        "fundraiser": "",
    }


async def _scrape_sharinghappiness(url: str) -> dict:
    """sharinghappiness.org exposes the campaign in __NEXT_DATA__ pageProps.data.result."""
    nd = _next_data(await _fetch(url))
    if not nd:
        raise ValueError("Struktur halaman berubah (tidak ada __NEXT_DATA__)")
    result = (((nd.get("props", {}) or {}).get("pageProps", {}) or {}).get("data", {}) or {}).get("result")
    if not isinstance(result, dict):
        raise ValueError("Data campaign tidak ditemukan — pastikan ini link halaman campaign")
    return {
        "name": result.get("title", "") or "",
        "raised": _rp(result.get("collected")),
        "target": _rp(result.get("target")),
        "donor_count": int(_num(result.get("transaction_count"))),
        "fundraiser_count": 0,
        "fundraiser": "",
    }


def _deep_find(obj, needles, depth=0):
    """Best-effort: return first numeric/string value whose key matches any needle."""
    found = {}
    if depth > 7:
        return found
    if isinstance(obj, dict):
        for k, v in obj.items():
            kl = str(k).lower()
            for tag, pats in needles.items():
                if tag not in found and any(p in kl for p in pats) and isinstance(v, (int, float, str)):
                    found[tag] = v
            found.update({t: val for t, val in _deep_find(v, needles, depth + 1).items() if t not in found})
    elif isinstance(obj, list) and obj:
        for item in obj[:3]:
            found.update({t: val for t, val in _deep_find(item, needles, depth + 1).items() if t not in found})
    return found


async def _scrape_generic_next(url: str) -> dict:
    nd = _next_data(await _fetch(url))
    if not nd:
        raise ValueError("Data tidak tersedia di HTML (kemungkinan dimuat client-side)")
    pp = nd.get("props", {}).get("pageProps", {}) or {}
    hits = _deep_find(pp, {
        "name": ["campaign_name", "title", "judul", "name"],
        "raised": ["total_donasi", "collected", "terkumpul", "raised", "current_amount"],
        "target": ["target_donasi", "target", "goal", "fund_target"],
        "donor_count": ["total_donatur", "donor", "donatur", "supporter_count"],
    })
    if not hits.get("raised") and not hits.get("target"):
        raise ValueError("Angka donasi tidak ditemukan di HTML (kemungkinan client-side)")
    return {
        "name": str(hits.get("name", "") or ""),
        "raised": _num(hits.get("raised")),
        "target": _num(hits.get("target")),
        "donor_count": int(_num(hits.get("donor_count"))),
        "fundraiser_count": 0,
        "fundraiser": "",
    }


async def scrape(url: str) -> dict:
    """Return {ok, platform, data|error}. Never raises."""
    platform = detect_platform(url)
    try:
        if platform == "raihmimpi":
            data = await _scrape_raihmimpi(url)
        elif platform == "niatbaik":
            data = await _scrape_niatbaik(url)
        elif platform == "sharinghappiness":
            data = await _scrape_sharinghappiness(url)
        elif platform == "kawanbantu":
            return {"ok": False, "platform": platform,
                    "error": "KawanBantu memblokir akses non-browser (404 untuk fetch & headless) — belum bisa auto-scrape. Isi manual dulu."}
        else:
            data = await _scrape_generic_next(url)
        return {"ok": True, "platform": platform, "data": data}
    except httpx.HTTPStatusError as e:
        return {"ok": False, "platform": platform, "error": f"Situs menolak akses (HTTP {e.response.status_code})."}
    except Exception as e:
        return {"ok": False, "platform": platform, "error": f"Gagal ambil data: {e}"}
