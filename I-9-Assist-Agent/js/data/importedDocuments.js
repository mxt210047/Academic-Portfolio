/**
 * Session registry of imported I-9 documents.
 * Holds metadata + object URLs so the UI can open each uploaded file.
 */

import { extensionOf, formatBytes } from "../services/fileImport.js";

/** @type {Map<string, ImportedDocument>} */
const byId = new Map();

/**
 * @typedef {object} ImportedDocument
 * @property {string} id
 * @property {string} name
 * @property {string} relativePath
 * @property {number} size
 * @property {string} type
 * @property {string} packageId
 * @property {string} employeeName
 * @property {string} url           object URL for in-browser preview
 * @property {"pdf"|"image"|"office"|"other"} kind
 * @property {string} importedAt
 * @property {File} [file]          session-local File (not serialized)
 */

function detectKind(name, mime = "") {
  const ext = extensionOf(name);
  if (ext === "pdf" || mime.includes("pdf")) return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext) || mime.startsWith("image/")) return "image";
  if (["doc", "docx"].includes(ext) || mime.includes("word") || mime.includes("officedocument")) {
    return "office";
  }
  return "other";
}

function toPublic(doc) {
  if (!doc) return null;
  const { file: _file, ...pub } = doc;
  return {
    ...pub,
    sizeLabel: formatBytes(pub.size),
  };
}

export function registerImportedDocument({
  id,
  name,
  relativePath,
  size,
  type,
  file,
  packageId,
  employeeName,
}) {
  const existing = byId.get(id);
  if (existing?.url) URL.revokeObjectURL(existing.url);

  const url = URL.createObjectURL(file);
  const record = {
    id,
    name,
    relativePath: relativePath || name,
    size: size ?? file.size,
    type: type || file.type || "",
    packageId,
    employeeName,
    url,
    kind: detectKind(name, type || file.type || ""),
    importedAt: new Date().toISOString(),
    file,
  };
  byId.set(id, record);
  return toPublic(record);
}

/** Register every document on an import package; returns packages unchanged shape with ids. */
export function registerPackageDocuments(pkg) {
  const employees = (pkg.employees || []).map((emp) => {
    const documents = (emp.documents || []).map((d) => {
      const id = d.id || `doc-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      registerImportedDocument({
        id,
        name: d.name,
        relativePath: d.relativePath || d.name,
        size: d.size ?? d.file?.size ?? 0,
        type: d.type || d.file?.type || "",
        file: d.file,
        packageId: pkg.id,
        employeeName: emp.name,
      });
      return { id, name: d.name, relativePath: d.relativePath || d.name, size: d.size ?? d.file?.size ?? 0 };
    });
    return {
      ...emp,
      documents,
      documentIds: documents.map((d) => d.id),
      fileNames: documents.map((d) => d.name),
      documentCount: documents.length,
    };
  });

  const allDocs = employees.flatMap((e) => e.documents);
  return {
    ...pkg,
    employees,
    fileNames: allDocs.map((d) => d.name),
    documentCount: allDocs.length,
    documentIds: allDocs.map((d) => d.id),
  };
}

export function getImportedDocument(id) {
  return toPublic(byId.get(id));
}

export function getImportedDocuments(ids = []) {
  return ids.map((id) => getImportedDocument(id)).filter(Boolean);
}

export function listImportedDocuments({ packageId, employeeName } = {}) {
  let rows = [...byId.values()].map(toPublic);
  if (packageId) rows = rows.filter((d) => d.packageId === packageId);
  if (employeeName) rows = rows.filter((d) => d.employeeName === employeeName);
  return rows;
}

export function revokeImportedDocuments(ids) {
  for (const id of ids) {
    const doc = byId.get(id);
    if (!doc) continue;
    if (doc.url) URL.revokeObjectURL(doc.url);
    byId.delete(id);
  }
}

export function revokePackageDocuments(packageId) {
  const ids = [...byId.values()].filter((d) => d.packageId === packageId).map((d) => d.id);
  revokeImportedDocuments(ids);
}

export function clearImportedDocuments() {
  for (const doc of byId.values()) {
    if (doc.url) URL.revokeObjectURL(doc.url);
  }
  byId.clear();
}
