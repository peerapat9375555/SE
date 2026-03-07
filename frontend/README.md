# AI Skin Assistant (DermaAI) - Frontend & Backend Architecture

This repository contains the frontend implementation for the **AI Skin Assistant (DermaAI)** system, designed to provide fast, reliable, and intelligent preliminary dermatological advice.

## 🚀 System Architecture: Multi-Stage RAG Pipeline

The web application leverages a state-of-the-art **Multi-Stage Retrieval-Augmented Generation (RAG)** pipeline to balance real-time response speeds with high-accuracy clinical context.

### The 4-Stage Chatbot Process:

1. **Stage 1: Fast Query Router** 🗲
   - Detects conversational queries (e.g., greetings like "สวัสดี", "test").
   - Bypasses the database entirely to provide zero-latency responses for non-medical interactions.
2. **Stage 2: Vector Retrieval & Hybrid Filter** 🔍
   - Extracts semantic meaning using the **Google Gemini Embedding Model**.
   - Retrieves the top 15-20 candidates from **Supabase (`pgvector`)**.
   - Applies Lexical/Keyword boosting (Hybrid Search) to filter down to the 6 most relevant documents, securing highly specific terms (e.g. disease names, medications).
3. **Stage 3: AI Reranking** 🧠
   - Passes the 6 filtered documents to an optimized prompt in the LLM.
   - The AI explicitly evaluates and reranks the context, selecting the absolute top 3 highest-quality sources to form the final knowledge context.
4. **Stage 4: Streaming Generation (SSE)** 🌊
   - The backend uses **Server-Sent Events (SSE)** via Flask's `stream_with_context`.
   - The React frontend consumes the chunks using the `ReadableStream` API.
   - Results are printed to the user's screen in real-time as they are being generated (Zero Perceived Latency).

## 💻 Tech Stack

- **Frontend:** React + Vite + Vanilla CSS / Tailwind (for dynamic styling)
- **Backend:** Python + Flask + Gunicorn (Hosted in the `RAG_skin` repo)
- **Database:** Supabase (PostgreSQL with `pgvector` extension)
- **AI Models:**
  - Generative AI: Gemini 3.1 Pro Preview (via custom API gateway)
  - Embedding: Gemini Embedding-001
- **Deployment:** Vercel (Frontend) & Render (Backend)

## 🛠️ Local Development (Frontend)

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Environment Variables:**
   Make sure you connect to the correct backend host by setting up your `.env` or configuring the `CHATBOT_URL` inside `src/components/Assessment.jsx`.

   ```javascript
   const CHATBOT_URL = "http://localhost:5000"; // For local python backend testing
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

## 🔐 Advanced Features Supported

- **Real-time Streaming:** Smooth text reveal animation mimicking ChatGPT.
- **Rich Text Rendering:** Support for Markdown outputs, ordered, and unordered lists out of the box.
- **Image Analysis Prep:** The UI is structured to support future expansions into direct image uploads for image-to-text pathological analysis (Vision).
