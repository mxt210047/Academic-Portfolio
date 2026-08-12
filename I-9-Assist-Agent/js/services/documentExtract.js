/**
 * Extract readable text from a live imported File (PDF / text / image / office).
 * Uses vendored pdf.js for PDFs. Does not invent content when extraction fails.
 */

let pdfjsLibPromise = null;

async function loadPdfJs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("../../vendor/pdf.min.mjs").then((mod) => {
      const pdfjs = mod.default || mod;
      if (pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "../../vendor/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
      }
      return pdfjs;
    });
  }
  return pdfjsLibPromise;
}

/** Fallback: pull printable strings from PDF content streams (no worker). */
function extractPdfTextFallback(bytes) {
  const decoder = new TextDecoder("latin1");
  const raw = decoder.decode(bytes);
  const chunks = [];

  // (...) Tj  and  (...) '
  const tjRe = /\((?:\\.|[^\\)])*\)\s*Tj/g;
  let m;
  while ((m = tjRe.exec(raw))) {
    chunks.push(unescapePdfString(m[0].replace(/\s*Tj$/, "")));
  }

  // [(...)...] TJ
  const TJRe = /\[(.*?)\]\s*TJ/gs;
  while ((m = TJRe.exec(raw))) {
    const inner = m[1];
    const parts = inner.match(/\((?:\\.|[^\\)])*\)/g) || [];
    for (const p of parts) chunks.push(unescapePdfString(p));
  }

  // Literal UTF-16 BE strings <FEFF...>
  const hexRe = /<([0-9A-Fa-f\s]+)>/g;
  while ((m = hexRe.exec(raw))) {
    const hex = m[1].replace(/\s+/g, "");
    if (hex.length < 4 || hex.length % 2) continue;
    try {
      const out = [];
      for (let i = 0; i < hex.length; i += 4) {
        const code = parseInt(hex.slice(i, i + 4), 16);
        if (code && code !== 0xfeff) out.push(String.fromCharCode(code));
      }
      const s = out.join("").trim();
      if (s.length > 1) chunks.push(s);
    } catch {
      /* ignore */
    }
  }

  return chunks.join(" ").replace(/\s+/g, " ").trim();
}

function unescapePdfString(token) {
  let s = token;
  if (s.startsWith("(") && s.endsWith(")")) s = s.slice(1, -1);
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

async function extractPdfWithPdfJs(bytes) {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) });
  const pdf = await loadingTask.promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const line = content.items.map((it) => ("str" in it ? it.str : "")).join(" ");
    pages.push(line);
  }
  return {
    text: pages.join("\n").replace(/\s+/g, " ").trim(),
    pageCount: pdf.numPages,
    method: "pdf.js",
  };
}

async function extractFromPdf(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  try {
    const viaJs = await extractPdfWithPdfJs(bytes);
    if (viaJs.text && viaJs.text.length >= 8) return { ...viaJs, ok: true };
    const fallback = extractPdfTextFallback(bytes);
    if (fallback.length >= 8) {
      return { text: fallback, pageCount: viaJs.pageCount || null, method: "pdf-stream-fallback", ok: true };
    }
    return {
      text: viaJs.text || fallback || "",
      pageCount: viaJs.pageCount || null,
      method: viaJs.method || "pdf",
      ok: Boolean((viaJs.text || fallback || "").trim()),
      uncertainty: "PDF opened but little or no extractable text (likely a scan/image-only PDF).",
    };
  } catch (err) {
    const fallback = extractPdfTextFallback(bytes);
    if (fallback.length >= 8) {
      return { text: fallback, pageCount: null, method: "pdf-stream-fallback", ok: true };
    }
    return {
      text: "",
      pageCount: null,
      method: "pdf-failed",
      ok: false,
      uncertainty: `PDF text extraction failed: ${err?.message || String(err)}`,
    };
  }
}

async function extractFromText(file) {
  const text = await file.text();
  return {
    text: (text || "").replace(/\u0000/g, "").trim(),
    pageCount: 1,
    method: "text",
    ok: Boolean((text || "").trim()),
    uncertainty: (text || "").trim() ? null : "Text file is empty.",
  };
}

async function extractFromDocx(file) {
  // Minimal DOCX: unzip XML and strip tags (no external unzip lib — use browser DecompressionStream if zip fails)
  try {
    const buf = await file.arrayBuffer();
    const text = await readDocxXmlText(buf);
    return {
      text: text.trim(),
      pageCount: null,
      method: "docx-xml",
      ok: Boolean(text.trim()),
      uncertainty: text.trim() ? null : "DOCX contained no readable text.",
    };
  } catch (err) {
    return {
      text: "",
      pageCount: null,
      method: "docx-failed",
      ok: false,
      uncertainty: `Office document text extraction failed: ${err?.message || String(err)}. Human review required.`,
    };
  }
}

async function readDocxXmlText(arrayBuffer) {
  // Prefer JSZip-free approach: scan for word/document.xml uncompressed is rare;
  // Use native CompressionStream only for gzip — for zip we parse local file headers.
  const bytes = new Uint8Array(arrayBuffer);
  const files = inflateZipEntries(bytes);
  const docXml = files["word/document.xml"];
  if (!docXml) throw new Error("word/document.xml not found in DOCX");
  const xml = new TextDecoder("utf-8").decode(docXml);
  return xml
    .replace(/<w:tab[^/]*\/>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");
}

/** Very small ZIP local-file reader for stored (method 0) and deflate (method 8) entries. */
function inflateZipEntries(bytes) {
  const out = {};
  let i = 0;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  while (i + 30 < bytes.length) {
    const sig = view.getUint32(i, true);
    if (sig !== 0x04034b50) break;
    const method = view.getUint16(i + 8, true);
    const compSize = view.getUint32(i + 18, true);
    const uncompSize = view.getUint32(i + 22, true);
    const nameLen = view.getUint16(i + 26, true);
    const extraLen = view.getUint16(i + 28, true);
    const name = new TextDecoder().decode(bytes.subarray(i + 30, i + 30 + nameLen));
    const dataStart = i + 30 + nameLen + extraLen;
    const dataEnd = dataStart + compSize;
    const compressed = bytes.subarray(dataStart, dataEnd);
    if (method === 0) {
      out[name] = compressed;
    } else if (method === 8 && typeof DecompressionStream !== "undefined") {
      // Sync inflate via Atomics wait not available — skip deflate entries here;
      // many simple docx writers store document.xml deflated. Use async path below.
      out[name] = { __deflate: compressed, uncompSize };
    }
    i = dataEnd;
  }
  return out;
}

async function materializeZip(files) {
  const result = {};
  for (const [name, val] of Object.entries(files)) {
    if (val && val.__deflate) {
      const ds = new DecompressionStream("deflate-raw");
      const stream = new Blob([val.__deflate]).stream().pipeThrough(ds);
      const ab = await new Response(stream).arrayBuffer();
      result[name] = new Uint8Array(ab);
    } else {
      result[name] = val;
    }
  }
  return result;
}

async function extractFromDocxAsync(file) {
  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const raw = inflateZipEntries(bytes);
    const files = await materializeZip(raw);
    const docXml = files["word/document.xml"];
    if (!docXml) throw new Error("word/document.xml not found");
    const xml = new TextDecoder("utf-8").decode(docXml);
    const text = xml
      .replace(/<w:tab[^/]*\/>/g, "\t")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
    return {
      text,
      pageCount: null,
      method: "docx-xml",
      ok: Boolean(text),
      uncertainty: text ? null : "DOCX contained no readable text.",
    };
  } catch (err) {
    return {
      text: "",
      pageCount: null,
      method: "docx-failed",
      ok: false,
      uncertainty: `Office document text extraction failed: ${err?.message || String(err)}. Human review required.`,
    };
  }
}

/**
 * Extract text content from a live File.
 * @param {File} file
 * @param {{ kind?: string, name?: string }} [meta]
 */
export async function extractDocumentContent(file, meta = {}) {
  if (!file) {
    return {
      text: "",
      pageCount: null,
      method: "none",
      ok: false,
      uncertainty: "No live file handle available for this document.",
      charCount: 0,
    };
  }

  const name = (meta.name || file.name || "").toLowerCase();
  const type = file.type || meta.type || "";
  const kind = meta.kind || "";

  let result;
  if (kind === "pdf" || type.includes("pdf") || name.endsWith(".pdf")) {
    result = await extractFromPdf(file);
  } else if (kind === "text" || type.startsWith("text/") || name.endsWith(".txt")) {
    result = await extractFromText(file);
  } else if (kind === "office" || name.endsWith(".docx") || type.includes("officedocument")) {
    result = await extractFromDocxAsync(file);
  } else if (kind === "image" || type.startsWith("image/")) {
    result = {
      text: "",
      pageCount: 1,
      method: "image-no-ocr",
      ok: false,
      uncertainty:
        "Image file detected. Browser OCR is not configured in this environment; human review of the image is required. Filename was not used as proof of contents.",
    };
  } else if (name.endsWith(".doc")) {
    result = {
      text: "",
      pageCount: null,
      method: "doc-legacy",
      ok: false,
      uncertainty: "Legacy .doc binary format is not text-extractable here. Convert to PDF/DOCX or review manually.",
    };
  } else {
    // Attempt text read as last resort
    try {
      const text = await file.text();
      const printable = (text || "").replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, "").trim();
      result = {
        text: printable.slice(0, 200000),
        pageCount: null,
        method: "binary-as-text",
        ok: printable.length >= 8,
        uncertainty: printable.length >= 8 ? null : "Could not extract meaningful text from this file type.",
      };
    } catch (err) {
      result = {
        text: "",
        pageCount: null,
        method: "unsupported",
        ok: false,
        uncertainty: `Unsupported file for automated extraction: ${err?.message || String(err)}`,
      };
    }
  }

  return {
    ...result,
    charCount: (result.text || "").length,
    extractedAt: new Date().toISOString(),
  };
}
