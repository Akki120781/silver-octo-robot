import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'secret123';
const DATA_FILE = path.join(__dirname, 'data', 'users.json');

// Ensure database file and directory exist
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([
      { "id": "1", "name": "John Doe", "email": "john@example.com" },
      { "id": "2", "name": "Jane Smith", "email": "jane@example.com" },
      { "id": "3", "name": "Bob Johnson", "email": "bob@example.com" }
    ], null, 2));
  }
}

ensureDataFile();

// Read helper
function readUsers() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users from JSON:', error);
    return [];
  }
}

// Write helper
function writeUsers(users) {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing users to JSON:', error);
    return false;
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Authorization Middleware
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
  }
  const token = authHeader.split(' ')[1];
  if (token !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Incorrect API key' });
  }
  next();
});

// GET /api/v1/users
app.get('/api/v1/users', (req, res) => {
  const users = readUsers();
  res.json(users);
});

// POST /api/v1/users
app.post('/api/v1/users', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing name, email, or password' });
  }

  const users = readUsers();
  const newUser = {
    id: Math.random().toString(36).substring(2, 9),
    name,
    email,
    password // Stored for simplicity in this dev environment
  };

  users.push(newUser);
  if (writeUsers(users)) {
    // Return user without password for response security (or with it, to match mockapi)
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

// DELETE /api/v1/users/:id
app.delete('/api/v1/users/:id', (req, res) => {
  const { id } = req.params;
  const users = readUsers();
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const [deletedUser] = users.splice(index, 1);
  if (writeUsers(users)) {
    const { password: _, ...userWithoutPassword } = deletedUser;
    res.json(userWithoutPassword);
  } else {
    res.status(500).json({ error: 'Failed to delete from database' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Expected Authorization Bearer Key: ${API_KEY}`);
});
