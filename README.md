# AI Study Companion

An intelligent AI-powered study assistant built on Cloudflare's infrastructure that helps students learn more effectively through conversational AI, document analysis, and personalized learning recommendations.

## 🎯 Features

- **Conversational Learning**: Ask questions and receive detailed, educational responses
- **Document Analysis**: Upload study materials (PDFs, text files) for summarization and analysis
- **Smart Q&A**: Get answers with follow-up suggestions on what to study next
- **Gap Analysis**: Identify important topics not covered in your documents
- **Persistent Memory**: Conversations are remembered across sessions for personalized learning
- **Context-Aware**: Builds on previous questions to provide more targeted guidance

## 🏗️ Architecture

This application demonstrates the four core components required for AI-powered applications on Cloudflare:

1. **LLM**: Meta Llama 3.1 8B via Cloudflare Workers AI
2. **Workflow/Coordination**: Cloudflare Workers for request handling and orchestration
3. **User Input**: Web-based chat interface with file upload support
4. **Memory/State**: Cloudflare Durable Objects for persistent conversation history

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Cloudflare Workers (TypeScript)
- **AI Model**: `@cf/meta/llama-3.1-8b-instruct` via Workers AI
- **State Management**: Cloudflare Durable Objects
- **File Processing**: Client-side text extraction
- **Deployment**: Cloudflare Workers Platform

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/cf_ai_study_companion.git
cd cf_ai_study_companion
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Cloudflare

Create a `wrangler.toml` file in the root directory:

```toml
name = "ai-study-companion"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[durable_objects.bindings]]
name = "USER_MEMORY"
class_name = "UserMemory"

[[migrations]]
tag = "v1"
new_classes = ["UserMemory"]

[ai]
binding = "AI"
```

### 4. Authenticate with Cloudflare

```bash
wrangler login
```

### 5. Run Locally

```bash
wrangler dev
```

The app will be available at `http://localhost:8787`

### 6. Deploy to Production

```bash
wrangler deploy
```

After deployment, you'll receive a live URL like: `https://ai-study-companion.your-subdomain.workers.dev`

## 💡 How to Use

### Basic Q&A
1. Type your study question in the input field
2. Press "Send" or hit Enter
3. Receive an answer with suggestions for further reading

### Document Analysis
1. Click the "Upload" button
2. Select a text file or PDF
3. Ask questions like:
   - "Summarize this document"
   - "What are the key concepts?"
   - "What important topics are missing?"
   - "Find information about [specific topic]"

### Conversation Memory
- Your conversation history is automatically saved
- The AI remembers context from previous messages
- Start a new session to reset the conversation

## 📁 Project Structure

```
cf_ai_study_companion/
├── src/
│   ├── index.ts          # Main worker with API endpoint
│   └── userMemory.ts     # Durable Object for state management
├── public/
│   └── index.html        # Frontend chat interface
├── wrangler.toml         # Cloudflare configuration
├── package.json          # Node.js dependencies
├── README.md            # This file
└── PROMPTS.md           # AI prompts used in development
```

## 🔧 Configuration

### Context Window Management
- The app automatically handles large documents by truncating to fit the model's context window
- Conversation history is limited to the last 10 messages to prevent overflow
- User-friendly error messages when content is too large

### Memory Retention
- Each user gets their own isolated conversation history
- History is stored in Cloudflare Durable Objects
- Data persists across sessions but can be reset by starting a new conversation

## 🎨 Customization

### Changing the AI Model
Edit `src/index.ts` and modify the model name:
```typescript
const aiResponse = await env.AI.run(
  "@cf/meta/llama-3.1-8b-instruct", // Change this line
  { messages }
);
```

Available models: See [Cloudflare Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)

### Adjusting System Prompt
Modify the `systemPrompt` variable in `src/index.ts` to change the AI's behavior and capabilities.

## 🐛 Troubleshooting

### "Context window exceeded" error
- Try uploading smaller documents
- Ask more specific questions
- Start a new conversation to reset history

### Document not uploading
- Ensure file is .txt or .pdf format
- Check file size (recommended < 1MB)
- Verify file is readable text

### Worker deployment fails
- Verify `wrangler.toml` is configured correctly
- Ensure you're authenticated: `wrangler login`
- Check your Cloudflare account has Workers AI enabled

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

This project was created as part of a Cloudflare technical assessment. Feel free to fork and experiment!

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- [Meta Llama 3.1](https://ai.meta.com/blog/meta-llama-3-1/)

## 👤 Author

Mutawakil Rabiu
- GitHub: [Muta4ever](https://github.com/Muta4ever)
- Email: sraba417@gmail.com

---

Built with ❤️ using Cloudflare Workers AI