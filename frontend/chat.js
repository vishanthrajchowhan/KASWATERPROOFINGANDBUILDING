console.log("✅ Chat JS Loaded");

const chatToggle = document.getElementById("chat-toggle");
const chatWidget = document.getElementById("chat-widget");
const chatClose = document.getElementById("chat-close");
const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("chat-text");
const messages = document.getElementById("chat-messages");

const sessionKey = "askKASSessionId";
const sessionId = localStorage.getItem(sessionKey) || crypto.randomUUID();
localStorage.setItem(sessionKey, sessionId);

if (chatToggle) {
  chatToggle.addEventListener("click", () => {
    if (chatWidget) chatWidget.classList.remove("closed");
  });
}

if (chatClose) {
  chatClose.addEventListener("click", () => {
    if (chatWidget) chatWidget.classList.add("closed");
  });
}

function addMessage(text, type) {
  if (!messages) return null;
  const div = document.createElement("div");
  div.className = `chat-message ${type}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

function addTyping() {
  return addMessage("Ask KAS is typing...", "bot");
}

function ensureSuggestions() {
  if (!chatWidget || !messages || document.getElementById("chat-suggestions")) return;

  const container = document.createElement("div");
  container.id = "chat-suggestions";
  container.className = "chat-suggestions";

  const suggestions = [
    "Request Quote",
    "Services",
    "Pricing",
    "Contact",
    "Waterproofing",
    "Painting"
  ];

  suggestions.forEach(label => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chat-suggestion";
    btn.textContent = label;
    btn.addEventListener("click", () => {
      if (!input) return;
      input.value = label;
      sendMessage();
    });
    container.appendChild(btn);
  });

  messages.parentNode.insertBefore(container, messages.nextSibling);

  const style = document.createElement("style");
  style.textContent = `
    .chat-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 0 0;
    }
    .chat-suggestion {
      border: 1px solid rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      font-size: 0.78rem;
      padding: 6px 10px;
      border-radius: 999px;
      cursor: pointer;
      transition: transform 0.2s ease, background 0.2s ease;
    }
    .chat-suggestion:hover {
      transform: translateY(-1px);
      background: rgba(255, 255, 255, 0.18);
    }
  `;
  document.head.appendChild(style);
}

async function sendMessage() {
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  const typingNode = addTyping();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, sessionId })
    });

    const data = await res.json().catch(() => ({}));
    if (typingNode) typingNode.remove();

    if (!res.ok) {
      addMessage(data.reply || "Sorry, we couldn't process that right now.", "bot");
      return;
    }

    addMessage(data.reply || "I'm happy to help. Could you share more details?", "bot");
  } catch (err) {
    console.error("Chat error:", err);
    if (typingNode) typingNode.remove();
    addMessage("We had trouble reaching the server. Please try again in a moment.", "bot");
  }
}

if (sendBtn) {
  sendBtn.addEventListener("click", sendMessage);
}

if (input) {
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

ensureSuggestions();
