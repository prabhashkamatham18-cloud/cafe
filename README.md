# Juniper & Grain

A warm, modern café landing page with a built-in general-purpose AI assistant. The site showcases a neighborhood coffee shop experience and includes a local chatbot powered by Ollama or OpenAI.

## Overview

This project combines a polished static front-end with a lightweight Node.js server:

- Responsive café homepage with hero, menu, story, and visit sections
- Elegant visual design built with HTML, CSS, and JavaScript
- Chat endpoint at `/api/chat` for general questions
- Local AI support via Ollama (default)
- Optional OpenAI integration for cloud-based responses

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js
- Ollama (default AI provider)
- OpenAI API (optional)

## Project Structure

- `index.html` — main website layout and content
- `styles.css` — styling and responsive design
- `script.js` — interactive behavior and chat UI logic
- `server.js` — HTTP server and AI proxy
- `.env.example` — environment variable template

## Features

- Community-style café branding and marketing homepage
- Mobile-friendly navigation and responsive layout
- Client-side chat panel for general questions
- Secure local environment variable handling
- AI provider switching between Ollama and OpenAI

## Run Locally

1. Make sure you have Node.js installed.
2. Clone the repository:
   ```bash
   git clone https://github.com/prabhashkamatham18-cloud/cafe.git
   cd cafe
   ```
3. Create a local environment file from the example:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` if needed.

### Using Ollama (default)

1. Install and start Ollama.
2. Pull the default model:
   ```bash
   ollama pull qwen2.5:latest
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. Open your browser at:
   ```text
   http://127.0.0.1:3000
   ```

### Using OpenAI (optional)

In `.env`, change the AI provider and add your API key:

```dotenv
AI_PROVIDER=openai
OPENAI_API_KEY=your_private_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

Then restart the server:

```bash
node server.js
```

## Environment Variables

The repository includes the following defaults in `.env.example`:

```dotenv
AI_PROVIDER=ollama
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:latest
```

You may also configure:

- `PORT`
- `HOST`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Notes

- The chat feature is intentionally limited to general questions and does not answer questions about the cafe or the website itself.
- `.env` should never be committed or shared publicly.
- The app serves static files and exposes a chat API on the same Node.js server.

## License

This project does not include a license file. If you plan to publish or reuse it, add a license appropriate for your use case.
