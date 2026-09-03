// ============================
// KAS "ASK KAS" CHAT WIDGET
// Self-injecting UI, quick replies, tel/mailto linking, local history
// ============================
(function () {
  "use strict";

  const sessionKey = "askKASSessionId";
  const sessionId = localStorage.getItem(sessionKey) || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  localStorage.setItem(sessionKey, sessionId);

  const historyKey = "askKASHistory:" + sessionId;

  const DEFAULT_SUGGESTIONS = [
    "Request Quote",
    "Services",
    "Waterproofing",
    "Stucco Repair",
    "Pressure Washing",
    "Painting",
    "Pricing",
    "Business Hours"
  ];

  let flowStage = "idle";

  function loadHistory() {
    try {
      const raw = localStorage.getItem(historyKey);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(historyKey, JSON.stringify(history.slice(-60)));
    } catch (e) {
      /* storage full or unavailable — safe to ignore */
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function linkify(escapedText) {
    let out = escapedText;
    out = out.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    out = out.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>');
    out = out.replace(/(\+?1?[\s.-]?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})/g, (match) => {
      const digits = match.replace(/[^\d+]/g, "");
      return '<a href="tel:' + digits + '">' + match + "</a>";
    });
    return out;
  }

  function buildWidget() {
    const oldToggle = document.getElementById("chat-toggle");
    const oldWidget = document.getElementById("chat-widget");
    if (oldToggle) oldToggle.remove();
    if (oldWidget) oldWidget.remove();

    const toggle = document.createElement("div");
    toggle.id = "chat-toggle";
    toggle.setAttribute("role", "button");
    toggle.setAttribute("tabindex", "0");
    toggle.setAttribute("aria-label", "Open Ask KAS chat");
    toggle.innerHTML = '<span class="chat-toggle-dot"></span> Ask KAS';

    const widget = document.createElement("div");
    widget.id = "chat-widget";
    widget.className = "closed";
    widget.innerHTML =
      '<div id="chat-header">' +
      '  <div class="chat-header-avatar">KAS</div>' +
      '  <div class="chat-header-info">' +
      '    <div class="chat-header-title">Ask KAS</div>' +
      '    <div class="chat-header-status">Usually replies instantly</div>' +
      "  </div>" +
      '  <span id="chat-close" role="button" tabindex="0" aria-label="Close chat">&times;</span>' +
      "</div>" +
      '<div id="chat-messages"></div>' +
      '<div id="chat-suggestions" class="chat-suggestions"></div>' +
      '<div id="chat-input">' +
      '  <input type="text" id="chat-text" placeholder="Type your question..." autocomplete="off">' +
      '  <button id="send-btn" type="button">Send</button>' +
      "</div>";

    document.body.appendChild(toggle);
    document.body.appendChild(widget);

    return { toggle, widget };
  }

  const { toggle: chatToggle, widget: chatWidget } = buildWidget();
  const chatClose = document.getElementById("chat-close");
  const sendBtn = document.getElementById("send-btn");
  const input = document.getElementById("chat-text");
  const messages = document.getElementById("chat-messages");
  const suggestionsBar = document.getElementById("chat-suggestions");

  function openWidget() {
    chatWidget.classList.remove("closed");
    if (input) input.focus();
  }

  function closeWidget() {
    chatWidget.classList.add("closed");
  }

  chatToggle.addEventListener("click", openWidget);
  chatToggle.addEventListener("keypress", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openWidget();
    }
  });

  chatClose.addEventListener("click", closeWidget);
  chatClose.addEventListener("keypress", (e) => {
    if (e.key === "Enter" || e.key === " ") closeWidget();
  });

  function renderMessage(text, type, persist) {
    const row = document.createElement("div");
    row.className = "chat-row " + type;

    const avatar = document.createElement("div");
    avatar.className = "chat-avatar-sm";
    avatar.textContent = type === "user" ? "You" : "KAS";

    const bubble = document.createElement("div");
    bubble.className = "chat-message " + type;
    bubble.innerHTML = linkify(escapeHtml(text));

    row.appendChild(avatar);
    row.appendChild(bubble);
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;

    if (persist) {
      const history = loadHistory();
      history.push({ text, type });
      saveHistory(history);
    }

    return row;
  }

  function addTyping() {
    const row = document.createElement("div");
    row.className = "chat-row bot";
    row.innerHTML =
      '<div class="chat-avatar-sm">KAS</div>' +
      '<div class="chat-message bot chat-typing"><span></span><span></span><span></span></div>';
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
    return row;
  }

  function updateFlowStage(replyText) {
    const lower = (replyText || "").toLowerCase();
    if (lower.includes("what's the best phone") || lower.includes("what is the best phone")) {
      flowStage = "phone";
    } else if (lower.includes("may i get your name") || lower.includes("could i get your name")) {
      flowStage = "name";
    } else if (lower.includes("which service do you need")) {
      flowStage = "service";
    } else if (lower.includes("your request is received") || lower.includes("we'll contact you shortly")) {
      flowStage = "idle";
    } else if (flowStage !== "phone" && flowStage !== "name" && flowStage !== "service") {
      flowStage = "idle";
    }
  }

  function renderSuggestions() {
    suggestionsBar.innerHTML = "";
    let items = DEFAULT_SUGGESTIONS;

    if (flowStage === "service") {
      items = ["Waterproofing", "Painting", "Remodeling", "Commercial Projects", "Cancel"];
    } else if (flowStage === "name" || flowStage === "phone") {
      items = ["Cancel"];
    }

    items.forEach((label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chat-suggestion";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        input.value = label;
        sendMessage();
      });
      suggestionsBar.appendChild(btn);
    });
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    renderMessage(text, "user", true);
    input.value = "";
    suggestionsBar.innerHTML = "";

    const typingNode = addTyping();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({ message: text, sessionId })
      });

      const data = await res.json().catch(() => ({}));
      typingNode.remove();

      const reply = res.ok
        ? data.reply || "I'm happy to help. Could you share more details?"
        : data.reply || "Sorry, we couldn't process that right now.";

      renderMessage(reply, "bot", true);
      updateFlowStage(reply);
      renderSuggestions();
    } catch (err) {
      typingNode.remove();
      renderMessage("We had trouble reaching the server. Please try again in a moment.", "bot", true);
      renderSuggestions();
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  const history = loadHistory();
  if (history.length) {
    history.forEach((entry) => renderMessage(entry.text, entry.type, false));
    updateFlowStage(history[history.length - 1].type === "bot" ? history[history.length - 1].text : "");
  } else {
    renderMessage(
      "Hi! I'm the KAS assistant. Ask me about waterproofing, stucco repair, painting, pressure washing, remodeling, or request a free quote.",
      "bot",
      true
    );
  }
  renderSuggestions();
})();
