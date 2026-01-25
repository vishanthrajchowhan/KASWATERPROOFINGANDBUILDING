console.log("✅ Chat JS Loaded");

const chatToggle = document.getElementById("chat-toggle");
const chatWidget = document.getElementById("chat-widget");
const chatClose = document.getElementById("chat-close");
const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("chat-text");
const messages = document.getElementById("chat-messages");

// Safety checks: null guards for DOM elements
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
  if (!messages) return;
  const div = document.createElement("div");
  div.className = `chat-message ${type}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

async function sendMessage() {
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      addMessage(errData.reply || errData.error || "Sorry, I'm offline right now.", "bot");
      return;
    }

    const data = await res.json();
    addMessage(data.reply || "No response", "bot");
  } catch (err) {
    console.error("Chat error:", err);
    addMessage("Error contacting server.", "bot");
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
