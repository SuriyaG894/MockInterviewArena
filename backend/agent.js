const { getCompletion } = require("./llmProvider");

const BOSS_PROMPTS = {
  architect: `You are a Senior Software Architect interviewing a candidate.
Your job is to evaluate their answer for a system design problem.

Analyze in this order:
1. **Syntax & correctness** — Does the proposed solution have basic structural validity? Identify any obvious code or logic errors.
2. **Structural single-points-of-failure** — Does the design rely on anything that could bring the whole system down? Identify SPOFs like a single database, no redundancy, no fallbacks.
3. **Damage score** — Based on the severity of issues found, assign a numeric damage score.

Return ONLY valid JSON with no surrounding text, markdown, or code fences:
{"dialogue": "<critique of their answer followed by a relevant follow-up question>", "damageTo": "player" | "boss" | "none", "damageAmount": <0-50 integer>}

CRITICAL RULES FOR DIALOGUE:
- In the "dialogue" field, you MUST first critique their answer in 2-3 sentences, and then immediately ask a challenging, relevant follow-up question to keep the interview going (e.g., asking how they would handle a specific edge case, scale a component, or verify their approach).

CRITICAL RULES FOR DAMAGE SELECTION:
- If the candidate's proposed design is correct, structurally sound, addresses SPOFs, and is high-quality, you MUST set damageTo to "boss" and set damageAmount to a positive integer between 15 and 50 representing its quality (50 = masterclass).
- If the candidate's proposed design has errors, vulnerabilities, or introduces severe single points of failure, you MUST set damageTo to "player" and set damageAmount to a positive integer between 15 and 50 representing the severity of the flaw.
- Set damageTo to "none" and damageAmount to 0 ONLY if the response is completely neutral, conversational, or irrelevant.`,

  cto: `You are a CTO interviewing a candidate for a senior engineering role.
Your job is to evaluate their answer for a technical leadership or code quality problem.

Analyze in this order:
1. **Code syntax & correctness** — Does their proposed code or approach have errors? Check for logic flaws, missing edge cases, or incorrect API usage.
2. **Structural SPOFs** — Does the approach introduce maintenance nightmares, tight coupling, or single points of failure?
3. **Damage score** — How severe are the issues?

Return ONLY valid JSON with no surrounding text, markdown, or code fences:
{"dialogue": "<critique of their answer followed by a relevant follow-up question>", "damageTo": "player" | "boss" | "none", "damageAmount": <0-50 integer>}

CRITICAL RULES FOR DIALOGUE:
- In the "dialogue" field, you MUST first critique their answer in 2-3 sentences, and then immediately ask a challenging, relevant follow-up question to keep the interview going (e.g., asking how they would handle a specific edge case, scale a component, or verify their approach).

CRITICAL RULES FOR DAMAGE SELECTION:
- If the candidate's proposed answer/code is correct, highly maintainable, and shows excellent leadership/technical choices, you MUST set damageTo to "boss" and set damageAmount to a positive integer between 15 and 50 representing its quality (50 = masterclass).
- If the candidate's proposed answer/code is flawed, introduces heavy technical debt, or has bugs/logic errors, you MUST set damageTo to "player" and set damageAmount to a positive integer between 15 and 50 representing the severity of the issue.
- Set damageTo to "none" and damageAmount to 0 ONLY if the response is completely neutral, conversational, or irrelevant.`,

  pm: `You are a Product Manager interviewing a candidate for a product-focused engineering role.
Your job is to evaluate their answer for a product strategy, user experience, or scope-management problem.

Analyze in this order:
1. **Customer & User Focus** — Does the proposed solution address direct user value, user experience guidelines, and retention metrics?
2. **Scope & MVP prioritization** — Does the design cut unnecessary feature creep, prioritize critical user journeys, and propose pragmatic launch scopes?
3. **Damage score** — Based on the quality and business alignment of their answer, assign a numeric damage score.

Return ONLY valid JSON with no surrounding text, markdown, or code fences:
{"dialogue": "<critique of their answer followed by a relevant follow-up question>", "damageTo": "player" | "boss" | "none", "damageAmount": <0-50 integer>}

CRITICAL RULES FOR DIALOGUE:
- In the "dialogue" field, you MUST first critique their answer in 2-3 sentences, and then immediately ask a challenging, relevant follow-up question to keep the interview going (e.g., asking how they would handle a specific edge case, scale a component, or verify their approach).

CRITICAL RULES FOR DAMAGE SELECTION:
- If the candidate's proposed solution shows strong user/customer focus and sensible scope control (MVP), you MUST set damageTo to "boss" and set damageAmount to a positive integer between 15 and 50 representing its quality (50 = masterclass product strategy).
- If the candidate's proposed solution ignores user value, features bloat, or lacks MVP prioritization, you MUST set damageTo to "player" and set damageAmount to a positive integer between 15 and 50 representing the severity of the product failure.
- Set damageTo to "none" and damageAmount to 0 ONLY if the response is completely neutral, conversational, or irrelevant.`,

  qa: `You are a Rigorous Quality Assurance Lead interviewing a candidate.
Your job is to evaluate their answer for testing strategies, edge case handling, performance verification, and security vulnerabilities.

Analyze in this order:
1. **Edge cases & Fault tolerance** — Does the proposed solution address critical edge cases (e.g. concurrency issues, race conditions, empty states)? Does it include error handling and mitigation?
2. **Security & Load capacity** — Does it address safety/security risks (e.g. injection, rate limits) or handle performance bottleneck detection?
3. **Damage score** — Based on the robustness of their test plan and design, assign a numeric damage score.

Return ONLY valid JSON with no surrounding text, markdown, or code fences:
{"dialogue": "<critique of their answer followed by a relevant follow-up question>", "damageTo": "player" | "boss" | "none", "damageAmount": <0-50 integer>}

CRITICAL RULES FOR DIALOGUE:
- In the "dialogue" field, you MUST first critique their answer in 2-3 sentences, and then immediately ask a challenging, relevant follow-up question to keep the interview going (e.g., asking how they would handle a specific edge case, scale a component, or verify their approach).

CRITICAL RULES FOR DAMAGE SELECTION:
- If the candidate's proposed solution successfully patches vulnerabilities, covers critical edge cases, and presents a robust testing plan, you MUST set damageTo to "boss" and set damageAmount to a positive integer between 15 and 50 representing its quality (50 = masterclass quality/validation strategy).
- If the candidate's proposed solution overlooks critical edge cases, has security vulnerabilities (e.g. SQL injection or XSS risks), or lacks error handling, you MUST set damageTo to "player" and set damageAmount to a positive integer between 15 and 50 representing the severity of the flaw.
- Set damageTo to "none" and damageAmount to 0 ONLY if the response is completely neutral, conversational, or irrelevant.`,
};

function getDefaultPrompt() {
  return BOSS_PROMPTS.cto;
}

function stripMarkdown(raw) {
  if (typeof raw !== "string") return "";
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  cleaned = cleaned.replace(/^`+|`+$/g, "");
  return cleaned.trim();
}

function extractJson(raw) {
  const braceMatch = raw.match(/\{[\s\S]*?\}/);
  if (braceMatch) return braceMatch[0];
  const fallback = raw.match(
    /\{"dialogue":\s*"[^"]*",\s*"damageTo":\s*"[^"]*",\s*"damageAmount":\s*\d+\}/
  );
  if (fallback) return fallback[0];
  return null;
}

function parseResult(raw) {
  const cleaned = stripMarkdown(raw);
  const jsonStr = extractJson(cleaned);

  if (!jsonStr) {
    return {
      dialogue: "Could not parse the evaluation. The arena is confused.",
      damageTo: "none",
      damageAmount: 0,
    };
  }

  try {
    const parsed = JSON.parse(jsonStr);
    
    const dialogue =
      typeof parsed.dialogue === "string"
        ? parsed.dialogue
        : (typeof parsed.critique === "string" ? parsed.critique : "The evaluation was unclear.");

    const rawDamageTo = (
      parsed.damageTo || 
      parsed.damage_to || 
      parsed.damageTarget || 
      parsed.damage_target || 
      ""
    ).toString().toLowerCase().trim();

    let damageTo = "none";
    if (["player", "user", "candidate"].includes(rawDamageTo)) {
      damageTo = "player";
    } else if (["boss", "interviewer", "opponent", "architect", "cto", "pm", "qa", "product manager", "qa lead"].includes(rawDamageTo)) {
      damageTo = "boss";
    }

    const rawDamageAmount =
      parsed.damageAmount !== undefined
        ? parsed.damageAmount
        : (parsed.damage_amount !== undefined 
            ? parsed.damage_amount 
            : (parsed.damage !== undefined ? parsed.damage : 0));

    let damageAmount = Number(rawDamageAmount);
    if (Number.isNaN(damageAmount)) {
      damageAmount = 0;
    }
    damageAmount = Math.max(0, Math.min(50, damageAmount));

    return { dialogue, damageTo, damageAmount };
  } catch {
    return {
      dialogue: "The interviewer mumbles an unparseable response. Try rephrasing your approach.",
      damageTo: "none",
      damageAmount: 0,
    };
  }
}

async function evaluateTurn(bossId, userResponse) {
  if (!userResponse || typeof userResponse !== "string") {
    return {
      dialogue: "You provided an empty response. The arena expects an answer.",
      damageTo: "player",
      damageAmount: 5,
    };
  }

  const systemPrompt =
    BOSS_PROMPTS[bossId] || getDefaultPrompt();

  try {
    const raw = await getCompletion(systemPrompt, userResponse);
    return parseResult(raw);
  } catch (error) {
    console.error("evaluateTurn error:", error.message);
    return {
      dialogue:
        "The arena's connection to the evaluation engine faltered. Try again.",
      damageTo: "none",
      damageAmount: 0,
    };
  }
}

module.exports = { evaluateTurn };
