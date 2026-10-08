# Juniper & Grain

A warm, modern cafe website with a local Qwen 2.5 chatbot.

## Overview

This project combines a responsive HTML, CSS, and JavaScript front end with a lightweight Node.js server and a local AI model.

- Responsive cafe homepage with menu, story, and visit sections
- Mobile-friendly navigation and chat panel
- General-purpose chat endpoint at `/api/chat`
- Qwen 2.5 local AI support through Ollama (default)
- Optional OpenAI integration

## Open the local website

When the server is running on your computer, open:

**[http://localhost:3000/](http://localhost:3000/)**

This is a **local-only** address. It works on the computer running the server; people visiting this GitHub repository cannot use it as a public website link.

## Run locally

1. Install Node.js and Ollama.
2. Make sure the Qwen 2.5 model is available:

   ```powershell
   ollama pull qwen2.5:latest
   ```

3. Start the Ollama app/service.
4. From the project folder, start the website:

   ```powershell
   node server.js
   ```

5. Open [http://localhost:3000/](http://localhost:3000/) in your browser.

The server uses `qwen2.5:latest` from the local Ollama service by default. No OpenAI API key is required for this configuration. Keep both the website server and Ollama running while chatting.

## Optional: use OpenAI

Copy `.env.example` to `.env`, set the provider and your private API key, then restart the server:

```dotenv
AI_PROVIDER=openai
OPENAI_API_KEY=your_private_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

API usage may be billed separately. Never commit or share `.env`.

## Project files

- `index.html` — website structure and content
- `styles.css` — responsive styling
- `script.js` — navigation and chat interface
- `server.js` — website server and AI proxy
- `.env.example` — optional provider configuration template

## License

This project does not include a license file. Add an appropriate license if you plan to publish or reuse it.
