const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// JWT secret
const JWT_SECRET = 'your-secret-key';

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    createTables();
  }
});

// Create tables
function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      // Insert default users if they don't exist
      insertDefaultUsers();
    }
  });
}

// Insert default users
async function insertDefaultUsers() {
  const defaultUsers = [
    {
      username: 'admin',
      password: '12345',
      role: 'admin'
    },
    {
      username: 'student',
      password: '12345',
      role: 'student'
    }
  ];

  for (const user of defaultUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    db.run(
      'INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)',
      [user.username, hashedPassword, user.role]
    );
  }
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  });
});

// Get current user endpoint
app.get('/api/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 