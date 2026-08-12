/**
 * Intent detection for the I-9 Audit Assistant.
 * Returns a coarse intent label — not private chain-of-thought.
 */

const PATTERNS = [
  { intent: "start_correction", patterns: [/start correction/i, /recommend/i, /fix (this|the) (form|i-?9)/i, /remediat/i] },
  { intent: "section1_help", patterns: [/section\s*-?\s*1/i, /attestation/i, /employee signature/i, /n\/a/i] },
  { intent: "section2_help", patterns: [/section\s*-?\s*2/i, /list\s*[abc]/i, /document number/i, /receipt/i] },
  { intent: "summarize_findings", patterns: [/summar/i, /overview/i, /what('s| is) wrong/i, /findings?/i, /errors?/i] },
  { intent: "approve_plan", patterns: [/approve/i, /accept/i, /apply (the )?plan/i, /looks good/i] },
  { intent: "reject_plan", patterns: [/reject/i, /discard/i, /no,? thanks/i, /don'?t apply/i] },
  { intent: "regenerate", patterns: [/regenerat/i, /try again/i, /another (plan|recommendation)/i, /retry/i] },
  { intent: "retention_help", patterns: [/retain/i, /retention/i, /how long/i, /storage/i] },
];

export function interpretIntent(userText) {
  const text = (userText || "").trim();
  if (!text) return { intent: "empty", confidence: 1 };

  for (const rule of PATTERNS) {
    if (rule.patterns.some((re) => re.test(text))) {
      return { intent: rule.intent, confidence: 0.86, text };
    }
  }
  return { intent: "general_question", confidence: 0.55, text };
}
