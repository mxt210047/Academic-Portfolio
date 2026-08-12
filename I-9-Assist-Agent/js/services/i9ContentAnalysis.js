/**
 * Content-based Form I-9 analysis rules.
 * Operates on extracted document text — NOT filenames.
 * Filename may be attached as metadata only.
 */

function severityFor(cls) {
  if (cls === "substantive") return "high";
  if (cls === "technical") return "medium";
  return "unknown";
}

export function makeFinding({
  id,
  section,
  cls,
  title,
  detail,
  documentId,
  documentName,
  field = null,
  detectedValue = null,
  recommendation = null,
  pageRef = null,
}) {
  return {
    id,
    section,
    class: cls,
    severity: severityFor(cls),
    title,
    detail,
    status: "open",
    documentId: documentId || null,
    documentName: documentName || null,
    field,
    detectedValue,
    recommendation,
    pageRef,
  };
}

const I9_MARKERS = [
  /employment\s+eligibility\s+verification/i,
  /\bform\s*i-?9\b/i,
  /\buscis\b/i,
  /department\s+of\s+homeland\s+security/i,
  /omb\s+no\.?\s*1615-0047/i,
  /lists?\s+of\s+acceptable\s+documents/i,
];

const SECTION1_MARKERS = [/section\s*1/i, /employee\s+information\s+and\s+attestation/i];
const SECTION2_MARKERS = [
  /section\s*2/i,
  /employer\s+(?:or\s+authorized\s+representative\s+)?review\s+and\s+verification/i,
];

function hasAny(text, patterns) {
  return patterns.some((re) => re.test(text));
}

function captureAfter(text, labelRe, valueRe = /([A-Za-z0-9][A-Za-z0-9 .,'/#-]{0,80})/) {
  const re = new RegExp(labelRe.source + "[\\s:.-]*" + valueRe.source, labelRe.flags.includes("i") ? "i" : "");
  const m = text.match(re);
  if (!m) return null;
  const val = (m[1] || "").trim();
  if (!val || /^(n\/?a|none|null|-)$/i.test(val)) return null;
  return val;
}

function looksBlankOrPlaceholder(val) {
  if (val == null) return true;
  const s = String(val).trim();
  return !s || /^(n\/?a|none|null|-|\.|_{2,})$/i.test(s);
}

/**
 * Classify document from CONTENT (not filename).
 * @returns {"form_i9"|"supporting_id"|"receipt"|"other"|"unknown"}
 */
export function classifyFromContent(text, extractionOk) {
  if (!extractionOk || !text || text.trim().length < 8) return "unknown";
  if (hasAny(text, I9_MARKERS)) return "form_i9";
  if (/\breceipt\b/i.test(text) && /(temporary|awaiting|replacement|form\s*i-?9)/i.test(text)) {
    return "receipt";
  }
  if (
    /\bpassport\b/i.test(text) ||
    /\bdriver'?s?\s+licen[cs]e\b/i.test(text) ||
    /\bsocial\s+security\b/i.test(text) ||
    /\bemployment\s+authorization\b/i.test(text) ||
    /\bpermanent\s+resident\b/i.test(text) ||
    /\bgreen\s+card\b/i.test(text) ||
    /\blist\s+[abc]\b/i.test(text)
  ) {
    return "supporting_id";
  }
  if (/\breceipt\b/i.test(text)) return "receipt";
  return "other";
}

/**
 * Pull structured field detections from I-9 text when present.
 * Missing values are null — never fabricated.
 */
export function detectI9Fields(text) {
  const fields = {
    lastName: captureAfter(text, /last\s+name(?:\s*\(family\s+name\))?/i),
    firstName: captureAfter(text, /first\s+name(?:\s*\(given\s+name\))?/i),
    middleInitial: captureAfter(text, /middle\s+initial/i, /([A-Za-z]|N\/A|n\/a)/),
    address: captureAfter(text, /address\s*\(street\s+number\s+and\s+name\)/i),
    city: captureAfter(text, /city\s+or\s+town/i),
    state: captureAfter(text, /\bstate\b/i, /([A-Z]{2})/),
    zip: captureAfter(text, /zip\s+code/i, /(\d{5}(?:-\d{4})?)/),
    dateOfBirth: captureAfter(text, /date\s+of\s+birth/i, /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/),
    ssn: captureAfter(text, /(?:U\.?S\.?\s+)?social\s+security\s+number/i, /([\dX*]{3}[-\s]?[\dX*]{2}[-\s]?[\dX*]{4}|XXX-XX-XXXX)/i),
    email: captureAfter(text, /employee'?s?\s+e-?mail/i, /([\w.+-]+@[\w.-]+\.\w+)/),
    phone: captureAfter(text, /employee'?s?\s+telephone/i, /([\d().\-\s]{7,20})/),
    citizenship:
      text.match(
        /citizen\s+of\s+the\s+united\s+states|noncitizen\s+national|lawful\s+permanent\s+resident|alien\s+authorized\s+to\s+work|noncitizen\s+authorized\s+to\s+work/i
      )?.[0] || null,
    employeeSignaturePresent: /employee\s+signature/i.test(text) && !/employee\s+signature[\s\S]{0,40}\b(missing|blank|n\/a)\b/i.test(text),
    employeeSignatureDate: captureAfter(text, /(?:today'?s?\s+)?date\s*\(mm\/dd\/yyyy\)/i, /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/),
    firstDayOfEmployment: captureAfter(
      text,
      /first\s+day\s+of\s+employment/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/
    ),
    documentTitle: captureAfter(text, /document\s+title/i),
    issuingAuthority: captureAfter(text, /issuing\s+authority/i),
    documentNumber: captureAfter(text, /document\s+(?:number|#|no\.?)/i),
    expirationDate: captureAfter(text, /expiration\s+date/i, /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|N\/A|n\/a)/),
    employerName: captureAfter(text, /(?:last\s+name[, ]+first\s+name|signature\s+of\s+employer|employer'?s?\s+business)/i),
    employerSignaturePresent: /signature\s+of\s+employer|employer\s+or\s+authorized\s+representative\s+signature/i.test(text),
    listAPresent: /list\s+a/i.test(text),
    listBPresent: /list\s+b/i.test(text),
    listCPresent: /list\s+c/i.test(text),
    preparerUsed: /preparer\s+and\/?or\s+translator/i.test(text),
    hasSection1: hasAny(text, SECTION1_MARKERS),
    hasSection2: hasAny(text, SECTION2_MARKERS),
  };
  return fields;
}

function rec(text) {
  return text;
}

/**
 * Analyze one document's extracted content into findings + field snapshot.
 */
export function analyzeDocumentContent({
  nextId,
  employeeName,
  documentId,
  documentName,
  extraction,
  filenameHint = "",
}) {
  const findings = [];
  const text = extraction?.text || "";
  const ok = Boolean(extraction?.ok && text.trim().length);
  const classification = classifyFromContent(text, ok);
  const fields = ok && classification === "form_i9" ? detectI9Fields(text) : ok ? detectI9Fields(text) : {};

  const base = { documentId, documentName };

  if (!extraction) {
    findings.push(
      makeFinding({
        id: nextId(),
        section: "Document Review",
        cls: "substantive",
        title: "Live document unavailable",
        detail: `No live file content was available to analyze for ${documentName}. Re-import the document.`,
        ...base,
        field: "file",
        recommendation: rec("Re-upload the original file so the audit agent can read its contents."),
      })
    );
    return { findings, classification, fields, extractionSummary: null };
  }

  if (extraction.size === 0 || (extraction.charCount === 0 && extraction.method === "none")) {
    findings.push(
      makeFinding({
        id: nextId(),
        section: "Document Review",
        cls: "substantive",
        title: "Empty file",
        detail: `${documentName} has no bytes/content and cannot be analyzed.`,
        ...base,
        field: "fileSize",
        detectedValue: "0",
        recommendation: rec("Replace with a complete scan or digital Form I-9 export."),
      })
    );
    return { findings, classification: "unknown", fields: {}, extractionSummary: extraction };
  }

  if (!ok) {
    findings.push(
      makeFinding({
        id: nextId(),
        section: "Document Review",
        cls: "substantive",
        title: "Unable to extract document text",
        detail:
          extraction.uncertainty ||
          `Could not extract readable text from ${documentName}. Automated field checks were not performed. Human review is required.`,
        ...base,
        field: "extraction",
        detectedValue: null,
        recommendation: rec(
          "Perform a manual Form I-9 review of this document, or re-export/re-scan with selectable text / higher-quality OCR."
        ),
      })
    );
    // Filename is supplementary note only — not a substantive classification proof
    if (filenameHint) {
      findings.push(
        makeFinding({
          id: nextId(),
          section: "Document Review",
          cls: "technical",
          title: "Filename noted (not used as content proof)",
          detail: `Filename “${filenameHint}” was recorded for reference only. Contents could not be verified automatically.`,
          ...base,
          field: "filename",
          detectedValue: filenameHint,
          recommendation: rec("Do not treat the filename as proof of Form I-9 completeness."),
        })
      );
    }
    return { findings, classification: "unknown", fields: {}, extractionSummary: extraction };
  }

  // Content successfully extracted
  if (classification === "form_i9") {
    findings.push(...analyzeFormI9Fields({ nextId, employeeName, documentId, documentName, fields, text }));
  } else if (classification === "supporting_id") {
    // Supporting ID content present — check for identity markers completeness
    if (!/\b(passport|license|licence|SSN|social security|authorization|resident)\b/i.test(text)) {
      findings.push(
        makeFinding({
          id: nextId(),
          section: "Section 2",
          cls: "technical",
          title: "Supporting identity document incomplete in text",
          detail: `Extracted text from ${documentName} suggests an identity document but key identity markers are weak or incomplete.`,
          ...base,
          field: "supportingId",
          detectedValue: text.slice(0, 120),
          recommendation: rec("Confirm List A or List B+C document data against the retained copy; complete Section 2 if this supports an I-9."),
        })
      );
    }
  } else if (classification === "receipt") {
    findings.push(
      makeFinding({
        id: nextId(),
        section: "Section 2",
        cls: "substantive",
        title: "Receipt documented in content",
        detail: `Extracted text from ${documentName} references a receipt. Confirm a replacement List A/B/C document was presented within the regulatory timeframe.`,
        ...base,
        field: "receipt",
        detectedValue: text.match(/.{0,40}receipt.{0,40}/i)?.[0] || "receipt",
        recommendation: rec(
          "If a receipt was accepted, obtain and record the replacement document; update Section 2 and retain both."
        ),
      })
    );
  } else if (classification === "other") {
    findings.push(
      makeFinding({
        id: nextId(),
        section: "Document Review",
        cls: "technical",
        title: "Document content is not Form I-9",
        detail: `Extracted text from ${documentName} (${extraction.charCount} chars) does not contain Form I-9 / USCIS employment eligibility markers. Classification is based on content, not the filename.`,
        ...base,
        field: "contentClass",
        detectedValue: text.slice(0, 160),
        recommendation: rec(
          "If this file was intended as Form I-9, upload the correct form. Otherwise retain only if it is a supporting identity document for Section 2."
        ),
      })
    );
  }

  return {
    findings,
    classification,
    fields,
    extractionSummary: {
      method: extraction.method,
      charCount: extraction.charCount,
      pageCount: extraction.pageCount,
      ok: extraction.ok,
      uncertainty: extraction.uncertainty || null,
      textPreview: text.slice(0, 280),
    },
  };
}

function analyzeFormI9Fields({ nextId, employeeName, documentId, documentName, fields, text }) {
  const findings = [];
  const base = { documentId, documentName };

  if (!fields.hasSection1 && !/last\s+name/i.test(text)) {
    findings.push(
      makeFinding({
        id: nextId(),
        section: "Section 1",
        cls: "substantive",
        title: "Section 1 content not clearly present",
        detail: `Form I-9 markers were found in ${documentName}, but Section 1 employee information headings were not clearly detected in the extracted text.`,
        ...base,
        field: "section1",
        detectedValue: null,
        recommendation: rec("Verify Section 1 is complete on the original form; re-scan if the page is missing."),
      })
    );
  }

  if (looksBlankOrPlaceholder(fields.lastName) || looksBlankOrPlaceholder(fields.firstName)) {
    findings.push(
      makeFinding({
        id: nextId(),
        section: "Section 1",
        cls: "substantive",
        title: "Employee name fields incomplete",
        detail: `Could not detect both first and last name values in the extracted text of ${documentName} for ${employeeName}.`,
        ...base,
        field: "employeeName",
        detectedValue: [fields.firstName, fields.lastName].filter(Boolean).join(" ") || null,
        recommendation: rec("Only the employee may correct Section 1 name fields; enter N/A for unused middle initial; initial and date with today’s date (never backdate)."),
      })
    );
  }

  if (looksBlankOrPlaceholder(fields.dateOfBirth)) {
    findings.push(
      makeFinding({
        id: nextId(),
        section: "Section 1",
        cls: "technical",
        title: "Date of birth not detected",
        detail: `No date of birth value was detected in extracted text for ${documentName}.`,
        ...base,
        field: "dateOfBirth",
        detectedValue: null,
        recommendation: rec("Employee completes Date of Birth in Section 1 if blank; initial and date the correction."),
      })
    );
  }

  if (!fields.citizenship) {
    findings.push(
      makeFinding({
        id: nextId(),
        section: "Section 1",
        cls: "substantive",
        title: "Citizenship / immigration attestation not detected",
        detail: `No citizenship or immigration status attestation language/selection was detected in ${documentName}.`,
        ...base,
        field: "citizenship",
        detectedValue: null,
        recommendation: rec("Employee must select the correct attestation box in Section 1; do not complete this for the employee."),
      })
    );
  }

  if (!fields.employeeSignaturePresent && !/signed|signature\s+on\s+file/i.test(text)) {
    findings.push(
      makeFinding({
        id: nextId(),
        section: "Section 1",
        cls: "substantive",
        title: "Employee signature not detected",
        detail: `Extracted text for ${documentName} does not show a completed employee signature attestation.`,
        ...base,
        field: "employeeSignature",
        detectedValue: null,
        recommendation: rec("Employee must sign and date Section 1 (wet ink or compliant electronic signature as applicable)."),
      })
    );
  }

  if (looksBlankOrPlaceholder(fields.employeeSignatureDate)) {
    findings.push(
      makeFinding({
        id: nextId(),
        section: "Section 1",
        cls: "technical",
        title: "Employee signature date not detected",
        detail: `No employee signature date (mm/dd/yyyy) was detected in ${documentName}.`,
        ...base,
        field: "employeeSignatureDate",
        detectedValue: null,
        recommendation: rec("Employee enters the actual date of signing; never backdate."),
      })
    );
  }

  if (!fields.hasSection2 && !/document\s+title/i.test(text)) {
    findings.push(
      makeFinding({
        id: nextId(),
        section: "Section 2",
        cls: "substantive",
        title: "Section 2 content not clearly present",
        detail: `Form I-9 content was detected in ${documentName}, but Section 2 employer verification headings/fields were not clearly found.`,
        ...base,
        field: "section2",
        detectedValue: null,
        recommendation: rec("Employer or authorized representative must complete Section 2 within 3 business days of the hire date."),
      })
    );
  } else {
    if (looksBlankOrPlaceholder(fields.documentTitle) && looksBlankOrPlaceholder(fields.documentNumber)) {
      findings.push(
        makeFinding({
          id: nextId(),
          section: "Section 2",
          cls: "substantive",
          title: "List A/B/C document details not detected",
          detail: `Neither document title nor document number was detected in Section 2 text of ${documentName}.`,
          ...base,
          field: "documentTitle",
          detectedValue: null,
          recommendation: rec("Employer records List A or List B+C document title, issuing authority, number, and expiration from the documents presented."),
        })
      );
    }
    if (looksBlankOrPlaceholder(fields.firstDayOfEmployment)) {
      findings.push(
        makeFinding({
          id: nextId(),
          section: "Section 2",
          cls: "technical",
          title: "First day of employment not detected",
          detail: `First day of employment was not found in extracted text of ${documentName}.`,
          ...base,
          field: "firstDayOfEmployment",
          detectedValue: null,
          recommendation: rec("Employer enters the employee’s first day of employment in Section 2."),
        })
      );
    }
    if (!fields.employerSignaturePresent) {
      findings.push(
        makeFinding({
          id: nextId(),
          section: "Section 2",
          cls: "substantive",
          title: "Employer signature not detected",
          detail: `Employer / authorized representative signature was not detected in ${documentName}.`,
          ...base,
          field: "employerSignature",
          detectedValue: null,
          recommendation: rec("Employer or authorized representative must sign and date Section 2 after examining documents."),
        })
      );
    }
  }

  // If I-9 content looks complete, do not invent findings
  return findings;
}

/**
 * Packet-level findings from CONTENT classifications across all docs.
 */
export function analyzePacketFromContent({ nextId, employeeName, docResults }) {
  const findings = [];
  const i9Docs = docResults.filter((d) => d.classification === "form_i9");
  const supportDocs = docResults.filter((d) => d.classification === "supporting_id");
  const receiptDocs = docResults.filter((d) => d.classification === "receipt");
  const unknownDocs = docResults.filter((d) => d.classification === "unknown");

  if (!docResults.length) {
    findings.push(
      makeFinding({
        id: nextId(),
        section: "Section 1",
        cls: "substantive",
        title: "No documents in packet",
        detail: `No files were imported for ${employeeName}.`,
        documentId: null,
        documentName: null,
        field: "packet",
        recommendation: rec("Import this employee’s Form I-9 packet and re-run the audit."),
      })
    );
    return findings;
  }

  if (!i9Docs.length) {
    // Attach to each analyzed doc that is not a clear supporting ID — content based
    for (const d of docResults) {
      if (d.classification === "supporting_id" || d.classification === "receipt") continue;
      // Avoid duplicate "not Form I-9" if already flagged per-doc
      const already = (d.findings || []).some((f) => f.title === "Document content is not Form I-9");
      if (already) continue;
      findings.push(
        makeFinding({
          id: nextId(),
          section: "Section 1",
          cls: "substantive",
          title: "No Form I-9 content identified in packet",
          detail: `After reading document contents for ${employeeName}, no file contained Form I-9 / USCIS employment eligibility verification text. Filename was not used as proof.`,
          documentId: d.documentId,
          documentName: d.documentName,
          field: "formI9",
          recommendation: rec("Upload the actual completed Form I-9 for this employee, then re-run analysis."),
        })
      );
    }
  }

  if (i9Docs.length && !supportDocs.length && !receiptDocs.length) {
    // Only if Section 2 document fields also missing on the I-9 itself
    for (const d of i9Docs) {
      const section2DocMissing = (d.findings || []).some((f) => f.field === "documentTitle");
      if (!section2DocMissing) continue;
      findings.push(
        makeFinding({
          id: nextId(),
          section: "Section 2",
          cls: "technical",
          title: "No supporting identity document content in packet",
          detail: `Form I-9 content was found for ${employeeName}, but no separate supporting identity document text (passport, license, etc.) was identified in other packet files, and Section 2 document fields were incomplete.`,
          documentId: d.documentId,
          documentName: d.documentName,
          field: "supportingDocuments",
          recommendation: rec("Retain and attach copies of List A or List B+C documents examined; complete Section 2 from those documents."),
        })
      );
    }
  }

  if (receiptDocs.length && !supportDocs.length) {
    for (const d of receiptDocs) {
      findings.push(
        makeFinding({
          id: nextId(),
          section: "Section 2",
          cls: "substantive",
          title: "Receipt without replacement identity document in packet",
          detail: `Receipt-related content was found in ${d.documentName}, but no replacement supporting identity document content was found elsewhere in ${employeeName}'s packet.`,
          documentId: d.documentId,
          documentName: d.documentName,
          field: "receipt",
          recommendation: rec("Obtain the replacement document, update Section 2, and retain both the receipt and replacement."),
        })
      );
    }
  }

  // Unknown extraction across entire packet
  if (unknownDocs.length === docResults.length && !i9Docs.length) {
    // already have per-doc extraction failures
  }

  return findings;
}
