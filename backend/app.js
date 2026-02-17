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
const { detectIntent } = require('../server/utils/chatIntents');
const { knowledgeBase } = require('../server/utils/chatKnowledge');
const { getResponseForIntent } = require('../server/utils/chatResponses');

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
// 5. CHATBOT INTENTS & LEAD FLOW
// ============================
const leadSessions = new Map();

function getSessionId(req) {
  return String(req.body.sessionId || req.headers['x-session-id'] || req.ip || 'unknown');
}

function extractPhone(text) {
  const match = String(text).match(/\+?\d[\d\s\-()]{6,}/);
  return match ? match[0].trim() : '';
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

const Lead = sequelize.define('Lead', {
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  service: { type: DataTypes.STRING, allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: true }
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


app.get('/service', (req, res) => {
  res.redirect('/services');
});


app.get('/gallery', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'gallery.html'));
});

app.get('/projects/professional-waterproofing-application', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'project-waterproofing-application.html'));
});

app.get('/projects/advanced-waterproof-coating-system', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'project-waterproof-coating-system.html'));
});

app.get('/projects/premium-interior-painting', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'project-premium-interior-painting.html'));
});

app.get('/projects/exterior-painting-excellence', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'project-exterior-painting-excellence.html'));
});

app.get('/projects/modern-construction-work', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'project-modern-construction-work.html'));
});

app.get('/projects/building-project-execution', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'project-building-project-execution.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'pages', 'contact.html'));
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
  const userMessage = String(req.body.message || '').trim();
  const sessionId = getSessionId(req);

  console.log("💬 CHAT RECEIVED:", userMessage);

  if (!userMessage) {
    return res.json({
      reply: "I'm happy to help! Could you please provide more details about your project?"
    });
  }

  try {
    const leadState = leadSessions.get(sessionId);

    if (leadState) {
      if (leadState.step === 'name') {
        leadState.lead.name = userMessage;
        leadState.step = 'phone';
        return res.json({ reply: `Thanks, ${userMessage}. What's the best phone number to reach you?` });
      }

      if (leadState.step === 'phone') {
        const phone = extractPhone(userMessage);
        if (!phone) {
          return res.json({ reply: 'Please share a phone number (digits only is fine).'});
        }
        leadState.lead.phone = phone;
        leadState.step = 'service';
        return res.json({
          reply: 'Which service do you need (Construction, Waterproofing, Painting, Remodeling, or Commercial Projects)?'
        });
      }

      if (leadState.step === 'service') {
        leadState.lead.service = userMessage;
        leadState.lead.message = leadState.lead.message || 'Quote request via chat.';

        await Lead.create({
          name: leadState.lead.name,
          phone: leadState.lead.phone,
          service: leadState.lead.service,
          message: leadState.lead.message
        });

        leadSessions.delete(sessionId);
        return res.json({
          reply: `Thank you! Your request is received. We'll contact you shortly. You can also call ${knowledgeBase.phone}.`
        });
      }
    }

    const intent = detectIntent(userMessage);
    if (intent === 'quote_request') {
      leadSessions.set(sessionId, {
        step: 'name',
        lead: { message: userMessage }
      });
    }

    const reply = getResponseForIntent(intent, knowledgeBase);
    return res.json({ reply });
  } catch (err) {
    console.error("❌ Chat Error:", err.message);
    return res.json({
      reply: `Please call ${knowledgeBase.phone} for immediate assistance.`
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

