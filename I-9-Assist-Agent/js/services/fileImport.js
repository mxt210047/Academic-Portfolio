/**
 * Browser file/folder import helpers for the I-9 Audit Agent.
 * Accepts a master folder (webkitdirectory) or individual documents.
 * Builds employee packets + document records from folder structure.
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
 * Normalize a FileList / File[] into import package records with employees + documents.
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
      packageName = parts[0];
      employeeKey = parts[1];
    } else if (parts.length === 2) {
      packageName = parts[0];
      employeeKey = file.name.replace(/\.[^.]+$/, "") || file.name;
    } else {
      packageName = file.name.replace(/\.[^.]+$/, "") || file.name;
      employeeKey = packageName;
    }

    if (!groups.has(packageName)) {
      groups.set(packageName, { name: packageName, files: [] });
    }
    groups.get(packageName).files.push({ file, rel, employeeKey });
  }

  const packages = [...groups.values()].map((g, idx) => {
    const packageId = `import-${Date.now()}-${idx}-${Math.random().toString(16).slice(2, 8)}`;
    const byEmployee = new Map();
    for (const entry of g.files) {
      if (!byEmployee.has(entry.employeeKey)) {
        byEmployee.set(entry.employeeKey, []);
      }
      byEmployee.get(entry.employeeKey).push(entry);
    }

    const employees = [...byEmployee.entries()].map(([name, entries], empIdx) => {
      const documents = entries.map((entry, docIdx) => ({
        id: `doc-${packageId}-${empIdx}-${docIdx}`,
        name: entry.file.name,
        relativePath: entry.rel,
        size: entry.file.size,
        type: entry.file.type || "",
        file: entry.file,
      }));
      return {
        name,
        documentCount: documents.length,
        fileNames: documents.map((d) => d.name),
        documents,
        documentIds: documents.map((d) => d.id),
        totalBytes: documents.reduce((n, d) => n + d.size, 0),
      };
    });

    const allDocs = employees.flatMap((e) => e.documents);
    return {
      id: packageId,
      name: g.name,
      employeeCount: employees.length,
      documentCount: allDocs.length,
      source: "upload",
      fileNames: allDocs.map((d) => d.name),
      documentIds: allDocs.map((d) => d.id),
      totalBytes: allDocs.reduce((n, d) => n + d.size, 0),
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
