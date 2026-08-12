/**
 * Browser file/folder import helpers for the I-9 Audit Agent.
 * Accepts a master folder (webkitdirectory) or individual documents.
 * Builds employee packets from folder structure — no mock catalogs.
 */

const ALLOWED_EXT = new Set(["pdf", "doc", "docx", "jpg", "jpeg", "png"]);
const MAX_BYTES = 25 * 1024 * 1024;

export function extensionOf(name) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function isAllowedFile(file) {
  return ALLOWED_EXT.has(extensionOf(file.name));
}

/**
 * Normalize a FileList / File[] into import package records with employees.
 * Directory uploads use webkitRelativePath (e.g. Master/Employee/file.pdf).
 */
export function packagesFromFiles(fileList) {
  const files = [...fileList];
  const errors = [];
  const accepted = [];

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name} exceeds 25MB`);
      continue;
    }
    if (file.name.startsWith(".")) continue;
    if (file.webkitRelativePath?.includes("/.")) continue;

    const rel = file.webkitRelativePath || file.name;
    if (!isAllowedFile(file)) {
      if (!file.webkitRelativePath) errors.push(`${file.name} is not PDF, DOC, JPG, or PNG`);
      continue;
    }
    accepted.push({ file, rel });
  }

  if (!accepted.length) {
    return {
      packages: [],
      errors: errors.length ? errors : ["No supported I-9 documents found (PDF, DOC, JPG, PNG)."],
    };
  }

  /** @type {Map<string, { name: string, files: { file: File, rel: string, employeeKey: string }[] }>} */
  const groups = new Map();

  for (const { file, rel } of accepted) {
    const parts = rel.split("/").filter(Boolean);
    let packageName;
    let employeeKey;

    if (parts.length >= 3) {
      // Master / EmployeeName / doc
      packageName = parts[0];
      employeeKey = parts[1];
    } else if (parts.length === 2) {
      // Master / doc  → employee from file name
      packageName = parts[0];
      employeeKey = file.name.replace(/\.[^.]+$/, "") || file.name;
    } else {
      // Loose file
      packageName = file.name.replace(/\.[^.]+$/, "") || file.name;
      employeeKey = packageName;
    }

    if (!groups.has(packageName)) {
      groups.set(packageName, { name: packageName, files: [] });
    }
    groups.get(packageName).files.push({ file, rel, employeeKey });
  }

  const packages = [...groups.values()].map((g, idx) => {
    const byEmployee = new Map();
    for (const entry of g.files) {
      if (!byEmployee.has(entry.employeeKey)) {
        byEmployee.set(entry.employeeKey, []);
      }
      byEmployee.get(entry.employeeKey).push(entry.file);
    }

    const employees = [...byEmployee.entries()].map(([name, empFiles]) => ({
      name,
      documentCount: empFiles.length,
      fileNames: empFiles.map((f) => f.name),
      totalBytes: empFiles.reduce((n, f) => n + f.size, 0),
    }));

    return {
      id: `import-${Date.now()}-${idx}-${Math.random().toString(16).slice(2, 8)}`,
      name: g.name,
      employeeCount: employees.length,
      documentCount: g.files.length,
      source: "upload",
      fileNames: g.files.map((e) => e.file.name),
      totalBytes: g.files.reduce((n, e) => n + e.file.size, 0),
      employees,
    };
  });

  return { packages, errors };
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
