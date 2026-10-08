const chatLauncher = document.querySelector(".chat-launcher");
const chatPanel = document.querySelector(".chat-panel");
const chatClose = document.querySelector(".chat-close");
const chatForm = document.querySelector(".chat-form");
const chatInput = document.querySelector("#chat-input");
const chatMessages = document.querySelector(".chat-messages");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const chatSubmit = chatForm.querySelector("button[type='submit']");
const conversation = [];

function setChatOpen(isOpen) {
  chatPanel.hidden = !isOpen;
  chatLauncher.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) chatInput.focus();
}

chatLauncher.addEventListener("click", () => setChatOpen(chatPanel.hidden));
chatClose.addEventListener("click", () => setChatOpen(false));

menuToggle.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    siteNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.className = `chat-message ${sender}-message`;
  message.append(document.createTextNode(text));
  const time = document.createElement("span");
  time.className = "message-time";
  time.textContent = "JUST NOW";
  message.append(time);
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = chatInput.value.trim();
  if (!question) return;
  addMessage(question, "user");
  conversation.push({ role: "user", content: question });
  chatInput.value = "";
  chatInput.disabled = true;
  chatSubmit.disabled = true;

  fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: conversation.slice(-12) })
  })
    .then(async (response) => {
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        const status = `${response.status} ${response.statusText}`.trim();
        const detail = responseText.trim().slice(0, 120);
        if (response.status === 403 && window.location.protocol === "file:") {
          throw new Error(
            "The browser preview blocks chatbot requests from a local file (403 Forbidden). " +
            "Run the website with its Node server and open http://localhost:3000 instead."
          );
        }
        throw new Error(
          `The chat server returned a non-JSON response (${status})${detail ? `: ${detail}` : "."} ` +
          "Open the site through its Node server at http://localhost:3000, not as a file or static-only page."
        );
      }
      if (!response.ok) throw new Error(result.error || "The chat service could not answer right now.");
      if (typeof result.reply !== "string" || !result.reply.trim()) {
        throw new Error("The chat service returned an empty response. Please try again.");
      }
      conversation.push({ role: "assistant", content: result.reply });
      addMessage(result.reply, "bot");
    })
    .catch((error) => {
      const message = error instanceof TypeError
          ? "I can't reach the chat server. Start it with `node server.js` and open http://localhost:3000."
        : error.message || "Couldn't reach the chat service. Please try again.";
      addMessage(message, "bot");
    })
    .finally(() => {
      chatInput.disabled = false;
      chatSubmit.disabled = false;
      chatInput.focus();
    });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !chatPanel.hidden) setChatOpen(false);
});
