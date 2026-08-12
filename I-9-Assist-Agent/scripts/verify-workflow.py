#!/usr/bin/env python3
"""End-to-end verification: Document A/B live analysis sync on :8765"""
from __future__ import annotations

import json
import re
import shutil
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765/"
OUT = Path("/opt/cursor/artifacts/verify")
OUT.mkdir(parents=True, exist_ok=True)

results: list[dict] = []


def assert_(name: str, cond: bool, detail: str = "") -> None:
    results.append({"name": name, "ok": bool(cond), "detail": detail})
    print(f"{'PASS' if cond else 'FAIL'}: {name}" + (f" — {detail}" if detail else ""))


def pdf_stub(label: str) -> bytes:
    return f"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%% {label} live verify\n".encode()


def main() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="i9-verify-"))
    # Master/Employee/files — matches fileImport packagesFromFiles (>=3 path parts)
    emp = tmp / "LiveMaster" / "Verify_Employee_Live"
    emp.mkdir(parents=True)
    (emp / "Form_I-9.pdf").write_bytes(pdf_stub("Form_I-9_A"))
    (emp / "receipt_only.pdf").write_bytes(pdf_stub("receipt_B"))
    (emp / "unknown_memo.pdf").write_bytes(pdf_stub("memo_C"))

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path="/usr/local/bin/google-chrome",
            args=["--no-sandbox", "--disable-gpu"],
        )
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("dialog", lambda d: d.accept())

        try:
            page.goto(BASE, wait_until="networkidle")
            page.screenshot(path=str(OUT / "01-empty.png"), full_page=True)

            page.click('[data-action="import"]')
            page.wait_for_selector('[data-overlay="import"]')
            page.fill("#org-name", "Live Verify Org")

            # Use file input with webkitRelativePath via set_input_files on folder input
            import base64

            payloads = [
                ("Form_I-9.pdf", "LiveMaster/Verify_Employee_Live/Form_I-9.pdf", pdf_stub("Form_I-9_A")),
                ("receipt_only.pdf", "LiveMaster/Verify_Employee_Live/receipt_only.pdf", pdf_stub("receipt_B")),
                ("unknown_memo.pdf", "LiveMaster/Verify_Employee_Live/unknown_memo.pdf", pdf_stub("memo_C")),
            ]
            files_js = [
                {
                    "baseName": name,
                    "rel": rel,
                    "b64": base64.b64encode(buf).decode("ascii"),
                }
                for name, rel, buf in payloads
            ]
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
            page.wait_for_timeout(400)
            page.wait_for_selector(".folder-row", timeout=15000)
            page.screenshot(path=str(OUT / "02-import.png"), full_page=True)
            page.click("[data-initiate]")

            page.wait_for_selector('[data-overlay="confirm"]', timeout=8000)
            page.click("[data-confirm]")

            page.wait_for_selector("text=Completed", timeout=45000)
            page.wait_for_timeout(600)

            if page.locator("button:has-text('VIEW AUDIT')").count():
                page.locator("button:has-text('VIEW AUDIT')").first.click()
                page.wait_for_timeout(400)

            page.screenshot(path=str(OUT / "03-audit.png"), full_page=True)

            assert_("Employee note button present", page.locator("[data-note]").count() > 0)
            page.locator("[data-note]").first.click()
            page.wait_for_selector(".analysis-doc-block", timeout=10000)
            page.screenshot(path=str(OUT / "04-assist.png"), full_page=True)

            chips = page.locator("[data-analysis-doc]")
            chip_count = chips.count()
            assert_("Document chips rendered", chip_count >= 2, f"count={chip_count}")

            chip_meta = []
            for i in range(chip_count):
                chip_meta.append(
                    {
                        "id": chips.nth(i).get_attribute("data-analysis-doc"),
                        "label": chips.nth(i).inner_text().strip(),
                    }
                )

            idx_a = next(
                (
                    i
                    for i, c in enumerate(chip_meta)
                    if "form_i-9" in c["label"].lower() or "i-9" in c["label"].lower()
                ),
                -1,
            )
            idx_b = next((i for i, c in enumerate(chip_meta) if "receipt" in c["label"].lower()), -1)
            assert_("Found Form I-9 chip (A)", idx_a >= 0, json.dumps(chip_meta))
            assert_("Found receipt chip (B)", idx_b >= 0, json.dumps(chip_meta))

            if idx_a >= 0:
                chips.nth(idx_a).click()
                page.wait_for_timeout(350)
                bound_a = page.get_attribute("[data-bound-document-id]", "data-bound-document-id")
                section_a = page.get_attribute("section[data-document-id]", "data-document-id")
                count_text = page.locator("[data-count-check]").inner_text()
                m = re.search(r"Showing\s+(\d+)\s+finding", count_text)
                count_a = int(m.group(1)) if m else -1
                titles_a = page.locator(".err-table tbody tr strong").all_inner_texts()
                assert_("Viewer bound to Document A", bound_a == chip_meta[idx_a]["id"], f"bound={bound_a}")
                assert_(
                    "Section data-document-id is A",
                    section_a == chip_meta[idx_a]["id"],
                    f"section={section_a}",
                )
                assert_("Document A findings count parsed", count_a >= 0, count_text)
                page.screenshot(path=str(OUT / "05-doc-a.png"), full_page=True)

                if idx_b >= 0:
                    chips.nth(idx_b).click()
                    page.wait_for_timeout(350)
                    bound_b = page.get_attribute("[data-bound-document-id]", "data-bound-document-id")
                    section_b = page.get_attribute("section[data-document-id]", "data-document-id")
                    count_text_b = page.locator("[data-count-check]").inner_text()
                    m_b = re.search(r"Showing\s+(\d+)\s+finding", count_text_b)
                    count_b = int(m_b.group(1)) if m_b else -1
                    titles_b = page.locator(".err-table tbody tr strong").all_inner_texts()
                    assert_("Viewer bound to Document B", bound_b == chip_meta[idx_b]["id"], f"bound={bound_b}")
                    assert_("Section data-document-id is B", section_b == chip_meta[idx_b]["id"])
                    assert_("Document B has findings", count_b >= 1, count_text_b)
                    assert_(
                        "A/B findings differ or titles differ",
                        count_a != count_b or "|".join(titles_a) != "|".join(titles_b),
                        f"A={count_a} B={count_b}",
                    )
                    page.screenshot(path=str(OUT / "06-doc-b.png"), full_page=True)

                    chips.nth(idx_a).click()
                    page.wait_for_timeout(300)
                    rebound = page.get_attribute("[data-bound-document-id]", "data-bound-document-id")
                    assert_("Re-select A restores A binding", rebound == chip_meta[idx_a]["id"])

            assert_(
                "Purpose metadata row",
                page.locator(".info-table").filter(has_text="Purpose").count() > 0,
            )
            assert_(
                "Section-1 Errors heading",
                page.locator("h4", has_text="Section-1 Errors").count() > 0,
            )
            assert_(
                "Section 2 Errors heading",
                page.locator("h4", has_text="Section 2 Errors").count() > 0,
            )
            assert_("Recommendation boxes present", page.locator(".rec-box").count() >= 2)
            assert_("Start Correction CTA", page.locator("#start-correction").count() > 0)
            assert_("Live document block", page.locator(".analysis-doc-block").count() > 0)

            if idx_b >= 0:
                chips.nth(idx_b).click()
                page.wait_for_timeout(200)
                page.click("#start-correction")
                page.wait_for_selector(".assist-chat .bubble.bot", timeout=12000)
                bot = page.locator(".assist-chat .bubble.bot").last.inner_text()
                assert_("Agent responded with live recommendation", len(bot) > 20, bot[:120])
                page.screenshot(path=str(OUT / "07-agent.png"), full_page=True)

        except Exception as err:
            print("VERIFY ERROR", err)
            results.append({"name": "script_error", "ok": False, "detail": str(err)})
            try:
                page.screenshot(path=str(OUT / "error.png"), full_page=True)
            except Exception:
                pass
        finally:
            browser.close()
            shutil.rmtree(tmp, ignore_errors=True)

    failed = [r for r in results if not r["ok"]]
    (OUT / "results.json").write_text(json.dumps({"results": results, "failed": len(failed)}, indent=2))
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
