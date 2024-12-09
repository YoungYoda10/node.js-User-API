const https = require('https');
const fs = require('fs');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const ip = require("ip");

const app = express();
app.use(express.json());

// Set up the database
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Database opening error: ', err);
    } else {
        console.log('Database connected.');
    }
});

// Create the "users" table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users
        (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            name  TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE
        )`);

// Default info
app.get('/', (req, res) => {
    db.all('SELECT * FROM users', [], (err) => {
        if (err) {
            res.status(500).json({error: err.message});
        } else {
            res.json({info: 'Welcome to node.js user api'});
        }
    });
});

// Get all users
app.get('/api/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            res.status(500).json({error: err.message});
        } else {
            res.json({users: rows});
        }
    });
});

// Get a user by ID
app.get('/api/users/:id', (req, res) => {
    const {id} = req.params;
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({error: err.message});
        } else if (row) {
            res.json(row);
        } else {
            res.status(404).json({message: 'User not found'});
        }
    });
});

// Create a new user
app.post('/api/users', (req, res) => {
    const {name, email} = req.body;
    db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], function (err) {
        if (err) {
            res.status(500).json({error: err.message});
        } else {
            res.status(201).json({id: this.lastID, name, email});
        }
    });
});

// Update an existing user
app.put('/api/users/:id', (req, res) => {
    const {id} = req.params;
    const {name, email} = req.body;
    db.run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id], function (err) {
        if (err) {
            res.status(500).json({error: err.message});
        } else if (this.changes === 0) {
            res.status(404).json({message: 'User not found'});
        } else {
            res.json({id, name, email});
        }
    });
});

// Delete a user
app.delete('/api/users/:id', (req, res) => {
    const {id} = req.params;
    db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({error: err.message});
        } else if (this.changes === 0) {
            res.status(404).json({message: 'User not found'});
        } else {
            res.status(204).send();
        }
    });
});

// SSL options
const options = {
    key: fs.readFileSync('key.pem'), cert: fs.readFileSync('cert.pem'),
};

// Start HTTPS server
https.createServer(options, app).listen(3000, () => {
    console.log('Secure API server running at https://' + ip.address() + ':3000');
});