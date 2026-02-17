function getResponseForIntent(intent, knowledge) {
  switch (intent) {
    case "greeting":
      return "Hello \ud83d\udc4b Welcome to KAS Waterproofing & Building Services. How can we help with your project today?";
    case "services":
      return "We provide professional Construction, Waterproofing, Painting and Remodeling services for residential and commercial properties.";
    case "pricing":
      return "Pricing depends on project size and requirements. We offer FREE estimates after a quick consultation.";
    case "quote_request":
      return "I can help you request a free quote. May I get your name?";
    case "location":
      return `We are located at\n\ud83d\udccd ${knowledge.location}\nWe serve all South Florida areas.`;
    case "contact":
      return `You can reach us directly:\n\ud83d\udcde ${knowledge.phone}\n\ud83d\udce7 ${knowledge.email}`;
    case "timeline":
      return "Project timelines depend on scope, but most projects start within a few days after approval.";
    case "waterproofing":
      return "We specialize in roof waterproofing, basement waterproofing, wall sealing and window sealing.";
    case "painting":
      return "We provide interior, exterior and commercial painting with professional surface preparation.";
    case "construction":
      return "We handle foundation work, framing, concrete work and general contracting.";
    case "remodeling":
      return "We offer kitchen, bathroom and interior remodeling services.";
    case "emergency":
      return `If you have urgent water damage, please call us immediately at ${knowledge.phone}.`;
    case "goodbye":
      return "Thank you for contacting KAS. We look forward to working with you!";
    default:
      return "I'm happy to help! Could you please provide more details about your project?";
  }
}

module.exports = { getResponseForIntent };
