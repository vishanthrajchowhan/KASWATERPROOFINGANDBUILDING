const intentMatchers = [
  { intent: "greeting", pattern: /(\bhi\b|\bhello\b|\bhey\b|good morning|good afternoon|good evening)/i },
  { intent: "goodbye", pattern: /(\bbye\b|goodbye|see you|talk later|thanks|thank you)/i },
  { intent: "emergency", pattern: /(emergency|urgent|flood|water damage|leak now|asap)/i },
  { intent: "quote_request", pattern: /(quote|request a quote|estimate|free estimate|need a quote)/i },
  { intent: "pricing", pattern: /(price|pricing|cost|budget|rate)/i },
  { intent: "contact", pattern: /(contact|phone|call|email|reach you|number)/i },
  { intent: "location", pattern: /(location|address|where are you|where located|office)/i },
  { intent: "timeline", pattern: /(timeline|how long|start date|when can you start|availability)/i },
  { intent: "waterproofing", pattern: /(waterproof|basement|roof sealing|wall sealing|window sealing)/i },
  { intent: "painting", pattern: /(painting|interior paint|exterior paint|commercial painting)/i },
  { intent: "construction", pattern: /(construction|foundation|framing|concrete|general contracting|build)/i },
  { intent: "remodeling", pattern: /(remodel|renovation|kitchen|bathroom|interior upgrades)/i },
  { intent: "services", pattern: /(services|what do you do|offerings|solutions)/i }
];

function detectIntent(message) {
  const text = (message || "").trim();
  if (!text) return "unknown";

  for (const matcher of intentMatchers) {
    if (matcher.pattern.test(text)) {
      return matcher.intent;
    }
  }

  return "unknown";
}

module.exports = { detectIntent };
