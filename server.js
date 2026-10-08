const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

function loadLocalEnv() {
  const envPath = path.join(__dirname, ".env");
  let contents;
  try {
    contents = fs.readFileSync(envPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  for (const [index, line] of contents.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) throw new Error(`Invalid .env entry on line ${index + 1}.`);
    if (process.env[match[1]] !== undefined) continue;

    let value = match[2].trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadLocalEnv();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const AI_PROVIDER = process.env.AI_PROVIDER || "ollama";
const OLLAMA_URL = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:latest";
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_BODY_BYTES = 32 * 1024;
const MAX_MESSAGE_CHARS = 5000;
const STATIC_FILES = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/index.html": ["index.html", "text/html; charset=utf-8"],
  "/styles.css": ["styles.css", "text/css; charset=utf-8"],
  "/script.js": ["script.js", "text/javascript; charset=utf-8"]
};

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(data));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let tooLarge = false;
    request.on("data", (chunk) => {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        tooLarge = true;
        body = "";
      }
    });
    request.on("end", () => {
      if (tooLarge) {
        const error = new Error("The request is too large. Please shorten your message.");
        error.statusCode = 413;
        reject(error);
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid request. Please try sending your message again."));
      }
    });
    request.on("error", reject);
  });
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 12) {
    return "Send between 1 and 12 chat messages.";
  }
  for (const message of messages) {
    if (
      !message ||
      !["user", "assistant"].includes(message.role) ||
      typeof message.content !== "string" ||
      !message.content.trim() ||
      message.content.length > MAX_MESSAGE_CHARS
    ) {
      return `Each message must have a user or assistant role and contain 1-${MAX_MESSAGE_CHARS} characters.`;
    }
  }
  if (messages[messages.length - 1].role !== "user") {
    return "The latest chat message must be a question.";
  }
  return null;
}

async function handleChat(request, response) {
  if (!["ollama", "openai"].includes(AI_PROVIDER)) {
    sendJson(response, 500, {
      error: `Unknown AI_PROVIDER "${AI_PROVIDER}". Set AI_PROVIDER to "ollama" or "openai" in .env.`
    });
    return;
  }
  if (AI_PROVIDER === "openai" && (!API_KEY || API_KEY === "replace_with_your_openai_api_key")) {
    sendJson(response, 503, {
      error: "OpenAI is selected but no API key is configured. Add OPENAI_API_KEY to .env, then restart the server. API usage may be billed separately."
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    if (!response.destroyed) sendJson(response, error.statusCode || 400, { error: error.message });
    return;
  }

  const validationError = !body || typeof body !== "object" || Array.isArray(body)
    ? "Send chat messages in a JSON object."
    : validateMessages(body.messages);
  if (validationError) {
    sendJson(response, 400, { error: validationError });
    return;
  }

  try {
    const systemMessage = {
      role: "system",
      content: "You are Curious Corner, a helpful general-purpose assistant on a cafe website. Answer general questions across topics clearly and usefully. Do not answer questions about this specific cafe, its business, menu, address, hours, or this website/project; politely direct the user to cafe staff for those. Do not claim to have live data or take actions you cannot perform. If a request is unclear, ask a brief clarifying question."
    };
    const endpoint = AI_PROVIDER === "ollama"
      ? `${OLLAMA_URL}/api/chat`
      : "https://api.openai.com/v1/chat/completions";
    const headers = { "Content-Type": "application/json" };
    if (AI_PROVIDER === "openai") headers.Authorization = `Bearer ${API_KEY}`;

    const upstream = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(AI_PROVIDER === "ollama"
        ? {
            model: OLLAMA_MODEL,
            messages: [systemMessage, ...body.messages],
            stream: false
          }
        : {
            model: MODEL,
            messages: [systemMessage, ...body.messages]
          })
    });

    if (!upstream.ok) {
      console.error(`${AI_PROVIDER} AI service returned HTTP ${upstream.status}.`);
      if (AI_PROVIDER === "ollama" && upstream.status === 404) {
        sendJson(response, 503, {
          error: `Ollama could not find model "${OLLAMA_MODEL}". Run "ollama pull ${OLLAMA_MODEL}" and try again.`
        });
        return;
      }
      const statusCode = upstream.status === 429 ? 503 : 502;
      sendJson(response, statusCode, {
        error: AI_PROVIDER === "ollama"
          ? `Ollama returned HTTP ${upstream.status}. Check that the local Ollama service is running and the model "${OLLAMA_MODEL}" is available.`
          : upstream.status === 429
            ? "The AI service is busy or its usage limit has been reached. Please try again later."
            : "The AI service could not answer this message. Check the server configuration and try again."
      });
      return;
    }

    const data = await upstream.json();
    const reply = AI_PROVIDER === "ollama"
      ? data.message?.content
      : data.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      console.error(`${AI_PROVIDER} AI service returned a response without message content.`);
      sendJson(response, 502, { error: "The AI service returned an empty answer. Please try again." });
      return;
    }
    sendJson(response, 200, { reply: reply.trim() });
  } catch (error) {
    console.error(`Failed to contact ${AI_PROVIDER} AI service:`, error.message);
    sendJson(response, 502, {
      error: AI_PROVIDER === "ollama"
        ? `Couldn't reach Ollama at ${OLLAMA_URL}. Start the Ollama app/service and try again.`
        : "Couldn't reach the AI service. Check the server connection and try again."
    });
  }
}

const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname;

  if (pathname === "/api/chat") {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      sendJson(response, 405, { error: "Use POST to send a chat message." });
      return;
    }
    handleChat(request, response);
    return;
  }

  const staticFile = STATIC_FILES[pathname];
  if (request.method !== "GET" || !staticFile) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const filePath = path.join(__dirname, staticFile[0]);
  fs.readFile(filePath, (error, contents) => {
    if (error) {
      console.error(`Failed to read ${staticFile[0]}:`, error.message);
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Unable to load the website.");
      return;
    }
    response.writeHead(200, {
      "Content-Type": staticFile[1],
      "X-Content-Type-Options": "nosniff"
    });
    response.end(contents);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Cafe website running at http://${HOST}:${PORT}`);
  if (AI_PROVIDER === "ollama") {
    console.log(`Using local Ollama model ${OLLAMA_MODEL} at ${OLLAMA_URL}`);
  } else if (AI_PROVIDER === "openai" && (!API_KEY || API_KEY === "replace_with_your_openai_api_key")) {
    console.warn("Chatbot is offline: OpenAI API key is missing. Set OPENAI_API_KEY in .env and restart the server.");
  }
});
