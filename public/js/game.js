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
  inDungeon: false,      // Flag to indicate if player is in a dungeon
  currentDungeon: null,  // Stores the current dungeon data
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
      strength: 1,
      defense: 1,
      dexterity: 1,
      agility: 1,
      intelligence: 1,
      luck: 1
    },
    skills: {
      melee: 1,
      distance: 1,
      magic: 1
    },
    // Equipment property
    equipment: {
      SLOT_NECKLACE: null,
      SLOT_HEAD: null, 
      SLOT_BACKPACK: null,
      SLOT_LEFTHAND: null,
      SLOT_ARMOR: null,
      SLOT_RIGHTHAND: null,
      SLOT_LEFTRING: null,
      SLOT_WINGS: null,
      SLOT_RIGHTRING: null
    },
    // Player's backpack inventory (4 slots)
    inventory: [null, null, null, null],
    selectedInventorySlot: -1 // -1 means no slot selected
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

// Dungeon Generator Module
const dungeonGenerator = {
  // Dungeon state storage
  dungeons: new Map(), // Map of player name -> dungeonData
  
  // Generate a new dungeon for the player
  generateDungeon: function(size = 100, roomSizeMin = 3, roomSizeMax = 9) {
    // Create the basic dungeon structure with rooms and corridors
    const dungeon = this._generateBasicDungeon(size, roomSizeMin, roomSizeMax);
    
    // Populate with monsters and loot
    this.populateDungeon(dungeon);
    
    // Store the dungeon and return it
    this.dungeons.set(gameState.player.name, dungeon);
    return dungeon;
  },
  
  // Check if two rooms overlap (including buffer space)
  checkRoomOverlap: function(roomA, roomB, buffer = 1) {
    return !(
      roomA.x + roomA.width + buffer < roomB.x ||
      roomB.x + roomB.width + buffer < roomA.x ||
      roomA.y + roomA.height + buffer < roomB.y ||
      roomB.y + roomB.height + buffer < roomA.y
    );
  },
  
  // Create a corridor between two points
  createCorridor: function(dungeon, x1, y1, x2, y2) {
    // Decide randomly whether to go horizontal first or vertical first
    const horizontalFirst = Math.random() >= 0.5;
    
    // Current position
    let currentX = x1;
    let currentY = y1;
    
    if (horizontalFirst) {
      // Move horizontally first, then vertically
      while (currentX !== x2) {
        currentX += currentX < x2 ? 1 : -1;
        this.setFloorTile(dungeon, currentX, currentY);
      }
      
      while (currentY !== y2) {
        currentY += currentY < y2 ? 1 : -1;
        this.setFloorTile(dungeon, currentX, currentY);
      }
    } else {
      // Move vertically first, then horizontally
      while (currentY !== y2) {
        currentY += currentY < y2 ? 1 : -1;
        this.setFloorTile(dungeon, currentX, currentY);
      }
      
      while (currentX !== x2) {
        currentX += currentX < x2 ? 1 : -1;
        this.setFloorTile(dungeon, currentX, currentY);
      }
    }
  },
  
  // Set a tile to floor (cobble floor - itemId 27)
  setFloorTile: function(dungeon, x, y) {
    // Find and replace the wall tile with floor
    const tileIndex = dungeon.layers[0].findIndex(
      tile => tile.x === x && tile.y === y
    );
    
    if (tileIndex !== -1) {
      dungeon.layers[0][tileIndex].itemId = 27; // Cobble floor
    } else {
      // Add new floor tile if not found
      dungeon.layers[0].push({
        x,
        y,
        itemId: 27
      });
    }
  },
  
  // Get player's current dungeon
  getPlayerDungeon: function() {
    return this.dungeons.get(gameState.player.name);
  },
  
  // Serialize the dungeon for saving
  serializeDungeon: function(dungeon) {
    return JSON.stringify(dungeon);
  },
  
  // Deserialize a dungeon from storage
  deserializeDungeon: function(serializedDungeon) {
    return JSON.parse(serializedDungeon);
  },
  
  // Add monsters and loot to a dungeon
  populateDungeon: function(dungeon) {
    if (!dungeon || !dungeon.rooms || dungeon.rooms.length === 0) {
      return dungeon;
    }
    
    // Set the danger level based on dungeon level
    const dungeonLevel = dungeon.level || 1;
    const dangerLevel = Math.min(10, dungeonLevel); // Cap at level 10
    
    // Define available monster types based on danger level
    const monsterTypes = [
      { id: 101, name: "Rat", hp: 10, damage: 1, sprite: { x: 10, y: 30 } },
      { id: 102, name: "Skeleton", hp: 20, damage: 3, sprite: { x: 11, y: 30 } },
      { id: 103, name: "Zombie", hp: 30, damage: 5, sprite: { x: 12, y: 30 } },
      { id: 104, name: "Ghoul", hp: 40, damage: 7, sprite: { x: 13, y: 30 } },
      { id: 105, name: "Demon", hp: 60, damage: 10, sprite: { x: 14, y: 30 } }
    ];
    
    // Define available loot items
    const lootItems = [
      { itemId: 69, chance: 0.2 }, // noob staff
      { itemId: 70, chance: 0.2 }  // noob club
    ];
    
    // Calculate number of monsters based on dungeon level
    const monsterCount = Math.min(20, 5 + (dungeonLevel * 2));
    
    // Get available monster types for this level
    const availableMonsters = monsterTypes.filter(
      monster => monster.id <= 100 + dangerLevel
    );
    
    // Create a monsters array if it doesn't exist
    if (!dungeon.monsters) {
      dungeon.monsters = [];
    }
    
    // Create a loot array if it doesn't exist
    if (!dungeon.loot) {
      dungeon.loot = [];
    }
    
    // Place monsters in rooms (except start room and end room)
    const roomsForMonsters = [...dungeon.rooms]
      .filter(room => 
        room !== dungeon.startRoom && 
        room !== dungeon.endRoom
      );
    
    // Determine how many monsters to place per room
    for (let i = 0; i < monsterCount; i++) {
      // Pick a random room
      if (roomsForMonsters.length === 0) break;
      const roomIndex = Math.floor(Math.random() * roomsForMonsters.length);
      const room = roomsForMonsters[roomIndex];
      
      // Pick a random position within the room
      const monsterX = Math.floor(Math.random() * (room.width - 2)) + room.x + 1;
      const monsterY = Math.floor(Math.random() * (room.height - 2)) + room.y + 1;
      
      // Pick a random monster type appropriate for this level
      const monsterType = availableMonsters[
        Math.floor(Math.random() * availableMonsters.length)
      ];
      
      // Scale monster stats based on dungeon level
      const levelMultiplier = 1 + ((dungeonLevel - 1) * 0.2); // +20% per level
      
      // Create monster instance
      const monster = {
        ...monsterType,
        x: monsterX,
        y: monsterY,
        hp: Math.floor(monsterType.hp * levelMultiplier),
        maxHp: Math.floor(monsterType.hp * levelMultiplier),
        damage: Math.floor(monsterType.damage * levelMultiplier)
      };
      
      // Add monster to dungeon
      dungeon.monsters.push(monster);
      
      // Add monster to the object layer
      if (dungeon.layers[1]) {
        dungeon.layers[1].push({
          x: monsterX,
          y: monsterY,
          itemId: monster.id,
          isMonster: true,
          monsterId: dungeon.monsters.length - 1 // Index of this monster in the monsters array
        });
      }
    }
    
    // Place loot in some rooms
    for (const room of dungeon.rooms) {
      // Skip start and end rooms for loot
      if (room === dungeon.startRoom || room === dungeon.endRoom) {
        continue;
      }
      
      // 30% chance per room to place loot, adjusted by dungeon level
      const lootChance = 0.3 + (dungeonLevel * 0.05); // +5% per level
      
      if (Math.random() < lootChance) {
        // Pick a random loot item
        const lootItem = lootItems[Math.floor(Math.random() * lootItems.length)];
        
        // Only place if random check passes
        if (Math.random() < lootItem.chance) {
          // Place in random position within room
          const lootX = Math.floor(Math.random() * (room.width - 2)) + room.x + 1;
          const lootY = Math.floor(Math.random() * (room.height - 2)) + room.y + 1;
          
          // Add loot to the object layer
          if (dungeon.layers[1]) {
            dungeon.layers[1].push({
              x: lootX,
              y: lootY,
              itemId: lootItem.itemId,
              isLoot: true
            });
          }
          
          // Add to loot array
          dungeon.loot.push({
            x: lootX,
            y: lootY,
            itemId: lootItem.itemId
          });
        }
      }
    }
    
    return dungeon;
  },
  
  // Rename the existing generateDungeon function to _generateBasicDungeon
  _generateBasicDungeon: function(size = 100, roomSizeMin = 3, roomSizeMax = 9) {
    // Original generateDungeon implementation here
    // Create empty dungeon grid (fill with walls - itemId 11)
    const dungeon = {
      width: size,
      height: size,
      layers: [[], [], []],  // Ground, Objects, Upper layers
      name: `${gameState.player.name}'s Dungeon`,
      level: 1,
      roomCount: 0,
      rooms: [],
      startRoom: null,
      endRoom: null
    };
    
    // Fill the ground layer with walls
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        // Add stone wall (itemId 11) to the entire map
        if (x === 0 || y === 0 || x === size - 1 || y === size - 1) {
          // Edge walls
          dungeon.layers[0].push({
            x,
            y,
            itemId: 11
          });
        } else {
          // Inner area (also walls initially)
          dungeon.layers[0].push({
            x,
            y,
            itemId: 11
          });
        }
      }
    }
    
    // Generate rooms
    const rooms = [];
    const maxRooms = 20;
    let attempts = 0;
    
    while (rooms.length < maxRooms && attempts < 200) {
      attempts++;
      
      // Random room size
      const width = Math.floor(Math.random() * (roomSizeMax - roomSizeMin + 1)) + roomSizeMin;
      const height = Math.floor(Math.random() * (roomSizeMax - roomSizeMin + 1)) + roomSizeMin;
      
      // Random position (avoid edges)
      const x = Math.floor(Math.random() * (size - width - 2)) + 1;
      const y = Math.floor(Math.random() * (size - height - 2)) + 1;
      
      // Create room object
      const newRoom = {
        x,
        y,
        width,
        height,
        center: {
          x: Math.floor(x + width / 2),
          y: Math.floor(y + height / 2)
        },
        connects: []
      };
      
      // Check for room overlap
      let overlaps = false;
      for (const room of rooms) {
        if (this.checkRoomOverlap(newRoom, room)) {
          overlaps = true;
          break;
        }
      }
      
      // If no overlap, add the room
      if (!overlaps) {
        rooms.push(newRoom);
        
        // Carve out the room - replace walls with floors
        for (let rx = 0; rx < width; rx++) {
          for (let ry = 0; ry < height; ry++) {
            const mapX = x + rx;
            const mapY = y + ry;
            
            // Find and replace the wall tile with floor (cobble floor - itemId 27)
            const tileIndex = dungeon.layers[0].findIndex(
              tile => tile.x === mapX && tile.y === mapY
            );
            
            if (tileIndex !== -1) {
              dungeon.layers[0][tileIndex].itemId = 27; // Cobble floor
            } else {
              // Add new floor tile if not found
              dungeon.layers[0].push({
                x: mapX,
                y: mapY,
                itemId: 27
              });
            }
          }
        }
      }
    }
    
    // Connect the rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
      const roomA = rooms[i];
      const roomB = rooms[i + 1];
      
      // Connect the centers of the rooms
      this.createCorridor(dungeon, roomA.center.x, roomA.center.y, roomB.center.x, roomB.center.y);
      
      // Mark the rooms as connected
      roomA.connects.push(i + 1);
      roomB.connects.push(i);
    }
    
    // Place stairs in the first and last room
    if (rooms.length > 0) {
      // Entrance stairs in the first room (itemId 12 - up stairs)
      const entranceRoom = rooms[0];
      const entranceX = entranceRoom.center.x;
      const entranceY = entranceRoom.center.y;
      
      // Replace floor with entrance stairs
      const entranceTileIndex = dungeon.layers[0].findIndex(
        tile => tile.x === entranceX && tile.y === entranceY
      );
      
      if (entranceTileIndex !== -1) {
        dungeon.layers[0][entranceTileIndex].itemId = 12; // Entrance stairs (up)
      }
      
      // Exit stairs in the last room (itemId 13 - down stairs)
      const exitRoom = rooms[rooms.length - 1];
      const exitX = exitRoom.center.x;
      const exitY = exitRoom.center.y;
      
      // Replace floor with exit stairs
      const exitTileIndex = dungeon.layers[0].findIndex(
        tile => tile.x === exitX && tile.y === exitY
      );
      
      if (exitTileIndex !== -1) {
        dungeon.layers[0][exitTileIndex].itemId = 13; // Exit stairs (down)
      }
      
      // Store rooms data
      dungeon.rooms = rooms;
      dungeon.roomCount = rooms.length;
      dungeon.startRoom = entranceRoom;
      dungeon.endRoom = exitRoom;
    }
    
    return dungeon;
  }
};

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
          
          // Add dungeon entrance at position 12,5
          placeDungeonEntrance();
          
          // Add test items around the player
          placeTestItems();
          
          // Start game loop
          gameLoop();
          
          // Initialize equipment slots display
          initInventorySystem();
          
          // Add chat messages
          addChatMessage('Welcome to MSRE RPG!', 'server');
          addChatMessage(`Welcome, ${userInfo.username}!`, 'server');
          addChatMessage(`You are in ${initialSector.name || 'an unknown location'}.`, 'server');
          addChatMessage('Press SPACE to pick up items on the ground.', 'server');
          addChatMessage('Press 1-4 to select inventory slots, E to use selected item, Q to drop it.', 'server');
          addChatMessage('Try exploring around position (12,5) to find a dungeon entrance.', 'server');
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
  // Keyboard event listeners
  document.addEventListener('keydown', (e) => {
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
      case 'i': // 'i' key to toggle inventory
        toggleInventory();
        break;
      case ' ': // Space bar to pick up items or interact with dungeon entrance
        if (isAtDungeonEntrance()) {
          showDungeonPrompt();
        } else {
          pickupItem();
        }
        break;
      case 'e': // 'e' key to use selected item
        useSelectedItem();
        break;
      case 'q': // 'q' key to drop selected item
        dropSelectedItem();
        break;
      case '1': // Number keys to select inventory slots
      case '2':
      case '3':
      case '4':
        const slotIndex = parseInt(e.key) - 1;
        handleInventorySlotClick(slotIndex);
        break;
    }
  });
  
  document.addEventListener('keyup', (e) => {
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
  
  // Chat input
  sendButton.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
  
  // Chat tabs
  chatTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      chatTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Set active chat channel
      gameState.activeChat = tab.getAttribute('data-channel');
    });
  });
  
  // Inventory toggle button
  const toggleInventoryBtn = document.getElementById('toggleInventoryBtn');
  if (toggleInventoryBtn) {
    toggleInventoryBtn.addEventListener('click', toggleInventory);
  }
}

// Toggle inventory visibility
function toggleInventory() {
  const inventoryWindow = document.querySelector('.inventory-window');
  if (inventoryWindow) {
    // Get current display state (accounting for empty style.display)
    const currentDisplay = inventoryWindow.style.display === 'none' ? 'none' : 
                          (inventoryWindow.style.display === '' ? 'block' : inventoryWindow.style.display);
    
    // Toggle visibility based on current state
    if (currentDisplay === 'none') {
      // Show inventory
      inventoryWindow.style.display = 'block';
      
      // Add bounce animation
      inventoryWindow.classList.add('inventory-bounce');
      setTimeout(() => {
        inventoryWindow.classList.remove('inventory-bounce');
      }, 300);
      
      // Ensure it's positioned correctly if it's the first time opening
      if (!inventoryWindow.style.left) {
        // Center in the game window
        const gameWindow = document.querySelector('.game-window');
        if (gameWindow) {
          const gameRect = gameWindow.getBoundingClientRect();
          const invWidth = inventoryWindow.offsetWidth;
          const invHeight = inventoryWindow.offsetHeight;
          
          const centerX = gameRect.left + (gameRect.width / 2) - (invWidth / 2);
          const centerY = gameRect.top + (gameRect.height / 2) - (invHeight / 2);
          
          inventoryWindow.style.left = `${centerX}px`;
          inventoryWindow.style.top = `${centerY}px`;
          inventoryWindow.style.right = 'auto';
        }
      }
      
      addChatMessage('Inventory opened', 'game');
    } else {
      inventoryWindow.style.display = 'none';
      addChatMessage('Inventory closed', 'game');
    }
  }
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
    
    // Skip if the layer doesn't exist
    if (!layer) continue;
    
    // Find items on this tile
    for (const tile of layer) {
      if (tile.x === x && tile.y === y) {
        // Get the item data
        const item = gameState.items.find(item => item.id === tile.itemId);
        
        // If the item is blocking, this tile is not walkable
        if (item && item.properties && item.properties.blocking) {
          return false;
        }
        
        // Special handling for dungeon entrance in the overworld
        if (
          !gameState.inDungeon && 
          gameState.activeSectorCoords.x === 0 && 
          gameState.activeSectorCoords.y === 0 && 
          x === 12 && 
          y === 5 && 
          tile.itemId === 13
        ) {
          // Dungeon entrance is walkable but we'll prompt the player
          return true;
        }
        
        // Check for stairs and handle dungeon navigation if the player steps on them
        if (item && gameState.inDungeon) {
          if (item.id === 13) { // Down stairs in dungeon - go deeper
            setTimeout(() => {
              goToDeeperDungeonLevel();
            }, 500); // Small delay to make movement feel better
          } else if (item.id === 12) { // Up stairs in dungeon - exit dungeon
            setTimeout(() => {
              exitDungeon();
            }, 500); // Small delay to make movement feel better
          }
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
  
  // Render dungeon level information if in a dungeon
  if (gameState.inDungeon && gameState.currentDungeon) {
    // Draw dungeon level info at the top right corner
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(canvas.width - 150, 10, 140, 30);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Dungeon Level ${gameState.currentDungeon.level}`, 
      canvas.width - 80, 
      30
    );
  }
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
  
  // Determine direction offset based on player direction
  let directionOffset = 0;
  switch (gameState.player.direction) {
    case 'north':
      directionOffset = 3 * 32; // 3rd sprite in row
      break;
    case 'east':
      directionOffset = 2 * 32; // 2nd sprite in row
      break;
    case 'south':
      directionOffset = 0; // 1st sprite in row
      break;
    case 'west':
      directionOffset = 1 * 32; // 4th sprite in row
      break;
  }
  
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
      // Use the equipped items to determine which addons to draw
      
      // Armor addon
      if (outfit.addons.armor && gameState.player.equipment.SLOT_ARMOR) {
        ctx.drawImage(
          tilesetImage,
          outfit.addons.armor.x * 32, outfit.addons.armor.y * 32, 32, 32,
          playerScreenX, playerScreenY, gameState.tileSize, gameState.tileSize
        );
      }
      
      // Left hand addon
      if (outfit.addons.leftHand && gameState.player.equipment.SLOT_LEFTHAND) {
        ctx.drawImage(
          tilesetImage,
          outfit.addons.leftHand.x * 32, outfit.addons.leftHand.y * 32, 32, 32,
          playerScreenX, playerScreenY, gameState.tileSize, gameState.tileSize
        );
      }
      
      // Right hand addon
      if (outfit.addons.rightHand && gameState.player.equipment.SLOT_RIGHTHAND) {
        ctx.drawImage(
          tilesetImage,
          outfit.addons.rightHand.x * 32, outfit.addons.rightHand.y * 32, 32, 32,
          playerScreenX, playerScreenY, gameState.tileSize, gameState.tileSize
        );
      }
      
      // Wings addon
      if (outfit.addons.wings && gameState.player.equipment.SLOT_WINGS) {
        ctx.drawImage(
          tilesetImage,
          outfit.addons.wings.x * 32, outfit.addons.wings.y * 32, 32, 32,
          playerScreenX, playerScreenY, gameState.tileSize, gameState.tileSize
        );
      }
      
      // Head addon
      if (outfit.addons.head && gameState.player.equipment.SLOT_HEAD) {
        ctx.drawImage(
          tilesetImage,
          outfit.addons.head.x * 32, outfit.addons.head.y * 32, 32, 32,
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
  
  // Process player movement
  handlePlayerMovement();
  
  // Render the game
  render();
  
  // Update stats display
  updateStatsDisplay();
  
  // Update equipment display occasionally (not needed every frame)
  if (timestamp % 1000 < 20) {
    updateAllEquipmentSlots();
  }
  
  // Request next frame
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

// Initialize inventory system
function initInventorySystem() {
  // Get all equipment slots
  const equipmentSlots = document.querySelectorAll('.equipment-slot');
  
  // Add click event listener to each slot
  equipmentSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      // For demo purposes, let's just equip a random item that fits in this slot
      const slotType = slot.getAttribute('data-slot');
      tryEquipRandomItem(slotType);
    });
    
    // Initialize tooltips with default content
    slot.querySelector('.tooltip').textContent = getSlotName(slot.getAttribute('data-slot'));
  });
  
  // Initialize inventory slots
  initInventorySlots();
  
  // Make inventory visible by default
  const inventoryWindow = document.querySelector('.inventory-window');
  if (inventoryWindow) {
    inventoryWindow.style.display = 'block';
  }
  
  // Setup draggable inventory
  setupDraggableInventory();
  
  // Update equipment stats display
  updateEquipmentStats();
  
  // Show initial message about inventory
  addChatMessage('Press I or click the Inventory button to toggle inventory', 'server');
  addChatMessage('You can drag the inventory window by its header', 'server');
}

// Initialize inventory slots
function initInventorySlots() {
  const inventorySlots = document.querySelectorAll('.inventory-slot');
  
  // Add click event listener to each inventory slot
  inventorySlots.forEach(slot => {
    slot.addEventListener('click', () => {
      const slotIndex = parseInt(slot.getAttribute('data-index'));
      handleInventorySlotClick(slotIndex);
    });
  });
  
  // Update inventory UI
  updateInventoryUI();
}

// Handle inventory slot click
function handleInventorySlotClick(slotIndex) {
  // If the slot is empty, nothing to do
  if (!gameState.player.inventory[slotIndex]) {
    // Deselect any currently selected slot
    gameState.player.selectedInventorySlot = -1;
    updateInventoryUI();
    return;
  }
  
  // If the slot was already selected, deselect it
  if (gameState.player.selectedInventorySlot === slotIndex) {
    gameState.player.selectedInventorySlot = -1;
    addChatMessage(`Item deselected`, 'game');
  } else {
    // Select the slot
    gameState.player.selectedInventorySlot = slotIndex;
    const item = gameState.player.inventory[slotIndex];
    addChatMessage(`Selected ${item.name}`, 'game');
  }
  
  // Update the UI
  updateInventoryUI();
}

// Update the inventory UI
function updateInventoryUI() {
  const inventorySlots = document.querySelectorAll('.inventory-slot');
  
  // Update each inventory slot with the corresponding item
  inventorySlots.forEach(slot => {
    const slotIndex = parseInt(slot.getAttribute('data-index'));
    const item = gameState.player.inventory[slotIndex];
    
    // Clear existing content except tooltip
    while (slot.firstChild) {
      if (slot.firstChild.className === 'tooltip') {
        break;
      }
      slot.removeChild(slot.firstChild);
    }
    
    // Reset active state
    slot.classList.remove('active');
    
    // Mark active slot if selected
    if (slotIndex === gameState.player.selectedInventorySlot) {
      slot.classList.add('active');
    }
    
    if (item) {
      // Create image element for the item
      const itemImage = document.createElement('div');
      itemImage.style.width = '32px';
      itemImage.style.height = '32px';
      itemImage.style.background = `url('/tileset.png')`;
      
      // Use the item sprite for display in inventory
      if (item.sprite) {
        itemImage.style.backgroundPosition = `-${item.sprite.x * 32}px -${item.sprite.y * 32}px`;
      } else if (item.sprites && item.sprites.length > 0) {
        // If item has multiple sprites, use the first one
        itemImage.style.backgroundPosition = `-${item.sprites[0].x * 32}px -${item.sprites[0].y * 32}px`;
      }
      
      slot.prepend(itemImage);
      
      // Update tooltip with item info
      const tooltip = slot.querySelector('.tooltip');
      if (tooltip) {
        tooltip.textContent = item.name;
        
        // Add stats info if available
        let statsText = '';
        if (item.attack) statsText += ` Atk:${item.attack}`;
        if (item.defense) statsText += ` Def:${item.defense}`;
        
        if (statsText) {
          tooltip.textContent += ` (${statsText.trim()})`;
        }
      }
    } else {
      // Reset tooltip to default
      const tooltip = slot.querySelector('.tooltip');
      if (tooltip) {
        tooltip.textContent = 'Empty';
      }
    }
  });
}

// Add an item to player's inventory
function addItemToInventory(item) {
  // Find first empty slot
  const emptySlotIndex = gameState.player.inventory.findIndex(slot => slot === null);
  
  if (emptySlotIndex !== -1) {
    // Add item to inventory
    gameState.player.inventory[emptySlotIndex] = item;
    
    // Update UI
    updateInventoryUI();
    
    // Notify player
    addChatMessage(`Added ${item.name} to inventory`, 'game');
    return true;
  } else {
    // Inventory is full
    addChatMessage('Your inventory is full!', 'game');
    return false;
  }
}

// Remove an item from player's inventory
function removeItemFromInventory(slotIndex) {
  if (slotIndex >= 0 && slotIndex < gameState.player.inventory.length) {
    const item = gameState.player.inventory[slotIndex];
    
    if (item) {
      // Remove item from inventory
      gameState.player.inventory[slotIndex] = null;
      
      // If the removed slot was selected, deselect it
      if (gameState.player.selectedInventorySlot === slotIndex) {
        gameState.player.selectedInventorySlot = -1;
      }
      
      // Update UI
      updateInventoryUI();
      
      // Notify player
      addChatMessage(`Removed ${item.name} from inventory`, 'game');
      return item;
    }
  }
  
  return null;
}

// Use the currently selected item
function useSelectedItem() {
  const selectedIndex = gameState.player.selectedInventorySlot;
  
  if (selectedIndex === -1) {
    addChatMessage('No item selected', 'game');
    return;
  }
  
  const item = gameState.player.inventory[selectedIndex];
  
  if (!item) {
    // Should not happen, but just in case
    gameState.player.selectedInventorySlot = -1;
    updateInventoryUI();
    return;
  }
  
  // Check if item is useable
  if (item.properties && item.properties.useable) {
    // Handle item use
    addChatMessage(`Used ${item.name}`, 'game');
    
    // If the item is consumable, remove it from inventory
    if (item.properties.consumable) {
      removeItemFromInventory(selectedIndex);
    }
    
    // Handle item effects
    if (item.effects) {
      applyItemEffects(item.effects);
    }
  } else {
    addChatMessage(`${item.name} cannot be used`, 'game');
  }
}

// Apply item effects
function applyItemEffects(effects) {
  if (effects.health) {
    gameState.player.health = Math.min(
      gameState.player.maxHealth, 
      gameState.player.health + effects.health
    );
    addChatMessage(`Healed ${effects.health} health points`, 'game');
  }
  
  if (effects.mana) {
    gameState.player.mana = Math.min(
      gameState.player.maxMana, 
      gameState.player.mana + effects.mana
    );
    addChatMessage(`Restored ${effects.mana} mana points`, 'game');
  }
  
  // Update stats display
  updateStatsDisplay();
}

// Setup draggable inventory window
function setupDraggableInventory() {
  const inventoryWindow = document.querySelector('.inventory-window');
  const inventoryHeader = document.getElementById('inventoryHeader');
  const closeBtn = document.getElementById('closeInventoryBtn');
  const gameWindow = document.querySelector('.game-window');
  
  if (!inventoryWindow || !inventoryHeader || !gameWindow) return;
  
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  
  // Close button event
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      inventoryWindow.style.display = 'none';
      addChatMessage('Inventory closed', 'game');
    });
  }
  
  // Handle mousedown event on header to start dragging
  inventoryHeader.addEventListener('mousedown', (e) => {
    // Only allow dragging from the header, not the close button
    if (e.target.closest('.close-btn')) return;
    
    isDragging = true;
    
    // Add dragging classes for visual feedback
    inventoryWindow.classList.add('inventory-dragging');
    inventoryHeader.classList.add('dragging');
    
    // Calculate the offset of the mouse pointer from the inventory window's edges
    const rect = inventoryWindow.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    
    // Change cursor while dragging
    document.body.style.cursor = 'move';
    
    // Prevent text selection during drag
    e.preventDefault();
  });
  
  // Handle mousemove event to perform the dragging
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    // Get game window bounds
    const gameRect = gameWindow.getBoundingClientRect();
    const invRect = inventoryWindow.getBoundingClientRect();
    
    // Calculate new position
    let newLeft = e.clientX - dragOffsetX;
    let newTop = e.clientY - dragOffsetY;
    
    // Constrain to game window bounds with a small margin
    const margin = 10;
    
    // Left boundary check
    newLeft = Math.max(newLeft, gameRect.left + margin);
    
    // Right boundary check (make sure at least 50px of inventory is visible)
    const maxLeft = gameRect.right - Math.min(50, invRect.width) - margin;
    newLeft = Math.min(newLeft, maxLeft);
    
    // Top boundary check
    newTop = Math.max(newTop, gameRect.top + margin);
    
    // Bottom boundary check (make sure at least 50px of inventory is visible)
    const maxTop = gameRect.bottom - Math.min(50, invRect.height) - margin;
    newTop = Math.min(newTop, maxTop);
    
    // Apply new position
    inventoryWindow.style.left = `${newLeft}px`;
    inventoryWindow.style.top = `${newTop}px`;
    
    // Remove default positioning
    inventoryWindow.style.right = 'auto';
  });
  
  // Handle mouseup event to stop dragging
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      // Remove dragging classes
      inventoryWindow.classList.remove('inventory-dragging');
      inventoryHeader.classList.remove('dragging');
      
      isDragging = false;
      document.body.style.cursor = 'default';
    }
  });
  
  // Handle ESC key to close inventory
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && inventoryWindow.style.display !== 'none') {
      inventoryWindow.style.display = 'none';
      addChatMessage('Inventory closed', 'game');
    }
  });
}

// Get user-friendly name for a slot
function getSlotName(slotType) {
  const slotNames = {
    'SLOT_NECKLACE': 'Necklace',
    'SLOT_HEAD': 'Helmet',
    'SLOT_BACKPACK': 'Backpack',
    'SLOT_LEFTHAND': 'Left Hand',
    'SLOT_ARMOR': 'Armor',
    'SLOT_RIGHTHAND': 'Right Hand',
    'SLOT_LEFTRING': 'Left Ring',
    'SLOT_WINGS': 'Wings',
    'SLOT_RIGHTRING': 'Right Ring'
  };
  
  return slotNames[slotType] || 'Unknown Slot';
}

// Try to equip a random item (for demo purposes)
function tryEquipRandomItem(slotType) {
  // Find items that fit this slot
  const compatibleItems = gameState.items.filter(item => 
    item.slot === slotType && 
    item.properties && 
    item.properties.pickupable);
  
  if (compatibleItems.length > 0) {
    // Choose a random item from compatible ones
    const randomItem = compatibleItems[Math.floor(Math.random() * compatibleItems.length)];
    
    // Equip the item
    equipItem(randomItem, slotType);
    
    // Show success message
    addChatMessage(`You equipped ${randomItem.name}`, 'game');
  } else {
    // No compatible items found
    addChatMessage(`No items found for ${getSlotName(slotType)}`, 'game');
  }
}

// Equip an item
function equipItem(item, slotType) {
  // Store the item in player's equipment
  gameState.player.equipment[slotType] = item;
  
  // Update the UI
  updateEquipmentSlot(slotType, item);
  
  // Find player outfit and ensure it's of "both" type to support addons
  const outfit = gameState.outfits.find(o => o.id === gameState.player.outfit);
  
  // If current outfit doesn't support addons, change to one that does
  if (!outfit || outfit.type !== 'both') {
    // Find an outfit that supports addons
    const addonOutfit = gameState.outfits.find(o => o.type === 'both');
    if (addonOutfit) {
      gameState.player.outfit = addonOutfit.id;
      addChatMessage(`Changed to outfit that supports equipment`, 'game');
    }
  }
  
  // Update player stats
  updateEquipmentStats();
}

// Update a specific equipment slot in the UI
function updateEquipmentSlot(slotType, item) {
  const slotElement = document.querySelector(`.equipment-slot[data-slot="${slotType}"]`);
  if (!slotElement) return;
  
  // Clear existing content
  while (slotElement.firstChild) {
    if (slotElement.firstChild.className === 'tooltip') {
      break;
    }
    slotElement.removeChild(slotElement.firstChild);
  }
  
  if (item) {
    // Create image element for the item
    const itemImage = document.createElement('div');
    itemImage.style.width = '32px';
    itemImage.style.height = '32px';
    itemImage.style.background = `url('/tileset.png')`;
    
    // Use the item sprite for display in inventory
    if (item.sprite) {
      itemImage.style.backgroundPosition = `-${item.sprite.x * 32}px -${item.sprite.y * 32}px`;
    } else if (item.sprites && item.sprites.length > 0) {
      // If item has multiple sprites, use the first one
      itemImage.style.backgroundPosition = `-${item.sprites[0].x * 32}px -${item.sprites[0].y * 32}px`;
    }
    
    slotElement.prepend(itemImage);
    
    // Update tooltip with item info
    const tooltip = slotElement.querySelector('.tooltip');
    if (tooltip) {
      tooltip.textContent = item.name;
      
      // Add stats info if available
      let statsText = '';
      if (item.attack) statsText += ` Atk:${item.attack}`;
      if (item.defense) statsText += ` Def:${item.defense}`;
      
      if (statsText) {
        tooltip.textContent += ` (${statsText.trim()})`;
      }
    }
  } else {
    // Reset tooltip to default
    const tooltip = slotElement.querySelector('.tooltip');
    if (tooltip) {
      tooltip.textContent = getSlotName(slotType);
    }
  }
}

// Update all equipment slots in the UI
function updateAllEquipmentSlots() {
  // Update each slot with the currently equipped item
  Object.entries(gameState.player.equipment).forEach(([slotType, item]) => {
    updateEquipmentSlot(slotType, item);
  });
}

// Calculate and update equipment stats
function updateEquipmentStats() {
  // Calculate total attack and defense from equipped items
  let totalAttack = 0;
  let totalDefense = 0;
  
  Object.values(gameState.player.equipment).forEach(item => {
    if (item) {
      if (item.attack) totalAttack += item.attack;
      if (item.defense) totalDefense += item.defense;
    }
  });
  
  // Update UI with calculated stats
  document.getElementById('attackStat').textContent = totalAttack;
  document.getElementById('equipDefenseStat').textContent = totalDefense;
}

// Find pickupable items at the player's position
function findPickupableItemsAtPlayer() {
  const x = gameState.player.x;
  const y = gameState.player.y;
  const pickupableItems = [];
  
  // Skip if no sector data or items loaded
  if (!gameState.currentSector || !gameState.items) return pickupableItems;
  
  // Check each layer for pickupable items
  for (let layerIndex = 0; layerIndex < gameState.currentSector.layers.length; layerIndex++) {
    const layer = gameState.currentSector.layers[layerIndex];
    
    // Skip empty layers
    if (!layer || layer.length === 0) continue;
    
    // Find tiles at the player's position
    const tilesAtPosition = layer.filter(tile => tile.x === x && tile.y === y);
    
    // Check each tile for pickupable items
    for (const tile of tilesAtPosition) {
      const item = gameState.items.find(item => item.id === tile.itemId);
      
      // Add to pickupable items if the item is pickupable
      if (item && item.properties && item.properties.pickupable) {
        pickupableItems.push({
          item,
          layerIndex,
          tile
        });
      }
    }
  }
  
  return pickupableItems;
}

// Pick up an item at the player's position
function pickupItem() {
  // Find pickupable items at player's position
  const pickupableItems = findPickupableItemsAtPlayer();
  
  if (pickupableItems.length > 0) {
    // Get the first pickupable item
    const { item, layerIndex, tile } = pickupableItems[0];
    
    // Try to add item to inventory
    if (addItemToInventory(item)) {
      // If successful, remove the item from the map
      removeItemFromMap(layerIndex, tile);
      
      // Play a pickup sound if implemented
      // playSound('pickup');
    }
  } else {
    addChatMessage('There is nothing to pick up here', 'game');
  }
}

// Remove an item from the map
function removeItemFromMap(layerIndex, tile) {
  // Get the layer
  const layer = gameState.currentSector.layers[layerIndex];
  
  // Find the tile index
  const tileIndex = layer.findIndex(t => 
    t.x === tile.x && t.y === tile.y && t.itemId === tile.itemId
  );
  
  // Remove the tile from the layer
  if (tileIndex !== -1) {
    layer.splice(tileIndex, 1);
  }
}

// Drop the selected item at the player's position
function dropSelectedItem() {
  const selectedIndex = gameState.player.selectedInventorySlot;
  
  if (selectedIndex === -1) {
    addChatMessage('No item selected to drop', 'game');
    return;
  }
  
  // Get the item
  const item = gameState.player.inventory[selectedIndex];
  
  if (item) {
    // Remove from inventory
    removeItemFromInventory(selectedIndex);
    
    // Add to map at player's position
    addItemToMap(item, gameState.player.x, gameState.player.y);
    
    addChatMessage(`Dropped ${item.name} on the ground`, 'game');
  }
}

// Add an item to the map at the specified position
function addItemToMap(item, x, y) {
  // Skip if no sector data
  if (!gameState.currentSector || !gameState.currentSector.layers) return;
  
  // Add to the top layer
  const topLayerIndex = gameState.currentSector.layers.length - 1;
  const topLayer = gameState.currentSector.layers[topLayerIndex];
  
  // Create a new tile for the item
  const newTile = {
    x,
    y,
    itemId: item.id
  };
  
  // Add the tile to the top layer
  topLayer.push(newTile);
}

// Place test items around the player for testing
function placeTestItems() {
  // Find health potion item
  const healthPotion = gameState.items.find(item => item.id === 2000);
  const manaPotion = gameState.items.find(item => item.id === 2001);
  const goldCoin = gameState.items.find(item => item.id === 2002);
  const magicScroll = gameState.items.find(item => item.id === 2003);
  
  if (healthPotion) {
    // Place health potion one tile to the right of player
    addItemToMap(healthPotion, gameState.player.x + 1, gameState.player.y);
  }
  
  if (manaPotion) {
    // Place mana potion one tile to the left of player
    addItemToMap(manaPotion, gameState.player.x - 1, gameState.player.y);
  }
  
  if (goldCoin) {
    // Place gold coin one tile above the player
    addItemToMap(goldCoin, gameState.player.x, gameState.player.y - 1);
  }
  
  if (magicScroll) {
    // Place magic scroll one tile below the player
    addItemToMap(magicScroll, gameState.player.x, gameState.player.y + 1);
  }
}

// Check if player is at the dungeon entrance (position 12,5 in sector 0,0)
function isAtDungeonEntrance() {
  // Only check if in the spawn sector and not already in a dungeon
  if (
    !gameState.inDungeon && 
    gameState.activeSectorCoords.x === 0 && 
    gameState.activeSectorCoords.y === 0 &&
    gameState.player.x === 12 && 
    gameState.player.y === 5
  ) {
    // Check if there's a dungeon entrance tile at this position
    if (gameState.currentSector.layers[1]) {
      const entranceTile = gameState.currentSector.layers[1].find(
        tile => tile.x === 12 && tile.y === 5 && tile.itemId === 13
      );
      
      if (entranceTile) {
        return true;
      }
    }
  }
  return false;
}

// Show the dungeon entrance prompt
function showDungeonPrompt() {
  // Create a modal popup for the dungeon prompt
  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-container';
  modalContainer.style.position = 'fixed';
  modalContainer.style.top = '0';
  modalContainer.style.left = '0';
  modalContainer.style.width = '100%';
  modalContainer.style.height = '100%';
  modalContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
  modalContainer.style.display = 'flex';
  modalContainer.style.justifyContent = 'center';
  modalContainer.style.alignItems = 'center';
  modalContainer.style.zIndex = '1000';
  
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.backgroundColor = '#222';
  modal.style.border = '2px solid #444';
  modal.style.borderRadius = '5px';
  modal.style.padding = '20px';
  modal.style.maxWidth = '400px';
  modal.style.color = '#fff';
  modal.style.textAlign = 'center';
  
  // Add modal title
  const title = document.createElement('h2');
  title.textContent = 'Dungeon Entrance';
  title.style.marginBottom = '15px';
  
  // Add modal message
  const message = document.createElement('p');
  message.textContent = 'You have discovered an entrance to a dark dungeon. Do you wish to enter?';
  message.style.marginBottom = '20px';
  
  // Add buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.justifyContent = 'center';
  buttonsContainer.style.gap = '10px';
  
  // Add Yes button
  const yesButton = document.createElement('button');
  yesButton.textContent = 'Enter Dungeon';
  yesButton.style.padding = '8px 16px';
  yesButton.style.backgroundColor = '#4CAF50';
  yesButton.style.border = 'none';
  yesButton.style.borderRadius = '4px';
  yesButton.style.color = 'white';
  yesButton.style.cursor = 'pointer';
  
  // Add No button
  const noButton = document.createElement('button');
  noButton.textContent = 'Stay Here';
  noButton.style.padding = '8px 16px';
  noButton.style.backgroundColor = '#f44336';
  noButton.style.border = 'none';
  noButton.style.borderRadius = '4px';
  noButton.style.color = 'white';
  noButton.style.cursor = 'pointer';
  
  // Add event listeners to buttons
  yesButton.addEventListener('click', () => {
    // Remove modal
    document.body.removeChild(modalContainer);
    
    // Enter the dungeon
    enterDungeon();
  });
  
  noButton.addEventListener('click', () => {
    // Remove modal
    document.body.removeChild(modalContainer);
    
    // Add chat message
    addChatMessage('You decided not to enter the dungeon.', 'game');
  });
  
  // Assemble modal
  buttonsContainer.appendChild(yesButton);
  buttonsContainer.appendChild(noButton);
  modal.appendChild(title);
  modal.appendChild(message);
  modal.appendChild(buttonsContainer);
  modalContainer.appendChild(modal);
  
  // Add modal to document
  document.body.appendChild(modalContainer);
  
  // Add chat message
  addChatMessage('You found a dungeon entrance! Press SPACE to interact or move away.', 'game');
}

// Function to enter the dungeon
function enterDungeon() {
  // Generate the dungeon
  const dungeon = dungeonGenerator.generateDungeon(100, 3, 9);
  
  // Store the player's current sector and position for when they exit
  gameState.previousSector = {
    coords: { ...gameState.activeSectorCoords },
    x: gameState.player.x,
    y: gameState.player.y
  };
  
  // Set the current dungeon
  gameState.currentDungeon = dungeon;
  gameState.inDungeon = true;
  
  // Load the dungeon as the current sector
  gameState.currentSector = dungeon;
  
  // Set player position to entrance stairs
  if (dungeon.startRoom) {
    gameState.player.x = dungeon.startRoom.center.x;
    gameState.player.y = dungeon.startRoom.center.y;
  } else {
    // Fallback to a random walkable position
    placePlayerAtRandomPosition();
  }
  
  // Center viewport on player
  centerViewportOnPlayer();
  
  // Notify player
  addChatMessage(`You have entered ${dungeon.name}.`, 'server');
  addChatMessage(`This dungeon has ${dungeon.roomCount} rooms. Find the exit stairs to proceed deeper.`, 'server');
}

// Function to exit the dungeon (called when player uses stairs to leave)
function exitDungeon() {
  if (!gameState.inDungeon || !gameState.previousSector) {
    return;
  }
  
  // Set flag
  gameState.inDungeon = false;
  
  // Load the previous sector
  if (gameState.previousSector.coords) {
    // Find sector data in worldData
    const sectorData = gameState.worldData.sectors.find(
      s => s.coordinates.x === gameState.previousSector.coords.x && 
           s.coordinates.y === gameState.previousSector.coords.y
    );
    
    if (sectorData) {
      // Load the sector
      loadSector(sectorData.filename)
        .then(sectorData => {
          // Update current sector data
          gameState.currentSector = sectorData;
          gameState.activeSectorCoords = gameState.previousSector.coords;
          
          // Set player position
          gameState.player.x = gameState.previousSector.x;
          gameState.player.y = gameState.previousSector.y;
          
          // Move player 1 tile away from the dungeon entrance to prevent loop
          gameState.player.y += 1;
          
          // Center viewport on player
          centerViewportOnPlayer();
          
          // Notify player
          addChatMessage('You have exited the dungeon.', 'server');
        })
        .catch(error => {
          console.error('Error loading previous sector:', error);
          addChatMessage('Error exiting dungeon. Please try again.', 'server');
        });
    }
  }
}

// Function to move to the next dungeon level (when player uses down stairs)
function goToDeeperDungeonLevel() {
  if (!gameState.inDungeon || !gameState.currentDungeon) {
    return;
  }
  
  // Generate a new, harder dungeon level
  const currentLevel = gameState.currentDungeon.level || 1;
  const newDungeon = dungeonGenerator.generateDungeon(100, 3, 9);
  newDungeon.level = currentLevel + 1;
  newDungeon.name = `${gameState.player.name}'s Dungeon - Level ${newDungeon.level}`;
  
  // Set the current dungeon
  gameState.currentDungeon = newDungeon;
  gameState.currentSector = newDungeon;
  
  // Set player position to entrance stairs
  if (newDungeon.startRoom) {
    gameState.player.x = newDungeon.startRoom.center.x;
    gameState.player.y = newDungeon.startRoom.center.y;
  } else {
    // Fallback to a random walkable position
    placePlayerAtRandomPosition();
  }
  
  // Center viewport on player
  centerViewportOnPlayer();
  
  // Notify player
  addChatMessage(`You have descended to dungeon level ${newDungeon.level}.`, 'server');
  addChatMessage(`This level has ${newDungeon.roomCount} rooms and ${newDungeon.monsters ? newDungeon.monsters.length : 0} monsters.`, 'server');
  addChatMessage('Be careful, monsters are stronger here!', 'server');
}

// Function to place dungeon entrance at position 12,5 in the spawn sector
function placeDungeonEntrance() {
  // Only modify the spawn sector (0,0)
  if (
    gameState.activeSectorCoords.x !== 0 || 
    gameState.activeSectorCoords.y !== 0 ||
    !gameState.currentSector
  ) {
    return;
  }
  
  // Define dungeon entrance position
  const entranceX = 12;
  const entranceY = 5;
  
  // Create a special visual indicator for the dungeon entrance
  // We'll use a modified version of the stairs down item (ID 13)
  // but with a special property
  
  // Check if there's already a tile at this position in the upper layers
  let tileExists = false;
  
  // Check in the objects layer (1)
  if (gameState.currentSector.layers[1]) {
    const existingTileIndex = gameState.currentSector.layers[1].findIndex(
      tile => tile.x === entranceX && tile.y === entranceY
    );
    
    if (existingTileIndex !== -1) {
      // Update existing tile
      gameState.currentSector.layers[1][existingTileIndex].itemId = 13; // Stairs down
      tileExists = true;
    }
  } else {
    // Create objects layer if it doesn't exist
    gameState.currentSector.layers[1] = [];
  }
  
  // If no tile exists, add a new one
  if (!tileExists) {
    gameState.currentSector.layers[1].push({
      x: entranceX,
      y: entranceY,
      itemId: 13, // Stairs down
      isDungeonEntrance: true // Custom property to identify dungeon entrance
    });
  }
  
  // Add a torch item (itemId 16) next to the dungeon entrance for visual cue
  const torchPositions = [
    { x: entranceX - 1, y: entranceY - 1 },
    { x: entranceX + 1, y: entranceY - 1 },
    { x: entranceX - 1, y: entranceY + 1 },
    { x: entranceX + 1, y: entranceY + 1 }
  ];
  
  // Add torches
  for (const pos of torchPositions) {
    // Check if there's already a tile at this position
    const existingTileIndex = gameState.currentSector.layers[1].findIndex(
      tile => tile.x === pos.x && tile.y === pos.y
    );
    
    if (existingTileIndex === -1) {
      // Add torch if no tile exists at this position
      gameState.currentSector.layers[1].push({
        x: pos.x,
        y: pos.y,
        itemId: 16 // Torch
      });
    }
  }
  
  console.log('Dungeon entrance placed at position (12,5)');
}

// Start the game when the page loads
window.addEventListener('load', init); 