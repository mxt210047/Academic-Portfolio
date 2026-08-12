/**
 * Re-exports document helpers from mockData.js (live import store).
 * Prefer importing from mockData.js directly.
 */

export {
  registerPackageDocuments,
  getImportedDocument,
  getImportedDocuments,
  listImportedDocuments,
  revokeImportedDocuments,
  revokePackageDocuments,
  clearImportedDocuments,
} from "./mockData.js";
