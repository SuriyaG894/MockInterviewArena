const { OpenAI } = require("openai");

const provider = process.env.LLM_PROVIDER || "groq";

let groqClient = null;
let localClient = null;
let azureClient = null;

// Initialize clients once at global module initialization (Singleton pattern)
try {
  if (provider === "groq" && process.env.GROQ_API_KEY) {
    groqClient = new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
    });
  } else if (provider === "local" && process.env.LOCAL_LLM_ENDPOINT) {
    localClient = new OpenAI({
      baseURL: process.env.LOCAL_LLM_ENDPOINT,
    });
  } else if (provider === "azure" && process.env.AZURE_AI_AGENTS_CONNECTION_STRING) {
    const { AIProjectsClient } = require("@azure/ai-agents");
    const { DefaultAzureCredential } = require("@azure/identity");
    azureClient = AIProjectsClient.fromConnectionString(
      process.env.AZURE_AI_AGENTS_CONNECTION_STRING,
      new DefaultAzureCredential()
    );
  }
} catch (err) {
  console.error("Global LLM Client Initialization Error:", err.message);
}

// Map to cache Azure Agent instances globally by systemPrompt key
const azureAgentsCache = new Map();

function getGroqClient() {
  if (!groqClient) {
    throw new Error("groqClient is not initialized. Check your environment variables.");
  }
  return groqClient;
}

function getLocalClient() {
  if (!localClient) {
    throw new Error("localClient is not initialized. Check your environment variables.");
  }
  return localClient;
}

function getAzureClient() {
  if (!azureClient) {
    throw new Error("azureClient is not initialized. Check your environment variables.");
  }
  return azureClient;
}

async function withRetry(fn, retries = 2, delayMs = 300) {
  let lastError;
  const startTime = Date.now();
  const overallLimit = 14000; // Under 15-second frontend abort threshold

  for (let attempt = 0; attempt <= retries; attempt++) {
    const elapsed = Date.now() - startTime;
    if (elapsed >= overallLimit) {
      throw new Error("Overall processing timeout exceeded");
    }

    try {
      // Individual attempt timeout of 10 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request Timeout")), 10000)
      );
      return await Promise.race([fn(), timeoutPromise]);
    } catch (error) {
      lastError = error;
      const willRetry = attempt < retries && (Date.now() - startTime + delayMs < overallLimit);
      if (willRetry) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

async function groqCompletion(systemPrompt, userMessage) {
  const client = getGroqClient();
  const model = process.env.GROQ_MODEL_NAME || "llama-3.1-8b-instant";
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
  });
  return response.choices[0].message.content;
}

async function localCompletion(systemPrompt, userMessage) {
  const client = getLocalClient();
  const model = process.env.LOCAL_MODEL_NAME;
  if (!model) throw new Error("LOCAL_MODEL_NAME is not set in .env");
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
  });
  return response.choices[0].message.content;
}

async function azureCompletion(systemPrompt, userMessage) {
  const client = getAzureClient();
  const deployment = process.env.AZURE_MODEL_DEPLOYMENT || "gpt-4o";

  // Cache/reuse the Agent instance matching current Azure guidelines
  let agent = azureAgentsCache.get(systemPrompt);
  if (!agent) {
    agent = await client.createAgent(deployment, {
      instructions: systemPrompt,
      name: "MockArenaAgent",
    });
    azureAgentsCache.set(systemPrompt, agent);
  }

  // Only spin up a lightweight, execution-specific Thread and Run lifecycle
  const thread = await client.createThread();

  await client.createMessage(thread.id, {
    role: "user",
    content: userMessage,
  });

  const run = await client.createRun(thread.id, agent.id);
  const startTime = Date.now();
  const TIMEOUT_MS = 10000;

  while (true) {
    if (Date.now() - startTime > TIMEOUT_MS) {
      throw new Error("Azure agent run timed out");
    }

    const status = await client.getRun(thread.id, run.id);

    if (status.status === "completed") break;
    if (status.status === "failed") {
      throw new Error(
        `Azure run failed: ${status.last_error?.message || "unknown error"}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const messages = await client.listMessages(thread.id);
  if (!messages || !Array.isArray(messages.data)) {
    return "";
  }
  const assistantMessages = messages.data.filter(
    (m) => m && m.role === "assistant"
  );
  if (assistantMessages.length === 0) {
    return "";
  }
  const last = assistantMessages[assistantMessages.length - 1];
  if (!last || !Array.isArray(last.content)) {
    return "";
  }

  // Join multiple text parts defensively
  const textParts = last.content
    .filter((c) => c && c.type === "text" && c.text && typeof c.text.value === "string")
    .map((c) => c.text.value);

  return textParts.join("\n").trim();
}

async function getCompletion(systemPrompt, userMessage) {
  const provider = process.env.LLM_PROVIDER || "groq";

  return withRetry(async () => {
    switch (provider) {
      case "groq":
        return groqCompletion(systemPrompt, userMessage);
      case "local":
        return localCompletion(systemPrompt, userMessage);
      case "azure":
        return azureCompletion(systemPrompt, userMessage);
      default:
        throw new Error(
          `Unknown LLM_PROVIDER: "${provider}". Use groq, local, or azure.`
        );
    }
  });
}

module.exports = { getCompletion };
