// ============================
// 1. ENV & DEPENDENCIES
// ============================
require('dotenv').config();

const OpenAI = require("openai");
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { Sequelize, DataTypes } = require('sequelize');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Log environment configuration
console.log("ENV LOADED:", {
  DB_TYPE: process.env.DB_TYPE || 'sqlite (default)',
  DB_PATH: process.env.DB_PATH || 'database.sqlite',
  NODE_ENV: process.env.NODE_ENV || 'development',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Missing',
  EMAIL_USER: process.env.EMAIL_USER ? '✓ Set' : '✗ Missing'
});

function hasAllEnv(keys) {
  return keys.every((k) => typeof process.env[k] === 'string' && process.env[k].trim().length > 0);
}

// ============================
// 2. OPENAI SETUP
// ============================
const hasOpenAI = hasAllEnv(['OPENAI_API_KEY']);
const openai = hasOpenAI
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ============================
// 3. EXPRESS SETUP
// ============================
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'frontend')));

// ============================
// 4. DATABASE SETUP
// ============================
// Support both PostgreSQL and SQLite
const useSQLite = process.env.DB_TYPE === 'sqlite' || !hasAllEnv(['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST']);
const dbPath = process.env.DB_PATH || 'database.sqlite';

const sequelize = useSQLite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      logging: false
    })
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: false
    });

// Ensure database exists (PostgreSQL only)
async function ensureDatabaseExists() {
  if (useSQLite) return;
  
  const sequelizeNoDb = new Sequelize(
    'postgres',
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      logging: false
    }
  );

  try {
    await sequelizeNoDb.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    console.log(`✅ Database '${process.env.DB_NAME}' created`);
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log(`✅ Database '${process.env.DB_NAME}' already exists`);
    } else {
      console.error("❌ Database error:", err.message);
    }
  } finally {
    await sequelizeNoDb.close();
  }
}

// Client model
const Client = sequelize
  ? sequelize.define('Client', {
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      service: { type: DataTypes.STRING },
      message: { type: DataTypes.TEXT }
    })
  : null;

// Start DB
async function startServer() {
  try {
    await ensureDatabaseExists();
    await sequelize.sync();
    console.log(`✅ Database (${useSQLite ? 'SQLite' : 'PostgreSQL'}) connected & synced`);
  } catch (err) {
    console.error("❌ Database init failed; contact service will fallback to SQLite.", err?.message || err);
  }
}

startServer();

// ============================
// 5. ROUTES (PAGES)
// ============================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'admin.html'));
});




// ============================
// 6. CONTACT FORM
// ============================
app.post('/contact', async (req, res) => {
  const { name, email, service, message } = req.body;

  try {
    const hasEmailConfig = hasAllEnv(['EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_TO']);

    // Always try to save to database (SQLite fallback if needed)
    if (Client) {
      try {
        await Client.create({ name, email, service, message });
        console.log(`✅ Contact saved to database: ${name}`);
      } catch (dbErr) {
        console.error("⚠️  Database save failed, attempting SQLite fallback...", dbErr.message);
        // Fallback to SQLite if PostgreSQL fails
        saveLead({ name, email, service, message });
      }
    } else {
      // No Client model, save to SQLite directly
      saveLead({ name, email, service, message });
    }

    // Try to send email if configured
    if (hasEmailConfig) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_TO,
          subject: `New Lead: ${name} (${service})`,
          text: `Name: ${name}\nEmail: ${email}\nService: ${service}\nMessage: ${message}`
        });
        console.log(`✅ Email sent for contact: ${name}`);
      } catch (emailErr) {
        console.error("⚠️  Email failed (contact still saved):", emailErr.message);
      }
    }

    return res.redirect('/success.html');

  } catch (error) {
    console.error("❌ Contact error:", error);
    res.status(500).send("Error saving contact");
  }
});

// SQLite fallback for contacts
function saveLead(data) {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("SQLite error:", err.message);
      return;
    }

    db.run(
      `INSERT INTO Clients (name, email, service, message, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [data.name, data.email, data.service, data.message],
      function(err) {
        if (err) {
          console.error("SQLite insert error:", err.message);
        } else {
          console.log(`✅ Contact saved to SQLite: ${data.name}`);
        }
        db.close();
      }
    );
  });
}

// ============================
// 7. ADMIN APIs
// ============================
app.get('/api/clients', async (req, res) => {
  if (!Client) {
    return res.status(503).json({ error: "Database isn't configured." });
  }
  const clients = await Client.findAll();
  return res.json(clients);
});

app.delete('/api/clients/:id', async (req, res) => {
  if (!Client) {
    return res.status(503).json({ error: "Database isn't configured." });
  }
  await Client.destroy({ where: { id: req.params.id } });
  return res.json({ message: "Client deleted" });
});

// ============================
// 8. 🤖 AI CHAT API (IMPORTANT)
// ============================
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }

  if (!openai) {
    return res.status(503).json({ error: "AI isn't configured. Set OPENAI_API_KEY." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a professional AI assistant for KAS Waterproofing & Building Services LLC.

Location: Plantation, FL
Phone: 954-982-2809
Email: kaspaintingllc@gmail.com

Services:
- Waterproofing
- Construction
- Painting
- Other services (pressure washing, inspections, demolition)

Rules:
- Be friendly & professional
- Answer clearly
- Encourage users to request a quote
`
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI service error" });
  }
});

// ============================
// 8B. GALLERY DESCRIPTION API
// ============================
app.post("/api/generate-description", async (req, res) => {
  const { title, category } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: "Title and category are required" });
  }

  if (!openai) {
    return res.status(503).json({ error: "AI isn't configured. Set OPENAI_API_KEY." });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional copywriter for KAS Waterproofing & Building Services LLC. Write engaging, professional descriptions for portfolio images. Keep descriptions to 2-3 sentences. Highlight quality, expertise, and results. Be specific about the work shown in the image without mentioning visual elements.`
        },
        {
          role: "user",
          content: `Write a professional description for a ${category} project titled: "${title}". Focus on the quality of work, materials used, and benefits to the client.`
        }
      ]
    });

    res.json({
      description: completion.choices[0].message.content
    });

  } catch (error) {
    console.error("Description Generation Error:", error);
    res.status(500).json({ error: "Failed to generate description" });
  }
});

// ============================
// 9. SERVER (MUST BE LAST)
// ============================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
