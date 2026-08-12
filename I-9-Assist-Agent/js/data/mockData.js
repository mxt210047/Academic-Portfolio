/**
 * Original fictional mock data for the I-9 Audit Agent.
 * Intentionally unrelated to any wireframe sample records.
 */

export const currentUser = {
  id: "u-jh",
  name: "Jordan Hale",
  initials: "JH",
  role: "HR Compliance Lead",
};

/** Seed folders available to "upload" during import demos */
export const availableFolders = [
  {
    id: "folder-1",
    name: "Northwind_Harbor_I9_Packet_2025",
    employeeCount: 86,
    documentCount: 1720,
  },
  {
    id: "folder-2",
    name: "Cedar_Ridge_Contractors_I9s",
    employeeCount: 42,
    documentCount: 910,
  },
  {
    id: "folder-3",
    name: "Blue_Orchard_Rehires_Q3",
    employeeCount: 18,
    documentCount: 240,
  },
];

/**
 * Audits start empty so the empty-state screen matches the wireframe.
 * Import / initiate flows populate this collection at runtime.
 */
export function createEmptyAudits() {
  return [];
}

/** Template used when a folder is imported into an audit */
export function buildAuditFromFolder(folder, orgName) {
  const now = new Date();
  return {
    id: `audit-${Date.now()}`,
    name: orgName,
    folderId: folder.id,
    folderName: folder.name,
    employees: folder.employeeCount,
    documents: folder.documentCount,
    status: "Not Initiated", // Not Initiated | In Progress | Completed
    initiatedAt: null,
    initiatedBy: null,
    createdAt: now.toISOString(),
  };
}

/** Employee roster for a completed/in-progress audit — all fictional */
export const employeeCatalog = [
  {
    id: "emp-01",
    name: "Priya Nandakumar",
    department: "Operations",
    docs: 7,
    errors: 42,
    auditDate: "2025-11-03",
    completedOn: "2025-11-04",
  },
  {
    id: "emp-02",
    name: "Theo Marchetti",
    department: "Finance",
    docs: 11,
    errors: 67,
    auditDate: "2025-11-03",
    completedOn: "2025-11-04",
  },
  {
    id: "emp-03",
    name: "Amara Okonkwo",
    department: "Customer Success",
    docs: 9,
    errors: 0,
    auditDate: "2025-11-03",
    completedOn: "2025-11-04",
  },
  {
    id: "emp-04",
    name: "Jonas Feld",
    department: "Engineering",
    docs: 12,
    errors: 88,
    auditDate: "2025-11-03",
    completedOn: "2025-11-04",
  },
  {
    id: "emp-05",
    name: "Elena Voss",
    department: "People Ops",
    docs: 6,
    errors: 0,
    auditDate: "2025-11-03",
    completedOn: "2025-11-04",
  },
  {
    id: "emp-06",
    name: "Mateo Ruiz",
    department: "Logistics",
    docs: 8,
    errors: 31,
    auditDate: "2025-11-03",
    completedOn: "2025-11-04",
  },
  {
    id: "emp-07",
    name: "Sora Kim",
    department: "Marketing",
    docs: 5,
    errors: 0,
    auditDate: "2025-11-03",
    completedOn: "2025-11-04",
  },
  {
    id: "emp-08",
    name: "Noah Bright",
    department: "Legal",
    docs: 10,
    errors: 54,
    auditDate: "2025-11-03",
    completedOn: "2025-11-04",
  },
  {
    id: "emp-09",
    name: "Imani Brooks",
    department: "Support",
    docs: 7,
    errors: 19,
    auditDate: "2025-11-03",
    completedOn: "2025-11-04",
  },
];

/** Findings keyed by employee id */
export const findingsByEmployee = {
  "emp-01": {
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
  "emp-02": {
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
  "emp-04": {
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
  "emp-06": {
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
  "emp-08": {
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
  "emp-09": {
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
};

export function getFindingsForEmployee(employeeId) {
  return (
    findingsByEmployee[employeeId] || {
      purpose: "Form I-9 corrections",
      reviewedBy: "OnBlick Review Desk",
      section1: [],
      section2: [],
      recommendation: "No open findings. Retain the form per the retention schedule.",
    }
  );
}

export function formatDisplayDate(isoOrDate) {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
