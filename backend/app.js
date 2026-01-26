// ============================
// 1. ENV & DEPENDENCIES
// ============================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OpenAI = require("openai");
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { Sequelize, DataTypes } = require('sequelize');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

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
// 3. ENV CHECK
// ============================
console.log("ENV STATUS:", {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✓ SET" : "✗ MISSING",
  EMAIL_USER: process.env.EMAIL_USER ? "✓ SET" : "✗ MISSING",
  DB_TYPE: process.env.DB_TYPE || "sqlite"
});

function hasAllEnv(keys) {
  return keys.every(k => process.env[k] && process.env[k].trim());
}

// ============================
// 4. OPENAI SETUP
// ============================
const hasOpenAI = hasAllEnv(['OPENAI_API_KEY']);
const openai = hasOpenAI
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ============================
// 5. DATABASE SETUP
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
  service: DataTypes.STRING,
  message: DataTypes.TEXT
});

sequelize.sync().then(() => {
  console.log("✅ Database ready");
});

// ============================
// 6. PAGE ROUTES
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

// ============================
// 7. CONTACT FORM
// ============================
app.post('/contact', async (req, res) => {
  const { name, email, service, message } = req.body;

  try {
    // Save to database
     Client.create({ name, email, service, message });

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
// 8. 🤖 CHAT API (FIXED)
// ============================
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;

  console.log("💬 CHAT RECEIVED:", userMessage);

  if (!userMessage) {
    return res.json({
      reply: "Please type a message so I can help you."
    });
  }

  if (!openai) {
    return res.json({
      reply:
        "I'm temporarily offline. Please call 954-982-2809 or email kaspaintingllc@gmail.com."
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a professional assistant for KAS Waterproofing & Building Services LLC.

Location: Plantation, FL
Phone: 954-982-2809
Email: kaspaintingllc@gmail.com

Services:
- Waterproofing
- Construction
- Painting

Be friendly, professional, and helpful.
Encourage users to request a quote.
`
        },
        { role: "user", content: userMessage }
      ]
    });

    const reply =
      completion?.choices?.[0]?.message?.content ||
      "Thanks for reaching out! Please call 954-982-2809 for immediate help.";

    res.json({ reply });

  } catch (err) {
    console.error("❌ OpenAI Error:", err.message);
    res.json({
      reply:
        "I'm having trouble responding right now. Please call 954-982-2809."
    });
  }
});

// ============================
// 9. SERVER START
// ============================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
