// MSRE RPG Game Client

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Chat functionality
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInputField');
const sendButton = document.getElementById('sendButton');
const chatTabs = document.querySelectorAll('.chat-tab');

// Authentication status
const userInfo = JSON.parse(sessionStorage.getItem('user') || '{"access":"none"}');
const isLoggedIn = !!userInfo.username;

// Redirect if not logged in
if (!isLoggedIn) {
  window.location.href = '/login';
}

// Game state
const gameState = {
  map: null,
  items: null,
  outfits: null,
  player: {
    x: 0,
    y: 0,
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    name: userInfo.username,
    outfit: 1,
    direction: 'south',
    stats: {
      strength: 10,
      defense: 5,
      dexterity: 8,
      agility: 7,
      intelligence: 6,
      luck: 5
    },
    skills: {
      melee: 10,
      distance: 5,
      magic: 8
    }
  },
  tileSize: 32,
  viewport: {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  },
  keyboard: {
    up: false,
    down: false,
    left: false,
    right: false
  },
  activeChat: 'game'
};

// Tileset image
const tilesetImage = new Image();
tilesetImage.src = 'tileset.png';

// Initialize the game
function init() {
  // Resize canvas to fit the container
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Load resources
  Promise.all([
    fetch('/api/map').then(res => res.json()),
    fetch('/api/items').then(res => res.json()),
    fetch('/api/outfits').then(res => res.json())
  ])
  .then(([mapData, itemsData, outfitsData]) => {
    gameState.map = mapData;
    gameState.items = itemsData;
    gameState.outfits = outfitsData;
    
    // Place player at a random walkable position
    placePlayerAtRandomPosition();
    
    // Start game loop
    gameLoop();
    
    // Add chat message to show game started
    addChatMessage('Welcome to MSRE RPG!', 'server');
    addChatMessage(`Welcome, ${userInfo.username}!`, 'server');
  })
  .catch(error => {
    console.error('Error loading game data:', error);
    addChatMessage('Error loading game data. Please refresh.', 'server');
  });
  
  // Set up event listeners
  setupEventListeners();
}

// Resize canvas to fit container
function resizeCanvas() {
  const gameWindow = canvas.parentElement;
  canvas.width = gameWindow.clientWidth;
  canvas.height = gameWindow.clientHeight;
  
  // Update viewport dimensions
  gameState.viewport.width = Math.ceil(canvas.width / gameState.tileSize);
  gameState.viewport.height = Math.ceil(canvas.height / gameState.tileSize);
  
  // When viewport size changes, recenter on player
  if (gameState.player) {
    centerViewportOnPlayer();
  }
}

// Place player at random walkable position
function placePlayerAtRandomPosition() {
  if (!gameState.map || !gameState.map.layers || !gameState.map.layers.length) {
    console.error('Map data not properly loaded');
    return;
  }
  
  // Find ground/floor layer
  const groundLayer = gameState.map.layers.find(layer => 
    layer.name === 'Ground' || layer.name === 'Floor');
  
  if (!groundLayer) {
    console.error('Ground layer not found in map');
    gameState.player.x = 5;
    gameState.player.y = 5;
    return;
  }
  
  // Find walkable tiles
  const walkableTiles = [];
  
  for (let y = 0; y < gameState.map.height; y++) {
    for (let x = 0; x < gameState.map.width; x++) {
      const tileIndex = y * gameState.map.width + x;
      const tileId = groundLayer.data[tileIndex];
      
      // Skip if no tile
      if (tileId === 0) continue;
      
      // Find the item for this tile
      const item = gameState.items.find(item => item.id === tileId);
      
      // Check if walkable
      if (item && item.walkable) {
        walkableTiles.push({ x, y });
      }
    }
  }
  
  // Place player on a random walkable tile
  if (walkableTiles.length > 0) {
    const randomTile = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
    gameState.player.x = randomTile.x;
    gameState.player.y = randomTile.y;
    
    // Center viewport on player
    centerViewportOnPlayer();
  } else {
    console.error('No walkable tiles found');
    gameState.player.x = 5;
    gameState.player.y = 5;
  }
}

// Center viewport on player
function centerViewportOnPlayer() {
  gameState.viewport.x = gameState.player.x - Math.floor(gameState.viewport.width / 2);
  gameState.viewport.y = gameState.player.y - Math.floor(gameState.viewport.height / 2);
  
  // Keep viewport within map bounds
  constrainViewport();
}

// Constrain viewport to map bounds
function constrainViewport() {
  if (!gameState.map) return;
  
  gameState.viewport.x = Math.max(0, gameState.viewport.x);
  gameState.viewport.y = Math.max(0, gameState.viewport.y);
  
  const maxX = gameState.map.width - gameState.viewport.width;
  const maxY = gameState.map.height - gameState.viewport.height;
  
  gameState.viewport.x = Math.min(maxX, gameState.viewport.x);
  gameState.viewport.y = Math.min(maxY, gameState.viewport.y);
}

// Set up event listeners
function setupEventListeners() {
  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        gameState.keyboard.up = true;
        break;
      case 'ArrowDown':
      case 's':
        gameState.keyboard.down = true;
        break;
      case 'ArrowLeft':
      case 'a':
        gameState.keyboard.left = true;
        break;
      case 'ArrowRight':
      case 'd':
        gameState.keyboard.right = true;
        break;
      case 'Enter':
        if (document.activeElement === chatInput) {
          sendChatMessage();
        } else {
          chatInput.focus();
        }
        break;
    }
  });
  
  window.addEventListener('keyup', (e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        gameState.keyboard.up = false;
        break;
      case 'ArrowDown':
      case 's':
        gameState.keyboard.down = false;
        break;
      case 'ArrowLeft':
      case 'a':
        gameState.keyboard.left = false;
        break;
      case 'ArrowRight':
      case 'd':
        gameState.keyboard.right = false;
        break;
    }
  });
  
  // Chat controls
  sendButton.addEventListener('click', sendChatMessage);
  
  // Chat tabs
  chatTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      chatTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Update active chat channel
      gameState.activeChat = tab.dataset.channel;
    });
  });
}

// Handle player movement
function handlePlayerMovement() {
  let newX = gameState.player.x;
  let newY = gameState.player.y;
  
  if (gameState.keyboard.up) {
    newY--;
    gameState.player.direction = 'north';
  } else if (gameState.keyboard.down) {
    newY++;
    gameState.player.direction = 'south';
  }
  
  if (gameState.keyboard.left) {
    newX--;
    gameState.player.direction = 'west';
  } else if (gameState.keyboard.right) {
    newX++;
    gameState.player.direction = 'east';
  }
  
  // Check if the movement is valid (no collision)
  if (isTileWalkable(newX, newY)) {
    gameState.player.x = newX;
    gameState.player.y = newY;
    
    // Update viewport to center player
    centerViewportOnPlayer();
  }
}

// Check if a tile is walkable
function isTileWalkable(x, y) {
  if (!gameState.map || !gameState.items) return false;
  
  // Out of bounds check
  if (x < 0 || y < 0 || x >= gameState.map.width || y >= gameState.map.height) {
    return false;
  }
  
  // Check each layer for non-walkable items
  for (const layer of gameState.map.layers) {
    const tileIndex = y * gameState.map.width + x;
    const tileId = layer.data[tileIndex];
    
    // Skip empty tiles
    if (tileId === 0) continue;
    
    // Find the item
    const item = gameState.items.find(item => item.id === tileId);
    
    // If item exists and is not walkable, return false
    if (item && !item.walkable) {
      return false;
    }
  }
  
  // All checks passed, tile is walkable
  return true;
}

// Render game
function render() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (!gameState.map || !gameState.items) return;
  
  // Render map layers
  renderMap();
  
  // Render player
  renderPlayer();
}

// Render map layers
function renderMap() {
  // Get the visible area
  const startX = gameState.viewport.x;
  const startY = gameState.viewport.y;
  const endX = startX + gameState.viewport.width;
  const endY = startY + gameState.viewport.height;
  
  // Render each layer
  for (const layer of gameState.map.layers) {
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        // Skip out-of-bounds tiles
        if (x < 0 || y < 0 || x >= gameState.map.width || y >= gameState.map.height) {
          continue;
        }
        
        const tileIndex = y * gameState.map.width + x;
        const tileId = layer.data[tileIndex];
        
        // Skip empty tiles
        if (tileId === 0) continue;
        
        // Find the item
        const item = gameState.items.find(item => item.id === tileId);
        
        if (item && item.spriteX !== undefined && item.spriteY !== undefined) {
          // Calculate position on canvas
          const canvasX = (x - startX) * gameState.tileSize;
          const canvasY = (y - startY) * gameState.tileSize;
          
          // Draw the tile
          ctx.drawImage(
            tilesetImage,
            item.spriteX * gameState.tileSize,
            item.spriteY * gameState.tileSize,
            gameState.tileSize,
            gameState.tileSize,
            canvasX,
            canvasY,
            gameState.tileSize,
            gameState.tileSize
          );
        }
      }
    }
  }
}

// Render player
function renderPlayer() {
  // Find player outfit
  const outfit = gameState.outfits.find(o => o.id === gameState.player.outfit);
  
  if (!outfit) {
    console.error('Player outfit not found');
    return;
  }
  
  // Get direction offsets
  let directionOffset = 0;
  switch (gameState.player.direction) {
    case 'north': directionOffset = 3; break;
    case 'east': directionOffset = 2; break;
    case 'south': directionOffset = 0; break;
    case 'west': directionOffset = 1; break;
  }
  
  // Calculate position on canvas
  const canvasX = (gameState.player.x - gameState.viewport.x) * gameState.tileSize;
  const canvasY = (gameState.player.y - gameState.viewport.y) * gameState.tileSize;
  
  // Draw player
  ctx.drawImage(
    tilesetImage,
    outfit.spriteX * gameState.tileSize,
    (outfit.spriteY + directionOffset) * gameState.tileSize,
    gameState.tileSize,
    gameState.tileSize,
    canvasX,
    canvasY,
    gameState.tileSize,
    gameState.tileSize
  );
}

// Update stats display
function updateStatsDisplay() {
  // Update health and mana
  document.getElementById('healthStat').textContent = 
    `${gameState.player.health}/${gameState.player.maxHealth}`;
  document.getElementById('manaStat').textContent = 
    `${gameState.player.mana}/${gameState.player.maxMana}`;
  
  // Update stats
  document.getElementById('strengthStat').textContent = gameState.player.stats.strength;
  document.getElementById('defenseStat').textContent = gameState.player.stats.defense;
  document.getElementById('dexterityStat').textContent = gameState.player.stats.dexterity;
  document.getElementById('agilityStat').textContent = gameState.player.stats.agility;
  document.getElementById('intelligenceStat').textContent = gameState.player.stats.intelligence;
  document.getElementById('luckStat').textContent = gameState.player.stats.luck;
  
  // Update skills
  document.getElementById('meleeStat').textContent = gameState.player.skills.melee;
  document.getElementById('distanceStat').textContent = gameState.player.skills.distance;
  document.getElementById('magicStat').textContent = gameState.player.skills.magic;
  
  // Update progress bars
  document.getElementById('meleeProgress').style.width = `${gameState.player.skills.melee}%`;
  document.getElementById('distanceProgress').style.width = `${gameState.player.skills.distance}%`;
  document.getElementById('magicProgress').style.width = `${gameState.player.skills.magic}%`;
}

// Send chat message
function sendChatMessage() {
  const message = chatInput.value.trim();
  
  if (message) {
    addChatMessage(message, 'game');
    chatInput.value = '';
  }
}

// Add chat message
function addChatMessage(message, channel) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('chat-message', channel);
  
  let prefix = '';
  switch (channel) {
    case 'game':
      prefix = `[${gameState.player.name}]: `;
      break;
    case 'server':
      prefix = '[Server]: ';
      break;
    case 'trade':
      prefix = '[Trade]: ';
      break;
  }
  
  messageElement.textContent = prefix + message;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Game loop
function gameLoop() {
  // Handle input
  handlePlayerMovement();
  
  // Update stats display
  updateStatsDisplay();
  
  // Render game
  render();
  
  // Schedule next frame
  requestAnimationFrame(gameLoop);
}

// Start the game when the page loads
window.addEventListener('load', init); 