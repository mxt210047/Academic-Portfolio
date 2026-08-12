import { getFindingsForEmployee } from "../data/models.js";
import { interpretIntent } from "./intent.js";
import { buildAgentPrompt } from "./promptBuilder.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function flattenFindings(employee, overrides = {}) {
  const pack = getFindingsForEmployee(employee);
  const source = Array.isArray(pack.all)
    ? pack.all
    : [...(pack.section1 || []), ...(pack.section2 || []), ...(pack.documentReview || [])];
  const rows = source.map((f) => ({
    ...f,
    section: f.section || "Section 1",
    status: overrides[f.id] || f.status,
  }));
  return { pack, rows, open: rows.filter((r) => r.status === "open") };
}

function planFromFindings(employee, open, pack) {
  if (!open.length) {
    const docs = (employee.documents || []).map((d) => (typeof d === "string" ? d : d.name)).join(", ");
    return {
      title: `No open remediation items for ${employee.name}`,
      steps: [
        docs ? `Imported documents on file: ${docs}.` : "No imported documents are attached to this employee.",
        pack?.recommendation || "Retain the Form I-9 per policy.",
      ],
      findingIds: [],
    };
  }
  const steps = open.map((f, i) => {
    const who = f.section === "Section 1" ? "Employee" : "Employer / authorized representative";
    return `${i + 1}. (${f.class}) ${f.title}: ${who} corrects on the form, initials, and dates with today's date. ${f.detail}`;
  });
  return {
    title: `Correction plan for ${employee.name}`,
    steps,
    findingIds: open.map((f) => f.id),
  };
}

/**
 * Build the assistant reply from the live prompt context (selected employee + findings).
 */
function responseFromPrompt(prompt, { employee, open, pack, userText, intent }) {
  const ctx = prompt.context || {};
  const name = ctx.employeeName || employee.name;
  switch (intent) {
    case "start_correction":
    case "regenerate": {
      const plan = planFromFindings(employee, open, pack);
      return {
        kind: "recommendation",
        text: `<strong>${plan.title}</strong><ol>${plan.steps.map((s) => `<li>${s.replace(/^\d+\.\s*/, "")}</li>`).join("")}</ol>`,
        recommendation: plan,
      };
    }
    case "section1_help":
      return {
        kind: "answer",
        text: `For <strong>${name}</strong>'s Section 1 items: only the employee should edit those fields. Use N/A for unused blanks, never backdate, and initial with the actual correction date. Open Section 1 findings: ${
          open.filter((f) => f.section === "Section 1").map((f) => f.title).join(", ") || "none"
        }.`,
      };
    case "section2_help":
      return {
        kind: "answer",
        text: `Section 2 fixes for <strong>${name}</strong> belong to the employer/authorized representative. Prefer List A <em>or</em> List B+C (not both). Open Section 2 findings: ${
          open.filter((f) => f.section === "Section 2").map((f) => f.title).join(", ") || "none"
        }.`,
      };
    case "summarize_findings":
      return {
        kind: "answer",
        text: ctx.openFindingCount
          ? `<strong>${name}</strong> has <strong>${ctx.errorCount}</strong> flagged issues (${ctx.openFindingCount} open). Technical: ${ctx.technicalCount}. Substantive: ${ctx.substantiveCount}. Documents: ${(
              pack.documentNames ||
              employee.documents?.map((d) => (typeof d === "string" ? d : d.name)) ||
              []
            ).join(", ") || "—"}. Guidance: ${ctx.recommendationSeed || pack.recommendation}`
          : `<strong>${name}</strong> has <strong>no open findings</strong>. ${(pack.documentNames || []).join(", ") || `${employee.docs} document(s)`}. ${
              ctx.recommendationSeed || pack.recommendation
            }`,
      };
    case "approve_plan":
      return {
        kind: "approve",
        text: "Marked the pending recommendation as approved. Open findings tied to the plan are now <strong>in remediation</strong>.",
      };
    case "reject_plan":
      return {
        kind: "reject",
        text: "Discarded the pending recommendation. Ask me to regenerate whenever you are ready.",
      };
    case "retention_help":
      return {
        kind: "answer",
        text: "Retain each Form I-9 for the later of 3 years after hire or 1 year after termination. Do not destroy forms that still sit inside that window.",
      };
    case "empty":
      return { kind: "answer", text: "Ask a question about this employee's findings, or start a correction recommendation." };
    default:
      return {
        kind: "answer",
        text: `I can help remediate <strong>${name}</strong>'s Form I-9 using the current audit result (${ctx.openFindingCount || 0} open findings). You asked: “${escapeHtml(
          userText
        )}”. Try “summarize findings”, “Section 1 help”, “Section 2 help”, or “start correction recommendation”.`,
      };
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Agent turn for the selected employee — uses live findings from Document Analysis state.
 */
export async function runAgentTurn({
  userText,
  employee,
  findingOverrides,
  onStatus,
}) {
  const { intent } = interpretIntent(userText);
  const { pack, open } = flattenFindings(employee, findingOverrides);
  const prompt = buildAgentPrompt({ intent, userText, employee, findings: pack, openFindings: open });

  onStatus?.("Analyzing request");
  await delay(200);
  onStatus?.("Reviewing available information");
  await delay(220);
  onStatus?.("Generating recommendation");
  await delay(240);

  const result = responseFromPrompt(prompt, { employee, open, pack, userText, intent });
  onStatus?.("Ready for review");
  await delay(100);
  return { intent, prompt, ...result };
}

export async function startCorrectionRecommendation(employee, findingOverrides, onStatus) {
  return runAgentTurn({
    userText: "Start correction recommendation",
    employee,
    findingOverrides,
    onStatus,
  });
}
