# Juniper & Grain

A neighborhood cafe website with a local Qwen 2.5 chatbot.

## Open the local website

When the website server is running on your computer, open:

**http://localhost:3000/**

This is a **local-only** address. It works on the computer running the server; people visiting this GitHub repository cannot use it as a public website link.

## Run the website and chatbot

1. Install Node.js and Ollama.
2. Make sure the Qwen 2.5 model is available to Ollama:

   ```powershell
   ollama pull qwen2.5:latest
   ```

3. Start the Ollama app/service.
4. From this project folder, start the website server:

   ```powershell
   node server.js
   ```

5. Open [http://localhost:3000/](http://localhost:3000/) in your browser.

The server uses `qwen2.5:latest` from the local Ollama service by default. No OpenAI API key is required for this configuration. Keep the server and Ollama running while chatting.
