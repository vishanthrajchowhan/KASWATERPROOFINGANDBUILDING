const intentMatchers = [
  { intent: "cancel", pattern: /^\s*(cancel|stop|nevermind|never mind|forget it|restart|start over|quit)\b/i },
  { intent: "emergency", pattern: /(emergency|urgent|flood|water damage|leak now|asap)/i },
  // quote_request is checked early and wins over topic-specific intents, so a message like
  // "I need a quote for stucco repair" still starts lead capture instead of just answering the FAQ.
  { intent: "quote_request", pattern: /(quote|request a quote|estimate|free estimate|need a quote)/i },
  { intent: "greeting", pattern: /(\bhi\b|\bhello\b|\bhey\b|good morning|good afternoon|good evening)/i },
  { intent: "goodbye", pattern: /(\bbye\b|goodbye|see you|talk later|thanks|thank you)/i },
  { intent: "business_hours", pattern: /(business hours|opening hours|hours of operation|what time.*(open|close)|are you open)/i },
  { intent: "stucco_repair", pattern: /(stucco)/i },
  { intent: "pressure_washing", pattern: /(pressure wash|power wash|pressure clean)/i },
  { intent: "mold_remediation", pattern: /(mold|mildew)/i },
  { intent: "roof_leak", pattern: /(roof leak|leaking roof|roof is leaking|leaky roof)/i },
  { intent: "warranty", pattern: /(warranty|guarantee)/i },
  { intent: "financing", pattern: /(financing|finance|payment plan|installment)/i },
  { intent: "reviews", pattern: /(review|testimonial|rating|feedback from (customers|clients))/i },
  { intent: "licensing", pattern: /(licensed|license number|insured|insurance|proof of insurance)/i },
  { intent: "scheduling", pattern: /(schedule|book an appointment|set up a (time|visit)|site visit|appointment)/i },
  { intent: "pricing", pattern: /(price|pricing|cost|budget|rate)/i },
  { intent: "contact", pattern: /(contact|phone|call|email|reach you|number)/i },
  { intent: "location", pattern: /(location|address|where are you|where located|office|service area|zip)/i },
  { intent: "timeline", pattern: /(timeline|how long|start date|when can you start|availability)/i },
  { intent: "waterproofing", pattern: /(waterproof|basement|roof sealing|wall sealing|window sealing)/i },
  { intent: "painting", pattern: /(painting|interior paint|exterior paint|commercial painting)/i },
  { intent: "construction", pattern: /(construction|foundation|framing|concrete|general contracting|\bbuild\b|demolition)/i },
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
