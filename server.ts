/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config();

// Verify GEMINI_API_KEY is present
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Chat features will fail until configured.");
}

// Initialize Google GenAI SDK (Lazy loaded when used, but we pre-configure client)
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// Helper function to retry transient API calls with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = (error.message || "").toLowerCase();
    const isTransient =
      errorStr.includes("503") ||
      errorStr.includes("unavailable") ||
      errorStr.includes("high demand") ||
      errorStr.includes("spikes in demand") ||
      errorStr.includes("resource exhausted") ||
      errorStr.includes("429") ||
      error.status === 503 ||
      error.status === 429 ||
      error.code === 503 ||
      error.code === 429;

    if (isTransient && retries > 0) {
      console.warn(`Transient Gemini API error encountered. Retrying in ${delay}ms... (Retries left: ${retries})`, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Helper function to clean up raw JSON exception outputs and return beautiful user-friendly notes
function cleanErrorMessage(message: string): string {
  if (!message) return "An error occurred during chat stream generation.";
  try {
    let parsed = null;
    const trimmed = message.trim();
    if (trimmed.startsWith("{")) {
      parsed = JSON.parse(trimmed);
    } else {
      const firstBrace = message.indexOf("{");
      const lastBrace = message.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        parsed = JSON.parse(message.substring(firstBrace, lastBrace + 1));
      }
    }
    
    if (parsed) {
      if (parsed.error && parsed.error.message) {
        return cleanErrorMessage(parsed.error.message);
      }
      if (parsed.message) {
        return cleanErrorMessage(parsed.message);
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }

  const lowercaseMsg = message.toLowerCase();
  if (
    lowercaseMsg.includes("resource_exhausted") || 
    lowercaseMsg.includes("quota") || 
    lowercaseMsg.includes("rate limit") || 
    lowercaseMsg.includes("429") ||
    lowercaseMsg.includes("too many requests")
  ) {
    return "⚠️ The Gemini API rate limit or project quota has been exceeded for your current API key. Please verify your billing/plan details in Google AI Studio or retry after a moment.";
  }

  if (
    lowercaseMsg.includes("api_key_invalid") || 
    lowercaseMsg.includes("api key not valid") || 
    lowercaseMsg.includes("invalid api key") ||
    lowercaseMsg.includes("not found") && lowercaseMsg.includes("key")
  ) {
    return "⚠️ The configured Gemini API key is invalid or lacks necessary permissions. Please set a valid API key in your environment or AI Studio Secrets panel.";
  }

  return message.replace(/\\n/g, "\n").replace(/\\"/g, '"');
}

// Helper function to stream content with automatic cascade of fallback models if rate limited or overloaded
async function generateContentStreamWithFallback(
  contents: any,
  config: any,
  primaryModel: string
): Promise<any> {
  const modelsToTry = [
    primaryModel,
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      console.log(`[Gemini API] Trying streaming model: ${model}`);
      const stream = await retryWithBackoff(() =>
        ai.models.generateContentStream({
          model,
          contents,
          config,
          // If search grounding is enabled, keep standard config, otherwise pass standard options
        })
      );
      console.log(`[Gemini API] Successfully initialized stream with: ${model}`);
      return stream;
    } catch (err: any) {
      console.warn(`[Gemini API] Model ${model} failed, cascading to fallback...`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("All models in Gemini API fallback chain failed.");
}

// Helper function to generate content with automatic cascade of fallback models
async function generateContentWithFallback(
  contents: any,
  config: any,
  primaryModel: string
): Promise<any> {
  const modelsToTry = [
    primaryModel,
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  const uniqueModels = Array.from(new Set(modelsToTry));
  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      console.log(`[Gemini API] Trying non-streaming model: ${model}`);
      const response = await retryWithBackoff(() =>
        ai.models.generateContent({
          model,
          contents,
          config,
        })
      );
      console.log(`[Gemini API] Successfully generated content with: ${model}`);
      return response;
    } catch (err: any) {
      console.warn(`[Gemini API] Model ${model} failed, cascading to fallback...`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("All models in Gemini API fallback chain failed.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to handle large file payloads (images, documents)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Route: Chat (Streaming SSE)
  app.post("/api/chat", async (req: express.Request, res: express.Response): Promise<void> => {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: "Gemini API key is missing. Please set it in AI Studio Secrets panel." });
      return;
    }

    const {
      messages,
      model = "gemini-3.5-flash",
      systemInstruction,
      searchGroundingEnabled = false,
      temperature = 0.7,
      memories = []
    } = req.body;

    try {
      // Map frontend message objects to the structure expected by the @google/genai SDK
      // contents: Array of { role: string, parts: Array<{ text: string } | { inlineData: { mimeType: string, data: string } }> }
      const contents = messages.map((msg: any) => {
        const parts: any[] = [{ text: msg.text || "" }];

        if (msg.files && Array.isArray(msg.files)) {
          msg.files.forEach((file: any) => {
            if (file.dataUrl && file.dataUrl.includes(";base64,")) {
              const base64Data = file.dataUrl.split(";base64,")[1];
              parts.push({
                inlineData: {
                  mimeType: file.type,
                  data: base64Data
                }
              });
            }
          });
        }

        return {
          role: msg.role === "user" ? "user" : "model",
          parts: parts
        };
      });

      // Assemble system instruction, injecting retrieved user long-term memory if present
      let finalSystemInstruction = systemInstruction || "You are a professional, highly capable, production-grade AI Assistant designed by Google DeepMind. Answer questions with maximum clarity.";
      
      // Inject Critical Language Directive so the AI always answers in the user's spoken/sent language
      finalSystemInstruction += "\n\nCRITICAL LANGUAGE DIRECTIVE: Always detect the language of the user's message/query. Respond in that exact same language (such as Spanish, French, German, Tamil, Hindi, Japanese, Arabic, Telugu, etc.). Do not translate or reply in English unless the user explicitly requests English.";

      if (memories && memories.length > 0) {
        finalSystemInstruction += `\n\n[USER LONG-TERM MEMORIES]\nUse these facts about the user to personalize and ground your response:\n${memories.map((m: string) => `- ${m}`).join("\n")}`;
      }

      // Configure tools for Google Search Grounding if enabled
      const tools = searchGroundingEnabled ? [{ googleSearch: {} }] : undefined;

      // Set headers for Server-Sent Events (SSE) streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Request streaming completion from Gemini API using the automatic fallback cascade
      const responseStream = await generateContentStreamWithFallback(
        contents,
        {
          systemInstruction: finalSystemInstruction,
          temperature: temperature,
          tools: tools,
        },
        model
      );

      let collectedCitations: any[] = [];

      for await (const chunk of responseStream) {
        const text = chunk.text || "";

        // Check for search grounding metadata and extract citations
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata && groundingMetadata.groundingChunks) {
          groundingMetadata.groundingChunks.forEach((item: any) => {
            if (item.web && item.web.uri) {
              const url = item.web.uri;
              const title = item.web.title || "Web Search Source";
              if (!collectedCitations.some((c: any) => c.url === url)) {
                collectedCitations.push({ title, url });
              }
            }
          });
        }

        // Send intermediate text data
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }

      // Send final metadata including citations if search grounding was enabled
      if (collectedCitations.length > 0) {
        res.write(`data: ${JSON.stringify({ citations: collectedCitations })}\n\n`);
      }

      res.write("data: [DONE]\n\n");
      res.end();

    } catch (error: any) {
      console.error("Error in /api/chat endpoint:", error);
      const friendlyError = cleanErrorMessage(error.message || "An error occurred during chat stream generation.");
      res.write(`data: ${JSON.stringify({ error: friendlyError })}\n\n`);
      res.end();
    }
  });

  // API Route: Memory Extraction
  // Analyzes chat messages to extract persistent, high-value facts about the user (e.g. preferences, names, jobs)
  app.post("/api/extract-memories", async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      res.json({ memories: [] });
      return;
    }

    const { messages } = req.body;
    if (!messages || messages.length < 2) {
      res.json({ memories: [] });
      return;
    }

    try {
      const recentExchange = messages.slice(-2).map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n");

      const prompt = `
Analyze the following recent chat exchange between a User and an AI Assistant.
Extract any direct facts, preferences, or personal attributes stated by the User that would be valuable for long-term memory.
Do NOT extract general questions or conversational remarks.
Only extract facts like "User is a Software Engineer", "User prefers light theme", "User lives in New York", or "User works with React".

Recent exchange:
${recentExchange}

Return a JSON array of strings containing the extracted facts. If no facts are found, return an empty array [].
Respond with JSON only, no markdown formatting, no explanation.
Example response: ["User is a developer", "User has a dog named Buddy"]
`;

      // Request memory extraction using the automatic fallback cascade
      const response = await generateContentWithFallback(
        prompt,
        {
          responseMimeType: "application/json",
        },
        "gemini-3.5-flash"
      );

      const text = response.text || "[]";
      const memories = JSON.parse(text);
      res.json({ memories: Array.isArray(memories) ? memories : [] });

    } catch (error) {
      console.error("Error extracting memories:", error);
      res.json({ memories: [], error: "Failed to extract memories" });
    }
  });

  // Serve static assets and frontend index.html
  if (process.env.NODE_ENV !== "production") {
    // In development mode, mount Vite middleware to serve client SPA assets
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve compiled build assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
