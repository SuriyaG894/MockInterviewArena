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

const BOSS_PROFILES = {
  architect: {
    title: "nitpicking System Architect",
    specialties: "system design, scalability, microservices, databases, and trade-offs"
  },
  cto: {
    title: "chaotic Startup CTO",
    specialties: "code quality, testing strategy, engineering velocity, and technical debt tradeoffs"
  },
  pm: {
    title: "pedantic Product Manager",
    specialties: "user experience, MVP strategy, roadmap prioritization, and customer-centric design"
  },
  qa: {
    title: "rigorous QA Lead",
    specialties: "edge cases, test automation, load testing, security vulnerabilities, and failure recovery"
  }
};

async function generateChallenge(bossId, difficulty, candidateProfile) {
  const profile = BOSS_PROFILES[bossId] || BOSS_PROFILES.cto;
  let systemPrompt = `You are a ${profile.title} interviewing a candidate.
Your job is to generate a single technical interview question.
The question difficulty MUST match: ${difficulty.toUpperCase()}.
- EASY: A straightforward conceptual question or simple code design challenge.
- MEDIUM: A standard, realistic interview scenario with some complexity and edge cases.
- HARD: A highly complex, multi-layered problem involving scaling, race conditions, advanced failure modes, or security risks.

The question must focus on: ${profile.specialties}.`;

  if (candidateProfile && typeof candidateProfile === "string" && candidateProfile.trim().length > 0) {
    systemPrompt += `\n\nTHE CANDIDATE PROFILE / BACKGROUND:\nThe candidate claims to have this specific background:\n"${candidateProfile.trim()}"\n\nYou MUST dynamically tailor the generated question to target their claimed skills and background while strictly preserving your character persona rules. For example, if they specialize in Java and databases, ask a Java/database scaling challenge. If they specialize in QA testing, ask about quality automation bottlenecks.`;
  }

  systemPrompt += `\n\nReturn ONLY a valid JSON object matching this schema:
{"question": "<question text under 2-3 sentences>"}
Do not return any surrounding text, markdown, or code fences.`;

  try {
    const rawQuestion = await getCompletion(systemPrompt, "Please generate the question now.");
    if (!rawQuestion || typeof rawQuestion !== "string") {
      throw new Error("Empty or invalid response received from LLM completion.");
    }
    let challenge = "";
    try {
      const parsed = JSON.parse(rawQuestion.trim());
      if (parsed && typeof parsed === "object") {
        challenge = parsed.question || parsed.challenge || rawQuestion;
      } else {
        challenge = rawQuestion;
      }
    } catch {
      challenge = rawQuestion;
    }
    challenge = challenge.trim();
    
    const welcomeMessages = {
      architect: "Ah, another architect hopeful. Let me examine your structural integrity...",
      cto: "Welcome to the trenches. Show me code that doesn't embarrass itself.",
      pm: "Let's align our roadmap. Show me how you trade off engineering complexity for user value...",
      qa: "My mission is to break your assumptions. Prove to me that your logic is bulletproof under pressure..."
    };
    const welcome = welcomeMessages[bossId] || "Let's begin the interview.";
    const welcomeMessage = `${welcome}\n\nChallenge: ${challenge}`;

    return { challenge, welcomeMessage };
  } catch (error) {
    console.error("Error generating challenge:", error.message);
    throw error;
  }
}

async function evaluateTurn(bossId, userResponse, difficulty = "medium", candidateProfile) {
  if (!userResponse || typeof userResponse !== "string") {
    return {
      dialogue: "You provided an empty response. The arena expects an answer.",
      damageTo: "player",
      damageAmount: 5,
    };
  }

  const trimmed = userResponse.trim();
  const hasAlphanumeric = /[a-zA-Z0-9]/.test(trimmed);
  if (trimmed.length < 5 || !hasAlphanumeric) {
    return {
      dialogue: "That response is too short or meaningless. Please provide a substantive answer to the challenge.",
      damageTo: "none",
      damageAmount: 0,
    };
  }

  let systemPrompt =
    BOSS_PROMPTS[bossId] || getDefaultPrompt();

  systemPrompt += `

DIFFICULTY SETTING: ${difficulty.toUpperCase()}
Evaluate the candidate's answer strictly based on this difficulty setting:
- EASY: Be highly lenient. Accept basic correct concepts. Overlook minor edge cases. If they show a general understanding, set damageTo to "boss" (damageAmount: 20-50) and damageTo to "player" only for completely incorrect answers.
- MEDIUM: Standard grading rules. Be fair but thorough. Check for core edge cases.
- HARD: Be extremely nitpicky, rigorous, and demanding. A correct answer is not enough; it must address advanced edge cases, security, and trade-offs. If they miss even minor edge cases or code flaws, you MUST set damageTo to "player" (damageAmount: 20-50). Only a truly comprehensive, bulletproof answer can deal damage to you (damageTo: "boss").`;

  if (candidateProfile && typeof candidateProfile === "string" && candidateProfile.trim().length > 0) {
    systemPrompt += `

THE CANDIDATE PROFILE / BACKGROUND:
The candidate claims to have this specific background:
"${candidateProfile.trim()}"

You MUST cross-examine their answers against their claimed stack and technologies while strictly preserving your character persona rules. If they say they are an expert in Java, grill them on concurrency or JVM memory. If they claim to know automated testing, attack their validation strategies. Critically evaluate whether their proposed solution aligns with or leverages their background appropriately, or if they are failing to apply their claimed skills.`;
  }

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

async function verifyAndExtractResume(rawText) {
  if (!rawText || typeof rawText !== "string" || rawText.trim().length < 100) {
    throw new Error("The uploaded document does not appear to be a professional resume or CV. Please upload a valid resume.");
  }

  const systemPrompt = `You are a professional recruiting assistant parser.
Your task is to analyze the raw text uploaded by a candidate and perform two tasks:
1. **Classification**: Verify if the text is a professional resume, Curriculum Vitae (CV), or a brief professional bio of a technical/software engineering professional. 
2. **Extraction**: If it is a valid resume/CV, extract and summarize the core technical profile into a concise paragraph (under 150-200 words). Focus ONLY on: Target Role, Primary Technology Stack, Years/level of experience, and key technical project themes. Do not include contact info, headers, or generic boilerplate.

If the document does not look like a resume/CV/bio (for example, if it is a receipt, utility bill, book, mathematical sheet, code script, or miscellaneous notes), you MUST set "isResume" to false and provide a reason in "extractedContent".

Return ONLY a valid JSON object with this schema:
{"isResume": true | false, "extractedContent": "concise technical summary here" | "error message here"}
Do not return any surrounding text, markdown, or code fences.`;

  try {
    const responseText = await getCompletion(systemPrompt, rawText);
    if (!responseText || typeof responseText !== "string") {
      throw new Error("The uploaded document does not appear to be a professional resume or CV. Please upload a valid resume.");
    }

    // Clean markdown code blocks if any
    let cleaned = responseText.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/i, "");
    cleaned = cleaned.replace(/^`+|`+$/g, "");

    const braceMatch = cleaned.match(/\{[\s\S]*?\}/);
    if (!braceMatch) {
      throw new Error("The uploaded document does not appear to be a professional resume or CV. Please upload a valid resume.");
    }

    let parsed;
    try {
      parsed = JSON.parse(braceMatch[0]);
    } catch (e) {
      throw new Error("The uploaded document does not appear to be a professional resume or CV. Please upload a valid resume.");
    }

    if (parsed.isResume === false || parsed.isResume === "false") {
      throw new Error(parsed.extractedContent || "The uploaded document does not appear to be a professional resume or CV. Please upload a valid resume.");
    }

    if (!parsed.extractedContent || typeof parsed.extractedContent !== "string") {
      throw new Error("The uploaded document does not appear to be a professional resume or CV. Please upload a valid resume.");
    }

    return parsed.extractedContent.trim();
  } catch (error) {
    console.error("verifyAndExtractResume error:", error.message);
    throw error;
  }
}

module.exports = { evaluateTurn, generateChallenge, verifyAndExtractResume };
