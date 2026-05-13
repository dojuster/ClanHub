const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// Enable connection requests from your phone over the router Wi-Fi
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite Database File
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the secure SQLite database local file.');
});

// Create Users Table Structure securely
db.serialize(() => {
    // 👤 Table 1: Core User Registry Profiles
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        contact TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 👥 Table 2: Multi-Device Interconnected Accounts Registry Map
    db.run(`CREATE TABLE IF NOT EXISTS linked_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        master_username TEXT NOT NULL,
        linked_username TEXT NOT NULL,
        UNIQUE(master_username, linked_username)
    )`);
});

// 🔐 Secure API Route: Handles User Registration safely
app.post('/api/register', async (req, res) => {
    const { name, username, password, contact } = req.body;

    if (!name || !username || !password || !contact) {
        return res.status(400).json({ error: "Missing registration fields" });
    }

    try {
        // Professional Hashing: Encrypts the password before it hits the disk file
        const salt = await bcrypt.genSalt(10);
        const hashedSecurePassword = await bcrypt.hash(password, salt);

        const sql = `INSERT INTO users (name, username, password, contact) VALUES (?, ?, ?, ?)`;
        db.run(sql, [name, username, hashedSecurePassword, contact], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: "Username is already taken" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, message: "User securely saved to database!" });
        });
    } catch (e) {
        res.status(500).json({ error: "Server encryption engine error" });
    }
});

// 🔑 Secure API Route: Handles User Login verification
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Missing identity credentials" });
    }

    const sql = `SELECT * FROM users WHERE LOWER(username) = LOWER(?)`;
    db.get(sql, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: "User profile not found" });

        // Compare input pass securely with hashed database string value
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid password credentials" });

        res.json({ success: true, username: user.username });
    });
});

// 👤 API Endpoint: Pulls a specific user's Name string out of SQLite for profile display
app.get('/api/users/:username', (req, res) => {
    const usernameParam = req.params.username;
    const sql = `SELECT name FROM users WHERE LOWER(username) = LOWER(?)`;
    
    db.get(sql, [usernameParam], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "User not found" });
        res.json({ name: row.name });
    });
});

// 📡 NEW Sync API Route: Maps multi-device account link relationships securely
app.post('/api/sync-account', (req, res) => {
    const { master, linked } = req.body;
    if (!master || !linked) {
        return res.status(400).json({ error: "Missing identity tokens for mapping" });
    }

    const sql = `INSERT OR IGNORE INTO linked_accounts (master_username, linked_username) VALUES (LOWER(?), LOWER(?))`;
    db.run(sql, [master.trim(), linked.trim()], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Cross-device account session link synchronized." });
    });
});

// 📡 NEW Pull API Route: Pulls multi-account arrays down onto alternate devices automatically
app.get('/api/get-linked/:username', (req, res) => {
    const userParam = req.params.username;
    const sql = `SELECT linked_username FROM linked_accounts WHERE LOWER(master_username) = LOWER(?)`;
    
    db.all(sql, [userParam], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const profilesArray = rows.map(row => row.linked_username);
        res.json({ success: true, accounts: profilesArray });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Database Server running on network endpoint: 0.0.0.0:${PORT}`);
});
