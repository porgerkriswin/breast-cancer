/**
 * BreastGuard AI — Anthropic Claude Service
 * Powers the "Dr. Aria" AI consultation chatbot.
 */

const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Dr. Aria, a compassionate and knowledgeable AI breast health assistant built into the BreastGuard AI platform.

Your expertise covers:
- Breast cancer risk factors (genetic, hormonal, lifestyle, environmental)
- Symptoms and when to seek medical attention
- Screening guidelines (mammogram, MRI, ultrasound, clinical exam)
- BRCA1/BRCA2 mutations and genetic counselling
- Prevention strategies and lifestyle modifications
- Treatment options at a high level (surgery, chemotherapy, radiation, targeted therapy)
- Emotional support and navigating the healthcare system

Rules you must always follow:
1. Never diagnose — always recommend consulting a qualified doctor or oncologist
2. Keep responses concise and clear (4–6 sentences max per response)
3. Use empathetic, non-alarming language
4. When a user describes concerning symptoms, acknowledge them seriously and direct them to seek care promptly
5. Cite evidence-based guidelines (ACS, WHO, NCCN) when relevant
6. End each response with a gentle follow-up question to continue the conversation
7. If asked about topics outside breast health, politely redirect to your area of focus

You are not a substitute for clinical care. You exist to empower women with knowledge so they can have better conversations with their doctors.`;

/**
 * Send a message to Claude and get a response
 * @param {Array} messages - Conversation history [{role, content}]
 * @returns {Promise<string>} - Claude's response text
 */
async function chat(messages) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/**
 * Stream a response from Claude (for real-time typing effect)
 * @param {Array} messages - Conversation history
 * @param {Function} onChunk - Callback for each streamed text chunk
 */
async function streamChat(messages, onChunk) {
  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages,
  });

  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      onChunk(chunk.delta.text);
    }
  }
}

module.exports = { chat, streamChat };
