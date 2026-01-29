// ============================
// 1. ENV & DEPENDENCIES
// ============================
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const OpenAI = require("openai");
const { Sequelize, DataTypes } = require("sequelize");

// ============================
// 2. EXPRESS SETUP
// ============================
const app = express();
const PORT = process.env.PORT || 10000;

// REQUIRED for Render (DO NOT REMOVE)
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));

// ============================
// 3. ENV CHECK (LOGGING)
// ============================
console.log("ENV STATUS:", {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✓ SET" : "✗ MISSING",
  EMAIL_USER: process.env.EMAIL_USER ? "✓ SET" : "✗ MISSING",
  DB_TYPE: process.env.DB_TYPE || "sqlite",
});

// ============================
// 4. OPENAI SETUP
// ============================
const openai =
  process.env.OPENAI_API_KEY &&
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================
// 5. DATABASE SETUP
// ============================
const useSQLite =
  process.env.DB_TYPE === "sqlite" ||
  !process.env.DB_NAME;

const sequelize = useSQLite
  ? new Sequelize({
      dialect: "sqlite",
      storage: path.join(__dirname, "database.sqlite"),
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        dialect: "postgres",
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      }
    );

const Client = sequelize.define("Client", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  service: DataTypes.STRING,
  message: DataTypes.TEXT,
});

sequelize.sync().then(() => {
  console.log("✅ Database ready");
});

// ============================
// 6. PAGE ROUTES
// ============================
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// ============================
// 7. CONTACT FORM (EMAIL FIXED)
// ============================
app.post("/contact", async (req, res) => {
  const { name, email, service, message } = req.body;

  try {
    // Save to DB
    await Client.create({ name, email, service, message });

    // Send Email (Gmail App Password REQUIRED)
    if (
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASSWORD &&
      process.env.EMAIL_TO
    ) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO,
        subject: `New Contact Form Submission - ${service}`,
        html: `
          <h2>New Contact Request</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Service:</strong> ${service}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      });

      console.log("✅ Email sent successfully");
    }

    res.redirect("/success.html");
  } catch (err) {
    console.error("❌ Contact Error:", err);
    res.status(500).send("Contact submission failed");
  }
});

// ============================
// 8. CHAT API (RENDER SAFE)
// ============================
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;
  console.log("💬 CHAT:", userMessage);

  if (!userMessage) {
    return res.json({ reply: "Please enter a message." });
  }

  if (!openai) {
    return res.json({
      reply:
        "Chat is temporarily unavailable. Please call 954-982-2809.",
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
Services: Waterproofing, Construction, Painting
Be professional and helpful.
          `,
        },
        { role: "user", content: userMessage },
      ],
    });

    const reply =
      completion.choices[0].message.content ||
      "Please call 954-982-2809 for assistance.";

    res.json({ reply });
  } catch (err) {
    console.error("❌ OpenAI Error:", err.message);
    res.json({
      reply:
        "I'm having trouble responding right now. Please call 954-982-2809.",
    });
  }
});

// ============================
// 9. SERVER START (CRITICAL FIX)
// ============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
