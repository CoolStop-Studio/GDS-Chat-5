import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import lodash from 'lodash';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default data structure
const defaultData = {
  users: {
    0: { name: "User0", pass: "User0", date: "2025-1-01T13:00:00Z", friends: [1] },
    1: { name: "User1", pass: "User1", date: "2025-1-01T13:00:00Z", friends: [0] }
  },
  chats: {
    0: {
      name: "User0 & User1",
      users: [0, 1],
      msgs: [
        { from: 0, date: "2025-1-01T13:00:00Z", msg: "User0" },
        { from: 1, date: "2025-1-01T13:00:00Z", msg: "User1" }
      ]
    }
  }
};

// Configure lowdb to use JSON file for storage
const file = join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, defaultData);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from 'public' directory
app.use(express.static(join(__dirname, 'public')));
app.use(express.json()); // Parse JSON bodies

// Initialize the database
async function initializeDb() {
  // Read existing data from db.json
  await db.read();
  // Write to ensure the file exists
  await db.write();
}

// API route to read data from a specific path
app.get('/api/read', async (req, res) => {
  try {
    const { path } = req.query;
    
    if (!path) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
    
    await db.read();
    
    // Use lodash get to safely retrieve nested properties
    const value = lodash.get(db.data, path);
    
    if (value === undefined) {
      return res.status(404).json({ error: 'Path not found in database' });
    }
    
    res.json({ value });
  } catch (error) {
    console.error('Error reading from database:', error);
    res.status(500).json({ error: 'Failed to read from database' });
  }
});

// API route to write data to a specific path
app.post('/api/write', async (req, res) => {
  try {
    const { path, value } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value parameter is required' });
    }
    
    await db.read();
    
    // Use lodash set to safely set nested properties
    lodash.set(db.data, path, value);
    
    // Write the updated data to the database
    await db.write();
    
    res.json({ success: true, message: `Value written to ${path}` });
  } catch (error) {
    console.error('Error writing to database:', error);
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

// Basic API routes for reference
app.get('/api/users', async (req, res) => {
  await db.read();
  res.json(db.data.users);
});

app.get('/api/chats', async (req, res) => {
  await db.read();
  res.json(db.data.chats);
});

// Start server
initializeDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});