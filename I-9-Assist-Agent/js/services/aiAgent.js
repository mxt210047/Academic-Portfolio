import { getFindingsForEmployee } from "../data/mockData.js";
import { interpretIntent } from "./intent.js";
import { buildAgentPrompt } from "./promptBuilder.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function flattenFindings(employeeId, overrides = {}) {
  const pack = getFindingsForEmployee(employeeId);
  const rows = [
    ...pack.section1.map((f) => ({ ...f, section: "Section 1", status: overrides[f.id] || f.status })),
    ...pack.section2.map((f) => ({ ...f, section: "Section 2", status: overrides[f.id] || f.status })),
  ];
  return { pack, rows, open: rows.filter((r) => r.status === "open") };
}

function planFromFindings(employee, open) {
  if (!open.length) {
    return {
      title: "No open remediation items",
      steps: ["Retain the Form I-9 per policy.", "No employee outreach required."],
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

function responseForIntent(intent, ctx) {
  const { employee, open, pack, userText } = ctx;
  switch (intent) {
    case "start_correction":
    case "regenerate": {
      const plan = planFromFindings(employee, open);
      return {
        kind: "recommendation",
        text: `<strong>${plan.title}</strong><ol>${plan.steps.map((s) => `<li>${s.replace(/^\d+\.\s*/, "")}</li>`).join("")}</ol>`,
        recommendation: plan,
      };
    }
    case "section1_help":
      return {
        kind: "answer",
        text: `For <strong>${employee.name}</strong>'s Section 1 items: only the employee should edit those fields. Use N/A for unused blanks, never backdate, and initial with the actual correction date. Open Section 1 findings: ${
          open.filter((f) => f.section === "Section 1").map((f) => f.title).join(", ") || "none"
        }.`,
      };
    case "section2_help":
      return {
        kind: "answer",
        text: `Section 2 fixes for <strong>${employee.name}</strong> belong to the employer/authorized representative. Prefer List A <em>or</em> List B+C (not both). Line through improper entries, initial, and date. Open Section 2 findings: ${
          open.filter((f) => f.section === "Section 2").map((f) => f.title).join(", ") || "none"
        }.`,
      };
    case "summarize_findings":
      return {
        kind: "answer",
        text: `<strong>${employee.name}</strong> has <strong>${employee.errors}</strong> flagged issues (${open.length} still open). Technical: ${
          open.filter((f) => f.class === "technical").length
        }. Substantive: ${
          open.filter((f) => f.class === "substantive").length
        }. Guidance: ${pack.recommendation}`,
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
        text: `I can help remediate <strong>${employee.name}</strong>'s Form I-9. You asked: “${escapeHtml(
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
 * Mock AI service — swap `generate` body for a real API later using buildAgentPrompt().
 */
export async function runAgentTurn({
  userText,
  employee,
  findingOverrides,
  onStatus,
}) {
  const { intent } = interpretIntent(userText);
  const { pack, open } = flattenFindings(employee.id, findingOverrides);
  const prompt = buildAgentPrompt({ intent, userText, employee, findings: pack, openFindings: open });

  onStatus?.("Analyzing request");
  await delay(350);
  onStatus?.("Reviewing available information");
  await delay(420);
  onStatus?.("Generating recommendation");
  await delay(480);

  // prompt is ready for a future LLM call
  void prompt;

  const result = responseForIntent(intent, { employee, open, pack, userText });
  onStatus?.("Ready for review");
  await delay(180);
  return { intent, ...result };
}

export async function startCorrectionRecommendation(employee, findingOverrides, onStatus) {
  return runAgentTurn({
    userText: "Start correction recommendation",
    employee,
    findingOverrides,
    onStatus,
  });
}
