/**
 * Seed I-9 document packets used by the Import modal.
 * Selecting a folder here imports these documents into the session.
 */

export const currentUser = {
  id: "u-jh",
  name: "Jordan Hale",
  initials: "JH",
  role: "HR Compliance Lead",
};

/**
 * Folders available to import. Each employee lists the documents that
 * become openable entries in importedDocuments.js.
 */
export const availableFolders = [
  {
    id: "folder-1",
    name: "Northwind_Harbor_I9_Packet_2025",
    employees: [
      {
        name: "Priya Nandakumar",
        department: "Operations",
        documents: [
          {
            name: "Form_I-9.pdf",
            content:
              "Form I-9 — Priya Nandakumar\nSection 1 employee attestation packet\nOrg: Northwind Harbor\n",
          },
          {
            name: "List_A_Passport.pdf",
            content: "Supporting List A document — U.S. Passport copy for Priya Nandakumar\n",
          },
        ],
        findings: {
          purpose: "Form I-9 corrections",
          reviewedBy: "OnBlick Review Desk",
          section1: [
            {
              id: "f-p1",
              class: "technical",
              title: "Address completeness",
              detail: "Street address line 2 and ZIP+4 are blank; enter N/A if unused.",
              status: "open",
            },
            {
              id: "f-p2",
              class: "substantive",
              title: "Attestation selection",
              detail: "Citizenship attestation box appears unchecked on the retained scan.",
              status: "open",
            },
          ],
          section2: [
            {
              id: "f-p3",
              class: "technical",
              title: "Issuing authority typo",
              detail: "List B issuing authority abbreviated inconsistently with supporting copy.",
              status: "open",
            },
          ],
          recommendation:
            "Employee must correct Section 1 attestation; employer may correct Section 2 technical typo with initials and current date.",
        },
      },
      {
        name: "Theo Marchetti",
        department: "Finance",
        documents: [
          {
            name: "Form_I-9.pdf",
            content: "Form I-9 — Theo Marchetti\nSection 1 / Section 2 retained scans\n",
          },
          {
            name: "List_B_Driver_License.pdf",
            content: "List B — Driver license for Theo Marchetti\n",
          },
          {
            name: "List_C_SSN.pdf",
            content: "List C — Social Security card for Theo Marchetti\n",
          },
        ],
        findings: {
          purpose: "Form I-9 corrections",
          reviewedBy: "OnBlick Review Desk",
          section1: [
            {
              id: "f-t1",
              class: "technical",
              title: "Other last names used",
              detail: "Field left blank; record N/A when no prior surnames apply.",
              status: "open",
            },
            {
              id: "f-t2",
              class: "substantive",
              title: "Employee signature date",
              detail: "Section 1 signature date is after the first day of employment.",
              status: "open",
            },
          ],
          section2: [
            {
              id: "f-t3",
              class: "substantive",
              title: "List A + List B combination",
              detail: "Both List A and List B entries are populated; retain only a valid combination.",
              status: "open",
            },
            {
              id: "f-t4",
              class: "technical",
              title: "Employer title missing",
              detail: "Authorized representative title field is empty.",
              status: "open",
            },
          ],
          recommendation:
            "Clear improper List B entries, have employee correct Section 1 date with current-day initials, and complete employer title.",
        },
      },
      {
        name: "Amara Okonkwo",
        department: "Customer Success",
        documents: [
          {
            name: "Form_I-9.pdf",
            content: "Form I-9 — Amara Okonkwo\nClean packet placeholder\n",
          },
        ],
        findings: null,
      },
    ],
  },
  {
    id: "folder-2",
    name: "Cedar_Ridge_Contractors_I9s",
    employees: [
      {
        name: "Jonas Feld",
        department: "Engineering",
        documents: [
          {
            name: "Form_I-9.pdf",
            content: "Form I-9 — Jonas Feld\nContractor hire packet\n",
          },
          {
            name: "Work_Auth.pdf",
            content: "Temporary work authorization document — Jonas Feld\n",
          },
        ],
        findings: {
          purpose: "Form I-9 corrections",
          reviewedBy: "OnBlick Review Desk",
          section1: [
            {
              id: "f-j1",
              class: "substantive",
              title: "Work authorization expiration",
              detail: "Temporary authorization expiration date is missing for the selected status.",
              status: "open",
            },
          ],
          section2: [
            {
              id: "f-j2",
              class: "substantive",
              title: "Late Section 2 completion",
              detail: "Section 2 signed more than three business days after start date.",
              status: "open",
            },
            {
              id: "f-j3",
              class: "technical",
              title: "Document number formatting",
              detail: "Passport number includes spaces inconsistent with the scanned page.",
              status: "open",
            },
          ],
          recommendation:
            "Document late Section 2 as a process finding, correct document number formatting, and complete missing authorization expiration with supporting evidence.",
        },
      },
      {
        name: "Elena Voss",
        department: "People Ops",
        documents: [
          {
            name: "Form_I-9.pdf",
            content: "Form I-9 — Elena Voss\n",
          },
        ],
        findings: null,
      },
      {
        name: "Mateo Ruiz",
        department: "Logistics",
        documents: [
          {
            name: "Form_I-9.pdf",
            content: "Form I-9 — Mateo Ruiz\n",
          },
          {
            name: "Preparer_Translator.pdf",
            content: "Supplement A — preparer/translator worksheet for Mateo Ruiz\n",
          },
        ],
        findings: {
          purpose: "Form I-9 corrections",
          reviewedBy: "OnBlick Review Desk",
          section1: [
            {
              id: "f-m1",
              class: "technical",
              title: "Preparer/translator block",
              detail: "Assistance indicated but Supplement A certification is incomplete.",
              status: "open",
            },
          ],
          section2: [
            {
              id: "f-m2",
              class: "technical",
              title: "Business address mismatch",
              detail: "Employer address does not match the active location on the hire packet.",
              status: "open",
            },
          ],
          recommendation:
            "Complete preparer/translator certification and align employer address with the location of hire records.",
        },
      },
    ],
  },
  {
    id: "folder-3",
    name: "Blue_Orchard_Rehires_Q3",
    employees: [
      {
        name: "Noah Bright",
        department: "Legal",
        documents: [
          {
            name: "Form_I-9.pdf",
            content: "Form I-9 — Noah Bright (rehire)\n",
          },
          {
            name: "Receipt_Followup.pdf",
            content: "Receipt replacement tracking — Noah Bright\n",
          },
        ],
        findings: {
          purpose: "Form I-9 corrections",
          reviewedBy: "OnBlick Review Desk",
          section1: [
            {
              id: "f-n1",
              class: "substantive",
              title: "Missing employee signature",
              detail: "Section 1 signature line is blank on the retained form.",
              status: "open",
            },
          ],
          section2: [
            {
              id: "f-n2",
              class: "substantive",
              title: "Receipt follow-up overdue",
              detail: "Receipt was accepted but replacement document was never recorded.",
              status: "open",
            },
          ],
          recommendation:
            "Obtain employee signature with current date and record the replacement List A/B/C document that superseded the receipt.",
        },
      },
      {
        name: "Imani Brooks",
        department: "Support",
        documents: [
          {
            name: "Form_I-9.pdf",
            content: "Form I-9 — Imani Brooks\n",
          },
        ],
        findings: {
          purpose: "Form I-9 corrections",
          reviewedBy: "OnBlick Review Desk",
          section1: [
            {
              id: "f-i1",
              class: "technical",
              title: "DOB transposition risk",
              detail: "Date of birth month/day order conflicts with supporting ID.",
              status: "open",
            },
          ],
          section2: [],
          recommendation:
            "Have the employee verify and correct date of birth; initial and date the change without backdating.",
        },
      },
      {
        name: "Sora Kim",
        department: "Marketing",
        documents: [
          {
            name: "Form_I-9.pdf",
            content: "Form I-9 — Sora Kim\nClean rehire packet\n",
          },
        ],
        findings: null,
      },
    ],
  },
];

function countFindings(findings) {
  if (!findings) return 0;
  return (findings.section1?.length || 0) + (findings.section2?.length || 0);
}

/**
 * Turn a mock folder into an import package with File blobs
 * so importedDocuments.js can register openable documents.
 */
export function materializeMockPackage(folder) {
  const packageId = `import-${folder.id}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const employees = folder.employees.map((emp, empIdx) => {
    const documents = emp.documents.map((doc, docIdx) => {
      const body = doc.content || `I-9 document: ${doc.name}\nEmployee: ${emp.name}\nPackage: ${folder.name}\n`;
      const blob = new Blob([body], { type: "text/plain" });
      const file = new File([blob], doc.name.replace(/\.pdf$/i, ".txt"), {
        type: "text/plain",
        lastModified: Date.now(),
      });
      // Keep display name as original (pdf label) while file is text for in-browser preview
      const displayName = doc.name;
      const id = `doc-${packageId}-${empIdx}-${docIdx}`;
      return {
        id,
        name: displayName,
        relativePath: `${folder.name}/${emp.name}/${displayName}`,
        size: file.size,
        type: "text/plain",
        file,
        previewAsText: true,
      };
    });
    const findings = emp.findings;
    const errors = countFindings(findings);
    return {
      name: emp.name,
      department: emp.department || "",
      documentCount: documents.length,
      fileNames: documents.map((d) => d.name),
      documents,
      documentIds: documents.map((d) => d.id),
      totalBytes: documents.reduce((n, d) => n + d.size, 0),
      findings: findings || undefined,
      errors,
      auditDate: "2025-11-03",
      completedOn: errors ? "2025-11-04" : null,
    };
  });

  const allDocs = employees.flatMap((e) => e.documents);
  return {
    id: packageId,
    name: folder.name,
    employeeCount: employees.length,
    documentCount: allDocs.length,
    source: "mock",
    fileNames: allDocs.map((d) => d.name),
    documentIds: allDocs.map((d) => d.id),
    totalBytes: allDocs.reduce((n, d) => n + d.size, 0),
    employees,
    mockFolderId: folder.id,
  };
}
