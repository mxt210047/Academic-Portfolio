/**
 * Prompt construction for a future real AI API.
 * Consumed by the agent service with findings from the selected audit only.
 */

export function buildAgentPrompt({ intent, userText, employee, findings, openFindings, documentId = null }) {
  return {
    system:
      "You are OnBlick Audit Assistant, helping HR correct Form I-9 findings. Be concise, non-discriminatory, and never suggest backdating.",
    intent,
    userText,
    context: {
      employeeName: employee?.name,
      employeeId: employee?.id,
      department: employee?.department,
      errorCount: openFindings.length,
      packetErrorCount: employee?.errors,
      selectedDocumentId: documentId,
      documentNames: findings?.documentNames || employee?.documents?.map((d) => (typeof d === "string" ? d : d.name)) || [],
      auditId: findings?.auditId || null,
      openFindingCount: openFindings.length,
      technicalCount: openFindings.filter((f) => f.class === "technical").length,
      substantiveCount: openFindings.filter((f) => f.class === "substantive").length,
      recommendationSeed: findings?.recommendation,
      findings: openFindings.map((f) => ({
        id: f.id,
        section: f.section,
        class: f.class,
        title: f.title,
        detail: f.detail,
        status: f.status,
        documentId: f.documentId || null,
      })),
    },
  };
}
