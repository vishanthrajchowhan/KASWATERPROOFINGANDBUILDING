require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = 3000;

// --- 1. SETUP DATABASE CONNECTION ---
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
});

// Function to ensure database exists
async function ensureDatabaseExists() {
    const sequelizeNoDb = new Sequelize('postgres', process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false
    });
    
    try {
        await sequelizeNoDb.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        console.log(`✅ Database '${process.env.DB_NAME}' created!`);
    } catch (err) {
        if (err.message.includes('already exists')) {
            console.log(`✅ Database '${process.env.DB_NAME}' already exists!`);
        } else {
            console.error("Error creating database:", err.message);
        }
    } finally {
        await sequelizeNoDb.close();
    }
}

// Define the 'Client' table
const Client = sequelize.define('Client', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    service: { type: DataTypes.STRING },
    message: { type: DataTypes.TEXT }
});

// Sync database (creates the table if it doesn't exist)
async function startServer() {
    await ensureDatabaseExists();
    
    await sequelize.sync()
        .then(() => console.log("✅ Database connected and synced!"))
        .catch(err => console.log("❌ Error connecting to database:", err));
}

startServer();

// --- 2. MIDDLEWARE ---
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(bodyParser.urlencoded({ extended: true }));

// --- 3. ROUTES ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'admin.html'));
});

app.post('/contact', async (req, res) => {
    const { name, email, service, message } = req.body;

    try {
        // A. SAVE TO POSTGRESQL
        await Client.create({ name, email, service, message });
        console.log("Data saved to Database!");

        // B. SEND EMAIL
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_TO, 
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
app.get('/api/clients', async (req, res) => {
    try {
        const allClients = await Client.findAll();
        res.json(allClients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong fetching data" });
    }
});

// --- API ROUTE: Delete Client ---
app.delete('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Client.destroy({ where: { id } });
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error deleting client" });
    }
});
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});