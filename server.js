const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4200;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware - No longer used directly but kept for reference
// Now authentication is handled on the client side using sessionStorage
const authenticated = (req, res, next) => {
  const authToken = req.headers.authorization;
  if (!authToken) {
    return res.redirect('/login');
  }
  
  // Validate token logic would go here
  next();
};

// Routes
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'game.html'));
});

app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Default route sends to login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Account API routes
app.post('/api/register', (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, email, and password are required' 
      });
    }
    
    // Check if username already exists
    const accountsDir = path.join(__dirname, 'public', 'accounts');
    if (!fs.existsSync(accountsDir)) {
      fs.mkdirSync(accountsDir, { recursive: true });
    }
    
    const files = fs.readdirSync(accountsDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const accountData = JSON.parse(fs.readFileSync(path.join(accountsDir, file)));
        if (accountData.username.toLowerCase() === username.toLowerCase()) {
          return res.status(400).json({ 
            success: false, 
            message: 'Username already exists' 
          });
        }
        if (accountData.email.toLowerCase() === email.toLowerCase()) {
          return res.status(400).json({ 
            success: false, 
            message: 'Email already in use' 
          });
        }
      }
    }
    
    // Hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    
    // Create account
    const account = {
      username,
      email,
      hash,
      salt,
      access: 'none', // Default to 'none' access
      created: new Date().toISOString()
    };
    
    // Save account
    const fileName = `${username.toLowerCase()}.json`;
    fs.writeFileSync(path.join(accountsDir, fileName), JSON.stringify(account, null, 2));
    
    res.json({ success: true, message: 'Account created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }
    
    // Find account
    const accountsDir = path.join(__dirname, 'public', 'accounts');
    const fileName = `${username.toLowerCase()}.json`;
    const accountPath = path.join(accountsDir, fileName);
    
    if (!fs.existsSync(accountPath)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
    
    const account = JSON.parse(fs.readFileSync(accountPath));
    
    // Verify password
    const hash = crypto.pbkdf2Sync(password, account.salt, 1000, 64, 'sha512').toString('hex');
    if (hash !== account.hash) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
    
    // Generate session token (in a real app, use a more secure method)
    const token = crypto.randomBytes(32).toString('hex');
    
    res.json({ 
      success: true, 
      username: account.username,
      access: account.access,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create default admin account if none exists
function createDefaultAdmin() {
  const accountsDir = path.join(__dirname, 'public', 'accounts');
  if (!fs.existsSync(accountsDir)) {
    fs.mkdirSync(accountsDir, { recursive: true });
  }
  
  // Check if admin account exists
  const adminPath = path.join(accountsDir, 'admin.json');
  if (!fs.existsSync(adminPath)) {
    // Create default admin
    const password = 'admin123';
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    
    const admin = {
      username: 'admin',
      email: 'admin@example.com',
      hash,
      salt,
      access: 'admin',
      created: new Date().toISOString()
    };
    
    fs.writeFileSync(adminPath, JSON.stringify(admin, null, 2));
    console.log('Default admin account created');
  }
}

// API endpoint to save items
app.post('/api/items', (req, res) => {
  try {
    const items = req.body;
    fs.writeFileSync('items.json', JSON.stringify(items, null, 2));
    res.json({ success: true, message: 'Items saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to load items
app.get('/api/items', (req, res) => {
  try {
    if (fs.existsSync('items.json')) {
      const items = JSON.parse(fs.readFileSync('items.json', 'utf8'));
      res.json(items);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to save outfits
app.post('/api/outfits', (req, res) => {
  try {
    const outfits = req.body;
    fs.writeFileSync('outfits.json', JSON.stringify(outfits, null, 2));
    res.json({ success: true, message: 'Outfits saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to load outfits
app.get('/api/outfits', (req, res) => {
  try {
    if (fs.existsSync('outfits.json')) {
      const outfits = JSON.parse(fs.readFileSync('outfits.json', 'utf8'));
      res.json(outfits);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to save map
app.post('/api/map', (req, res) => {
  try {
    const map = req.body;
    fs.writeFileSync('map.json', JSON.stringify(map, null, 2));
    res.json({ success: true, message: 'Map saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// API endpoint to load map
app.get('/api/map', (req, res) => {
  try {
    if (fs.existsSync('map.json')) {
      const map = JSON.parse(fs.readFileSync('map.json', 'utf8'));
      res.json(map);
    } else {
      res.json({ width: 20, height: 20, layers: [] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  createDefaultAdmin();
  console.log(`Server running on port ${PORT}`);
}); 