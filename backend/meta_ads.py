"""Meta (Facebook) Ads live pull via the Graph API.

Reads campaign-level insights + status for each configured ad account and upserts
them into the `ad_campaigns` collection (keyed by `meta_campaign_id`), so the Ads
dashboard shows real spend / revenue / ROAS instead of manual numbers.

Config (env / HF Space secrets):
- META_ACCESS_TOKEN     : a long-lived System User token with `ads_read`.
- META_AD_ACCOUNT_IDS   : comma-separated numeric account ids to sync
                          (e.g. "1641572743115552,2450927798578749").
- META_API_VERSION      : optional, defaults to v21.0.
- META_DATE_PRESET      : optional insights window, defaults to "maximum".
"""
import os
import re
from datetime import datetime, timezone
from typing import Optional

import httpx

import core

GRAPH = "https://graph.facebook.com"

# Meta objective → our OBJECTIVES vocabulary
_OBJECTIVE_MAP = {
    "OUTCOME_SALES": "conversion",
    "OUTCOME_LEADS": "leads",
    "OUTCOME_TRAFFIC": "traffic",
    "OUTCOME_AWARENESS": "awareness",
    "OUTCOME_ENGAGEMENT": "awareness",
    "LINK_CLICKS": "traffic",
    "CONVERSIONS": "conversion",
    "LEAD_GENERATION": "leads",
    "BRAND_AWARENESS": "awareness",
    "REACH": "awareness",
}
_STATUS_MAP = {"ACTIVE": "active", "PAUSED": "paused"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def is_configured() -> bool:
    return bool(os.environ.get("META_ACCESS_TOKEN") and _account_ids())


def _account_ids() -> list[str]:
    raw = os.environ.get("META_AD_ACCOUNT_IDS", "")
    return [a.strip().replace("act_", "") for a in re.split(r"[,\s]+", raw) if a.strip()]


def _num(v) -> float:
    try:
        return float(re.sub(r"[^\d.]", "", str(v)) or 0)
    except Exception:
        return 0.0


def _purchase_value(rows: Optional[list]) -> float:
    """Sum values in an actions/action_values list whose action_type is a purchase."""
    if not isinstance(rows, list):
        return 0.0
    total = 0.0
    for r in rows:
        at = str(r.get("action_type", ""))
        if "purchase" in at:
            total += _num(r.get("value"))
    return total


async def _fetch_account(client: httpx.AsyncClient, acct: str, token: str,
                         version: str, date_preset: str) -> list[dict]:
    """Return merged campaign dicts (metrics + status) for one ad account."""
    base = f"{GRAPH}/{version}/act_{acct}"
    # 1) campaign attributes (name, status, objective)
    meta_by_id: dict[str, dict] = {}
    camp_url = f"{base}/campaigns"
    params = {"fields": "id,name,effective_status,objective", "limit": 500, "access_token": token}
    while camp_url:
        r = await client.get(camp_url, params=params)
        r.raise_for_status()
        body = r.json()
        for c in body.get("data", []):
            meta_by_id[c["id"]] = c
        camp_url = (body.get("paging", {}) or {}).get("next")
        params = {}  # `next` already carries querystring

    # 2) campaign-level insights (spend, purchases, revenue, roas)
    insights: dict[str, dict] = {}
    ins_url = f"{base}/insights"
    params = {
        "level": "campaign",
        "fields": "campaign_id,campaign_name,spend,actions,action_values,purchase_roas,objective",
        "date_preset": date_preset,
        "limit": 500,
        "access_token": token,
    }
    while ins_url:
        r = await client.get(ins_url, params=params)
        r.raise_for_status()
        body = r.json()
        for row in body.get("data", []):
            insights[row.get("campaign_id")] = row
        ins_url = (body.get("paging", {}) or {}).get("next")
        params = {}

    out: list[dict] = []
    for cid, c in meta_by_id.items():
        ins = insights.get(cid, {})
        spend = _num(ins.get("spend"))
        revenue = _purchase_value(ins.get("action_values"))
        results = int(_purchase_value(ins.get("actions")))
        roas_rows = ins.get("purchase_roas")
        roas = _num(roas_rows[0]["value"]) if isinstance(roas_rows, list) and roas_rows else (
            round(revenue / spend, 2) if spend else 0.0)
        out.append({
            "meta_campaign_id": cid,
            "account_id": acct,
            "name": c.get("name", "") or ins.get("campaign_name", ""),
            "platform": "meta",
            "objective": _OBJECTIVE_MAP.get(c.get("objective", ""), "lainnya"),
            "status": _STATUS_MAP.get(c.get("effective_status", ""), "ended"),
            "spend": spend,
            "revenue": revenue,
            "results": results,
            "roas": roas,
        })
    return out


async def sync() -> dict:
    """Pull all configured accounts and upsert campaigns. Returns a summary."""
    token = os.environ.get("META_ACCESS_TOKEN")
    accts = _account_ids()
    if not token or not accts:
        raise RuntimeError("META_ACCESS_TOKEN / META_AD_ACCOUNT_IDS belum diset di server")
    version = os.environ.get("META_API_VERSION", "v21.0")
    date_preset = os.environ.get("META_DATE_PRESET", "maximum")

    synced, errors = 0, []
    async with httpx.AsyncClient(timeout=60) as client:
        for acct in accts:
            try:
                campaigns = await _fetch_account(client, acct, token, version, date_preset)
            except httpx.HTTPStatusError as e:
                detail = ""
                try:
                    detail = e.response.json().get("error", {}).get("message", "")
                except Exception:
                    detail = f"HTTP {e.response.status_code}"
                errors.append({"account_id": acct, "error": detail})
                continue
            except Exception as e:
                errors.append({"account_id": acct, "error": str(e)})
                continue
            for c in campaigns:
                await core.db.ad_campaigns.update_one(
                    {"meta_campaign_id": c["meta_campaign_id"]},
                    {
                        "$set": {**c, "source": "meta", "last_synced": _now(), "updated_at": _now()},
                        "$setOnInsert": {"id": c["meta_campaign_id"], "target_roas": 0,
                                         "client_name": "", "notes": "", "created_at": _now()},
                    },
                    upsert=True,
                )
                synced += 1
    return {"synced": synced, "accounts": len(accts), "errors": errors, "at": _now()}
