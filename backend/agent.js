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

CRITICAL DIFFICULTY RULES:
- EASY: Generate a straightforward conceptual question or a very basic scenario. It must be entry-level, simple, and must NOT require complex architectures, scaling strategies, automation frameworks, or distributed systems orchestration. Keep it focused on basic principles (e.g., explaining a single concept, writing a simple manual test case, or designing a single endpoint).
- MEDIUM: Generate a standard, realistic interview scenario. It should involve common mid-level trade-offs, standard edge cases, and design of simple features.
- HARD: Generate a highly complex, senior-level/principal-level problem. It must involve scaling, race conditions, advanced failure modes, security vulnerabilities, or deep low-level optimization.

The question must focus on: ${profile.specialties}.`;

  if (candidateProfile && typeof candidateProfile === "string" && candidateProfile.trim().length > 0) {
    systemPrompt += `\n\nTHE CANDIDATE PROFILE / BACKGROUND:
The candidate claims to have this specific background:
"${candidateProfile.trim()}"

You MUST dynamically tailor the generated question to target their claimed skills and background, but you MUST adjust the depth of the question to match the active difficulty setting (${difficulty.toUpperCase()}):
- For EASY difficulty: Ask a fundamental conceptual question or a very basic task aligned with their background. For example, if they are a manual tester, ask about simple manual test case design; if they use Java, ask about basic object-oriented concepts or simple API creation. Do NOT ask them about scaling, complex performance tuning, or automation frameworks.
- For MEDIUM difficulty: Ask a standard real-world scenario with typical mid-level engineering trade-offs or edge cases relevant to their background.
- For HARD difficulty: Ask a highly complex, senior-level problem involving scale, concurrency bottlenecks, security holes, or advanced failures in their technologies.`;
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

function summarizeBattleLog(battleLog) {
  if (!battleLog || !Array.isArray(battleLog) || battleLog.length === 0) {
    return "";
  }
  const intactCount = 2;
  const compressed = battleLog.map((entry, index) => {
    const isRecent = index >= battleLog.length - intactCount;
    const role = entry.sender === "boss" ? "Interviewer" : "Candidate";
    let text = entry.text || "";
    if (!isRecent && text.length > 120) {
      text = text.substring(0, 120) + "... [truncated]";
    }
    return `${role}: ${text}`;
  });
  return compressed.join("\n");
}

async function evaluateTurn(bossId, userResponse, difficulty = "medium", candidateProfile, battleLog) {
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

  let basePrompt = BOSS_PROMPTS[bossId] || getDefaultPrompt();
  // Strip the conflicting static damage rules to prevent conflict with the active difficulty setting
  basePrompt = basePrompt.replace(/CRITICAL RULES FOR DAMAGE SELECTION:[\s\S]*$/, "");

  if (difficulty === "easy") {
    // Strip the pre-existing complex analysis steps to prevent the LLM from grading on advanced criteria
    basePrompt = basePrompt.replace(/Analyze in this order:[\s\S]*?(?=Return ONLY valid JSON|$)/i, 
      `Analyze in this order:
1. **Basic Correctness & Concept** — Does the candidate understand the basic conceptual question? Does their response make logical sense for a beginner?
2. **General Understanding** — Have they answered the simple question directly, even if they omitted advanced edge cases, scaling, or systems architecture?
3. **Damage score** — If they show a basic correct concept, they MUST deal damage to the boss. Only deal damage to the player if their answer is completely incorrect or nonsensical.
`);
  }

  let systemPrompt = `You are running an interview simulation at ${difficulty.toUpperCase()} difficulty.
All evaluation rules, grading criteria, and follow-up question complexity MUST be adjusted to match this difficulty level.

${basePrompt}

=========================================
DIFFICULTY RULES OVERRIDE (${difficulty.toUpperCase()}):
- EASY: 
  - GRADING: Be highly lenient. Accept basic correct concepts. Overlook minor edge cases, concurrency issues, database scaling, or advanced security concerns unless the question explicitly asked for them. If the candidate shows a general understanding, set damageTo to "boss" (damageAmount: 20-50). Only set damageTo to "player" (damageAmount: 20-50) for completely incorrect, nonsensical, or empty answers.
  - FOLLOW-UP: Ask a simple, conceptual, or basic follow-up question. Do NOT ask them to scale components, design complex architectures, write automated scripts, or handle advanced concurrency/security edge cases.
- MEDIUM:
  - GRADING: Standard grading rules. Be fair but thorough. Check for core edge cases. If the candidate's proposed design is generally correct and addresses typical edge cases, set damageTo to "boss" (damageAmount: 15-40). If they miss standard edge cases, fail to address core issues, or introduce noticeable flaws, set damageTo to "player" (damageAmount: 15-40).
  - FOLLOW-UP: Ask a standard follow-up question about common edge cases, standard implementation trade-offs, or simple refactoring.
- HARD:
  - GRADING: Be extremely nitpicky, rigorous, and demanding. A correct answer is not enough; it must address advanced edge cases, security, and trade-offs. If they miss even minor edge cases or code flaws, you MUST set damageTo to "player" (damageAmount: 20-50). Only a truly comprehensive, bulletproof answer can deal damage to you (damageTo: "boss", damageAmount: 20-50).
  - FOLLOW-UP: Ask a highly challenging follow-up question pushing them to explain scaling limits, race conditions, advanced failure modes, or deep security vulnerabilities.

These DIFFICULTY RULES OVERRIDE override any conflicting instructions or example criteria mentioned in the rules above.`;

  // Inject Difficulty Stability Rules and Stack-Neutral progressions
  systemPrompt += `

CRITICAL INSTRUCTIONS FOR DIFFICULTY STABILITY:
- You MUST maintain the selected difficulty setting (${difficulty.toUpperCase()}) across all turns of the interview. Do NOT progressively escalate the difficulty to a higher tier even if the candidate's answers are excellent.
- For EASY difficulty: 80-90% of the questions must be basic, conceptual, or entry-level. If the candidate answers a question correctly, do NOT drill down into advanced concepts, system architecture, enterprise governance, or risk management. Instead, ask a different basic conceptual question, another straightforward scenario question, or ask them to explain a simple fundamental detail of their response. Keep all questions strictly at a beginner level.
- For MEDIUM difficulty: Keep all questions at a standard mid-level (e.g. common edge cases, standard testing strategies, typical database choices). Do NOT escalate into Hard topics (like microservice migration, distributed lock deadlocks, or advanced security exploit mitigations).
- For HARD difficulty: Keep the questions demanding, detailed, and highly technical from start to finish, grilling them on low-level details, concurrency, security exploits, and architectural trade-offs.`;

  // Inject strict domain restrictions for EASY, MEDIUM, and HARD modes
  if (difficulty === "easy") {
    systemPrompt += `\n\nSTRICT INTERVIEWER BOUNDARIES FOR EASY MODE:
- As the Nitpicking System Architect: Focus only on basic CRUD endpoints, simple database tables, or simple client-server concepts. DO NOT ask about database scalability, Paxos/Raft consensus, multi-region database sharding, saga design patterns, distributed queues, or performance tuning.
- As the Chaotic Startup CTO: Focus only on basic code logic, simple unit testing (positive/negative assertions), or standard code style/comments. DO NOT ask about CI/CD pipeline structures, dependency injection containers, or complex architectural refactoring.
- As the Pedantic Product Manager: Focus only on basic user features, simple user feedback, or basic prioritization. DO NOT ask about database scalability, billion-row datasets, data aggregation strategy, statistical significance in A/B tests, or complex roadmap dependencies.
- As the Rigorous QA Lead: Focus only on manual QA/testing topics (defect lifecycle, simple bug logging, priority vs severity, or basic data validations). DO NOT ask about automation frameworks, Unicode normalization, ICU libraries, hidden/invisible characters, or performance/load testing.

EASY MODE FOLLOW-UP PROGRESSION (STACK-NEUTRAL):
If there is a conversation history, build a simple progression within the EASY tier:
1. Explain basic expected result or core definition (e.g. NULL handling or WHERE vs HAVING).
2. Detail how to log/report/document this concept or check for simple validation issues (e.g. empty or missing inputs).
3. Define simple priority, severity, or basic importance of resolving this issue.
4. Detail simple boundary check scenarios or simple input validations (e.g. character limits or positive numbers).
Keep the follow-up question short, clear, and strictly entry-level. Do NOT branch into migration, time zones, or database constraints.`;
  } else if (difficulty === "medium") {
    systemPrompt += `\n\nSTRICT INTERVIEWER BOUNDARIES FOR MEDIUM MODE:
- As the Nitpicking System Architect: Focus on standard database choices (SQL vs NoSQL), basic caching (Redis/Memcached), REST API design, load balancing, and basic scaling. DO NOT ask about complex distributed consensus (Paxos/Raft) or multi-region active-active setups.
- As the Chaotic Startup CTO: Focus on standard code quality, code reviews, unit and integration testing strategy, technical debt tradeoffs, and basic developer team conflicts. DO NOT ask about complex high-scale performance profiling or complete serverless architecture migration.
- As the Pedantic Product Manager: Focus on standard MVP scope definition, customer acquisition/retention metrics, prioritizing roadmap items based on feedback, and user analytics tools. DO NOT ask about complex micro-funnel statistical significance equations or setting up global multi-team roadmaps.
- As the Rigorous QA Lead: Focus on automation test strategies (UI vs API tests), standard edge cases (empty lists, negative inputs, null values), basic load testing metrics (response time, throughput), and common security practices (input validation, rate limiting). DO NOT ask about advanced Unicode normalization, hidden/invisible characters, or ICU libraries.

MEDIUM MODE FOLLOW-UP PROGRESSION (STACK-NEUTRAL):
If there is a conversation history, build a progressive mid-level interview flow:
- Architect: 1. Core component design -> 2. Data flow & CRUD API definition -> 3. Caching & read replica setup -> 4. Failover planning.
- CTO: 1. Identifying code debt -> 2. Testing strategy -> 3. Trade-off decision (speed vs refactoring) -> 4. Team process improvement.
- PM: 1. MVP feature scope -> 2. Analytics KPIs -> 3. User feedback prioritization -> 4. Feature trade-offs.
- QA: 1. Automation strategy/scope (API vs UI) -> 2. Standard edge cases -> 3. Basic performance configuration -> 4. Common security checks (rate limiting/input sanitization).
Keep follow-up questions focused, realistic, and mid-level.`;
  } else if (difficulty === "hard") {
    systemPrompt += `\n\nSTRICT INTERVIEWER BOUNDARIES FOR HARD MODE:
- As the Nitpicking System Architect: Focus on advanced system design, distributed consensus (Paxos, Raft), multi-region active-active replication, distributed transactions (2PC, Sagas), complex caching eviction strategies, and low-latency global architectures.
- As the Chaotic Startup CTO: Focus on principal-level engineering issues, complete system refactoring strategies, architectural paradigm shifts (e.g. monolith to microservices), complex team restructures, and technical debt risk management.
- As the Pedantic Product Manager: Focus on complex product monetization, deep A/B testing statistical significance, advanced user retention funnels, global roadmap prioritization, and market dynamics trade-offs.
- As the Rigorous QA Lead: Focus on advanced security vulnerabilities (SQLi, XSS, CSRF, JWT compromise), low-level race conditions and concurrency bottlenecks, complex performance profiling, automation framework scalability, and edge cases like Unicode normalization, invisible/hidden characters, and ICU libraries.

HARD MODE FOLLOW-UP PROGRESSION (STACK-NEUTRAL):
If there is a conversation history, build a challenging, senior-level progression pushing candidates to their technical limits:
- Architect: 1. Global multi-component design -> 2. Distributed consistency & Sagas -> 3. Deep bottlenecks (memory leaks, lock contention) -> 4. Multi-region disaster recovery.
- CTO: 1. Resolving complex tech debt risks -> 2. Designing long-term refactoring roadmaps -> 3. Organization scaling -> 4. Risk assessment of major paradigm shifts.
- PM: 1. Advanced monetization -> 2. A/B testing statistical analysis -> 3. Deep funnel optimization -> 4. High-risk roadmap trade-offs.
- QA: 1. Exploitation vector & system-wide remediation -> 2. Concurrency/race condition mitigation -> 3. Lock contention & database deadlocks -> 4. Advanced boundary testing (Unicode normalization, invisible characters).
Keep the questions demanding, detailed, and highly technical.`;
  }

  if (candidateProfile && typeof candidateProfile === "string" && candidateProfile.trim().length > 0) {
    systemPrompt += `

THE CANDIDATE PROFILE / BACKGROUND:
The candidate claims to have this specific background:
"${candidateProfile.trim()}"

You MUST cross-examine their answers against their claimed stack and technologies while strictly preserving your character persona rules. If they say they are an expert in Java, grill them on concurrency or JVM memory. If they claim to know automated testing, attack their validation strategies. Critically evaluate whether their proposed solution aligns with or leverages their background appropriately, or if they are failing to apply their claimed skills.`;
  }

  systemPrompt += `

CRITICAL DAMAGE ASSIGNMENT RULES:
- For EVERY turn where the candidate provides a substantive technical answer, you MUST choose either "player" or "boss" for the "damageTo" field.
- You are STRICTLY PROHIBITED from setting "damageTo" to "none" or "damageAmount" to 0 for a technical response. Setting damageTo to "none" and damageAmount to 0 is ONLY permitted if the candidate's response is completely empty, conversational chit-chat, or completely off-topic.
- If the candidate's answer is correct or shows reasonable understanding (applying lenient grading for EASY, standard for MEDIUM, and strict for HARD), you MUST set "damageTo" to "boss" and "damageAmount" to a value between 15 and 50.
- If the candidate's answer is flawed, incorrect, or misses key elements (applying lenient grading for EASY, standard for MEDIUM, and strict for HARD), you MUST set "damageTo" to "player" and "damageAmount" to a value between 15 and 50.
- Ensure that HP is dynamically and consistently reduced on either side to maintain an engaging, fast-paced game.`;

  const historyText = summarizeBattleLog(battleLog);
  if (historyText) {
    systemPrompt += `\n\nCONVERSATION HISTORY (SUMMARIZED):\nUse the following history to understand the context and progress the conversation naturally:\n${historyText}`;
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

async function generateReportCard(bossId, battleLog, difficulty = "medium", candidateProfile) {
  if (!battleLog || !Array.isArray(battleLog) || battleLog.length === 0) {
    throw new Error("Cannot generate a report card for an empty battle log.");
  }

  const BOSS_TITLES = {
    architect: "nitpicking System Architect",
    cto: "chaotic Startup CTO",
    pm: "pedantic Product Manager",
    qa: "rigorous QA Lead"
  };

  const BOSS_TONES = {
    architect: "technical, structural, nitpicky, focusing on scalability and SPOFs",
    cto: "pragmatic, engineering-focused, fast-paced, focusing on code quality and technical debt",
    pm: "customer-centric, pedantic about MVP scope, roadmap alignment, and business metrics",
    qa: "rigorous, defensive, focusing on edge cases, safety, vulnerabilities, and reliability"
  };

  const title = BOSS_TITLES[bossId] || BOSS_TITLES.cto;
  const tone = BOSS_TONES[bossId] || BOSS_TONES.cto;

  const systemPrompt = `You are the evaluation engine for the Mock Interview Arena.
The candidate just finished a mock interview combat simulation against the ${title} (difficulty: ${difficulty.toUpperCase()}).
Candidate's claimed profile/resume summary: "${candidateProfile || 'None provided'}"

Here is the complete dialogue log of the interview:
${JSON.stringify(battleLog, null, 2)}

Your task is to perform a comprehensive post-game technical evaluation of the candidate's answers and generate a Candidate Feedback Matrix (Technical Report Card).

==================================================
DIFFICULTY-ALIGNED GRADING STANDARDS (${difficulty.toUpperCase()}):
You MUST calibrate your grading criteria, category scores, and proficiency ratings to align with the active difficulty tier (${difficulty.toUpperCase()}):

- EASY Mode:
  - Expect only fundamental, entry-level concepts. 
  - Do NOT penalize or deduct points in any category (including "System Scalability & SPOFs") for the omission of advanced architectures, distributed scaling, sharding, replication, or performance profiling.
  - Specifically, for the "System Scalability & SPOFs" category, you MUST assign a score of at least 4/5 if their proposed solution is correct for a small or local dataset. You are prohibited from assigning a score below 4/5 in this category in EASY mode unless their basic design is functionally incorrect, broken, or contains severe logical bugs.
  - If a candidate provides correct beginner/intermediate level answers (e.g., simple SQL joins, date conversions, handling duplicates/nulls, basic expected results), they should receive high scores (4/5 or 5/5) in all categories relative to the EASY baseline.
  - In the "skillsMatrix", evaluate proficiency relative to entry-level expectations. A candidate showing solid intermediate SQL capabilities (e.g., using functions, filters, and null checks) must NOT be rated as "Beginner"; rate them as "Intermediate" or "Advanced" for this tier.
  
- MEDIUM Mode:
  - Expect standard mid-level trade-offs, standard edge cases, and solid component-level design.
  - Do not expect principal-level optimizations, distributed consensus protocols, or highly complex security exploit remediations unless the dialogue explicitly focused on them.
  - Calibrate the skills matrix and category scores against a standard developer baseline.

- HARD Mode:
  - Grade with extreme rigor, demanding senior/principal-level engineering expertise.
  - Candidacy must show deep understanding of scalability, concurrency, security vulnerabilities, database deadlocks, and system trade-offs. Deduct points heavily if they omit these advanced concerns.
==================================================

CRITICAL SKILLS EXTRACTION INSTRUCTIONS:
- Identify 3-5 key technical skills, tools, or frameworks dynamically based on the candidate's profile/resume and the actual interview rounds. 
- If no profile was provided, extract them from the core topics tested. 
- DO NOT output placeholder skills (like Spring Boot, Kafka, System Design, Concurrency) unless they were actually mentioned in the candidate profile or dialogue. For example, if the candidate profile is a Manual Tester, extract manual testing skills (e.g. Manual Testing, Test Cases, Bug Reporting, Regression Testing, etc.).

Analyze the conversation step-by-step and output a valid JSON object matching the following structure:
{
  "overallVerdict": {
    "status": "PASS" | "FAIL",
    "overallScore": <integer between 0 and 100>,
    "summary": "<A 3-4 sentence comprehensive performance summary. This summary MUST be written in the voice/persona of the interviewer (${title}), reflecting their unique attitude, tone: ${tone}. It should be constructive yet stay strictly in character.>"
  },
  "categories": [
    {
      "name": "Technical Accuracy & Logic",
      "score": <integer 1 to 5>,
      "maxScore": 5,
      "feedback": "<Critique of their technical understanding, accuracy of solutions, and correctness of code/algorithms.>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "improvements": ["<improvement 1>", "<improvement 2>"]
    },
    {
      "name": "System Scalability & SPOFs",
      "score": <integer 1 to 5>,
      "maxScore": 5,
      "feedback": "<Critique of how well they identified single points of failure, scaling issues, concurrency, or performance bottlenecks.>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "improvements": ["<improvement 1>", "<improvement 2>"]
    },
    {
      "name": "Pragmatism & MVP Alignment",
      "score": <integer 1 to 5>,
      "maxScore": 5,
      "feedback": "<Critique of their prioritization, cost/velocity awareness, trade-offs, and keeping focus on core user value.>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "improvements": ["<improvement 1>", "<improvement 2>"]
    },
    {
      "name": "Communication & Persona Engagement",
      "score": <integer 1 to 5>,
      "maxScore": 5,
      "feedback": "<Critique of how well they answered the interviewer's specific follow-up questions and engaged with their persona context.>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "improvements": ["<improvement 1>", "<improvement 2>"]
    }
  ],
  "skillsMatrix": [
    {
      "skill": "<A technical skill, framework, tool, or engineering core competency tested or mentioned in the interview (e.g. Manual Testing, Jest, Load Testing, API Design, Scalability, etc.). DO NOT hardcode Spring Boot, Kafka, or Concurrency unless they actually match the candidate's profile/resume or dialogue rounds.>",
      "proficiency": "Advanced" | "Intermediate" | "Beginner",
      "status": "Targeted" | "Untargeted",
      "comments": "<Short critique of how well they demonstrated or failed to apply this skill relative to their claimed resume/profile and the dialogue history.>"
    }
  ],
  "timelineFeedback": [
    {
      "turnIndex": <integer, starting at 1>,
      "candidateAnswerSummary": "<A short summary of what the candidate answered in 1 sentence.>",
      "scoreImpact": "<e.g., +10 (Solid scaling strategy) or -15 (Single database SPOF)>",
      "critique": "<Short 1-2 sentence critique of this specific round's answer.>"
    }
  ]
}

TIMELINE FEEDBACK CONSTRAINTS:
- You MUST generate exactly one entry in the "timelineFeedback" array for each player answer (entries where sender is "player") in the provided dialogue log.
- Do NOT hallucinate, invent, or append any extra rounds that are not present in the dialogue history. For example, if the candidate only answered 1 question, there must be exactly 1 entry in the "timelineFeedback" array. If they answered 2 questions, there must be exactly 2 entries.
- If there are no player answers in the log at all, return an empty array for "timelineFeedback".

Ensure the output is ONLY a valid JSON object. Do not include markdown code fences, trailing commas, or any other extra text.`;

  try {
    const raw = await getCompletion(systemPrompt, "Please generate the report card JSON now.");
    const cleaned = stripMarkdown(raw);
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    let jsonStr = null;
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
    }
    if (!jsonStr) {
      throw new Error("Failed to parse report card JSON from LLM response.");
    }
    const report = JSON.parse(jsonStr);

    const playerTurnCount = battleLog.filter(
      (m) => m && ["player", "candidate", "user"].includes((m.sender || "").toLowerCase())
    ).length;

    // Normalize and truncate turnIndex in timelineFeedback to match the actual number of player turns
    if (report && Array.isArray(report.timelineFeedback)) {
      if (report.timelineFeedback.length > playerTurnCount) {
        report.timelineFeedback = report.timelineFeedback.slice(0, playerTurnCount);
      }
      report.timelineFeedback.forEach((tf, index) => {
        tf.turnIndex = index + 1;
      });
    }

    return report;
  } catch (error) {
    console.error("generateReportCard error:", error.message);
    throw error;
  }
}

module.exports = { evaluateTurn, generateChallenge, verifyAndExtractResume, generateReportCard };
