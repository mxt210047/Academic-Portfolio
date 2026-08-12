/**
 * Document helpers for UI — backed by the production documentStore.
 */

export {
  registerPackageDocuments,
  getImportedDocument,
  getImportedDocuments,
  listImportedDocuments,
  getDocumentFile,
  getDocumentRecord,
  revokeImportedDocuments,
  revokePackageDocuments,
  clearImportedDocuments,
} from "../services/documentStore.js";
