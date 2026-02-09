// ============================
// 1. ENV & DEPENDENCIES
// ============================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { Sequelize, DataTypes } = require('sequelize');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const crypto = require('crypto');

// ============================
// 2. EXPRESS SETUP (FIXED)
// ============================
const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 🔴 THIS MUST BE FIRST — THIS FIXES YOUR CHAT
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the real frontend folder (one level up)
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// ============================
// 3. ADMIN PASSWORD & AUTH
// ============================
const ADMIN_PASSWORD = '123456'; // Admin password
const activeSessions = new Set(); // Store active session tokens

// Generate a simple session token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && activeSessions.has(token)) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// ============================
// 4. ENV CHECK
// ============================
console.log("ENV STATUS:", {
  // FIXED: No AI keys required for chat (rule-based, always available)
  EMAIL_USER: process.env.EMAIL_USER ? "✓ SET" : "✗ MISSING",
  DB_TYPE: process.env.DB_TYPE || "sqlite"
});

function hasAllEnv(keys) {
  return keys.every(k => process.env[k] && process.env[k].trim());
}

// ============================
// 5. CHATBOT RULES (FIXED)
// ============================
// FIXED: Pure rule-based responses so chat never depends on external APIs
const BUSINESS_INFO = {
  company: "KAS Waterproofing & Building Services LLC",
  phone: "954-982-2809",
  email: "kaspaintingllc@gmail.com",
  location: "319 S State Rd 7, Plantation, FL 33317",
  services: {
    waterproofing: "We offer waterproofing for basements, roofs, wall sealing, and window sealing. For details, contact +1-954-982-2809 or email ingrid@kaswaterproofingbuilding.com.",
    construction: "We provide construction services including foundation, roofing, framing, concrete, and general contracting. For details, contact +1-954-982-2809 or email ingrid@kaswaterproofingbuilding.com.",
    painting: "We handle interior, exterior, and commercial painting services. For details, contact +1-954-982-2809 or email ingrid@kaswaterproofingbuilding.com."
  }
};

function getChatReply(message) {
  // FIXED: Normalize input for reliable keyword matching
  const text = (message || "").toLowerCase();

  if (!text.trim()) {
    return "Please type a message so I can help you.";
  }

  // Greetings
  if (/(\bhi\b|\bhello\b|\bhey\b|good morning|good afternoon|good evening)/i.test(text)) {
    return `Hi! I'm Ask KAS. How can we help you today?`;
  }

  // Services
  if (/waterproof|basement|roof|wall sealing|window sealing/i.test(text)) {
    return BUSINESS_INFO.services.waterproofing;
  }

  if (/construction|foundation|framing|concrete|general contracting|build|remodel/i.test(text)) {
    return BUSINESS_INFO.services.construction;
  }

  if (/paint|painting|interior|exterior|commercial painting/i.test(text)) {
    return BUSINESS_INFO.services.painting;
  }

  // Contact info
  if (/phone|call|number|contact/i.test(text)) {
    return `You can call us at ${BUSINESS_INFO.phone}.`;
  }

  if (/email|mail/i.test(text)) {
    return `You can email us at ${BUSINESS_INFO.email}.`;
  }

  if (/location|address|where are you|where located/i.test(text)) {
    return `Our location is ${BUSINESS_INFO.location}.`;
  }

  if (/quote|price|pricing|estimate|cost/i.test(text)) {
    return `We can provide a quote. Please call ${BUSINESS_INFO.phone} or email ${BUSINESS_INFO.email}.`;
  }

  // FIXED: Safe fallback for unknown questions
  return `Please call ${BUSINESS_INFO.phone} for immediate assistance.`;
}

// ============================
// 6. DATABASE SETUP
// ============================
const useSQLite =
  process.env.DB_TYPE === 'sqlite' ||
  !hasAllEnv(['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST']);

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'database.sqlite');

const sequelize = useSQLite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: false
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      }
    );

const Client = sequelize.define('Client', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: true }, // FIXED: Added phone field to save contact phone number
  service: DataTypes.STRING,
  message: DataTypes.TEXT,
  status: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    defaultValue: 'pending' // Default status for new inquiries
  }
});

sequelize.sync().then(() => {
  console.log("✅ Database ready");
});

// ============================
// 7. PAGE ROUTES
// ============================
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.get('/services', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'services.html'));
});

app.get('/gallery', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'gallery.html'));
});

app.get('/construction', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'construction.html'));
});

app.get('/painting', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'painting.html'));
});

app.get('/waterproofing', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'waterproofing.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'login.html'));
});

// ============================
// 8. ADMIN AUTHENTICATION
// ============================
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  
  if (password === ADMIN_PASSWORD) {
    const token = generateToken();
    activeSessions.add(token);
    console.log('✅ Admin login successful');
    res.json({ success: true, token });
  } else {
    console.log('❌ Admin login failed - incorrect password');
    res.status(401).json({ success: false, message: 'Invalid password' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    activeSessions.delete(token);
    console.log('✅ Admin logged out');
  }
  res.json({ success: true });
});

app.get('/api/admin/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && activeSessions.has(token)) {
    res.json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// ============================
// 9. CONTACT FORM
// ============================
app.post('/contact', async (req, res) => {
  const { name, email, phone, service, message } = req.body; // FIXED: Added phone to destructuring

  try {
    console.log("📋 Contact form received:", { name, email, phone, service }); // FIXED: Debug log to verify phone is received
    
    // Save to database
    await Client.create({ name, email, phone, service, message }); // FIXED: Added phone to Client.create()
    console.log(`✅ Contact saved with phone: ${phone}`);

    // Send email notification
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_TO) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });

         transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_TO,
          subject: `New Contact Form Submission - ${service}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Service:</strong> ${service}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          `
        });

        console.log(`✅ Email sent for contact: ${name}`);
      } catch (emailErr) {
        console.error("⚠️ Email failed (contact still saved):", emailErr.message);
      }
    }

    res.redirect('/success.html');
  } catch (err) {
    console.error(err);
    res.status(500).send("Contact error");
  }
});

// ============================
// 10. 🤖 CHAT API (FIXED)
// ============================
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;

  console.log("💬 CHAT RECEIVED:", userMessage);

  try {
    // FIXED: Rule-based chatbot (no external APIs, always available)
    const reply = getChatReply(userMessage);
    return res.json({ reply });
  } catch (err) {
    // FIXED: Never crash; always return fallback message
    console.error("❌ Chat Error:", err.message);
    return res.json({
      reply: "Please call 954-982-2809 for immediate assistance."
    });
  }
});

// ============================
// 11. ADMIN API - Get all clients (PROTECTED)
// ============================
app.get('/api/clients', requireAuth, async (req, res) => {
  try {
    const clients = await Client.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(clients);
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// ============================
// 12. ADMIN API - Update client status (PROTECTED)
// ============================
app.put('/api/clients/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'replied', 'rejected', 'approved', 'processing'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Update the client status
    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    client.status = status;
    await client.save();
    
    console.log(`✅ Updated client ${id} status to: ${status}`);
    res.json({ success: true, client });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ============================
// 13. SERVER START
// ============================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
