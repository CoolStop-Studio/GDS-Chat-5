// =====================================
// ======== I N I T I A L I Z E ========
// =====================================

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

// =====================================
// =============== A P I ===============
// =====================================

// Initialize the database
async function initializeDb() {
  // Read existing data from db.json
  await db.read();
  // Write to ensure the file exists
  await db.write();
}

async function read(path) {
  try {

    if (!path) {
      return { error: 'Read: Path parameter is required', status: 400 };
    }
  
    await db.read();
    const result = lodash.get(db.data, path);
    
    if (result === undefined) {
      return { error: `Read: No value defined at path: "${path}"`, status: 404 };
    }

    return result;

  } catch(err) {
    console.error("Read: Error: " + err.message)
    return { error: 'Error reading from database: ' + err.message, status: 500 };
  }
}

async function write(path, value) {
  try {
    if (!path) {
      return { error: 'Write: Path parameter is required', status: 400 };
    }
  
    if (value === undefined) {
      return { error: 'Write: Value parameter is required', status: 400 };
    }
  
    await db.read();
  
    lodash.set(db.data, path, value);
  
    await db.write();
    
    return { success: true, message: `"${value}" successfully written to "${path}"` }

  } catch(err) {
    console.error("Write: Error: " + err.message)
    return { error: 'Error writing to database: ' + err.message, status: 500 };
  }
  
}


// =====================================
// ============ R O U T E S ============
// =====================================

// API route to read data from a specific path
app.get('/api/read', async (req, res) => {
  const result = await read(req.query.path);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json({ value: result }); 
});


// API route to write data to a specific path
app.post('/api/write', async (req, res) => {
  const result = await write(req.body.path, req.body.value);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result);
});

// =====================================
// ============= S T A R T =============
// =====================================

// Start server
initializeDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});