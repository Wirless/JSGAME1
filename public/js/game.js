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
  worldData: null,       // Stores the mapsindex.json data
  currentSector: null,   // Stores the current sector map data
  activeSectorCoords: { x: 0, y: 0 }, // Current sector coordinates
  sectors: new Map(),    // Cache of loaded sectors (Map of sector filename -> sector data)
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
    moveSpeed: 0.2,      // Movement speed (tiles per frame)
    moveCooldown: 0,     // Cooldown counter for movement
    moveDelay: 1000,      // Milliseconds between moves
    lastMoveTime: 0,     // Last time the player moved
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
  activeChat: 'game',
  lastFrameTime: 0,      // For handling frame timing
  deltaTime: 0           // Time between frames
};

// Tileset image
const tilesetImage = new Image();
tilesetImage.src = '/tileset.png';

// Initialize the game
function init() {
  // Resize canvas to fit the container
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Load resources
  Promise.all([
    fetch('/api/mapsindex').then(res => res.json()),
    fetch('/api/items').then(res => res.json()),
    fetch('/api/outfits').then(res => res.json())
  ])
  .then(([worldData, itemsData, outfitsData]) => {
    gameState.worldData = worldData;
    gameState.items = itemsData;
    gameState.outfits = outfitsData;
    
    // Load the initial sector (currently only one sector in the world)
    if (worldData.sectors && worldData.sectors.length > 0) {
      const initialSector = worldData.sectors[0];
      gameState.activeSectorCoords = initialSector.coordinates;
      
      // Load the sector data
      loadSector(initialSector.filename)
        .then(sectorData => {
          gameState.currentSector = sectorData;
          
          // Place player at spawn point from metadata
          if (initialSector.metadata && initialSector.metadata.spawnPoint) {
            // Get spawn point coordinates from metadata
            const spawnX = initialSector.metadata.spawnPoint.x;
            const spawnY = initialSector.metadata.spawnPoint.y;
            
            // Check if the spawn point is walkable
            const item = findItemAtTile(spawnX, spawnY);
            if (item && item.properties && item.properties.walkable) {
              gameState.player.x = spawnX;
              gameState.player.y = spawnY;
            } else {
              // Fallback to a random walkable position
              console.warn('Spawn point is not walkable, finding alternative position');
              placePlayerAtRandomPosition();
            }
          } else {
            // No spawn point defined, use random position
            placePlayerAtRandomPosition();
          }
          
          // Center viewport on player
          centerViewportOnPlayer();
          
          // Start game loop
          gameLoop();
          
          // Add chat messages
          addChatMessage('Welcome to MSRE RPG!', 'server');
          addChatMessage(`Welcome, ${userInfo.username}!`, 'server');
          addChatMessage(`You are in ${initialSector.name || 'an unknown location'}.`, 'server');
        })
        .catch(error => {
          console.error('Error loading sector:', error);
          addChatMessage('Error loading map sector. Please refresh.', 'server');
        });
    } else {
      console.error('No sectors found in world data');
      addChatMessage('Error: No map sectors found. Please contact an administrator.', 'server');
    }
  })
  .catch(error => {
    console.error('Error loading game data:', error);
    addChatMessage('Error loading game data. Please refresh.', 'server');
  });
  
  // Set up event listeners
  setupEventListeners();
}

// Load a sector by filename
async function loadSector(filename) {
  // Check if sector is already loaded in cache
  if (gameState.sectors.has(filename)) {
    return gameState.sectors.get(filename);
  }
  
  // Load sector from server
  try {
    const response = await fetch(`/api/sector/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load sector: ${response.status} ${response.statusText}`);
    }
    
    const sectorData = await response.json();
    gameState.sectors.set(filename, sectorData); // Cache the sector
    return sectorData;
  } catch (error) {
    console.error('Error loading sector:', error);
    throw error;
  }
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
  if (!gameState.currentSector || !gameState.currentSector.layers || !gameState.currentSector.layers.length) {
    console.error('Map data not properly loaded');
    return;
  }
  
  // Find walkable tiles from the current sector
  const walkableTiles = [];
  const groundLayer = gameState.currentSector.layers[0]; // Assuming first layer is ground
  
  for (const tile of groundLayer) {
    const x = tile.x;
    const y = tile.y;
    const itemId = tile.itemId;
    
    // Find the item for this tile
    const item = gameState.items.find(item => item.id === itemId);
    
    // Filter for good spawn positions - walkable grass tiles only
    if (item && item.properties && item.properties.walkable) {
      // Skip water borders and other non-ideal spawn points
      if (item.name && (item.name.toLowerCase().includes('grass') || item.name.toLowerCase() === 'ground')) {
        walkableTiles.push({ x, y });
      }
    }
  }
  
  // If no grass/ground tiles found, use any walkable tile
  if (walkableTiles.length === 0) {
    for (const tile of groundLayer) {
      const item = gameState.items.find(item => item.id === tile.itemId);
      if (item && item.properties && item.properties.walkable) {
        walkableTiles.push({ x: tile.x, y: tile.y });
      }
    }
  }
  
  // Place player on a random walkable tile
  if (walkableTiles.length > 0) {
    const randomTile = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
    gameState.player.x = randomTile.x;
    gameState.player.y = randomTile.y;
    
    // Debug info
    console.log(`Player placed at walkable tile (${gameState.player.x}, ${gameState.player.y})`);
    
    // Center viewport on player
    centerViewportOnPlayer();
  } else {
    console.error('No walkable tiles found');
    // Fallback to a fixed position
    gameState.player.x = 10;
    gameState.player.y = 10;
    centerViewportOnPlayer();
  }
}

// Center viewport on player
function centerViewportOnPlayer() {
  // The player should be at the center of the viewport
  gameState.viewport.x = Math.max(0, gameState.player.x - Math.floor(gameState.viewport.width / 2));
  gameState.viewport.y = Math.max(0, gameState.player.y - Math.floor(gameState.viewport.height / 2));
  
  // Keep viewport within sector bounds
  constrainViewport();
}

// Constrain viewport to sector bounds
function constrainViewport() {
  if (!gameState.currentSector) return;
  
  gameState.viewport.x = Math.max(0, gameState.viewport.x);
  gameState.viewport.y = Math.max(0, gameState.viewport.y);
  
  const maxX = gameState.currentSector.width - gameState.viewport.width;
  const maxY = gameState.currentSector.height - gameState.viewport.height;
  
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

// Handle player movement based on keyboard input
function handlePlayerMovement() {
  // Check if enough time has passed since the last move
  const currentTime = Date.now();
  if (currentTime - gameState.player.lastMoveTime < gameState.player.moveDelay) {
    return; // Skip this frame if we're still in cooldown
  }
  
  // Store original position for collision detection
  const originalX = gameState.player.x;
  const originalY = gameState.player.y;
  
  // Calculate new position based on keyboard input
  let newX = originalX;
  let newY = originalY;
  let moved = false;
  
  if (gameState.keyboard.up) {
    newY--;
    gameState.player.direction = 'north';
    moved = true;
  } else if (gameState.keyboard.down) {
    newY++;
    gameState.player.direction = 'south';
    moved = true;
  } else if (gameState.keyboard.left) {
    newX--;
    gameState.player.direction = 'west';
    moved = true;
  } else if (gameState.keyboard.right) {
    newX++;
    gameState.player.direction = 'east';
    moved = true;
  }
  
  // If no movement input, return early
  if (!moved) {
    return;
  }
  
  // Check if the player needs to move to a different sector
  const sectorChange = needSectorChange(newX, newY);
  if (sectorChange) {
    handleSectorChange(newX, newY);
    gameState.player.lastMoveTime = currentTime; // Update last move time
    return; // Skip the rest of the movement handling since we're changing sectors
  }
  
  // Check if the new position is walkable
  if (isTileWalkable(newX, newY)) {
    // Update player position
    gameState.player.x = newX;
    gameState.player.y = newY;
    
    // Center viewport on player
    centerViewportOnPlayer();
    
    // Update last move time
    gameState.player.lastMoveTime = currentTime;
  }
}

// Check if player is moving to a different sector
function needSectorChange(x, y) {
  if (!gameState.currentSector) return false;
  
  // Check if player is at a sector boundary
  return (
    x < 0 || 
    y < 0 || 
    x >= gameState.currentSector.width || 
    y >= gameState.currentSector.height
  );
}

// Handle sector change
function handleSectorChange(x, y) {
  if (!gameState.worldData || !gameState.worldData.sectors) return;
  
  // Find the current sector in world data
  const currentSectorData = gameState.worldData.sectors.find(
    s => s.coordinates.x === gameState.activeSectorCoords.x && 
         s.coordinates.y === gameState.activeSectorCoords.y
  );
  
  if (!currentSectorData || !currentSectorData.connections) {
    console.error('Current sector or connections not found');
    return;
  }
  
  // Determine which direction the player is moving
  let direction;
  
  if (x < 0) direction = 'west';
  else if (x >= gameState.currentSector.width) direction = 'east';
  else if (y < 0) direction = 'north';
  else if (y >= gameState.currentSector.height) direction = 'south';
  
  // Check if there's a connection in that direction
  if (!currentSectorData.connections[direction]) {
    console.log(`No connection found in direction: ${direction}`);
    return;
  }
  
  // Get target sector coordinates
  const targetSectorCoords = currentSectorData.connections[direction].targetSector;
  
  // Find target sector in world data
  const targetSectorData = gameState.worldData.sectors.find(
    s => s.coordinates.x === targetSectorCoords.x && 
         s.coordinates.y === targetSectorCoords.y
  );
  
  if (!targetSectorData) {
    console.error(`Target sector not found at coordinates: ${targetSectorCoords.x}, ${targetSectorCoords.y}`);
    return;
  }
  
  // Load the target sector
  loadSector(targetSectorData.filename)
    .then(sectorData => {
      // Update current sector data
      gameState.currentSector = sectorData;
      gameState.activeSectorCoords = targetSectorCoords;
      
      // Set player position in new sector
      const exitPoint = currentSectorData.connections[direction].exitPoint;
      if (exitPoint) {
        gameState.player.x = exitPoint.x;
        gameState.player.y = exitPoint.y;
      } else {
        // Default positions if exit point not specified
        switch (direction) {
          case 'west':
            gameState.player.x = gameState.currentSector.width - 1;
            break;
          case 'east':
            gameState.player.x = 0;
            break;
          case 'north':
            gameState.player.y = gameState.currentSector.height - 1;
            break;
          case 'south':
            gameState.player.y = 0;
            break;
        }
      }
      
      // Center viewport on player in new sector
      centerViewportOnPlayer();
      
      // Notify player
      addChatMessage(`You have entered ${targetSectorData.name || 'a new area'}.`, 'server');
    })
    .catch(error => {
      console.error('Error loading target sector:', error);
      addChatMessage('Error changing areas. Please try again.', 'server');
    });
}

// Check if the tile at the given coordinates is walkable
function isTileWalkable(x, y) {
  // Check map boundaries
  if (x < 0 || y < 0 || 
      x >= gameState.currentSector.width || 
      y >= gameState.currentSector.height) {
    return false;
  }
  
  // Check for blocking items on all layers
  for (let layerIndex = 0; layerIndex < gameState.currentSector.layers.length; layerIndex++) {
    const layer = gameState.currentSector.layers[layerIndex];
    
    // Find items on this tile
    for (const tile of layer) {
      if (tile.x === x && tile.y === y) {
        // Get the item data
        const item = gameState.items.find(item => item.id === tile.itemId);
        
        // If the item is blocking, this tile is not walkable
        if (item && item.properties && item.properties.blocking) {
          return false;
        }
      }
    }
  }
  
  // Check if there's at least one walkable tile
  let hasWalkableTile = false;
  for (const tile of gameState.currentSector.layers[0]) { // Check ground layer
    if (tile.x === x && tile.y === y) {
      const item = gameState.items.find(item => item.id === tile.itemId);
      if (item && item.properties && item.properties.walkable) {
        hasWalkableTile = true;
        break;
      }
    }
  }
  
  return hasWalkableTile;
}

// Render game
function render() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (!gameState.currentSector || !gameState.items) return;
  
  // Render map layers
  renderMap();
  
  // Render player
  renderPlayer();
}

// Render map layers
function renderMap() {
  // Don't render if sector data or tileset image isn't loaded
  if (!gameState.currentSector || !tilesetImage.complete) return;
  
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Render each layer
  for (let layerIndex = 0; layerIndex < gameState.currentSector.layers.length; layerIndex++) {
    const layer = gameState.currentSector.layers[layerIndex];
    
    // Skip empty layers
    if (!layer || layer.length === 0) continue;
    
    // Render each tile in the layer
    for (const tile of layer) {
      // Calculate screen position
      const screenX = (tile.x - gameState.viewport.x) * gameState.tileSize;
      const screenY = (tile.y - gameState.viewport.y) * gameState.tileSize;
      
      // Skip rendering if outside viewport
      if (screenX < -gameState.tileSize || screenY < -gameState.tileSize ||
          screenX > canvas.width || screenY > canvas.height) {
        continue;
      }
      
      // Find the item data for this tile
      const item = gameState.items.find(item => item.id === tile.itemId);
      if (!item) continue;
      
      // Handle animated items
      if (item.animated && item.sprites && item.sprites.length > 0) {
        // Calculate animation frame
        const frameInterval = item.animationSpeed || 1000;
        const frameCount = item.sprites.length;
        const frameIndex = Math.floor((Date.now() % (frameInterval * frameCount)) / frameInterval);
        const sprite = item.sprites[frameIndex];
        
        // Draw the sprite
        ctx.drawImage(
          tilesetImage,
          sprite.x * 32, sprite.y * 32, 32, 32,
          screenX, screenY, gameState.tileSize, gameState.tileSize
        );
      } 
      // Handle items with single sprite
      else if (item.sprite) {
        ctx.drawImage(
          tilesetImage,
          item.sprite.x * 32, item.sprite.y * 32, 32, 32,
          screenX, screenY, gameState.tileSize, gameState.tileSize
        );
      }
      // Handle items with multiple sprites (non-animated)
      else if (item.sprites && item.sprites.length > 0) {
        const sprite = item.sprites[0]; // Use the first sprite
        ctx.drawImage(
          tilesetImage,
          sprite.x * 32, sprite.y * 32, 32, 32,
          screenX, screenY, gameState.tileSize, gameState.tileSize
        );
      }
    }
  }
}

// Render the player character
function renderPlayer() {
  // Don't render if player data or tileset image isn't loaded
  if (!gameState.player || !tilesetImage.complete || !gameState.outfits) return;
  
  // Calculate screen position (player should be at center of screen)
  const playerScreenX = (gameState.player.x - gameState.viewport.x) * gameState.tileSize;
  const playerScreenY = (gameState.player.y - gameState.viewport.y) * gameState.tileSize;
  
  // Find the player's outfit
  const outfit = gameState.outfits.find(outfit => outfit.id === gameState.player.outfit);
  if (!outfit) return;
  
  // Draw the player
  if (outfit.type === 'full') {
    // Single sprite outfit
    ctx.drawImage(
      tilesetImage,
      outfit.baseSprite.x * 32, outfit.baseSprite.y * 32, 32, 32,
      playerScreenX, playerScreenY, gameState.tileSize, gameState.tileSize
    );
  } else if (outfit.type === 'both' && outfit.baseSprite) {
    // Draw the base outfit
    ctx.drawImage(
      tilesetImage,
      outfit.baseSprite.x * 32, outfit.baseSprite.y * 32, 32, 32,
      playerScreenX, playerScreenY, gameState.tileSize, gameState.tileSize
    );
    
    // Draw addons if they exist
    if (outfit.addons) {
      // Draw armor
      if (outfit.addons.armor) {
        ctx.drawImage(
          tilesetImage,
          outfit.addons.armor.x * 32, outfit.addons.armor.y * 32, 32, 32,
          playerScreenX, playerScreenY, gameState.tileSize, gameState.tileSize
        );
      }
      
      // Draw weapons/items in hands
      if (outfit.addons.leftHand) {
        ctx.drawImage(
          tilesetImage,
          outfit.addons.leftHand.x * 32, outfit.addons.leftHand.y * 32, 32, 32,
          playerScreenX, playerScreenY, gameState.tileSize, gameState.tileSize
        );
      }
      
      if (outfit.addons.rightHand) {
        ctx.drawImage(
          tilesetImage,
          outfit.addons.rightHand.x * 32, outfit.addons.rightHand.y * 32, 32, 32,
          playerScreenX, playerScreenY, gameState.tileSize, gameState.tileSize
        );
      }
    }
  }
  
  // Draw player name above the character
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.font = '12px Arial';
  ctx.fillText(gameState.player.name, playerScreenX + (gameState.tileSize / 2), playerScreenY - 5);
  
  // Draw health bar
  const healthBarWidth = gameState.tileSize;
  const healthBarHeight = 3;
  const healthPercentage = gameState.player.health / gameState.player.maxHealth;
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(playerScreenX, playerScreenY - 15, healthBarWidth, healthBarHeight);
  
  // Health fill
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.fillRect(playerScreenX, playerScreenY - 15, healthBarWidth * healthPercentage, healthBarHeight);
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
function gameLoop(timestamp) {
  // Calculate delta time for smooth movement
  if (!gameState.lastFrameTime) {
    gameState.lastFrameTime = timestamp;
  }
  gameState.deltaTime = timestamp - gameState.lastFrameTime;
  gameState.lastFrameTime = timestamp;
  
  // Handle input
  handlePlayerMovement();
  
  // Update stats display
  updateStatsDisplay();
  
  // Render game
  render();
  
  // Schedule next frame
  requestAnimationFrame(gameLoop);
}

// Helper function to find item at specific tile
function findItemAtTile(x, y) {
  if (!gameState.currentSector || !gameState.currentSector.layers || !gameState.items) return null;
  
  // Check ground layer first
  const groundLayer = gameState.currentSector.layers[0];
  
  for (const tile of groundLayer) {
    if (tile.x === x && tile.y === y) {
      return gameState.items.find(item => item.id === tile.itemId);
    }
  }
  
  return null;
}

// Start the game when the page loads
window.addEventListener('load', init); 