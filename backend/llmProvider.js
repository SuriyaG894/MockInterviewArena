const { OpenAI } = require("openai");

let groqClient = null;
let localClient = null;
let azureClient = null;

function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set in .env");
    groqClient = new OpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey,
    });
  }
  return groqClient;
}

function getLocalClient() {
  if (!localClient) {
    const baseURL = process.env.LOCAL_LLM_ENDPOINT;
    if (!baseURL) throw new Error("LOCAL_LLM_ENDPOINT is not set in .env");
    localClient = new OpenAI({ baseURL });
  }
  return localClient;
}

async function getAzureClient() {
  if (!azureClient) {
    const { AIProjectsClient } = require("@azure/ai-agents");
    const { DefaultAzureCredential } = require("@azure/identity");
    const connectionString = process.env.AZURE_AI_AGENTS_CONNECTION_STRING;
    if (!connectionString) throw new Error("AZURE_AI_AGENTS_CONNECTION_STRING is not set in .env");
    azureClient = AIProjectsClient.fromConnectionString(
      connectionString,
      new DefaultAzureCredential()
    );
  }
  return azureClient;
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
  const client = await getAzureClient();
  const deployment = process.env.AZURE_MODEL_DEPLOYMENT || "gpt-4o";

  const agent = await client.createAgent(deployment, {
    instructions: systemPrompt,
    name: "MockArenaAgent",
  });

  const thread = await client.createThread();

  await client.createMessage(thread.id, {
    role: "user",
    content: userMessage,
  });

  const run = await client.createRun(thread.id, agent.id);
  const startTime = Date.now();
  const TIMEOUT_MS = 30000;

  while (true) {
    if (Date.now() - startTime > TIMEOUT_MS) {
      throw new Error("Azure agent run timed out after 30s");
    }

    const status = await client.getRun(thread.id, run.id);

    if (status.status === "completed") break;
    if (status.status === "failed") {
      throw new Error(
        `Azure run failed: ${status.last_error?.message || "unknown error"}`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const messages = await client.listMessages(thread.id);
  const assistantMessages = messages.data.filter(
    (m) => m.role === "assistant"
  );
  const last = assistantMessages[assistantMessages.length - 1];
  const textContent = last?.content?.find((c) => c.type === "text");

  return textContent?.text?.value || "";
}

async function getCompletion(systemPrompt, userMessage) {
  const provider = process.env.LLM_PROVIDER || "groq";

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
}

module.exports = { getCompletion };
