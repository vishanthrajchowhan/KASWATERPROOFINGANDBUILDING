function getResponseForIntent(intent, knowledge) {
  switch (intent) {
    case "greeting":
      return "Hello 👋 Welcome to KAS Waterproofing & Building Services! I can help with waterproofing, stucco repair, painting, pressure washing, construction and free quotes. What can I help you with today?";
    case "services":
      return `We provide professional ${knowledge.services.join(", ")} for residential and commercial properties across South Florida. Would you like a free quote?`;
    case "pricing":
      return "Pricing depends on project size, materials and scope, but every estimate is completely free. Want me to start a free quote for you right now?";
    case "quote_request":
      return "I can help you request a free quote. May I get your name?";
    case "location":
      return `We're located at\n📍 ${knowledge.location}\nWe proudly serve ${knowledge.serviceArea}.`;
    case "contact":
      return `You can reach us directly:\n📞 ${knowledge.phone}\n📧 ${knowledge.email}\nOr just tell me you'd like a free quote and I'll get your details now.`;
    case "timeline":
      return "Project timelines depend on scope, but most projects start within a few days after approval. Want a free quote so we can give you an exact timeline?";
    case "scheduling":
      return `Happy to help you schedule a free site visit. Call us at ${knowledge.phone}, or tell me you'd like a free quote and I'll collect your details here.`;
    case "business_hours":
      return `We're open ${knowledge.hours}. Feel free to call us at ${knowledge.phone} anytime during those hours, or request a free quote here.`;
    case "waterproofing":
      return "We specialize in roof waterproofing, basement waterproofing, wall sealing and window sealing, using advanced materials for long-lasting protection. Would you like a free waterproofing quote?";
    case "stucco_repair":
      return "We repair cracked, stained and damaged stucco on both residential and commercial properties, restoring a clean, weatherproof finish. Want a free stucco repair quote?";
    case "pressure_washing":
      return "Our pressure washing service refreshes driveways, sidewalks, siding and building exteriors, often as prep work before painting or waterproofing. Would you like a free pressure washing quote?";
    case "mold_remediation":
      return "Mold and mildew are usually signs of an underlying moisture or waterproofing issue. We can inspect the source and recommend a fix. Would you like a free inspection quote?";
    case "roof_leak":
      return `A leaking roof should be handled quickly to avoid further damage. If it's urgent, call us right away at ${knowledge.phone}. Otherwise, I can start a free quote for you now.`;
    case "painting":
      return "We provide interior, exterior and commercial painting with professional surface preparation for a durable, premium finish. Would you like a free painting quote?";
    case "construction":
      return "We handle foundation work, framing, concrete work, demolition and general contracting for residential and commercial projects. Would you like a free construction quote?";
    case "remodeling":
      return "We offer kitchen, bathroom and full interior remodeling services, from design to finished space. Would you like a free remodeling quote?";
    case "warranty":
      return knowledge.warranty + " Would you like a free quote to get started?";
    case "licensing":
      return knowledge.licensing + " Would you like a free quote?";
    case "financing":
      return `We're happy to discuss project budgets and phased work to fit your needs. Call us at ${knowledge.phone} to talk through options, or request a free quote here.`;
    case "reviews":
      return "We're proud of our 5-star client feedback on Google — you can see live reviews on our homepage. Would you like a free quote for your own project?";
    case "emergency":
      return `If you have urgent water damage or an active leak, please call us immediately at ${knowledge.phone}.`;
    case "cancel":
      return "No problem, no worries at all! Feel free to ask me anything else about our services, or let me know if you'd like a free quote whenever you're ready.";
    case "goodbye":
      return "Thank you for contacting KAS. We look forward to working with you!";
    default:
      return `I'm happy to help! Could you share a bit more detail about your project — waterproofing, stucco repair, painting, pressure washing, or construction? You can also call us anytime at ${knowledge.phone}.`;
  }
}

module.exports = { getResponseForIntent };
