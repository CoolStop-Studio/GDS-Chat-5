import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import lodash from 'lodash';

// =====================================
// =========== CONFIGURATION ==========
// =====================================

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// File paths
const fileFolder = join(__dirname, 'public');
const fileName = "test.html";
const dbFile = join(__dirname, 'db.json');

// Server settings
const PORT = process.env.PORT || 3000;

// =====================================
// =========== DATABASE SETUP =========
// =====================================

// Default data structure
const defaultData = {
  info: {
    minUsernameLength: 4,
    maxUsernameLength: 30,
    minPasswordLength: 6,
    maxPasswordLength: 30
  },
  users: [
    { name: "User0", pass: "User0", date: "2025-1-01T13:00:00Z", friends: [1], reqs: [] },
    { name: "User1", pass: "User1", date: "2025-1-01T13:00:00Z", friends: [0], reqs: [] }
  ],
  chats: [
    {
      name: "User0 & User1",
      users: [0, 1],
      msgs: [
        { from: 0, date: "2025-1-01T13:00:00Z", msg: "I'm User0" },
        { from: 1, date: "2025-1-01T13:00:00Z", msg: "I'm User1" }
      ]
    }
  ]
};

// Configure lowdb to use JSON file for storage
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, defaultData);

// =====================================
// =============== A P I ===============
// =====================================

// Initialize the database
async function initializeDb() {
  await db.read();
  await db.write();
}

// Read data from database at specified path
async function read(path) {
  try {
    if (!path) return { error: 'Read: Path parameter is required', status: 400 };
    
    await db.read();
    const result = lodash.get(db.data, path);

    if (result === undefined) {
      return { error: `Read: No value defined at path: "${path}"`, status: 404 };
    }
    return result;
  } catch (err) {
    console.error("Read: Error: " + err.message);
    return { error: 'Read: Error reading from database: ' + err.message, status: 500 };
  }
}

// Write data to database at specified path
async function write(path, value) {
  try {
    if (!path) return { error: 'Write: Path parameter is required', status: 400 };
    if (value === undefined) return { error: 'Write: Value parameter is required', status: 400 };
    
    await db.read();
    lodash.set(db.data, path, value);
    await db.write();
    
    return { success: true, message: `"${value}" successfully written to "${path}"` };
  } catch (err) {
    console.error("Write: Error: " + err.message);
    return { error: 'Write: Error writing to database: ' + err.message, status: 500 };
  }
}

async function registerUser(username, password) {
  try {
    const info = await read('info');

    if (username.length < info.minUsernameLength) return { error: `Register: Username "${username}" is less than minUsernameLength (${minUsernameLength})`, status: 400 };
    if (username.length > info.maxUsernameLength) return { error: `Register: Username "${username}" is more than maxUsernameLength (${maxUsernameLength})`, status: 400 };
    if (password.length < info.minPasswordLength) return { error: `Register: Password "${password}" is less than minPasswordLength (${minPasswordLength})`, status: 400 };
    if (password.length > info.maxPasswordLength) return { error: `Register: Password "${password}" is more than maxPasswordLength (${maxPasswordLength})`, status: 400 };

    const time = new Date();

    const user = {
      name: username,
      pass: password,
      date: time,
      friends: [],
      reqs: []
    }
    await db.read();
    db.data.users.push(user);
    await db.write();
    
    
    return { success: true, message: `User "${username}" successfully registered` };
  } catch (err) {
    console.error("Register: Error: " + err.message);
    return { error: 'Register: Error registering user to database: ' + err.message, status: 500 };
  }
}

async function tryLogin(username, password) {
  try {
    if (!username) return { error: 'Login: username parameter is required', status: 400 };
    if (!password) return { error: 'Login: username parameter is required', status: 400 };

    await db.read();

    const user = db.data.users.find(u => u.name === username);

    if (!user) {
      return false;
    }

    if (user.pass !== password) {
      return false;
    }

    return true;
  } catch (err) {
    console.error("Login: Error: " + err.message);
    return { error: 'Login: Error reading from database: ' + err.message, status: 500 };
  }
}

async function newChat(name, users) {
  // no return value
}

async function deleteChat(chat) {
  // no return value
}

async function addUserToChat(chat, user) {
  // no return value
}

async function removeUserFromChat(chat, user) {
  // no return value
}

async function getMessages(chat, count) {
  // returns array of messages
}

async function sendMessage(chat, user, message) {
  // no return value
}

async function changePassword(user, password) {
  // no return value
}

async function sendFreindRequest(sender, receiver) {

}

async function acceptFreindRequest(sender, receiver) {

}

async function denyFreindRequest(sender, receiver) {
  
}








// =====================================
// =========== EXPRESS SETUP ==========
// =====================================

// Initialize Express app
const app = express();

// Configure middleware
app.use(express.static(fileFolder));
app.use(express.json());

// =====================================
// ============== ROUTES ==============
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

app.post('/api/registerUser', async (req, res) => {
  const result = await registerUser(req.body.username, req.body.password);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result);
});

app.get('/api/tryLogin', async (req, res) => {
  const result = await tryLogin(req.query.username, req.query.password);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  if (!result) {
    return res.json({ success: false, message: 'Incorrect username or password' });
  }

  return res.json({ success: true, message: 'Login successful' });
});

// Serve the main application page
app.get('/', (req, res) => {
  res.sendFile(join(fileFolder, fileName));
});

// =====================================
// =========== SERVER START ===========
// =====================================

// Start the server after database initialization
initializeDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});