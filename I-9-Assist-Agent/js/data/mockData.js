/**
 * Compatibility shim only.
 * Production live imports and analysis use js/services/documentStore.js.
 * This file re-exports the document store so older imports keep resolving
 * without driving audit findings from fixtures.
 */

export {
  currentUser,
  registerPackageDocuments,
  getPackages,
  setPackages,
  addPackage,
  removePackageAt,
  clearPackages,
  clearAllImportData,
  getImportedDocument,
  getImportedDocuments,
  listImportedDocuments,
  getDocumentFile,
  getDocumentRecord,
  cacheDocumentExtraction,
  revokeImportedDocuments,
  revokePackageDocuments,
  clearImportedDocuments,
  getDocumentStoreSnapshot as getMockDataSnapshot,
} from "../services/documentStore.js";
