console.log("✅ Chat JS Loaded");

const chatToggle = document.getElementById("chat-toggle");
const chatWidget = document.getElementById("chat-widget");
const chatClose = document.getElementById("chat-close");

chatToggle.addEventListener("click", () => {
  chatWidget.classList.remove("closed");
});

chatClose.addEventListener("click", () => {
  chatWidget.classList.add("closed");
});


console.log("✅ Chat JS Loaded");

const sendBtn = document.getElementById("send-btn");
const input = document.getElementById("chat-text");
const messages = document.getElementById("chat-messages");

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = `chat-message ${type}`;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

async function sendMessage() {
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

    const data = await res.json();
    addMessage(data.reply, "bot");
  } catch (err) {
    addMessage("Error contacting server.", "bot");
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});



// Gallery rendering logic removed from chat.js. Now handled only in gallery.html.
