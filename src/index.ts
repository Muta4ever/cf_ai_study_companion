import { UserMemory } from "./userMemory";

interface ChatRequestBody {
  userId?: string;
  message?: string;
  doc?: string;
}

// Estimate token count (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Truncate document if too large
function truncateDocument(doc: string, maxTokens: number = 4000): { text: string; wasTruncated: boolean } {
  const tokens = estimateTokens(doc);
  if (tokens <= maxTokens) {
    return { text: doc, wasTruncated: false };
  }
  
  // Truncate to max tokens worth of characters
  const maxChars = maxTokens * 4;
  return { 
    text: doc.substring(0, maxChars), 
    wasTruncated: true 
  };
}

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    
    // Only handle POST /chat
    if (url.pathname === "/chat" && request.method === "POST") {
      try {
        // Safely parse message, userId, doc
        const body = (await request.json()) as ChatRequestBody;
        const message = body.message || "";
        const userId = body.userId || "demo";
        const doc = body.doc || "";
        
        // Get Durable Object stub for this user
        const id = env.USER_MEMORY.idFromName(userId);
        const stub = env.USER_MEMORY.get(id);
        
        // Get previous memory
        const previousMemoryRes = await stub.fetch("https://memory");
        const previous = previousMemoryRes.ok
          ? await previousMemoryRes.json()
          : { history: [] };
        
        // Enhanced system prompt with Q&A features
        const systemPrompt = `You are an intelligent study assistant with the following capabilities:

1. **Answer Questions Thoughtfully**: Provide clear, comprehensive answers to study questions.

2. **Suggest Further Reading**: After answering, always recommend specific topics, concepts, or areas the student should explore next to deepen their understanding. Be specific about what to read or study.

3. **Document Analysis**: When a document is provided:
   - Analyze it thoroughly and answer questions based on its content
   - If asked to summarize, provide a clear, structured summary
   - If asked for specific information, extract and explain it precisely
   - Identify and highlight any critical information or key concepts in the document
   - Point out important topics that are NOT covered in the document but that the student should know about related to the subject matter
   - Suggest additional resources or topics to study that complement the document

4. **Contextual Learning**: Remember previous questions in the conversation and build on that knowledge to provide more personalized guidance.

5. **Gap Analysis**: When working with documents, actively identify knowledge gaps - topics that are important to the subject but missing from the provided material.

Always be encouraging, clear, and focused on helping the student learn effectively.`;
        
        // Combine memory and current doc if available
        const messages = [
          {
            role: "system",
            content: systemPrompt
          },
          ...(previous?.history || []).slice(-20) // Keep last 20 messages from history
        ];
        
        let truncationNotice = "";
        
        if (doc) {
          // Truncate document if needed
          const { text: processedDoc, wasTruncated } = truncateDocument(doc, 3500);
          
          if (wasTruncated) {
            truncationNotice = "\n\n⚠️ Note: Your document was quite large, so I've analyzed the first portion. For best results with large documents, consider asking about specific sections or topics.";
          }
          
          messages.push({
            role: "system",
            content: `The user has uploaded the following document for analysis:

---DOCUMENT START---
${processedDoc}
---DOCUMENT END---

${wasTruncated ? "Note: This document was truncated due to length. Focus on what's available." : ""}

Analyze this document and:
1. Answer any questions the user asks about it
2. If asked to summarize, provide a clear summary
3. Identify critical information and key concepts
4. Point out important related topics NOT covered in this document that the student should know
5. Suggest specific areas for further reading or study`
          });
        }
        
        // Add user message
        messages.push({ role: "user", content: message });
        
        // Final check: estimate total tokens
        const totalText = messages.map(m => m.content).join(" ");
        const estimatedTokens = estimateTokens(totalText);
        
        // Context window is 8000, leave room for response (2000 tokens)
        if (estimatedTokens > 6000) {
          return Response.json({ 
            reply: "📚 Your document or conversation is too large for me to process all at once. Here are some options:\n\n1. Ask me a specific question about a particular section or topic\n2. Upload a smaller document or excerpt\n3. Start a new conversation to reset the context\n\nI'm here to help - just need to work with smaller chunks of information!" 
          });
        }
        
        // Call Workers AI
        const aiResponse = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct",
          {
            messages
          }
        );
        
        const aiText = (aiResponse?.response || "Sorry, something went wrong with the AI.") + truncationNotice;
        
        // Update memory (keep last 10 messages to manage context size)
        const updatedHistory = [
          ...(previous?.history || []),
          { role: "user", content: message },
          { role: "assistant", content: aiText }
        ].slice(-20); // Keep last 10 messages (5 exchanges)
        
        await stub.fetch("https://memory", {
          method: "POST",
          body: JSON.stringify({ history: updatedHistory })
        });
        
        return Response.json({ reply: aiText });
        
      } catch (err: any) {
        console.error("Error in /chat:", err);
        
        // Handle specific AI errors gracefully
        if (err.message && err.message.includes("context window")) {
          return Response.json({ 
            reply: "📚 The content is too large to process. Try:\n\n1. Asking about a specific section\n2. Uploading a shorter document\n3. Starting a new conversation\n\nI'm here to help with smaller, focused questions!" 
          });
        }
        
        // Return JSON instead of plain text
        return Response.json(
          { reply: "Sorry, something went wrong. Please try again or start a new conversation." },
          { status: 500 }
        );
      }
    }
    
    // Fallback response
    return new Response("AI Study Companion running");
  }
};

export { UserMemory };