"""Invoicing — generate client invoices (PDF) and monitor revenue (omzet)."""
import io
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import core

router = APIRouter(prefix="/api")

STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"]
STATUS_LABELS = {"draft": "Draft", "sent": "Terkirim", "paid": "Lunas", "overdue": "Jatuh Tempo", "cancelled": "Batal"}

COMPANY = {
    "name": "Mawana Corp",
    "tagline": "Digital Strategis untuk NGO & Brand",
    "email": "notifikasi@mawanads.com",
    "site": "mawanads.com",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def fmt_rp(n) -> str:
    return "Rp " + f"{int(round(n or 0)):,}".replace(",", ".")


class InvoiceItem(BaseModel):
    description: str
    qty: float = 1
    unit_price: float = 0


class InvoiceIn(BaseModel):
    client_id: Optional[str] = None
    client_name: str = ""
    client_detail: str = ""
    items: List[InvoiceItem] = []
    tax_percent: float = 0
    discount: float = 0
    status: str = "draft"
    issue_date: Optional[str] = None
    due_date: Optional[str] = None
    notes: str = ""


class InvoiceUpdate(BaseModel):
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    client_detail: Optional[str] = None
    items: Optional[List[InvoiceItem]] = None
    tax_percent: Optional[float] = None
    discount: Optional[float] = None
    status: Optional[str] = None
    issue_date: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None


def _compute(doc: dict) -> dict:
    items = doc.get("items", []) or []
    subtotal = sum((i.get("qty", 0) or 0) * (i.get("unit_price", 0) or 0) for i in items)
    tax = subtotal * (doc.get("tax_percent", 0) or 0) / 100.0
    total = subtotal + tax - (doc.get("discount", 0) or 0)
    doc["subtotal"] = round(subtotal, 2)
    doc["tax_amount"] = round(tax, 2)
    doc["total"] = round(total, 2)
    return doc


async def _next_number() -> str:
    year = datetime.now(timezone.utc).year
    count = await core.db.invoices.count_documents({"number": {"$regex": f"^INV/{year}/"}})
    return f"INV/{year}/{count + 1:03d}"


@router.get("/invoices")
async def list_invoices(_: dict = Depends(core.require_roles("owner", "admin")),
                        status: Optional[str] = None, client_id: Optional[str] = None):
    query: dict = {}
    if status:
        query["status"] = status
    if client_id:
        query["client_id"] = client_id
    return await core.db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(2000)


@router.get("/invoices/stats")
async def invoice_stats(_: dict = Depends(core.require_roles("owner", "admin"))):
    paid = outstanding = draft = 0.0
    by_status = {s: 0 for s in STATUSES}
    monthly: dict = {}
    async for inv in core.db.invoices.find({}, {"_id": 0, "status": 1, "total": 1, "issue_date": 1}):
        st = inv.get("status", "draft")
        by_status[st] = by_status.get(st, 0) + 1
        total = inv.get("total", 0) or 0
        if st == "paid":
            paid += total
            month = (inv.get("issue_date") or "")[:7]
            if month:
                monthly[month] = monthly.get(month, 0) + total
        elif st in ("sent", "overdue"):
            outstanding += total
        elif st == "draft":
            draft += total
    trend = [{"month": k, "revenue": v} for k, v in sorted(monthly.items())][-12:]
    return {"revenue_paid": paid, "outstanding": outstanding, "draft_value": draft,
            "by_status": by_status, "monthly": trend, "count": sum(by_status.values())}


@router.get("/invoices/{inv_id}")
async def get_invoice(inv_id: str, _: dict = Depends(core.require_roles("owner", "admin"))):
    inv = await core.db.invoices.find_one({"id": inv_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice tidak ditemukan")
    return inv


@router.post("/invoices")
async def create_invoice(body: InvoiceIn, user: dict = Depends(core.require_roles("owner", "admin"))):
    if body.status not in STATUSES:
        raise HTTPException(status_code=400, detail="Status tidak valid")
    doc = body.model_dump()
    doc["items"] = [i if isinstance(i, dict) else i for i in doc.get("items", [])]
    doc.update({"id": str(uuid.uuid4()), "number": await _next_number(),
                "created_by": user["id"], "created_at": _now(), "updated_at": _now()})
    if not doc.get("issue_date"):
        doc["issue_date"] = datetime.now(timezone.utc).date().isoformat()
    _compute(doc)
    await core.db.invoices.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/invoices/{inv_id}")
async def update_invoice(inv_id: str, body: InvoiceUpdate, _: dict = Depends(core.require_roles("owner", "admin"))):
    inv = await core.db.invoices.find_one({"id": inv_id})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice tidak ditemukan")
    if body.status and body.status not in STATUSES:
        raise HTTPException(status_code=400, detail="Status tidak valid")
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if update:
        update["updated_at"] = _now()
        if update.get("status") == "paid" and inv.get("status") != "paid":
            update["paid_at"] = _now()
        merged = {**inv, **update}
        _compute(merged)
        update["subtotal"] = merged["subtotal"]
        update["tax_amount"] = merged["tax_amount"]
        update["total"] = merged["total"]
        await core.db.invoices.update_one({"id": inv_id}, {"$set": update})
    return await core.db.invoices.find_one({"id": inv_id}, {"_id": 0})


@router.delete("/invoices/{inv_id}")
async def delete_invoice(inv_id: str, _: dict = Depends(core.require_roles("owner", "admin"))):
    await core.db.invoices.delete_one({"id": inv_id})
    return {"success": True}


@router.get("/invoices/{inv_id}/pdf")
async def invoice_pdf(inv_id: str, _: dict = Depends(core.require_roles("owner", "admin"))):
    inv = await core.db.invoices.find_one({"id": inv_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice tidak ditemukan")

    from fpdf import FPDF
    pdf = FPDF()
    pdf.add_page()
    # Header
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(8, 145, 178)
    pdf.cell(0, 10, COMPANY["name"], ln=True)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(120, 120, 120)
    pdf.cell(0, 5, COMPANY["tagline"], ln=True)
    pdf.cell(0, 5, f"{COMPANY['site']}  |  {COMPANY['email']}", ln=True)
    pdf.ln(4)
    pdf.set_draw_color(220, 220, 220)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(6)

    # Invoice meta
    pdf.set_text_color(20, 20, 20)
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 8, "INVOICE", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(95, 6, f"No: {inv.get('number', '-')}")
    pdf.cell(0, 6, f"Status: {STATUS_LABELS.get(inv.get('status'), inv.get('status'))}", ln=True)
    pdf.cell(95, 6, f"Tanggal: {inv.get('issue_date', '-')}")
    pdf.cell(0, 6, f"Jatuh tempo: {inv.get('due_date', '-') or '-'}", ln=True)
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "Ditagihkan kepada:", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, inv.get("client_name", "-") or "-", ln=True)
    for line in (inv.get("client_detail", "") or "").split("\n"):
        if line.strip():
            pdf.cell(0, 5, line.strip(), ln=True)
    pdf.ln(4)

    # Items table
    pdf.set_fill_color(241, 245, 249)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(95, 8, "Deskripsi", border=0, fill=True)
    pdf.cell(20, 8, "Qty", border=0, align="C", fill=True)
    pdf.cell(37, 8, "Harga", border=0, align="R", fill=True)
    pdf.cell(38, 8, "Jumlah", border=0, align="R", fill=True, ln=True)
    pdf.set_font("Helvetica", "", 10)
    for it in inv.get("items", []):
        amount = (it.get("qty", 0) or 0) * (it.get("unit_price", 0) or 0)
        pdf.cell(95, 8, str(it.get("description", ""))[:55])
        pdf.cell(20, 8, str(it.get("qty", 0)), align="C")
        pdf.cell(37, 8, fmt_rp(it.get("unit_price", 0)), align="R")
        pdf.cell(38, 8, fmt_rp(amount), align="R", ln=True)
    pdf.ln(2)
    pdf.line(115, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(2)

    def total_row(label, value, bold=False):
        pdf.set_font("Helvetica", "B" if bold else "", 11 if bold else 10)
        pdf.cell(115, 7, "")
        pdf.cell(37, 7, label, align="R")
        pdf.cell(38, 7, fmt_rp(value), align="R", ln=True)

    total_row("Subtotal", inv.get("subtotal", 0))
    if inv.get("tax_percent", 0):
        total_row(f"Pajak ({inv.get('tax_percent')}%)", inv.get("tax_amount", 0))
    if inv.get("discount", 0):
        total_row("Diskon", -inv.get("discount", 0))
    total_row("TOTAL", inv.get("total", 0), bold=True)

    if inv.get("notes"):
        pdf.ln(6)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(0, 5, "Catatan:", ln=True)
        pdf.set_font("Helvetica", "", 9)
        pdf.multi_cell(0, 5, inv.get("notes", ""))

    out = pdf.output(dest="S")
    data = bytes(out) if isinstance(out, (bytes, bytearray)) else out.encode("latin-1")
    filename = (inv.get("number", "invoice") or "invoice").replace("/", "-") + ".pdf"
    return StreamingResponse(io.BytesIO(data), media_type="application/pdf",
                             headers={"Content-Disposition": f'attachment; filename="{filename}"'})
