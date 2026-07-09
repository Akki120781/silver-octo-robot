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
const DATA_DIR = path.join(__dirname, 'data');

// Ensure database files and directory exist
function ensureDataFile(filename, defaultData) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

// Seed data
const SEED_USERS = [
  { "id": "1", "name": "John Doe", "email": "john@example.com" },
  { "id": "2", "name": "Jane Smith", "email": "jane@example.com" }
];

const SEED_FEEDBACK = [
  {
    "id": "f1",
    "name": "John Doe",
    "email": "john@example.com",
    "category": "General",
    "rating": 5,
    "comments": "Excellent portal layout, very minimalist!"
  },
  {
    "id": "f2",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "category": "Course",
    "rating": 4,
    "comments": "The curriculum is very well-paced and clear."
  }
];

const SEED_ATTENDANCE = [
  {
    "id": "a1",
    "studentId": "S101",
    "fullName": "John Doe",
    "date": new Date().toISOString().split('T')[0],
    "status": "Present",
    "reason": ""
  },
  {
    "id": "a2",
    "studentId": "S102",
    "fullName": "Jane Smith",
    "date": new Date().toISOString().split('T')[0],
    "status": "Absent",
    "reason": "Medical appointment"
  }
];

const SEED_SPORTS = [
  {
    "id": "s1",
    "studentName": "Bob Johnson",
    "age": 20,
    "sport": "Football",
    "skillLevel": "Intermediate",
    "contact": "+1-555-0199"
  },
  {
    "id": "s2",
    "studentName": "Alice Williams",
    "age": 19,
    "sport": "Tennis",
    "skillLevel": "Advanced",
    "contact": "+1-555-0188"
  }
];

// Initialize database files
ensureDataFile('users.json', SEED_USERS);
ensureDataFile('feedback.json', SEED_FEEDBACK);
ensureDataFile('attendance.json', SEED_ATTENDANCE);
ensureDataFile('sports.json', SEED_SPORTS);

// Read helper
function readData(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading data from ${filename}:`, error);
    return [];
  }
}

// Write helper
function writeData(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing data to ${filename}:`, error);
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

/* ==========================================================================
   USERS ENDPOINTS (Kept for compatibility)
   ========================================================================== */
app.get('/api/v1/users', (req, res) => {
  res.json(readData('users.json'));
});

app.post('/api/v1/users', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing name, email, or password' });
  }
  const users = readData('users.json');
  const newUser = { id: Math.random().toString(36).substring(2, 9), name, email };
  users.push(newUser);
  if (writeData('users.json', users)) {
    res.status(201).json(newUser);
  } else {
    res.status(500).json({ error: 'Failed to save user' });
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
