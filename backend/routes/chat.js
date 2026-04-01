/**
 * BreastGuard AI — Chat Route
 * Proxies frontend messages to the Anthropic Claude API.
 */

const express = require("express");
const router = express.Router();
const { chat, streamChat } = require("../services/anthropicService");

/**
 * POST /api/chat
 * Body: { messages: [{role: "user"|"assistant", content: string}] }
 */
router.post("/", async (req, res) => {
  try {
    const { messages, stream = false } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    // Validate message structure
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({ error: "Each message must have role and content" });
      }
      if (!["user", "assistant"].includes(msg.role)) {
        return res.status(400).json({ error: "role must be 'user' or 'assistant'" });
      }
    }

    if (stream) {
      // Server-sent events for streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      await streamChat(messages, (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      });

      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      const reply = await chat(messages);
      res.json({ reply });
    }
  } catch (error) {
    console.error("Chat route error:", error);
    if (error.status === 401) {
      return res.status(401).json({ error: "Invalid Anthropic API key" });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: "Rate limit reached. Please try again shortly." });
    }
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

module.exports = router;
