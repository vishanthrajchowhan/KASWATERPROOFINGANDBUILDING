const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = 3000;

// --- 1. SETUP DATABASE CONNECTION ---
// IMPORTANT: Replace 'YOUR_PASSWORD' with the password you used for pgAdmin
const sequelize = new Sequelize('kas_db', 'postgres', '1234', {
    host: 'localhost',
    dialect: 'postgres'
});

// Define the 'Client' table
const Client = sequelize.define('Client', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    service: { type: DataTypes.STRING },
    message: { type: DataTypes.TEXT }
});

// Sync database (creates the table if it doesn't exist)
sequelize.sync()
    .then(() => console.log("✅ Database connected and synced!"))
    .catch(err => console.log("❌ Error connecting to database:", err));

// --- 2. MIDDLEWARE ---
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(bodyParser.urlencoded({ extended: true }));

// --- 3. ROUTES ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.post('/contact', async (req, res) => {
    const { name, email, service, message } = req.body;

    try {
        // A. SAVE TO POSTGRESQL
        await Client.create({ name, email, service, message });
        console.log("Data saved to Database!");

        // B. SEND EMAIL (Replace with your real Gmail and App Password)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'chowhanvishanthraj@gmail.com',
                pass: 'chowhan.2001' 
            }
        });

        const mailOptions = {
            from: 'chowhanvishanthraj@gmail.com',
            to: 'chowhanvishanthraj@gmail.com', 
            subject: `New Lead: ${name} (${service})`,
            text: `Name: ${name}\nEmail: ${email}\nService: ${service}\nMessage: ${message}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log("Email failed:", error);
            else console.log("Email sent.");
        });

        res.redirect('/success.html');

    } catch (error) {
        console.error("Error saving to database:", error);
        res.send("<h1>Error!</h1><p>Could not save data.</p>");
    }
});
// --- API ROUTE: Get All Clients ---
// This acts as your "API" that sends raw data
app.get('/api/clients', async (req, res) => {
    try {
        // 1. Ask the database for all entries in the 'Client' table
        const allClients = await Client.findAll();
        
        // 2. Send the data back as JSON (not HTML)
        res.json(allClients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong fetching data" });
    }
});
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});