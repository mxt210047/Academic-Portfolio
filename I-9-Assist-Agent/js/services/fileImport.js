/**
 * Browser file/folder import helpers for the I-9 Audit Agent.
 * Accepts a master folder (webkitdirectory) or individual documents.
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
 * Normalize a FileList / File[] into import package records.
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
    // Skip macOS junk / empty placeholders inside folders
    if (file.name.startsWith(".")) continue;
    if (file.webkitRelativePath?.includes("/.")) continue;

    const rel = file.webkitRelativePath || file.name;
    // Folders may include nested non-docs; only count allowed docs
    if (!isAllowedFile(file)) {
      // Allow folder selection to include other files silently; warn only for top-level picks
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

  /** @type {Map<string, { name: string, files: File[], employeeNames: Set<string> }>} */
  const groups = new Map();

  for (const { file, rel } of accepted) {
    const parts = rel.split("/").filter(Boolean);
    let packageName;
    let employeeName = null;

    if (parts.length >= 2) {
      // MasterFolder / EmployeeName / doc
      packageName = parts[0];
      employeeName = parts.length >= 3 ? parts[1] : parts[0];
    } else {
      // Loose file — group under a package named after the file (sans extension)
      packageName = file.name.replace(/\.[^.]+$/, "") || file.name;
    }

    if (!groups.has(packageName)) {
      groups.set(packageName, {
        name: packageName,
        files: [],
        employeeNames: new Set(),
      });
    }
    const g = groups.get(packageName);
    g.files.push(file);
    if (employeeName) g.employeeNames.add(employeeName);
  }

  const packages = [...groups.values()].map((g, idx) => {
    const employeeCount = g.employeeNames.size || estimateEmployeesFromFiles(g.files);
    return {
      id: `import-${Date.now()}-${idx}-${Math.random().toString(16).slice(2, 8)}`,
      name: g.name,
      employeeCount,
      documentCount: g.files.length,
      source: "upload",
      // Keep lightweight metadata only (File objects are session-local)
      fileNames: g.files.map((f) => f.name),
      totalBytes: g.files.reduce((n, f) => n + f.size, 0),
    };
  });

  return { packages, errors };
}

function estimateEmployeesFromFiles(files) {
  // If no employee subfolders, treat each document as one employee packet
  return Math.max(1, files.length);
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
