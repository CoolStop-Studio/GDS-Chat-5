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
    maxPasswordLength: 30,
    minChatnameLength: 1,
    maxChatnameLength: 30,
    minChatUserAmount: 2,
    maxChatUserAmount: 15 
  },
  users: [
    { name: "User0", pass: "User0", date: "2025-1-01T13:00:00Z", friends: [], reqs: [] },
    { name: "User1", pass: "User1", date: "2025-1-01T13:00:00Z", friends: [], reqs: [] }
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

async function initializeDb() {
  await db.read();
  await db.write();
}

// Read data from database at specified path
async function read(path) {
  console.log(`REQUEST: READING FROM ${path}`);
  try {
    await db.read();

    if (path === undefined) return { error: 'Read: Path parameter is required', status: 400 };  // Check if there's a path parameter
    
    const result = lodash.get(db.data, path); // Get the value from the path with lodash
    
    if (result === undefined) return { error: `Read: No value defined at path: "${path}"`, status: 404 }; // Check if there's a value at the path

    return result;
  } catch (err) {
    console.error('Read: ' + err.message);
    return { error: 'Read: ' + err.message, status: 500 };
  }
}

async function write(path, value) {
  console.log(`REQUEST: WRITE ${value} TO ${path}`);
  try {
    await db.read();

    if (path === undefined) return { error: 'Write: Path parameter is required', status: 400 };  // Check if there's a path parameter
    if (value === undefined) return { error: 'Write: Value parameter is required', status: 400 };  // Check if there's a value parameter
    
    lodash.set(db.data, path, value); // Set the value to the path

    await db.write();
    
    return { success: true, message: `"${value}" successfully written to "${path}"` };
  } catch (err) {
    console.error("Write: Error: " + err.message);
    return { error: 'Write: Error writing to database: ' + err.message, status: 500 };
  }
}

async function registerUser(username, password) {
  console.log(`REQUEST: REGISTERING ${username} WITH PASSWORD ${password}`);
  try {
    await db.read();
    const info = db.data.info; // Get info

    if (username === undefined) return { error: 'Register: username parameter is required', status: 400 }; // Check if there's a username
    if (password === undefined) return { error: 'Register: passwprd parameter is required', status: 400 }; // Check if there's a password

    if (username.length < info.minUsernameLength) return { error: `Register: Username "${username}" is less than minUsernameLength (${info.minUsernameLength})`, status: 400 }; // Check if username is shorter than min
    if (username.length > info.maxUsernameLength) return { error: `Register: Username "${username}" is more than maxUsernameLength (${info.maxUsernameLength})`, status: 400 }; // Check if username is longer than max
    if (password.length < info.minPasswordLength) return { error: `Register: Password "${password}" is less than minPasswordLength (${info.minPasswordLength})`, status: 400 }; // Check if password is shorter than min
    if (password.length > info.maxPasswordLength) return { error: `Register: Password "${password}" is more than maxPasswordLength (${info.maxPasswordLength})`, status: 400 }; // Check if password is longer than max

    const time = new Date(); // Get current time

    const user = { // Setup the user as a variable
      name: username,
      pass: password,
      date: time,
      friends: [],
      reqs: []
    }

    db.data.users.push(user); // Push the variable to the database

    await db.write();
    
    return { success: true, message: `User "${username}" successfully registered` };
  } catch (err) {
    console.error("Register: Error: " + err.message);
    return { error: 'Register: Error registering user to database: ' + err.message, status: 500 };
  }
}

async function tryLogin(username, password) {
  console.log(`REQUEST: ATTEMPTED LOG IN username: ${username} password: ${password}`);
  try {
    await db.read();

    if (username === undefined) return { error: 'Login: username parameter is required', status: 400 }; // Check if there's a username
    if (password === undefined) return { error: 'Login: passwprd parameter is required', status: 400 }; // Check if there's a password

    const user = db.data.users.find(u => u.name === username); // Find the user ID by name

    if (!user) return false; // Check if the username exists

    if (user.pass !== password) return false; // Check if the password is correct

    return true; // If both correct, return true
  } catch (err) {
    console.error("Login: Error: " + err.message);
    return { error: 'Login: Error reading from database: ' + err.message, status: 500 };
  }
}

async function newChat(name, users) {
  console.log(`REQUEST: CREATE NEW CHAT ${name} WITH USERS ${users}`);
  try {
    await db.read();
    const info = db.data.info; // Get info

    if (name === undefined) return { error: `New Chat: name parameter required`, status: 400 }; // Check if there's a name
    if (users === undefined) return { error: `New Chat: users parameter required`, status: 400 }; // Check if there are users

    if (name.length < info.minChatnameLength) return { error: `New Chat: Name "${name}" is less than minChatnameLength (${info.minChatnameLength})`, status: 400 }; // Check if name is longer than max
    if (name.length > info.manChatnameLength) return { error: `New Chat: Name "${name}" is more than maxChatnameLength (${info.maxChatnameLength})`, status: 400 }; // Check if name is shorter than min
    if (users.length < info.minChatnameLength) return { error: `New Chat: Name "${name}" is less than minChatnameLength (${info.minChatnameLength})`, status: 400 }; // Check if users are more than max
    if (users.length > info.manChatnameLength) return { error: `New Chat: Name "${name}" is more than maxChatnameLength (${info.maxChatnameLength})`, status: 400 }; // Check if users are less than min

    const chat = { // Setup the chat as a variable
      name: name,
      users: users,
      msgs: []
    }
    db.data.chats.push(chat); // Push the variable to the database

    await db.write();
    
    return { success: true, message: `Chat "${name}" successfully created` };
  } catch (err) {
    console.error("New Chat: Error: " + err.message);
    return { error: 'New Chat: Error creating new chat: ' + err.message, status: 500 };
  }
}

async function addUserToChat(chat, user) {
  console.log(`REQUEST: ADD ${user} TO CHAT ${chat}}`);
  try {
    await db.read();

    if (chat === undefined) return { error: `Add user to chat: chat parameter required`, status: 400 }; // Check if there's a chat
    if (user === undefined) return { error: `Add user to chat: user parameter required`, status: 400 }; // Check if there's a user

    if (!db.data.chats[chat]) return { error: `Add user to chat: chat does not exist`, status: 400 }; // Check if the chat exists
    if (!db.data.users[user]) return { error: `Add user to chat: user does not exist`, status: 400 }; // Check if the user exists

    db.data.chats[chat].users.push(user); // Push the user to the chat user list

    await db.write();
    
    return { success: true, message: `User "${db.data.users[user].name}" successfully added to chat "${db.data.chats[chat].name}"` };
  } catch (err) {
    console.error("Add user to chat: Error: " + err.message);
    return { error: 'Add user to chat: Error adding user to chat: ' + err.message, status: 500 };
  }
}

async function removeUserFromChat(chat, user) {
  console.log(`REQUEST: REMOVE ${user} FROM CHAT ${chat}}`);
  try {
    await db.read();

    if (chat === undefined) return { error: `Remove user from chat: chat parameter required`, status: 400 }; // Check if there's a chat
    if (user === undefined) return { error: `Remove user from chat: user parameter required`, status: 400 }; // Check if there's a user

    if (db.data.users[user] === undefined) return { error: `Remove user from chat: user does not exist`, status: 400 }; // Check if the chat exists
    if (db.data.chats[chat] === undefined) return { error: `Remove user from chat: chat does not exist`, status: 400 }; // Check if the user exists

    if(!db.data.chats[chat].users.includes(user)) return { error: `Remove user from chat: user does not exist in chat`, status: 400 }; // Check if the user is in the chat

    db.data.chats[chat].users.splice(db.data.chats[chat].users.indexOf(user), 1); // Remove the user from the chat

    await db.write();
    
    return { success: true, message: `User "${db.data.users[user].name}" successfully Removed from chat "${db.data.chats[chat].name}"` };
  } catch (err) {
    console.error("Remove user from chat: Error: " + err.message);
    return { error: 'Remove user from chat: Error adding user to chat: ' + err.message, status: 500 };
  }
}

async function getMessages(chat, count) {
  console.log(`REQUEST: GET ${count} MESSAGES FROM ${chat}`);
  try {
    await db.read()

    if (chat === undefined) return { error: 'Get Messages: chat parameter is required', status: 400 }; // Check if there's a chat
    if (count == undefined) return { error: 'Get Messages: count parameter is required', status: 400 }; // Check if there's a count
    
    if (db.data.chats[chat] === undefined) return { error: 'Get Messages: chat does not exist', status: 400 } // Check if the chat exists

    return await db.data.chats[chat].msgs.slice(-count); // Return the messages
  } catch (err) {
    console.error("Get messages: Error: " + err.message);
    return { error: 'Get messages: Error reading from database: ' + err.message, status: 500 };
  }
}

async function sendMessage(chat, user, msg) {
  console.log(`REQUEST: SEND ${msg} FROM ${user} TO ${chat}`);
  try {
    await db.read();

    if (chat === undefined) return { error: `Send message: chat parameter required`, status: 400 }; // Check if there's a chat
    if (user === undefined) return { error: `Send message: user parameter required`, status: 400 }; // Check if there's a user
    if (msg === undefined) return { error: `Send message: message parameter required`, status: 400 }; // Check if there's a message

    if (!db.data.users[user]) return { error: `Send message: user does not exist`, status: 400 }; // Check if the user exists
    if (!db.data.chats[chat]) return { error: `Send message: chat does not exist`, status: 400 }; // Check if the chat exists

    if (!db.data.chats[chat].users.includes(user)) return { error: `Send message: user is not in chat`, status: 400 };
    const time = new Date(); // Get current time

    const message = { // Setup the message as a variable
      from: user,
      date: time,
      msg: msg
    }
    
    db.data.chats[chat].msgs.push(message); // Push the variable to the database

    await db.write();

    return { success: true, message: `Message from "${db.data.users[user].name}" successfully sent to chat "${db.data.chats[chat].name}"` };
  } catch (err) {
    console.error("Send message: Error: " + err.message);
    return { error: 'Send message: Error adding user to chat: ' + err.message, status: 500 };
  }
}

async function changePassword(user, password) {
  console.log(`REQUEST: CHANGE PASSWORD FOR ${user} TO ${password}`);
  try {
    await db.read();
    const info = db.data.info;

    if (user === undefined) return { error: `Change password: user parameter required`, status: 400 }; // Check if there's a user
    if (password === undefined) return { error: `Change password: password parameter required`, status: 400 }; // Check if there's a password

    if (!db.data.users[user]) return { error: `Change password: user does not exist`, status: 400 }; // Check if the user exists

    if (password.length > info.maxPasswordLength) return { error: `Change password: Password "${password}" is longer than maxPasswordLength (${maxPasswordLength})`, status: 400 }; // Check if the password is longer than than max
    if (password.length < info.minPasswordLength) return { error: `Change password: Password "${password}" is shorter than minPasswordLength (${minPasswordLength})`, status: 400 }; // Check if the password is shorter than than min

    db.data.users[user].pass = password; // Set the users password

    await db.write();

    return { success: true, message: `${db.data.users[user].name}'s password successfully changed` };
  } catch (err) {
    console.error("Change password: Error: " + err.message);
    return { error: 'Change password: Error changing password: ' + err.message, status: 500 };
  }
}

async function sendFriendRequest(sender, receiver) {
  console.log(`REQUEST: SEND FRIEND REQUEST FROM ${sender} TO ${receiver}`);
  try {
    await db.read();

    if (sender === undefined) return { error: `Send request: sender parameter required`, status: 400 }; // Check if there's a sender
    if (receiver === undefined) return { error: `Send request: receiver parameter required`, status: 400 }; // Check if there's a receiver

    if (db.data.users[sender] === undefined) return { error: `Send request: sender "${db.data.users[sender]}" is not a user`, status: 400 }; // Check if the sender exists
    if (db.data.users[receiver]  === undefined) return { error: `Send request: receiver "${db.data.users[receiver]}" is not a user`, status: 400 }; // Check if the receiver exists

    if (db.data.users[receiver].friends.includes(sender)) return { error: `Send request: Already friends`, status: 400 }; // Check if the receiver is already friends with sender
    if (db.data.users[sender].friends.includes(receiver)) return { error: `Send request: Already friends`, status: 400 }; // Check if the receiver is already friends with receiver

    if (db.data.users[receiver].reqs.includes(sender)) return { error: `Send request: request already sent`, status: 400 }; // Check if the receiver already has a request from the sender

    if (db.data.users[sender].reqs.includes(receiver)) { // Check if the sender alread has a request from the receiver 
        let result = await acceptFriendRequest(receiver, sender); // If so, add them as friends
        return result;
    }

    db.data.users[receiver].reqs.push(sender); // Add the request to the receiver

    await db.write();

    return { success: true, message: `Request from ${db.data.users[sender].name} successfully sent to ${db.data.users[receiver].name}` };
  } catch (err) {
    console.error("Send request: Error: " + err.message);
    return { error: 'Send request: error sending request: ' + err.message, status: 500 };
  }
}

async function acceptFriendRequest(sender, receiver) {
  console.log(`REQUEST: ACCEPT FRIEND REQUEST FROM ${sender} BY ${receiver}`);
  try {
    await db.read();

    if (sender === undefined) return { error: `Accept request: sender parameter required`, status: 400 }; // Check if there's a sender
    if (receiver === undefined) return { error: `Accept request: receiver parameter required`, status: 400 }; // Check if there's a receiver


    if (db.data.users[sender] === undefined) return { error: `Accept request: sender "${db.data.users[sender]}" is not a user`, status: 400 };  // Check if the sender exists
    if (db.data.users[receiver]  === undefined) return { error: `Accept request: receiver "${db.data.users[receiver]}" is not a user`, status: 400 };  // Check if the receiver exists

    if (!db.data.users[receiver].reqs.includes(sender)) return { error: `Accept request: receiver does not have request from sender`, status: 400 }; // Check if the receiver has a request from the sender

    db.data.users[receiver].friends.push(sender); console.log("Added receiver as friend"); // Add the sender to the receivers friend list
    db.data.users[sender].friends.push(receiver); console.log("Added sender as friend") // Add the receiver to the senders friend list

    db.data.users[receiver].reqs.splice(db.data.users[receiver].reqs.indexOf(sender), 1); console.log("Removed senders request from receivers req") // Remove the senders request to receiver
    if (db.data.users[sender].reqs.includes(receiver)) db.data.users[sender].reqs.splice(db.data.users[sender].reqs.indexOf(receiver), 1); // Remove the receivers request to sender (if there is a request)

    await db.write();

    return { success: true, message: `Request from ${db.data.users[sender].name} successfully accepted by ${db.data.users[receiver].name}` };
  } catch (err) {
    console.error("Accept request: Error: " + err.message);
    return { error: 'Accept request: error accepting request: ' + err.message, status: 500 };
  }
}

async function denyFriendRequest(sender, receiver) {
  console.log(`REQUEST: DENY FRIEND REQUEST FROM ${sender} BY ${receiver}`);
  try {
    await db.read();

    if (sender === undefined) return { error: `Deny request: sender parameter required`, status: 400 }; // Check if there's a sender
    if (receiver === undefined) return { error: `Deny request: receiver parameter required`, status: 400 }; // Check if there's a receiver

    if (db.data.users[sender] === undefined) return { error: `Deny request: sender "${db.data.users[sender]}" is not a user`, status: 400 }; // Check if the sender exists
    if (db.data.users[receiver]  === undefined) return { error: `Deny request: receiver "${db.data.users[receiver]}" is not a user`, status: 400 }; // Check if the receiver exists

    if (!db.data.users[receiver].reqs.includes(sender)) return { error: `Deny request: receiver does not have request from sender`, status: 400 }; // Check if the receiver has a request from the sender

    db.data.users[receiver].reqs.splice(db.data.users[receiver].reqs.indexOf(sender), 1); // Remove senders request to receiver
    if (db.data.users[sender].reqs.includes(receiver)) db.data.users[sender].reqs.splice(db.data.users[sender].reqs.indexOf(receiver), 1);  // Remove the receivers request to sender (if there is a request)

    await db.write();

    return { success: true, message: `Request from ${db.data.users[sender].name} successfully Denied by ${db.data.users[receiver].name}` };
  } catch (err) {
    console.error("Deny request: Error: " + err.message);
    return { error: 'Deny request: error Denying request: ' + err.message, status: 500 };
  }
}

async function removeFriend(user1, user2) {
  console.log(`REQUEST: REMOVE FRIEND PAIR ${user1}, ${user2}`);
  try {
    await db.read();

    if (user1 === undefined) return { error: `Remove friend: user1 parameter required`, status: 400 }; // Check if there's a user1
    if (user2 === undefined) return { error: `Remove friend: user2 parameter required`, status: 400 }; // Check if there's a user2

    if (db.data.users[user1] === undefined) return { error: `Remove friend: user1 "${db.data.users[user1]}" is not a user`, status: 400 }; // Check if user1 exists
    if (db.data.users[user2]  === undefined) return { error: `Remove friend: user2 "${db.data.users[user2]}" is not a user`, status: 400 }; // Check if user2 exists


    db.data.users[user1].friends.splice(db.data.users[user1].friends.indexOf(user2), 1); // Remove user2 from user1's friends list
    db.data.users[user2].friends.splice(db.data.users[user2].friends.indexOf(user1), 1); // Remove user1 from user2's friends list

    await db.write();

    return { success: true, message: `${db.data.users[user1].name} and ${db.data.users[user2].name} were successfully unfriended` };
  } catch (err) {
    console.error("Remove friend: Error: " + err.message);
    return { error: 'Remove friend: error removing friends: ' + err.message, status: 500 };
  }
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

app.post('/api/newChat', async (req, res) => {
  const result = await newChat(req.body.name, req.body.users);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result);
});

app.post('/api/addUserToChat', async (req, res) => {
  const result = await addUserToChat(req.body.chat, req.body.user);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result);
});

app.post('/api/removeUserFromChat', async (req, res) => {
  const result = await removeUserFromChat(req.body.chat, req.body.user);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result);
});

app.get('/api/getMessages', async (req, res) => {
  const result = await getMessages(req.query.chat, req.query.count);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json({ value: result });
});

app.post('/api/sendMessage', async (req, res) => {
  const result = await sendMessage(req.body.chat, req.body.user, req.body.msg);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result);
});

app.post('/api/changePassword', async (req, res) => {
  const result = await changePassword(req.body.user, req.body.password);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result);
});

app.post('/api/sendFriendRequest', async (req, res) => {
  const result = await sendFriendRequest(req.body.sender, req.body.receiver);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result);
});

app.post('/api/acceptFriendRequest', async (req, res) => {
  const result = await acceptFriendRequest(req.body.sender, req.body.receiver);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result);
});

app.post('/api/denyFriendRequest', async (req, res) => {
  const result = await denyFriendRequest(req.body.sender, req.body.receiver);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result);
});

app.post('/api/removeFriend', async (req, res) => {
  const result = await removeFriend(req.body.user1, req.body.user2);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.json(result);
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