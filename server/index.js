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

// Get all users (admin only)
app.get('/api/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all('SELECT id, username, role FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Create new user (admin only)
app.post('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { username, password, role } = req.body;
  
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ id: this.lastID, username, role });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Update user (admin only)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { id } = req.params;
  const { username, password, role } = req.body;

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.run(
        'UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?',
        [username, hashedPassword, role, id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ id, username, role });
        }
      );
    } else {
      db.run(
        'UPDATE users SET username = ?, role = ? WHERE id = ?',
        [username, role, id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ id, username, role });
        }
      );
    }
  } catch (error) {
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { id } = req.params;
  
  db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

// Get student progress (admin only)
app.get('/api/students/:id/progress', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { id } = req.params;
  
  // Заглушка для демонстрации
  const mockProgress = {
    completedTests: 5,
    averageScore: 85,
    lastActivity: new Date().toISOString(),
    testHistory: [
      { testId: 1, score: 90, date: '2024-03-15' },
      { testId: 2, score: 85, date: '2024-03-14' },
      { testId: 3, score: 80, date: '2024-03-13' }
    ]
  };

  res.json(mockProgress);
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 