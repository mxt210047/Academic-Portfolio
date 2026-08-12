#!/usr/bin/env python3
"""
Verify CONTENT-based I-9 analysis (not filename heuristics).

1) Document A = Form I-9 text content → Form I-9 findings / classification
2) Document B = passport text content → supporting / different findings
3) Rename Document A file without changing bytes → substantive analysis must NOT flip solely due to name
"""
from __future__ import annotations

import base64
import json
import re
import shutil
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765/"
OUT = Path("/opt/cursor/artifacts/verify-content")
OUT.mkdir(parents=True, exist_ok=True)
results: list[dict] = []


def assert_(name: str, cond: bool, detail: str = "") -> None:
    results.append({"name": name, "ok": bool(cond), "detail": detail})
    print(f"{'PASS' if cond else 'FAIL'}: {name}" + (f" — {detail}" if detail else ""))


def pdf_with_text(lines: list[str]) -> bytes:
    """Minimal PDF with visible/extractable text operators."""
    # Build content stream
    y = 720
    ops = ["BT", "/F1 11 Tf"]
    for line in lines:
        safe = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        ops.append(f"1 0 0 1 50 {y} Tm ({safe}) Tj")
        y -= 16
    ops.append("ET")
    stream = "\n".join(ops).encode("latin1", errors="replace")
    objects = []
    objects.append(b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n")
    objects.append(b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n")
    objects.append(
        b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n"
    )
    objects.append(
        f"4 0 obj<< /Length {len(stream)} >>stream\n".encode() + stream + b"\nendstream\nendobj\n"
    )
    objects.append(b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n")

    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(len(out))
        out.extend(obj)
    xref_pos = len(out)
    out.extend(f"xref\n0 {len(offsets)}\n".encode())
    out.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        out.extend(f"{off:010d} 00000 n \n".encode())
    out.extend(
        f"trailer<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode()
    )
    return bytes(out)


I9_LINES = [
    "Employment Eligibility Verification",
    "Form I-9",
    "USCIS",
    "OMB No. 1615-0047",
    "Section 1. Employee Information and Attestation",
    "Last Name (Family Name) Smith",
    "First Name (Given Name) Ada",
    "Address (Street Number and Name) 1 Main St",
    "City or Town Austin",
    "State TX",
    "ZIP Code 78701",
    "Date of Birth 01/02/1990",
    "U.S. Social Security Number XXX-XX-1234",
    "Citizen of the United States",
    "Employee Signature Ada Smith",
    "Todays Date (mm/dd/yyyy) 03/01/2024",
    "Section 2. Employer Review and Verification",
    "Document Title Passport",
    "Issuing Authority USA",
    "Document Number P1234567",
    "Expiration Date 01/01/2030",
    "First day of employment 03/01/2024",
    "Signature of Employer Jane HR",
]

# Incomplete I-9 — missing signature / citizenship etc.
I9_INCOMPLETE = [
    "Employment Eligibility Verification",
    "Form I-9",
    "USCIS OMB No. 1615-0047",
    "Section 1. Employee Information and Attestation",
    "Last Name (Family Name)",
    "First Name (Given Name)",
    "Section 2. Employer Review and Verification",
]

PASSPORT_LINES = [
    "UNITED STATES OF AMERICA",
    "PASSPORT",
    "Type P",
    "Surname DOE",
    "Given Names JANE",
    "Nationality USA",
    "Date of birth 05/05/1988",
    "Date of issue 01/01/2020",
    "Date of expiration 01/01/2030",
    "Passport No 999998888",
]


def inject_files(page, files_js):
    page.evaluate(
        """(files) => {
          const input = document.querySelector('#folder-input');
          const dt = new DataTransfer();
          for (const f of files) {
            const bin = atob(f.b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            const file = new File([bytes], f.baseName, { type: 'application/pdf' });
            Object.defineProperty(file, 'webkitRelativePath', { value: f.rel });
            dt.items.add(file);
          }
          Object.defineProperty(input, 'files', { configurable: true, value: dt.files });
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }""",
        files_js,
    )


def run_flow(page, payloads, org="Content Verify Org"):
    page.goto(BASE, wait_until="networkidle")
    # Hard reset via reload to clear in-memory store
    page.goto(BASE + "?t=" + str(Path(tempfile.mktemp()).name), wait_until="networkidle")
    if page.locator('[data-action="import"]').count() == 0:
        # Already has audits — open import from list
        if page.locator("button:has-text('IMPORT I-9 DOCUMENTS')").count():
            page.locator("button:has-text('IMPORT I-9 DOCUMENTS')").first.click()
        else:
            page.goto(BASE, wait_until="networkidle")
            page.click('[data-action="import"]')
    else:
        page.click('[data-action="import"]')
    page.wait_for_selector('[data-overlay="import"]')
    page.fill("#org-name", org)
    inject_files(page, payloads)
    page.wait_for_selector(".folder-row", timeout=10000)
    page.click("[data-initiate]")
    page.wait_for_selector('[data-overlay="confirm"]', timeout=8000)
    page.click("[data-confirm]")
    page.wait_for_selector("text=Completed", timeout=60000)
    page.wait_for_timeout(500)
    if page.locator("button:has-text('VIEW AUDIT')").count():
        page.locator("button:has-text('VIEW AUDIT')").first.click()
        page.wait_for_timeout(300)
    # Open newest employee note (last row)
    page.locator("[data-note]").last.click()
    page.wait_for_selector(".analysis-doc-block", timeout=15000)


def main() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="i9-content-"))
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                executable_path="/usr/local/bin/google-chrome",
                args=["--no-sandbox", "--disable-gpu"],
            )
            page = browser.new_page(viewport={"width": 1440, "height": 900})
            page.on("dialog", lambda d: d.accept())

            try:
                pdf_a = pdf_with_text(I9_INCOMPLETE)
                pdf_b = pdf_with_text(PASSPORT_LINES)

                payloads = [
                    {
                        "baseName": "Form_I-9.pdf",
                        "rel": "LiveMaster/EmpA/Form_I-9.pdf",
                        "b64": base64.b64encode(pdf_a).decode("ascii"),
                    },
                    {
                        "baseName": "passport_scan.pdf",
                        "rel": "LiveMaster/EmpA/passport_scan.pdf",
                        "b64": base64.b64encode(pdf_b).decode("ascii"),
                    },
                ]

                run_flow(page, payloads, org="Content Verify Org A")
                page.screenshot(path=str(OUT / "01-assist.png"), full_page=True)

                chips = page.locator("[data-analysis-doc]")
                assert_("Document chips", chips.count() >= 2, f"count={chips.count()}")

                # Select Form I-9 (A)
                idx_a = next(
                    i
                    for i in range(chips.count())
                    if "i-9" in chips.nth(i).inner_text().lower() or "form" in chips.nth(i).inner_text().lower()
                )
                chips.nth(idx_a).click()
                page.wait_for_timeout(400)
                class_a = page.locator("tr:has(td:text('Content classification')) td >> nth=1").inner_text().strip()
                count_a_text = page.locator("[data-count-check]").inner_text()
                m_a = re.search(r"Showing\s+(\d+)", count_a_text)
                count_a = int(m_a.group(1)) if m_a else -1
                preview_a = page.locator("[data-extraction-preview]").inner_text() if page.locator("[data-extraction-preview]").count() else ""
                assert_("A classified as form_i9", class_a == "form_i9", class_a)
                assert_("A has content findings", count_a >= 1, count_a_text)
                assert_("A extraction preview has I-9 text", "Form I-9" in preview_a or "Employment Eligibility" in preview_a, preview_a[:120])
                page.screenshot(path=str(OUT / "02-doc-a.png"), full_page=True)

                # Select passport (B)
                idx_b = next(i for i in range(chips.count()) if "passport" in chips.nth(i).inner_text().lower())
                chips.nth(idx_b).click()
                page.wait_for_timeout(400)
                class_b = page.locator("tr:has(td:text('Content classification')) td >> nth=1").inner_text().strip()
                count_b_text = page.locator("[data-count-check]").inner_text()
                m_b = re.search(r"Showing\s+(\d+)", count_b_text)
                count_b = int(m_b.group(1)) if m_b else -1
                preview_b = page.locator("[data-extraction-preview]").inner_text() if page.locator("[data-extraction-preview]").count() else ""
                bound_b = page.get_attribute("[data-bound-document-id]", "data-bound-document-id")
                assert_("B classified as supporting_id", class_b == "supporting_id", class_b)
                assert_("Viewer bound to B", bool(bound_b))
                assert_("B extraction shows passport content", "PASSPORT" in preview_b or "passport" in preview_b.lower(), preview_b[:120])
                assert_("A/B classification differs", class_a != class_b, f"{class_a} vs {class_b}")
                page.screenshot(path=str(OUT / "03-doc-b.png"), full_page=True)

                # Widget: close existing agent → launcher → reopen with same document context
                if page.locator("[data-close-agent]").count():
                    page.locator("[data-close-agent]").click()
                    page.wait_for_timeout(200)
                assert_("Widget launcher after close", page.locator("[data-open-agent]").count() > 0)
                bound_before = page.get_attribute("[data-bound-document-id]", "data-bound-document-id")
                page.locator("[data-open-agent]").click()
                page.wait_for_selector("[data-ai-agent-panel]", timeout=5000)
                assert_("Agent panel reopened from widget", page.locator("[data-ai-agent-panel]").count() > 0)
                panel_doc = page.get_attribute("[data-ai-agent-panel]", "data-document-id")
                bound_after = page.get_attribute("[data-bound-document-id]", "data-bound-document-id")
                assert_("Widget reopen keeps document binding", bound_before == bound_after, f"{bound_before}→{bound_after}")
                assert_("Agent panel context documentId matches", panel_doc == bound_after, f"panel={panel_doc}")
                page.screenshot(path=str(OUT / "03b-widget.png"), full_page=True)

                # --- Rename test: same I-9 bytes, misleading filename ---
                page.goto(BASE, wait_until="networkidle")
                # New browser context for clean store
            except Exception as err:
                print("VERIFY ERROR phase1", err)
                results.append({"name": "script_error_phase1", "ok": False, "detail": str(err)})
                page.screenshot(path=str(OUT / "error1.png"), full_page=True)

            # Fresh page for rename test
            page2 = browser.new_page(viewport={"width": 1440, "height": 900})
            page2.on("dialog", lambda d: d.accept())
            try:
                pdf_same = pdf_with_text(I9_INCOMPLETE)
                # Misleading name — must still classify as form_i9 from CONTENT
                payloads_rename = [
                    {
                        "baseName": "random-notes-xyz.pdf",
                        "rel": "LiveMaster/EmpRename/random-notes-xyz.pdf",
                        "b64": base64.b64encode(pdf_same).decode("ascii"),
                    }
                ]
                run_flow(page2, payloads_rename, org="Rename Content Org")
                page2.wait_for_timeout(300)
                class_r = page2.locator("tr:has(td:text('Content classification')) td >> nth=1").inner_text().strip()
                preview_r = (
                    page2.locator("[data-extraction-preview]").inner_text()
                    if page2.locator("[data-extraction-preview]").count()
                    else ""
                )
                assert_(
                    "Rename test: still form_i9 from content",
                    class_r == "form_i9",
                    f"class={class_r} preview={preview_r[:80]}",
                )
                assert_(
                    "Rename test: extraction still has I-9 markers",
                    "Form I-9" in preview_r or "Employment Eligibility" in preview_r,
                    preview_r[:120],
                )
                page2.screenshot(path=str(OUT / "04-rename.png"), full_page=True)
            except Exception as err:
                print("VERIFY ERROR rename", err)
                results.append({"name": "script_error_rename", "ok": False, "detail": str(err)})
                try:
                    page2.screenshot(path=str(OUT / "error2.png"), full_page=True)
                except Exception:
                    pass
            finally:
                browser.close()
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    failed = [r for r in results if not r["ok"]]
    (OUT / "results.json").write_text(json.dumps({"results": results, "failed": len(failed)}, indent=2))
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
