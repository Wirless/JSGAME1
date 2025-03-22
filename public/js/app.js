// Global Variables
const SPRITE_SIZE = 32; // Size of each sprite in pixels
let scale = 1;
let offsetX = 0;
let offsetY = 0;
let spriteSheet = new Image();
let selectedX = -1;
let selectedY = -1;
let items = [];
let currentItemIndex = -1;
let spriteVariants = []; // Array to store multiple sprite variants
let multiSelectMode = false; // Flag for multi-select mode

// Animation Variables
let animationIntervals = {}; // Store animation interval IDs
let animationsEnabled = true; // Flag to toggle animations on/off

// Outfit Editor Variables
let outfits = [];
let currentOutfitIndex = -1;
let outfitScale = 1;
let outfitOffsetX = 0;
let outfitOffsetY = 0;
let selectedOutfitX = -1;
let selectedOutfitY = -1;
let currentAddonSelect = null; // Currently selecting addon
let outfitAddons = {
  wings: null,
  helmet: null,
  armor: null,
  pants: null,
  boots: null,
  beard: null,
  leftHand: null,
  rightHand: null
};

// Map Editor Variables
let mapData = { width: 20, height: 20, layers: [[]] };
let currentLayer = 0;
let selectedTileX = -1;
let selectedTileY = -1;
let selectedTileItemIndex = -1;
let selectedItemId = null; // Currently selected item ID for map editing
let eraseMode = false; // Flag for erase mode
let isDrawing = false; // Flag for drag drawing
let isErasing = false; // Flag for drag erasing with right mouse button
let lastDrawnTileX = -1; // Last drawn tile X position
let lastDrawnTileY = -1; // Last drawn tile Y position
let fillMode = false; // Add fill mode flag
let mapZoom = 1; // Add map zoom level
let lastAnimationFrame = null; // For optimization
let throttledDraw = false; // For performance optimization
let movementSpeed = 5; // Default movement speed
let fillEntireMapMode = false; // Flag for fill entire map mode
let clearLowerLayersOnDraw = false; // Flag to clear lower layers when drawing

// DOM Elements - Item Editor
const spriteSheetCanvas = document.getElementById('spriteSheetCanvas');
const selectedSpriteCanvas = document.getElementById('selectedSpriteCanvas');
const spriteSheetCtx = spriteSheetCanvas.getContext('2d');
const selectedSpriteCtx = selectedSpriteCanvas.getContext('2d');
const coordinatesSpan = document.getElementById('coordinates');
const selectedPositionSpan = document.getElementById('selectedPosition');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const addItemBtn = document.getElementById('addItemBtn');
const clearItemBtn = document.getElementById('clearItemBtn');
const downloadItemsBtn = document.getElementById('downloadItemsBtn');
const newItemsJsonBtn = document.getElementById('newItemsJsonBtn');
const itemsList = document.getElementById('itemsList');
const quickVariantsContainer = document.getElementById('quickVariantsContainer');

// DOM Elements - Tab Navigation
const itemEditorTab = document.getElementById('itemEditorTab');
const mapEditorTab = document.getElementById('mapEditorTab');
const outfitEditorTab = document.getElementById('outfitEditorTab');
const gameClientTab = document.getElementById('gameClientTab');
const logoutBtn = document.getElementById('logoutBtn');
const itemEditorSection = document.getElementById('itemEditorSection');
const mapEditorSection = document.getElementById('mapEditorSection');
const outfitEditorSection = document.getElementById('outfitEditorSection');

// DOM Elements - Map Editor
const mapCanvas = document.getElementById('mapCanvas');
const mapCtx = mapCanvas.getContext('2d');
const mapWidthInput = document.getElementById('mapWidth');
const mapHeightInput = document.getElementById('mapHeight');
const currentLayerInput = document.getElementById('currentLayer');
const createMapBtn = document.getElementById('createMapBtn');
const layerUpBtn = document.getElementById('layerUpBtn');
const layerDownBtn = document.getElementById('layerDownBtn');
const saveMapBtn = document.getElementById('saveMapBtn');
const loadMapBtn = document.getElementById('loadMapBtn');
const downloadMapBtn = document.getElementById('downloadMapBtn');
const clearMapBtn = document.getElementById('clearMapBtn');
const itemPalette = document.getElementById('itemPalette');
const selectedTilePosition = document.getElementById('selectedTilePosition');
const selectedTileLayer = document.getElementById('selectedTileLayer');
const tileItems = document.getElementById('tileItems');
const removeItemBtn = document.getElementById('removeItemBtn');
const eraseModeCheckbox = document.getElementById('eraseMode');

// DOM Elements - Outfit Editor
const outfitSpriteCanvas = document.getElementById('outfitSpriteCanvas');
const outfitSpriteCtx = outfitSpriteCanvas.getContext('2d');
const outfitPreviewCanvas = document.getElementById('outfitPreviewCanvas');
const outfitPreviewCtx = outfitPreviewCanvas.getContext('2d');
const helmetCanvas = document.getElementById('helmetCanvas');
const armorCanvas = document.getElementById('armorCanvas');
const pantsCanvas = document.getElementById('pantsCanvas');
const bootsCanvas = document.getElementById('bootsCanvas');
const leftHandCanvas = document.getElementById('leftHandCanvas');
const rightHandCanvas = document.getElementById('rightHandCanvas');
const wingsCanvas = document.getElementById('wingsCanvas');
const beardCanvas = document.getElementById('beardCanvas');
const helmetCtx = helmetCanvas.getContext('2d');
const armorCtx = armorCanvas.getContext('2d');
const pantsCtx = pantsCanvas.getContext('2d');
const bootsCtx = bootsCanvas.getContext('2d');
const leftHandCtx = leftHandCanvas.getContext('2d');
const rightHandCtx = rightHandCanvas.getContext('2d');
const wingsCtx = wingsCanvas.getContext('2d');
const beardCtx = beardCanvas.getContext('2d');
const outfitZoomInBtn = document.getElementById('outfitZoomIn');
const outfitZoomOutBtn = document.getElementById('outfitZoomOut');
const selectHelmetBtn = document.getElementById('selectHelmetBtn');
const selectArmorBtn = document.getElementById('selectArmorBtn');
const selectPantsBtn = document.getElementById('selectPantsBtn');
const selectBootsBtn = document.getElementById('selectBootsBtn');
const selectLeftHandBtn = document.getElementById('selectLeftHandBtn');
const selectRightHandBtn = document.getElementById('selectRightHandBtn');
const selectWingsBtn = document.getElementById('selectWingsBtn');
const selectBeardBtn = document.getElementById('selectBeardBtn');
const clearHelmetBtn = document.getElementById('clearHelmetBtn');
const clearArmorBtn = document.getElementById('clearArmorBtn');
const clearPantsBtn = document.getElementById('clearPantsBtn');
const clearBootsBtn = document.getElementById('clearBootsBtn');
const clearLeftHandBtn = document.getElementById('clearLeftHandBtn');
const clearRightHandBtn = document.getElementById('clearRightHandBtn');
const clearWingsBtn = document.getElementById('clearWingsBtn');
const clearBeardBtn = document.getElementById('clearBeardBtn');
const addOutfitBtn = document.getElementById('addOutfitBtn');
const updateOutfitBtn = document.getElementById('updateOutfitBtn');
const clearOutfitBtn = document.getElementById('clearOutfitBtn');
const saveOutfitBtn = document.getElementById('saveOutfitBtn');
const downloadOutfitsBtn = document.getElementById('downloadOutfitsBtn');
const loadOutfitsBtn = document.getElementById('loadOutfitsBtn');
const outfitNameInput = document.getElementById('outfitName');
const outfitIdInput = document.getElementById('outfitId');
const outfitTypeRadios = document.getElementsByName('outfitType');
const outfitsList = document.getElementById('outfitsList');
const selectedOutfitPosition = document.getElementById('selectedOutfitPosition');

// Form Elements
const itemNameInput = document.getElementById('itemName');
const itemIdInput = document.getElementById('itemId');
const walkableCheckbox = document.getElementById('walkable');
const blockingCheckbox = document.getElementById('blocking');
const useableCheckbox = document.getElementById('useable');
const pickupableCheckbox = document.getElementById('pickupable');
const actionScriptInput = document.getElementById('actionScript');
const containerSizeInput = document.getElementById('containerSize');
const floorChangeSelect = document.getElementById('floorChange');
const attackInput = document.getElementById('attack');
const defenseInput = document.getElementById('defense');
const armorInput = document.getElementById('armor');
const weightInput = document.getElementById('weight');
const slotSelect = document.getElementById('slot');
const spriteVariantsContainer = document.getElementById('spriteVariants');
const addSpriteVariantBtn = document.getElementById('addSpriteVariant');
const clearSpriteVariantsBtn = document.getElementById('clearSpriteVariants');
const isAnimatedCheckbox = document.getElementById('isAnimated');
const animationSpeedInput = document.getElementById('animationSpeed');

// File input event listeners
document.getElementById('itemsFileInput').addEventListener('change', handleItemsFileSelect);
document.getElementById('mapFileInput').addEventListener('change', handleMapFileSelect);
document.getElementById('outfitsFileInput').addEventListener('change', handleOutfitsFileSelect);

// Connect load buttons to file inputs
document.getElementById('loadItemsBtn').addEventListener('click', () => {
  document.getElementById('itemsFileInput').click();
});

document.getElementById('loadMapBtn').addEventListener('click', () => {
  document.getElementById('mapFileInput').click();
});

// Handle items file selection
function handleItemsFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const loadedItems = JSON.parse(e.target.result);
      items = loadedItems;
      renderItemsList();
      renderItemPalette();
      saveItems(); // Save to server
      event.target.value = ''; // Reset file input
    } catch (error) {
      alert('Error loading items file: ' + error.message);
    }
  };
  reader.readAsText(file);
}

// Handle map file selection
function handleMapFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const loadedMap = JSON.parse(e.target.result);
      mapData = loadedMap;
      mapWidthInput.value = mapData.width;
      mapHeightInput.value = mapData.height;
      drawMap();
      saveMap(); // Save to server
      event.target.value = ''; // Reset file input
    } catch (error) {
      alert('Error loading map file: ' + error.message);
    }
  };
  reader.readAsText(file);
}

// Handle outfits file selection
function handleOutfitsFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const loadedOutfits = JSON.parse(e.target.result);
      outfits = loadedOutfits;
      renderOutfitsList();
      event.target.value = ''; // Reset file input
    } catch (error) {
      alert('Error loading outfits file: ' + error.message);
    }
  };
  reader.readAsText(file);
}

// Initialize the application
function init() {
  // Load the sprite sheet
  spriteSheet.src = '/tileset.png';
  spriteSheet.onload = function() {
    drawSpriteSheet();
    drawOutfitSpriteSheet();
    // Fetch any existing items
    fetchItems();
    // Fetch any existing map
    fetchMap();
    // Fetch any existing outfits
    fetchOutfits();
    // Initialize map editor extras
    initializeMapEditorExtras();
  };

  // Add event listeners for Item Editor
  spriteSheetCanvas.addEventListener('mousemove', handleMouseMove);
  spriteSheetCanvas.addEventListener('click', handleSpriteClick);
  zoomInBtn.addEventListener('click', zoomIn);
  zoomOutBtn.addEventListener('click', zoomOut);
  addItemBtn.addEventListener('click', addOrUpdateItem);
  clearItemBtn.addEventListener('click', clearForm);
  downloadItemsBtn.addEventListener('click', downloadItemsJson);
  newItemsJsonBtn.addEventListener('click', newItemsJson);
  addSpriteVariantBtn.addEventListener('click', addSpriteVariant);
  clearSpriteVariantsBtn.addEventListener('click', clearSpriteVariants);
  isAnimatedCheckbox.addEventListener('change', toggleAnimationOptions);
  
  // Add event listeners for Map Editor
  mapCanvas.addEventListener('mousemove', handleMapMouseMove);
  mapCanvas.addEventListener('mousedown', handleMapMouseDown);
  mapCanvas.addEventListener('mouseup', handleMapMouseUp);
  mapCanvas.addEventListener('mouseleave', handleMapMouseUp);
  mapCanvas.addEventListener('contextmenu', handleMapRightClick);
  createMapBtn.addEventListener('click', createOrResetMap);
  layerUpBtn.addEventListener('click', layerUp);
  layerDownBtn.addEventListener('click', layerDown);
  saveMapBtn.addEventListener('click', saveMap);
  loadMapBtn.addEventListener('click', fetchMap);
  downloadMapBtn.addEventListener('click', downloadMapJson);
  clearMapBtn.addEventListener('click', clearMap);
  removeItemBtn.addEventListener('click', removeSelectedTileItem);
  eraseModeCheckbox.addEventListener('change', toggleEraseMode);
  
  // Initialize map editor extras with enhanced functionality
  initializeMapEditorExtras();
  
  // Add event listeners for Outfit Editor
  outfitSpriteCanvas.addEventListener('mousemove', handleOutfitMouseMove);
  outfitSpriteCanvas.addEventListener('click', handleOutfitSpriteClick);
  outfitZoomInBtn.addEventListener('click', outfitZoomIn);
  outfitZoomOutBtn.addEventListener('click', outfitZoomOut);
  selectHelmetBtn.addEventListener('click', () => startAddonSelection('helmet'));
  selectArmorBtn.addEventListener('click', () => startAddonSelection('armor'));
  selectPantsBtn.addEventListener('click', () => startAddonSelection('pants'));
  selectBootsBtn.addEventListener('click', () => startAddonSelection('boots'));
  selectLeftHandBtn.addEventListener('click', () => startAddonSelection('leftHand'));
  selectRightHandBtn.addEventListener('click', () => startAddonSelection('rightHand'));
  selectWingsBtn.addEventListener('click', () => startAddonSelection('wings'));
  selectBeardBtn.addEventListener('click', () => startAddonSelection('beard'));
  clearHelmetBtn.addEventListener('click', () => clearAddon('helmet'));
  clearArmorBtn.addEventListener('click', () => clearAddon('armor'));
  clearPantsBtn.addEventListener('click', () => clearAddon('pants'));
  clearBootsBtn.addEventListener('click', () => clearAddon('boots'));
  clearLeftHandBtn.addEventListener('click', () => clearAddon('leftHand'));
  clearRightHandBtn.addEventListener('click', () => clearAddon('rightHand'));
  clearWingsBtn.addEventListener('click', () => clearAddon('wings'));
  clearBeardBtn.addEventListener('click', () => clearAddon('beard'));
  addOutfitBtn.addEventListener('click', addOutfit);
  updateOutfitBtn.addEventListener('click', updateOutfit);
  clearOutfitBtn.addEventListener('click', clearOutfitForm);
  saveOutfitBtn.addEventListener('click', saveOutfits);
  downloadOutfitsBtn.addEventListener('click', downloadOutfitsJson);
  loadOutfitsBtn.addEventListener('click', () => {
    document.getElementById('outfitsFileInput').click();
  });
  
  // Tab switching
  itemEditorTab.addEventListener('click', () => switchTab('item'));
  mapEditorTab.addEventListener('click', () => switchTab('map'));
  outfitEditorTab.addEventListener('click', () => switchTab('outfit'));
  gameClientTab.addEventListener('click', () => switchTab('game'));
  logoutBtn.addEventListener('click', logout);
  
  // Map dimension inputs
  mapWidthInput.addEventListener('change', validateMapDimensions);
  mapHeightInput.addEventListener('change', validateMapDimensions);
  currentLayerInput.addEventListener('change', changeLayer);
  
  // Global keyboard shortcuts
  document.addEventListener('keydown', handleKeyDown);
  
  // Add shift key listeners for multi-select mode
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Shift') {
      multiSelectMode = true;
    }
  });
  
  document.addEventListener('keyup', function(e) {
    if (e.key === 'Shift') {
      multiSelectMode = false;
    }
  });
}

// ==================== ITEM EDITOR FUNCTIONS ====================

// Draw the sprite sheet on the canvas
function drawSpriteSheet() {
  // Resize canvas if needed to fit sprite sheet
  if (spriteSheetCanvas.width < spriteSheet.width * scale || 
      spriteSheetCanvas.height < spriteSheet.height * scale) {
    spriteSheetCanvas.width = Math.max(800, spriteSheet.width * scale);
    spriteSheetCanvas.height = Math.max(600, spriteSheet.height * scale);
  }
  
  // Clear the canvas
  spriteSheetCtx.clearRect(0, 0, spriteSheetCanvas.width, spriteSheetCanvas.height);
  
  // Draw the sprite sheet with the current scale and offset
  spriteSheetCtx.drawImage(
    spriteSheet, 
    offsetX, offsetY, 
    spriteSheetCanvas.width / scale, 
    spriteSheetCanvas.height / scale, 
    0, 0, 
    spriteSheetCanvas.width, 
    spriteSheetCanvas.height
  );
  
  // Draw the grid
  drawGrid();
  
  // Highlight the selected sprite if any
  if (selectedX >= 0 && selectedY >= 0) {
    highlightSelectedSprite();
  }
}

// Draw the grid overlay on the sprite sheet
function drawGrid() {
  spriteSheetCtx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
  spriteSheetCtx.lineWidth = 1;
  
  // Calculate the starting points based on offset and scale
  const startX = (offsetX % SPRITE_SIZE) * scale;
  const startY = (offsetY % SPRITE_SIZE) * scale;
  
  // Draw vertical lines
  for (let x = -startX; x < spriteSheetCanvas.width; x += SPRITE_SIZE * scale) {
    spriteSheetCtx.beginPath();
    spriteSheetCtx.moveTo(x, 0);
    spriteSheetCtx.lineTo(x, spriteSheetCanvas.height);
    spriteSheetCtx.stroke();
  }
  
  // Draw horizontal lines
  for (let y = -startY; y < spriteSheetCanvas.height; y += SPRITE_SIZE * scale) {
    spriteSheetCtx.beginPath();
    spriteSheetCtx.moveTo(0, y);
    spriteSheetCtx.lineTo(spriteSheetCanvas.width, y);
    spriteSheetCtx.stroke();
  }
}

// Highlight the selected sprite
function highlightSelectedSprite() {
  const spriteX = (selectedX * SPRITE_SIZE - offsetX) * scale;
  const spriteY = (selectedY * SPRITE_SIZE - offsetY) * scale;
  
  spriteSheetCtx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
  spriteSheetCtx.lineWidth = 2;
  spriteSheetCtx.strokeRect(spriteX, spriteY, SPRITE_SIZE * scale, SPRITE_SIZE * scale);
}

// Handle mouse movement over the sprite sheet
function handleMouseMove(event) {
  const rect = spriteSheetCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Calculate sprite coordinates
  const spriteX = Math.floor((x / scale) + offsetX) / SPRITE_SIZE;
  const spriteY = Math.floor((y / scale) + offsetY) / SPRITE_SIZE;
  
  // Update the coordinates display
  coordinatesSpan.textContent = `X: ${Math.floor(spriteX)}, Y: ${Math.floor(spriteY)}`;
}

// Handle clicking on a sprite
function handleSpriteClick(event) {
  const rect = spriteSheetCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Calculate sprite coordinates
  const newX = Math.floor((x / scale + offsetX) / SPRITE_SIZE);
  const newY = Math.floor((y / scale + offsetY) / SPRITE_SIZE);
  
  // If not in multi-select mode, clear previous selection
  if (!multiSelectMode) {
    selectedX = newX;
    selectedY = newY;
    
    // Update the selected position display
    selectedPositionSpan.textContent = `(${selectedX}, ${selectedY})`;
    
    // Draw the selected sprite in the preview
    drawSelectedSprite();
  } else {
    // In multi-select mode, add the sprite to variants
    addSpriteVariantAt(newX, newY);
  }
  
  // Redraw the sprite sheet to show the selection
  drawSpriteSheet();
}

// Draw the selected sprite in the preview
function drawSelectedSprite() {
  // Clear the canvas
  selectedSpriteCtx.clearRect(0, 0, selectedSpriteCanvas.width, selectedSpriteCanvas.height);
  
  // Draw the selected sprite
  selectedSpriteCtx.drawImage(
    spriteSheet,
    selectedX * SPRITE_SIZE,
    selectedY * SPRITE_SIZE,
    SPRITE_SIZE,
    SPRITE_SIZE,
    0, 0,
    selectedSpriteCanvas.width,
    selectedSpriteCanvas.height
  );
}

// Zoom in function
function zoomIn() {
  if (scale < 3) {
    scale += 0.25;
    drawSpriteSheet();
  }
}

// Zoom out function
function zoomOut() {
  if (scale > 0.5) {
    scale -= 0.25;
    drawSpriteSheet();
  }
}

// Add or update an item
function addOrUpdateItem() {
  // Validate inputs
  if (!itemNameInput.value) {
    alert('Please enter an item name');
    return;
  }
  
  if (selectedX < 0 || selectedY < 0 && spriteVariants.length === 0) {
    alert('Please select a sprite first or add sprite variants');
    return;
  }
  
  // Create the item object
  const item = {
    id: itemIdInput.value ? parseInt(itemIdInput.value) : items.length + 1,
    name: itemNameInput.value,
    properties: {
      walkable: walkableCheckbox.checked,
      blocking: blockingCheckbox.checked,
      useable: useableCheckbox.checked,
      pickupable: pickupableCheckbox.checked
    }
  };
  
  // Get selected skill type
  const skillTypeRadios = document.getElementsByName('skillType');
  let skillType = 'none';
  for (const radio of skillTypeRadios) {
    if (radio.checked) {
      skillType = radio.value;
      break;
    }
  }
  item.skillType = skillType;
  
  // Handle sprite variants
  if (spriteVariants.length > 0) {
    item.sprites = [...spriteVariants]; // Copy the sprites array
    
    // Add animation settings if enabled
    if (isAnimatedCheckbox.checked) {
      item.animated = true;
      item.animationSpeed = parseInt(animationSpeedInput.value) || 500;
    }
  } else {
    // Single sprite
    item.sprite = {
      x: selectedX,
      y: selectedY
    };
  }
  
  // Add optional properties
  if (actionScriptInput.value) {
    item.action = actionScriptInput.value;
  }
  
  if (containerSizeInput.value) {
    item.containerSize = parseInt(containerSizeInput.value);
  }
  
  if (floorChangeSelect.value) {
    item.floorChange = parseInt(floorChangeSelect.value);
  }
  
  // Add new properties
  if (attackInput.value) {
    item.attack = parseInt(attackInput.value);
  }
  
  if (defenseInput.value) {
    item.defense = parseInt(defenseInput.value);
  }
  
  if (armorInput.value) {
    item.armor = parseInt(armorInput.value);
  }
  
  if (weightInput.value) {
    item.weight = parseInt(weightInput.value);
  }
  
  if (slotSelect.value) {
    item.slot = slotSelect.value;
  }
  
  // Check if we're editing an existing item
  if (currentItemIndex >= 0) {
    items[currentItemIndex] = item;
  } else {
    items.push(item);
  }
  
  // Reset form and update UI
  clearForm();
  renderItemsList();
  renderItemPalette();
  saveItems();
}

// Clear the item form
function clearForm() {
  itemNameInput.value = '';
  itemIdInput.value = '';
  walkableCheckbox.checked = false;
  blockingCheckbox.checked = false;
  useableCheckbox.checked = false;
  pickupableCheckbox.checked = false;
  actionScriptInput.value = '';
  containerSizeInput.value = '';
  floorChangeSelect.value = '';
  attackInput.value = '';
  defenseInput.value = '';
  armorInput.value = '';
  weightInput.value = '';
  slotSelect.value = '';
  isAnimatedCheckbox.checked = false;
  animationSpeedInput.value = '500';
  animationSpeedInput.disabled = true;
  
  clearSpriteVariants();
  
  currentItemIndex = -1;
  addItemBtn.textContent = 'Add Item';
}

// Render the items list
function renderItemsList() {
  // Clear any existing animation intervals
  Object.keys(animationIntervals).forEach(key => {
    clearInterval(animationIntervals[key]);
    delete animationIntervals[key];
  });
  
  itemsList.innerHTML = '';
  
  if (items.length === 0) {
    itemsList.innerHTML = '<p>No items created yet</p>';
    return;
  }
  
  items.forEach((item, index) => {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card';
    
    // Create a small canvas for the sprite
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 32;
    spriteCanvas.height = 32;
    spriteCanvas.className = 'item-sprite';
    const spriteCtx = spriteCanvas.getContext('2d');
    
    // Create the animation container if needed
    let animationContainer = null;
    if (item.animated && item.sprites && item.sprites.length > 1) {
      animationContainer = document.createElement('div');
      animationContainer.className = 'item-animation-preview';
      animationContainer.appendChild(spriteCanvas);
      
      // Set up the animation
      let frameIndex = 0;
      const animationId = `item-${index}-animation`;
      
      animationIntervals[animationId] = setInterval(() => {
        frameIndex = (frameIndex + 1) % item.sprites.length;
        const sprite = item.sprites[frameIndex];
        
        spriteCtx.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
        spriteCtx.drawImage(
          spriteSheet,
          sprite.x * SPRITE_SIZE,
          sprite.y * SPRITE_SIZE,
          SPRITE_SIZE,
          SPRITE_SIZE,
          0, 0,
          32, 32
        );
      }, item.animationSpeed || 500);
    }
    
    // Draw the sprite (first frame for animations)
    if (item.sprites && item.sprites.length > 0) {
      // Draw the first sprite from the variants
      const firstSprite = item.sprites[0];
      spriteCtx.drawImage(
        spriteSheet,
        firstSprite.x * SPRITE_SIZE,
        firstSprite.y * SPRITE_SIZE,
        SPRITE_SIZE,
        SPRITE_SIZE,
        0, 0,
        32, 32
      );
    } else if (item.sprite) {
      // Draw the single sprite
      spriteCtx.drawImage(
        spriteSheet,
        item.sprite.x * SPRITE_SIZE,
        item.sprite.y * SPRITE_SIZE,
        SPRITE_SIZE,
        SPRITE_SIZE,
        0, 0,
        32, 32
      );
    }
    
    // Create the card header
    const header = document.createElement('div');
    header.className = 'item-card-header';
    
    const title = document.createElement('h3');
    title.textContent = `${item.name} (ID: ${item.id})`;
    
    if (animationContainer) {
      header.appendChild(animationContainer);
    } else {
      header.appendChild(spriteCanvas);
    }
    header.appendChild(title);
    
    // Create properties list
    const propertiesList = document.createElement('div');
    propertiesList.className = 'item-properties';
    
    // Add properties
    addProperty(propertiesList, 'Walkable', item.properties.walkable ? 'Yes' : 'No');
    addProperty(propertiesList, 'Blocking', item.properties.blocking ? 'Yes' : 'No');
    addProperty(propertiesList, 'Useable', item.properties.useable ? 'Yes' : 'No');
    addProperty(propertiesList, 'Pickupable', item.properties.pickupable ? 'Yes' : 'No');
    
    if (item.action) {
      addProperty(propertiesList, 'Action', item.action);
    }
    
    if (item.containerSize) {
      addProperty(propertiesList, 'Container Size', item.containerSize);
    }
    
    if (item.floorChange) {
      addProperty(propertiesList, 'Floor Change', item.floorChange);
    }
    
    // New properties
    if (item.attack) {
      addProperty(propertiesList, 'Attack', item.attack);
    }
    
    if (item.defense) {
      addProperty(propertiesList, 'Defense', item.defense);
    }
    
    if (item.armor) {
      addProperty(propertiesList, 'Armor', item.armor);
    }
    
    if (item.weight) {
      addProperty(propertiesList, 'Weight', item.weight);
    }
    
    if (item.slot) {
      addProperty(propertiesList, 'Slot', item.slot.replace('SLOT_', '').toLowerCase());
    }
    
    if (item.sprites && item.sprites.length > 0) {
      addProperty(propertiesList, 'Variants', item.sprites.length);
    }
    
    if (item.animated) {
      addProperty(propertiesList, 'Animated', 'Yes');
      addProperty(propertiesList, 'Animation Speed', `${item.animationSpeed}ms`);
    }
    
    // Create action buttons
    const actions = document.createElement('div');
    actions.className = 'item-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => editItem(index);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteItem(index);
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    // Assemble the card
    itemCard.appendChild(header);
    itemCard.appendChild(propertiesList);
    itemCard.appendChild(actions);
    
    itemsList.appendChild(itemCard);
  });
}

// Helper function to add a property to the properties list
function addProperty(container, label, value) {
  const prop = document.createElement('div');
  
  const propLabel = document.createElement('span');
  propLabel.className = 'property-label';
  propLabel.textContent = `${label}: `;
  
  const propValue = document.createElement('span');
  propValue.textContent = value;
  
  prop.appendChild(propLabel);
  prop.appendChild(propValue);
  
  container.appendChild(prop);
}

// Edit an item
function editItem(index) {
  const item = items[index];
  
  // Set form values
  itemNameInput.value = item.name;
  itemIdInput.value = item.id;
  walkableCheckbox.checked = item.properties.walkable;
  blockingCheckbox.checked = item.properties.blocking;
  useableCheckbox.checked = item.properties.useable;
  pickupableCheckbox.checked = item.properties.pickupable;
  actionScriptInput.value = item.action || '';
  containerSizeInput.value = item.containerSize || '';
  floorChangeSelect.value = item.floorChange || '';
  attackInput.value = item.attack || '';
  defenseInput.value = item.defense || '';
  armorInput.value = item.armor || '';
  weightInput.value = item.weight || '';
  slotSelect.value = item.slot || '';
  isAnimatedCheckbox.checked = item.animated || false;
  animationSpeedInput.value = item.animationSpeed || '500';
  animationSpeedInput.disabled = !item.animated;
  
  // Set skill type radio button
  const skillType = item.skillType || 'none';
  const skillTypeRadio = document.getElementById(`skillType${skillType.charAt(0).toUpperCase() + skillType.slice(1)}`);
  if (skillTypeRadio) {
    skillTypeRadio.checked = true;
  } else {
    document.getElementById('skillTypeNone').checked = true;
  }
  
  // Clear sprite variants
  clearSpriteVariants();
  
  // Set sprite variants or single sprite
  if (item.sprites && item.sprites.length > 0) {
    // Add each sprite variant
    item.sprites.forEach(sprite => {
      spriteVariants.push({ x: sprite.x, y: sprite.y });
    });
    renderSpriteVariants();
  } else if (item.sprite) {
    // Set the selected sprite
    selectedX = item.sprite.x;
    selectedY = item.sprite.y;
    selectedPositionSpan.textContent = `(${selectedX}, ${selectedY})`;
    drawSelectedSprite();
    drawSpriteSheet();
  }
  
  // Update the current item index
  currentItemIndex = index;
  addItemBtn.textContent = 'Update Item';
}

// Delete an item
function deleteItem(index) {
  if (confirm(`Are you sure you want to delete "${items[index].name}"?`)) {
    items.splice(index, 1);
    renderItemsList();
    renderItemPalette();
    saveItems();
  }
}

// Save items to the server
function saveItems() {
  fetch('/api/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(items)
  })
  .then(response => response.json())
  .then(data => {
    console.log('Items saved:', data);
  })
  .catch(error => {
    console.error('Error saving items:', error);
  });
}

// Fetch items from the server
function fetchItems() {
  fetch('/api/items')
    .then(response => response.json())
    .then(data => {
      items = data;
      renderItemsList();
      renderImprovedItemPalette();
    })
    .catch(error => {
      console.error('Error fetching items:', error);
      // Fallback to static JSON if the API fails
      loadItemsFromStaticJson();
    });
}

// Download the items JSON
function downloadItemsJson() {
  if (items.length === 0) {
    alert('No items to download');
    return;
  }
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "items.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

// Create a new items JSON (clear all items)
function newItemsJson() {
  if (items.length > 0 && confirm('Are you sure you want to clear all items?')) {
    items = [];
    renderItemsList();
    renderItemPalette();
    saveItems();
  }
}

// ==================== MAP EDITOR FUNCTIONS ====================

// Tab switching function
function switchTab(tab) {
  // Hide all sections
  itemEditorSection.classList.remove('active');
  mapEditorSection.classList.remove('active');
  outfitEditorSection.classList.remove('active');
  
  // Remove active class from tabs
  itemEditorTab.classList.remove('active');
  mapEditorTab.classList.remove('active');
  outfitEditorTab.classList.remove('active');
  gameClientTab.classList.remove('active');
  
  // Show selected section and set active class on tab
  if (tab === 'item') {
    itemEditorSection.classList.add('active');
    itemEditorTab.classList.add('active');
  } else if (tab === 'map') {
    mapEditorSection.classList.add('active');
    mapEditorTab.classList.add('active');
    
    // Initialize map editor extras when switching to map tab
    if (typeof initializeMapEditorExtras === 'function') {
      initializeMapEditorExtras();
    }
    
    // Make sure the map is drawn
    if (typeof safeDrawMap === 'function') {
      safeDrawMap();
    } else if (typeof drawMap === 'function') {
      drawMap();
    }
  } else if (tab === 'outfit') {
    outfitEditorSection.classList.add('active');
    outfitEditorTab.classList.add('active');
  } else if (tab === 'game') {
    // Redirect to game client
    window.location.href = '/game';
  }
}

// Helper function to determine item category based on properties and name
function getItemCategory(item) {
  // First, check based on properties (these should take precedence)
  if (item.properties) {
    if (item.properties.pickupable) return 'item';
    if (item.properties.blocking && !item.properties.walkable) return 'wall';
    if (item.properties.walkable && !item.properties.blocking) return 'ground';
    // If it's not pickupable, not a wall, and not walkable ground, it's likely decoration
    if (!item.properties.pickupable && !item.properties.walkable && !item.properties.blocking) return 'decoration';
  }
  
  // If we couldn't determine the category by properties, fall back to name-based categorization
  const nameLower = item.name.toLowerCase();
  
  const categories = {
    ground: ['grass', 'sand', 'water', 'floor', 'gravel', 'earth', 'ground', 'cobble', 'dirt'],
    wall: ['wall', 'rock', 'stone', 'brick'],
    decoration: ['torch', 'fire', 'statue', 'furniture', 'light'],
    item: ['sword', 'staff', 'club', 'armor', 'shield', 'helm', 'boot', 'ring', 'amulet', 'belt']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => nameLower.includes(keyword))) {
      return category;
    }
  }
  
  // Default to decoration if we couldn't determine category
  return 'decoration';
}

// Render item palette for quick selection
function renderItemPalette() {
  const itemPalette = document.getElementById('itemPalette');
  
  if (!itemPalette) return;
  
  // Clear existing palette items
  itemPalette.innerHTML = '';
  
  // Get the current category filter
  const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
  
  // Get search text
  const searchText = (document.getElementById('itemSearch')?.value || '').toLowerCase();
  
  // Filter items based on category and search text
  const filteredItems = items.filter(item => {
    // Check if item matches the category filter
    const matches = activeCategory === 'all' || getItemCategory(item) === activeCategory;
    
    // Check if item matches search text
    const searchMatches = !searchText || 
                          item.name.toLowerCase().includes(searchText) ||
                          item.id.toString().includes(searchText);
    
    return matches && searchMatches;
  });
  
  // Display a message if no items match the filter
  if (filteredItems.length === 0) {
    const noItems = document.createElement('div');
    noItems.className = 'no-items';
    noItems.textContent = 'No items match the current filter';
    itemPalette.appendChild(noItems);
    return;
  }
  
  // Group items by category
  const categories = {
    ground: ['grass', 'sand', 'water', 'floor', 'gravel', 'earth', 'ground', 'cobble', 'dirt'],
    wall: ['wall', 'rock', 'stone', 'brick'],
    decoration: ['torch', 'fire', 'statue', 'furniture', 'light'],
    item: ['sword', 'staff', 'club', 'armor', 'shield', 'helm', 'boot', 'ring', 'amulet', 'belt']
  };
  
  // Helper function definition removed - now using global getItemCategory function
  
  filteredItems.forEach(item => {
    const paletteItem = document.createElement('div');
    paletteItem.className = 'palette-item';
    paletteItem.dataset.itemId = item.id;
    paletteItem.dataset.category = getItemCategory(item);
    
    if (selectedItemId === item.id) {
      paletteItem.classList.add('selected');
    }
    
    // Create content wrapper for better styling
    const itemContent = document.createElement('div');
    itemContent.className = 'item-content';
    
    const itemCanvas = document.createElement('canvas');
    itemCanvas.width = 32;
    itemCanvas.height = 32;
    const itemCtx = itemCanvas.getContext('2d');
    
    // Draw the sprite
    if (item.sprites && item.sprites.length > 0) {
      // Draw the first sprite from the variants
      const firstSprite = item.sprites[0];
      itemCtx.drawImage(
        spriteSheet,
        firstSprite.x * SPRITE_SIZE,
        firstSprite.y * SPRITE_SIZE,
        SPRITE_SIZE,
        SPRITE_SIZE,
        0, 0,
        32, 32
      );
    } else if (item.sprite) {
      // Draw the single sprite
      itemCtx.drawImage(
        spriteSheet,
        item.sprite.x * SPRITE_SIZE,
        item.sprite.y * SPRITE_SIZE,
        SPRITE_SIZE,
        SPRITE_SIZE,
        0, 0,
        32, 32
      );
    }
    
    itemContent.appendChild(itemCanvas);
    
    // Add a small label with item name
    const label = document.createElement('div');
    label.className = 'item-name';
    label.textContent = item.name;
    
    itemContent.appendChild(label);
    paletteItem.appendChild(itemContent);
    
    // Event listener for selecting an item
    paletteItem.addEventListener('click', () => {
      // Deselect all items
      document.querySelectorAll('.palette-item').forEach(el => {
        el.classList.remove('selected');
      });
      
      // Select this item
      paletteItem.classList.add('selected');
      selectedItemId = item.id;
    });
    
    itemPalette.appendChild(paletteItem);
  });
}

// Improved render item palette function - renamed for clarity
function renderImprovedItemPalette() {
  const itemPalette = document.getElementById('itemPalette');
  
  if (!itemPalette) return;
  
  // Clear existing palette items
  itemPalette.innerHTML = '';
  
  // Get the current category filter
  const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
  
  // Get search text
  const searchText = (document.getElementById('itemSearch')?.value || '').toLowerCase();
  
  // Filter items based on category and search text
  const filteredItems = items.filter(item => {
    // Check if item matches the category filter
    const matches = activeCategory === 'all' || getItemCategory(item) === activeCategory;
    
    // Check if item matches search text
    const searchMatches = !searchText || 
                          item.name.toLowerCase().includes(searchText) ||
                          item.id.toString().includes(searchText);
    
    return matches && searchMatches;
  });
  
  // Display a message if no items match the filter
  if (filteredItems.length === 0) {
    const noItems = document.createElement('div');
    noItems.className = 'no-items';
    noItems.textContent = 'No items match the current filter';
    itemPalette.appendChild(noItems);
    return;
  }
  
  // Group items by category
  const categories = {
    ground: ['grass', 'sand', 'water', 'floor', 'gravel', 'earth', 'ground', 'cobble', 'dirt'],
    wall: ['wall', 'rock', 'stone', 'brick'],
    decoration: ['torch', 'fire', 'statue', 'furniture', 'light'],
    item: ['sword', 'staff', 'club', 'armor', 'shield', 'helm', 'boot', 'ring', 'amulet', 'belt']
  };
  
  // Helper function definition removed - now using global getItemCategory function
  
  filteredItems.forEach(item => {
    const paletteItem = document.createElement('div');
    paletteItem.className = 'palette-item';
    paletteItem.dataset.itemId = item.id;
    paletteItem.dataset.category = getItemCategory(item);
    
    if (selectedItemId === item.id) {
      paletteItem.classList.add('selected');
    }
    
    // Create content wrapper for better styling
    const itemContent = document.createElement('div');
    itemContent.className = 'item-content';
    
    const itemCanvas = document.createElement('canvas');
    itemCanvas.width = 32;
    itemCanvas.height = 32;
    const itemCtx = itemCanvas.getContext('2d');
    
    // Draw the sprite
    if (item.sprites && item.sprites.length > 0) {
      // Draw the first sprite from the variants
      const firstSprite = item.sprites[0];
      itemCtx.drawImage(
        spriteSheet,
        firstSprite.x * SPRITE_SIZE,
        firstSprite.y * SPRITE_SIZE,
        SPRITE_SIZE,
        SPRITE_SIZE,
        0, 0,
        32, 32
      );
    } else if (item.sprite) {
      // Draw the single sprite
      itemCtx.drawImage(
        spriteSheet,
        item.sprite.x * SPRITE_SIZE,
        item.sprite.y * SPRITE_SIZE,
        SPRITE_SIZE,
        SPRITE_SIZE,
        0, 0,
        32, 32
      );
    }
    
    itemContent.appendChild(itemCanvas);
    
    // Add a small label with item name
    const label = document.createElement('div');
    label.className = 'item-name';
    label.textContent = item.name;
    
    itemContent.appendChild(label);
    paletteItem.appendChild(itemContent);
    
    // Event listener for selecting an item
    paletteItem.addEventListener('click', () => {
      // Deselect all items
      document.querySelectorAll('.palette-item').forEach(el => {
        el.classList.remove('selected');
      });
      
      // Select this item
      paletteItem.classList.add('selected');
      selectedItemId = item.id;
    });
    
    itemPalette.appendChild(paletteItem);
  });
}

// Modify createOrResetMap function to preserve tiles
function createOrResetMap() {
  const width = parseInt(mapWidthInput.value);
  const height = parseInt(mapHeightInput.value);
  
  if (confirm(`Are you sure you want to resize the map to ${width}x${height}?`)) {
    // Store old dimensions
    const oldWidth = mapData.width;
    const oldHeight = mapData.height;
    
    // Update dimensions
    mapData.width = width;
    mapData.height = height;
    
    // Preserve existing layers and their tiles
    if (mapData.layers) {
      mapData.layers.forEach(layer => {
        if (layer) {
          // Filter out tiles that would be outside the new dimensions
          layer = layer.filter(tile => tile.x < width && tile.y < height);
        }
      });
    }
    
    // Ensure at least one layer exists
    if (!mapData.layers || mapData.layers.length === 0) {
      mapData.layers = [[]];
    }
    
    currentLayer = 0;
    currentLayerInput.value = currentLayer;
    selectedTileLayer.textContent = currentLayer;
    
    drawMap();
    saveMap();
  }
}

// Validate map dimensions
function validateMapDimensions() {
  const width = parseInt(mapWidthInput.value);
  const height = parseInt(mapHeightInput.value);
  
  if (width < 5) mapWidthInput.value = 5;
  if (width > 500) mapWidthInput.value = 500;
  if (height < 5) mapHeightInput.value = 5;
  if (height > 500) mapHeightInput.value = 500;
}

// Change the current layer
function changeLayer() {
  const layer = parseInt(currentLayerInput.value);
  
  if (layer < 0) {
    currentLayerInput.value = 0;
    currentLayer = 0;
  } else {
    currentLayer = layer;
    
    // Initialize the layer if it doesn't exist
    if (!mapData.layers[currentLayer]) {
      mapData.layers[currentLayer] = [];
    }
  }
  
  selectedTileLayer.textContent = currentLayer;
  drawMap();
}

// Layer up function
function layerUp() {
  currentLayer++;
  currentLayerInput.value = currentLayer;
  
  // Initialize the layer if it doesn't exist
  if (!mapData.layers[currentLayer]) {
    mapData.layers[currentLayer] = [];
  }
  
  selectedTileLayer.textContent = currentLayer;
  drawMap();
}

// Layer down function
function layerDown() {
  if (currentLayer > 0) {
    currentLayer--;
    currentLayerInput.value = currentLayer;
    selectedTileLayer.textContent = currentLayer;
    drawMap();
  }
}

// Draw the map with performance optimization
function drawMap() {
  // Cancel any pending animation frame
  if (lastAnimationFrame) {
    cancelAnimationFrame(lastAnimationFrame);
  }
  
  // Create a new animation frame immediately - don't use throttling for direct updates
  lastAnimationFrame = requestAnimationFrame(() => {
    // Set canvas size based on map dimensions
    const tileSize = 32; // Size to draw each tile
    mapCanvas.width = mapData.width * tileSize;
    mapCanvas.height = mapData.height * tileSize;
    
    // Clear canvas
    mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    
    // Draw background grid
    mapCtx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
    mapCtx.lineWidth = 1;
    
    // Optimize grid drawing by only drawing visible grid lines
    const visibleStartX = Math.floor(mapCanvas.scrollLeft / tileSize);
    const visibleEndX = Math.min(mapData.width, Math.ceil((mapCanvas.scrollLeft + mapCanvas.clientWidth) / tileSize));
    const visibleStartY = Math.floor(mapCanvas.scrollTop / tileSize);
    const visibleEndY = Math.min(mapData.height, Math.ceil((mapCanvas.scrollTop + mapCanvas.clientHeight) / tileSize));
    
    // Draw vertical lines
    for (let x = 0; x <= mapData.width; x++) {
      mapCtx.beginPath();
      mapCtx.moveTo(x * tileSize, 0);
      mapCtx.lineTo(x * tileSize, mapCanvas.height);
      mapCtx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= mapData.height; y++) {
      mapCtx.beginPath();
      mapCtx.moveTo(0, y * tileSize);
      mapCtx.lineTo(mapCanvas.width, y * tileSize);
      mapCtx.stroke();
    }
    
    // Draw tiles from each layer up to the current layer
    for (let layer = 0; layer <= currentLayer; layer++) {
      if (!mapData.layers[layer]) continue;
      
      mapData.layers[layer].forEach(tile => {
        const item = items.find(i => i.id === tile.itemId);
        if (!item) return;
        
        // Skip tiles that are not visible
        if (tile.x < visibleStartX - 1 || tile.x > visibleEndX + 1 || 
            tile.y < visibleStartY - 1 || tile.y > visibleEndY + 1) {
          return;
        }
        
        // Get the sprite to draw
        let spriteX, spriteY;
        
        if (item.sprites && item.sprites.length > 0) {
          if (item.animated && animationsEnabled) {
            // For animated items, we need a different approach 
            // We'll use a hash of the tile coords + time to show different frames at different times
            const frameIndex = Math.floor(Date.now() / (item.animationSpeed || 500)) % item.sprites.length;
            spriteX = item.sprites[frameIndex].x;
            spriteY = item.sprites[frameIndex].y;
          } else {
            // For multi-sprite items, randomly select a sprite variant
            // We use a hash of the tile coordinates and layer to ensure consistent selection
            const variantIndex = Math.abs((tile.x * 31 + tile.y * 17 + layer * 7) % item.sprites.length);
            spriteX = item.sprites[variantIndex].x;
            spriteY = item.sprites[variantIndex].y;
          }
        } else if (item.sprite) {
          // Single sprite
          spriteX = item.sprite.x;
          spriteY = item.sprite.y;
        } else {
          return; // No valid sprite, skip
        }
        
        mapCtx.drawImage(
          spriteSheet,
          spriteX * SPRITE_SIZE,
          spriteY * SPRITE_SIZE,
          SPRITE_SIZE,
          SPRITE_SIZE,
          tile.x * tileSize,
          tile.y * tileSize,
          tileSize,
          tileSize
        );
      });
    }
    
    // Highlight selected tile
    if (selectedTileX >= 0 && selectedTileX < mapData.width &&
        selectedTileY >= 0 && selectedTileY < mapData.height) {
      mapCtx.strokeStyle = eraseMode ? 'rgba(255, 0, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
      mapCtx.lineWidth = 2;
      mapCtx.strokeRect(
        selectedTileX * tileSize,
        selectedTileY * tileSize,
        tileSize,
        tileSize
      );
    }
    
    // Request animation frame for animated items if needed
    if (animationsEnabled && items.some(item => item.animated)) {
      setTimeout(() => {
      lastAnimationFrame = requestAnimationFrame(drawMap);
      }, 100); // 10 FPS for animations to save resources
    } else {
      // Reset animation frame reference when not needed
      lastAnimationFrame = null;
    }
    
    // Reset throttle immediately
      throttledDraw = false;
  });
}

// Enhanced resize function for map editor
function resizeMapEditor(zoomLevel, width, height) {
  const mapCanvasContainer = document.querySelector('.map-canvas-container');
  const mapEditorContainer = document.querySelector('.map-editor-container');
  
  if (zoomLevel) {
    mapZoom = zoomLevel;
  }
  
  // Adjust for the items panel width
  const itemsPanel = document.getElementById('itemsPanel');
  const itemsPanelWidth = itemsPanel ? (itemsPanelVisible ? itemsPanel.offsetWidth : 40) : 0;
  
  // Set specific width and height if provided
  if (width && height) {
    mapCanvasContainer.style.width = `${width}px`;
    mapCanvasContainer.style.height = `${height}px`;
  } else {
    // Default zoom based resize - consider available space
    const availableWidth = Math.max(600, window.innerWidth - itemsPanelWidth - 50);
    mapCanvasContainer.style.width = `${Math.min(availableWidth, 800 * mapZoom)}px`;
    mapCanvasContainer.style.height = `${600 * mapZoom}px`;
  }
  
  mapCanvas.style.transform = `scale(${mapZoom})`;
  mapCanvas.style.transformOrigin = 'top left';
  
  // Adjust container sizes
  if (mapEditorContainer) {
    mapEditorContainer.style.height = `${Math.max(600, parseInt(mapCanvasContainer.style.height, 10) + 50)}px`;
  }
  
  // Force redraw to ensure everything renders correctly
  drawMap();
}

// Fill the entire map with the selected item
function fillEntireMap(itemId) {
  if (!mapData.layers[currentLayer]) {
    mapData.layers[currentLayer] = [];
  }
  
  if (!confirm('Are you sure you want to fill the entire map with this item? This will replace all existing items on the current layer.')) {
    return;
  }
  
  // Clear existing items on the current layer
  mapData.layers[currentLayer] = [];
  
  // Fill the entire map with selected item
  for (let x = 0; x < mapData.width; x++) {
    for (let y = 0; y < mapData.height; y++) {
      addItemToTile(x, y, currentLayer, itemId);
    }
  }
  
  // Redraw the map
  drawMap();
  
  // Save the map
  saveMap();
}

// Fill map with boundaries - only fills open areas
function fillMapWithBoundaries(itemId) {
  if (!mapData.layers[currentLayer]) {
    mapData.layers[currentLayer] = [];
  }
  
  // Create a visited map to track filled tiles
  const visited = Array(mapData.width).fill().map(() => Array(mapData.height).fill(false));
  
  // Find all boundary tiles first (tiles with items on current layer)
  for (let x = 0; x < mapData.width; x++) {
    for (let y = 0; y < mapData.height; y++) {
      const hasItem = mapData.layers[currentLayer].some(tile => 
        tile.x === x && tile.y === y
      );
      
      if (hasItem) {
        visited[x][y] = true; // Mark as boundary
      }
    }
  }
  
  // Now fill all non-boundary tiles
  for (let x = 0; x < mapData.width; x++) {
    for (let y = 0; y < mapData.height; y++) {
      if (!visited[x][y]) {
        addItemToTile(x, y, currentLayer, itemId);
      }
    }
  }
  
  // Redraw the map
  drawMap();
  
  // Save the map
  saveMap();
}

// Handle mouse movement over the map
function handleMapMouseMove(event) {
  const rect = mapCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const tileSize = 32;
  const tileX = Math.floor(x / tileSize / mapZoom);
  const tileY = Math.floor(y / tileSize / mapZoom);
  
  // Update coordinates display if we have one
  if (document.getElementById('mapCoordinates')) {
    document.getElementById('mapCoordinates').textContent = `X: ${tileX}, Y: ${tileY}`;
  }
  
  // Always update the selected tile position for highlighting
    if (tileX >= 0 && tileX < mapData.width && tileY >= 0 && tileY < mapData.height) {
      selectedTileX = tileX;
      selectedTileY = tileY;
      
    // Even if not drawing, redraw to update the highlight
    safeDrawMap();
    
    // Handle continuous drawing
    if (isDrawing && (tileX !== lastDrawnTileX || tileY !== lastDrawnTileY) && !fillMode) {
      // If we are in erase mode, remove item
      if (eraseMode) {
        removeItemAtTile(tileX, tileY, currentLayer);
      } 
      // If we have a selected item, add it to the map
      else if (selectedItemId !== null) {
        if (clearLowerLayersOnDraw) {
          // Clear all items on this tile on lower layers
          for (let layer = 0; layer <= currentLayer; layer++) {
            removeItemAtTile(tileX, tileY, layer);
          }
        }
        addItemToTile(tileX, tileY, currentLayer, selectedItemId);
      }
      
      // Update the last drawn position
      lastDrawnTileX = tileX;
      lastDrawnTileY = tileY;
    }
    
    // Handle continuous erasing with right mouse button
    if (isErasing && (tileX !== lastDrawnTileX || tileY !== lastDrawnTileY)) {
      removeItemAtTile(tileX, tileY, currentLayer);
      
      // Update the last drawn position
      lastDrawnTileX = tileX;
      lastDrawnTileY = tileY;
    }
  }
}

// Handle mouse down on the map (start drawing)
function handleMapMouseDown(event) {
  // Only process left mouse button
  if (event.button !== 0) return;
  
  isDrawing = true;
  
  const rect = mapCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const tileSize = 32;
  const tileX = Math.floor(x / tileSize / mapZoom);
  const tileY = Math.floor(y / tileSize / mapZoom);
  
  // Make sure the click is within the map bounds
  if (tileX < 0 || tileX >= mapData.width || tileY < 0 || tileY >= mapData.height) {
    return;
  }
  
  // Update selected tile
  selectedTileX = tileX;
  selectedTileY = tileY;
  selectedTileItemIndex = -1; // Reset selected item index
  
  // Update selected tile display
  selectedTilePosition.textContent = `(${selectedTileX}, ${selectedTileY})`;
  
  // Handle different modes
  if (fillEntireMapMode && selectedItemId !== null) {
    // Fill entire map mode
    fillMapWithBoundaries(selectedItemId);
  } else if (fillMode && selectedItemId !== null) {
    // Fill connected tiles
    fillMapArea(selectedTileX, selectedTileY, selectedItemId);
  } else if (eraseMode) {
    // Erase mode - remove item
    removeItemAtTile(selectedTileX, selectedTileY, currentLayer);
  } else if (selectedItemId !== null) {
    // Normal mode - add item
    addItemToTile(selectedTileX, selectedTileY, currentLayer, selectedItemId);
  }
  
  // Remember the last drawn position
  lastDrawnTileX = tileX;
  lastDrawnTileY = tileY;
  
  // Display items on this tile
  displayTileItems(selectedTileX, selectedTileY);
}

// Handle mouse up on the map (stop drawing)
function handleMapMouseUp(event) {
  isDrawing = false;
  isErasing = false;
  lastDrawnTileX = -1;
  lastDrawnTileY = -1;
  document.removeEventListener('mouseup', stopErasing);
}

// Replace the old handleMapClick function
function handleMapClick(event) {
  // This function is now handled by handleMapMouseDown
  // Kept for compatibility with any existing references
  handleMapMouseDown(event);
}

// Add an item to a tile
function addItemToTile(x, y, layer, itemId) {
  // Ensure the layer exists
  if (!mapData.layers[layer]) {
    mapData.layers[layer] = [];
  }
  
  // Check if the item already exists at this location
  const existingTileIndex = mapData.layers[layer].findIndex(tile => 
    tile.x === x && tile.y === y && tile.itemId === itemId
  );
  
  if (existingTileIndex >= 0) {
    // Item already exists, do nothing
    return;
  }
  
  // Add the item to the layer
  mapData.layers[layer].push({
    x: x,
    y: y,
    itemId: itemId
  });
  
  // Redraw the map to reflect changes immediately
  safeDrawMap();
  
  // Save the map
  saveMap();
}

// Display items on a tile
function displayTileItems(x, y) {
  tileItems.innerHTML = '';
  removeItemBtn.disabled = true;
  
  // Collect all items on this tile across all layers
  const tileItemsList = [];
  
  for (let layer = 0; layer < mapData.layers.length; layer++) {
    if (!mapData.layers[layer]) continue;
    
    const layerItems = mapData.layers[layer].filter(tile => tile.x === x && tile.y === y);
    
    layerItems.forEach(tile => {
      const item = items.find(i => i.id === tile.itemId);
      if (item) {
        tileItemsList.push({
          item: item,
          layer: layer,
          index: mapData.layers[layer].indexOf(tile)
        });
      }
    });
  }
  
  if (tileItemsList.length === 0) {
    tileItems.innerHTML = '<p>No items on this tile</p>';
    return;
  }
  
  tileItemsList.forEach((tileItem, index) => {
    const tileItemElement = document.createElement('div');
    tileItemElement.className = 'tile-item';
    
    if (index === selectedTileItemIndex) {
      tileItemElement.classList.add('selected');
      removeItemBtn.disabled = false;
    }
    
    const itemCanvas = document.createElement('canvas');
    itemCanvas.width = 32;
    itemCanvas.height = 32;
    itemCanvas.className = 'tile-item-sprite';
    const itemCtx = itemCanvas.getContext('2d');
    
    // Draw the sprite
    itemCtx.drawImage(
      spriteSheet,
      tileItem.item.sprite.x * SPRITE_SIZE,
      tileItem.item.sprite.y * SPRITE_SIZE,
      SPRITE_SIZE,
      SPRITE_SIZE,
      0, 0,
      32, 32
    );
    
    const itemInfo = document.createElement('div');
    itemInfo.innerHTML = `
      <div>${tileItem.item.name}</div>
      <div style="font-size: 0.8em; color: #666;">Layer: ${tileItem.layer}</div>
    `;
    
    tileItemElement.appendChild(itemCanvas);
    tileItemElement.appendChild(itemInfo);
    
    // Event listener for selecting this item
    tileItemElement.addEventListener('click', () => {
      // Deselect all items
      document.querySelectorAll('.palette-item').forEach(el => {
        el.classList.remove('selected');
      });
      
      // Select this item
      tileItemElement.classList.add('selected');
      selectedTileItemIndex = index;
      
      // Enable the remove button
      document.getElementById('removeItemBtn').disabled = false;
      selectedTileItemId = tileItem.layer + '-' + tileItem.item.id;
    });
    
    tileItems.appendChild(tileItemElement);
  });
}

// Remove the selected item from the tile
function removeSelectedTileItem() {
  if (selectedTileX < 0 || selectedTileY < 0 || selectedTileItemIndex < 0) {
    return;
  }
  
  // Collect all items on this tile across all layers
  const tileItemsList = [];
  
  for (let layer = 0; layer < mapData.layers.length; layer++) {
    if (!mapData.layers[layer]) continue;
    
    const layerItems = mapData.layers[layer].filter(tile => tile.x === selectedTileX && tile.y === selectedTileY);
    
    layerItems.forEach(tile => {
      const item = items.find(i => i.id === tile.itemId);
      if (item) {
        tileItemsList.push({
          item: item,
          layer: layer,
          index: mapData.layers[layer].indexOf(tile)
        });
      }
    });
  }
  
  if (selectedTileItemIndex >= tileItemsList.length) {
    return;
  }
  
  const tileItem = tileItemsList[selectedTileItemIndex];
  
  // Remove the item from the map
  mapData.layers[tileItem.layer].splice(tileItem.index, 1);
  
  // Reset selection
  selectedTileItemIndex = -1;
  
  // Update display
  displayTileItems(selectedTileX, selectedTileY);
  drawMap();
  saveMap();
}

// Save map to the server
function saveMap() {
  fetch('/api/map', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(mapData)
  })
  .then(response => response.json())
  .then(data => {
    console.log('Map saved:', data);
    // Ensure the map is redrawn after saving
    safeDrawMap();
  })
  .catch(error => {
    console.error('Error saving map:', error);
  });
}

// Fetch map from the server
function fetchMap() {
  fetch('/api/map')
    .then(response => response.json())
    .then(data => {
      mapData = data;
      mapWidthInput.value = mapData.width;
      mapHeightInput.value = mapData.height;
      
      // Ensure at least one layer exists
      if (!mapData.layers || mapData.layers.length === 0) {
        mapData.layers = [[]];
      }
      
      currentLayer = 0;
      currentLayerInput.value = currentLayer;
      selectedTileLayer.textContent = currentLayer;
      
      // Reset selections
      selectedTileX = -1;
      selectedTileY = -1;
      selectedTileItemIndex = -1;
      
      drawMap();
    })
    .catch(error => {
      console.error('Error fetching map:', error);
    });
}

// Download the map JSON
function downloadMapJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mapData, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "map.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

// Clear the map
function clearMap() {
  if (confirm('Are you sure you want to clear the map? This will remove all items from all layers.')) {
    mapData.layers = [[]];
    currentLayer = 0;
    currentLayerInput.value = currentLayer;
    selectedTileLayer.textContent = currentLayer;
    
    // Reset selections
    selectedTileX = -1;
    selectedTileY = -1;
    selectedTileItemIndex = -1;
    
    drawMap();
    saveMap();
  }
}

// Toggle erase mode
function toggleEraseMode() {
  eraseMode = eraseModeCheckbox.checked;
  
  if (eraseMode) {
    mapCanvas.classList.add('erase-mode');
  } else {
    mapCanvas.classList.remove('erase-mode');
  }
}

// Handle right click on map for erasing
function handleMapRightClick(event) {
  event.preventDefault(); // Prevent context menu
  
  const rect = mapCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const tileSize = 32;
  const tileX = Math.floor(x / tileSize / mapZoom);
  const tileY = Math.floor(y / tileSize / mapZoom);
  
  // Make sure the click is within the map bounds
  if (tileX < 0 || tileX >= mapData.width || tileY < 0 || tileY >= mapData.height) {
    return;
  }
  
  // Update selected tile
  selectedTileX = tileX;
  selectedTileY = tileY;
  
  // Update selected tile display
  selectedTilePosition.textContent = `(${selectedTileX}, ${selectedTileY})`;
  
  // Remove item at current layer
  removeItemAtTile(selectedTileX, selectedTileY, currentLayer);
  
  // Display items on this tile
  displayTileItems(selectedTileX, selectedTileY);
  
  // Start drag erasing
  isErasing = true;
  lastDrawnTileX = tileX;
  lastDrawnTileY = tileY;
  
  // Add mouse up listener to stop erasing
  document.addEventListener('mouseup', stopErasing);
}

// Function to stop erasing
function stopErasing() {
  isErasing = false;
  lastDrawnTileX = -1;
  lastDrawnTileY = -1;
  document.removeEventListener('mouseup', stopErasing);
}

// Remove an item at a specific tile and layer
function removeItemAtTile(x, y, layer) {
  // Ensure the layer exists
  if (!mapData.layers[layer]) {
    return;
  }
  
  // Find items at this location
  const itemsAtTile = mapData.layers[layer].filter(tile => 
    tile.x === x && tile.y === y
  );
  
  if (itemsAtTile.length === 0) {
    return;
  }
  
  // Remove the items by filtering
  mapData.layers[layer] = mapData.layers[layer].filter(tile => 
    !(tile.x === x && tile.y === y)
  );
  
  // Redraw the map to reflect changes immediately
  safeDrawMap();
  
  // Save the map
  saveMap();
}

// Add sprite variant at specific coordinates
function addSpriteVariantAt(x, y) {
  // Check if this sprite is already in the variants
  const exists = spriteVariants.some(sprite => sprite.x === x && sprite.y === y);
  
  if (!exists) {
    // Add the sprite to variants
    spriteVariants.push({ x: x, y: y });
    renderSpriteVariants();
    
    // Also update quick variants display
    renderQuickVariants();
  }
}

// Add sprite variant
function addSpriteVariant() {
  if (selectedX < 0 || selectedY < 0) {
    alert('Please select a sprite first');
    return;
  }
  
  // Add the selected sprite to variants
  addSpriteVariantAt(selectedX, selectedY);
}

// Clear sprite variants
function clearSpriteVariants() {
  spriteVariants = [];
  renderSpriteVariants();
  renderQuickVariants();
}

// Render sprite variants
function renderSpriteVariants() {
  spriteVariantsContainer.innerHTML = '';
  
  if (spriteVariants.length === 0) {
    return;
  }
  
  spriteVariants.forEach((sprite, index) => {
    const variantCanvas = document.createElement('canvas');
    variantCanvas.width = 32;
    variantCanvas.height = 32;
    variantCanvas.className = 'variant-sprite';
    const variantCtx = variantCanvas.getContext('2d');
    
    // Draw the sprite
    variantCtx.drawImage(
      spriteSheet,
      sprite.x * SPRITE_SIZE,
      sprite.y * SPRITE_SIZE,
      SPRITE_SIZE,
      SPRITE_SIZE,
      0, 0,
      32, 32
    );
    
    // Add click event to remove the variant
    variantCanvas.addEventListener('click', () => {
      spriteVariants.splice(index, 1);
      renderSpriteVariants();
      renderQuickVariants();
    });
    
    spriteVariantsContainer.appendChild(variantCanvas);
  });
}

// Render quick variants for the sprite selection area
function renderQuickVariants() {
  quickVariantsContainer.innerHTML = '';
  
  if (spriteVariants.length === 0) {
    quickVariantsContainer.innerHTML = '<span class="help-text">No sprite variants added yet</span>';
    return;
  }
  
  spriteVariants.forEach((sprite, index) => {
    const variantCanvas = document.createElement('canvas');
    variantCanvas.width = 32;
    variantCanvas.height = 32;
    variantCanvas.className = 'variant-sprite';
    const variantCtx = variantCanvas.getContext('2d');
    
    // Draw the sprite
    variantCtx.drawImage(
      spriteSheet,
      sprite.x * SPRITE_SIZE,
      sprite.y * SPRITE_SIZE,
      SPRITE_SIZE,
      SPRITE_SIZE,
      0, 0,
      32, 32
    );
    
    // Add click event to remove the variant
    variantCanvas.addEventListener('click', () => {
      spriteVariants.splice(index, 1);
      renderSpriteVariants();
      renderQuickVariants();
    });
    
    quickVariantsContainer.appendChild(variantCanvas);
  });
}

// Handle keyboard shortcuts
function handleKeyDown(e) {
  // Only process if we're not in a text input or select
  if (document.activeElement.tagName === 'INPUT' || 
      document.activeElement.tagName === 'SELECT' || 
      document.activeElement.tagName === 'TEXTAREA') {
    return;
  }
  
  // Check which tab is active
  const isItemEditorActive = itemEditorSection.classList.contains('active');
  const isMapEditorActive = mapEditorSection.classList.contains('active');
  const isOutfitEditorActive = outfitEditorSection.classList.contains('active');
  
  if (isItemEditorActive) {
    // Item editor shortcuts
    switch (e.key) {
      case 'F2':
        e.preventDefault();
        addSpriteVariant();
        break;
      case 'F3':
        e.preventDefault();
        clearSpriteVariants();
        break;
      case 's':
        if (e.ctrlKey) {
          e.preventDefault();
          addOrUpdateItem();
        }
        break;
      case 'Escape':
        e.preventDefault();
        clearForm();
        break;
      case '+':
      case '=':
        e.preventDefault();
        zoomIn();
        break;
      case '-':
      case '_':
        e.preventDefault();
        zoomOut();
        break;
    }
  } else if (isMapEditorActive) {
    // Map editor shortcuts
    switch (e.key) {
      case 'e':
        e.preventDefault();
        eraseModeCheckbox.checked = !eraseModeCheckbox.checked;
        toggleEraseMode();
        break;
      case 'ArrowUp':
        if (e.ctrlKey) {
          e.preventDefault();
          layerUp();
        }
        break;
      case 'ArrowDown':
        if (e.ctrlKey) {
          e.preventDefault();
          layerDown();
        }
        break;
      case 's':
        if (e.ctrlKey) {
          e.preventDefault();
          saveMap();
        }
        break;
    }
  } else if (isOutfitEditorActive) {
    // Outfit editor shortcuts
    switch (e.key) {
      case '+':
      case '=':
        e.preventDefault();
        outfitZoomIn();
        break;
      case '-':
      case '_':
        e.preventDefault();
        outfitZoomOut();
        break;
      case 's':
        if (e.ctrlKey) {
          e.preventDefault();
          saveOutfit();
        }
        break;
      case 'Escape':
        e.preventDefault();
        clearOutfitForm();
        break;
    }
  }
}

// ==================== OUTFIT EDITOR FUNCTIONS ====================

// Draw the outfit sprite sheet
function drawOutfitSpriteSheet() {
  // Resize canvas if needed to fit sprite sheet
  if (outfitSpriteCanvas.width < spriteSheet.width * outfitScale || 
      outfitSpriteCanvas.height < spriteSheet.height * outfitScale) {
    outfitSpriteCanvas.width = Math.max(400, spriteSheet.width * outfitScale);
    outfitSpriteCanvas.height = Math.max(300, spriteSheet.height * outfitScale);
  }
  
  // Clear the canvas
  outfitSpriteCtx.clearRect(0, 0, outfitSpriteCanvas.width, outfitSpriteCanvas.height);
  
  // Draw the sprite sheet with the current scale and offset
  outfitSpriteCtx.drawImage(
    spriteSheet, 
    outfitOffsetX, outfitOffsetY, 
    outfitSpriteCanvas.width / outfitScale, 
    outfitSpriteCanvas.height / outfitScale, 
    0, 0, 
    outfitSpriteCanvas.width, 
    outfitSpriteCanvas.height
  );
  
  // Draw the grid
  drawOutfitGrid();
  
  // Highlight the selected sprite if any
  if (selectedOutfitX >= 0 && selectedOutfitY >= 0) {
    highlightSelectedOutfitSprite();
  }
}

// Draw the grid overlay on the outfit sprite sheet
function drawOutfitGrid() {
  outfitSpriteCtx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
  outfitSpriteCtx.lineWidth = 1;
  
  // Calculate the starting points based on offset and scale
  const startX = (outfitOffsetX % SPRITE_SIZE) * outfitScale;
  const startY = (outfitOffsetY % SPRITE_SIZE) * outfitScale;
  
  // Draw vertical lines
  for (let x = -startX; x < outfitSpriteCanvas.width; x += SPRITE_SIZE * outfitScale) {
    outfitSpriteCtx.beginPath();
    outfitSpriteCtx.moveTo(x, 0);
    outfitSpriteCtx.lineTo(x, outfitSpriteCanvas.height);
    outfitSpriteCtx.stroke();
  }
  
  // Draw horizontal lines
  for (let y = -startY; y < outfitSpriteCanvas.height; y += SPRITE_SIZE * outfitScale) {
    outfitSpriteCtx.beginPath();
    outfitSpriteCtx.moveTo(0, y);
    outfitSpriteCtx.lineTo(outfitSpriteCanvas.width, y);
    outfitSpriteCtx.stroke();
  }
}

// Highlight the selected outfit sprite
function highlightSelectedOutfitSprite() {
  const spriteX = (selectedOutfitX * SPRITE_SIZE - outfitOffsetX) * outfitScale;
  const spriteY = (selectedOutfitY * SPRITE_SIZE - outfitOffsetY) * outfitScale;
  
  outfitSpriteCtx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
  outfitSpriteCtx.lineWidth = 2;
  outfitSpriteCtx.strokeRect(spriteX, spriteY, SPRITE_SIZE * outfitScale, SPRITE_SIZE * outfitScale);
}

// Handle mouse movement over the outfit sprite sheet
function handleOutfitMouseMove(event) {
  const rect = outfitSpriteCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Calculate sprite coordinates
  const spriteX = Math.floor((x / outfitScale) + outfitOffsetX) / SPRITE_SIZE;
  const spriteY = Math.floor((y / outfitScale) + outfitOffsetY) / SPRITE_SIZE;
  
  // We don't need to update coordinates here since we don't have a coordinates display for outfits
}

// Handle clicking on an outfit sprite
function handleOutfitSpriteClick(event) {
  const rect = outfitSpriteCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Calculate sprite coordinates
  const spriteX = Math.floor((x / outfitScale + outfitOffsetX) / SPRITE_SIZE);
  const spriteY = Math.floor((y / outfitScale + outfitOffsetY) / SPRITE_SIZE);
  
  if (currentAddonSelect) {
    // If we're in addon selection mode, set the addon
    setAddon(currentAddonSelect, spriteX, spriteY);
    currentAddonSelect = null; // Exit addon selection mode
  } else {
    // Normal outfit selection
    selectedOutfitX = spriteX;
    selectedOutfitY = spriteY;
    
    // Update the selected position display
    selectedOutfitPosition.textContent = `(${selectedOutfitX}, ${selectedOutfitY})`;
    
    // Redraw the preview
    drawOutfitPreview();
  }
  
  // Redraw the sprite sheet to show the selection
  drawOutfitSpriteSheet();
}

// Outfit zoom in function
function outfitZoomIn() {
  if (outfitScale < 3) {
    outfitScale += 0.25;
    drawOutfitSpriteSheet();
  }
}

// Outfit zoom out function
function outfitZoomOut() {
  if (outfitScale > 0.5) {
    outfitScale -= 0.25;
    drawOutfitSpriteSheet();
  }
}

// Start the addon selection mode
function startAddonSelection(addonType) {
  currentAddonSelect = addonType;
  // Highlight the outfit sprite sheet to indicate selection mode
  outfitSpriteCanvas.style.border = '2px solid #ff9800';
}

// Set an addon at the specified coordinates
function setAddon(addonType, x, y) {
  outfitAddons[addonType] = { x, y };
  
  // Remove selection highlight
  outfitSpriteCanvas.style.border = '1px solid #ddd';
  
  // Update the addon preview
  drawAddonPreview(addonType);
  
  // Update the full outfit preview
  drawOutfitPreview();
}

// Clear an addon
function clearAddon(addonType) {
  outfitAddons[addonType] = null;
  
  // Clear the addon canvas
  const canvas = document.getElementById(`${addonType}Canvas`);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Update the full outfit preview
  drawOutfitPreview();
}

// Draw an addon preview
function drawAddonPreview(addonType) {
  const addon = outfitAddons[addonType];
  if (!addon) return;
  
  const canvas = document.getElementById(`${addonType}Canvas`);
  const ctx = canvas.getContext('2d');
  
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw the addon sprite
  ctx.drawImage(
    spriteSheet,
    addon.x * SPRITE_SIZE,
    addon.y * SPRITE_SIZE,
    SPRITE_SIZE,
    SPRITE_SIZE,
    0, 0,
    canvas.width,
    canvas.height
  );
}

// Draw the full outfit preview
function drawOutfitPreview() {
  // Clear the canvas
  outfitPreviewCtx.clearRect(0, 0, outfitPreviewCanvas.width, outfitPreviewCanvas.height);
  
  // Get the outfit type
  const outfitType = getSelectedOutfitType();
  
  // First draw the wings if they exist (behind everything)
  if (outfitType !== 'full' || currentOutfitIndex < 0) {
    if (outfitAddons.wings) {
      outfitPreviewCtx.drawImage(
        spriteSheet,
        outfitAddons.wings.x * SPRITE_SIZE,
        outfitAddons.wings.y * SPRITE_SIZE,
        SPRITE_SIZE,
        SPRITE_SIZE,
        0, 0,
        outfitPreviewCanvas.width,
        outfitPreviewCanvas.height
      );
    }
  }
  
  // Draw the base outfit if it's full or both, or if there's no selection yet
  if (outfitType !== 'addon' || currentOutfitIndex < 0) {
    if (selectedOutfitX >= 0 && selectedOutfitY >= 0) {
      outfitPreviewCtx.drawImage(
        spriteSheet,
        selectedOutfitX * SPRITE_SIZE,
        selectedOutfitY * SPRITE_SIZE,
        SPRITE_SIZE,
        SPRITE_SIZE,
        0, 0,
        outfitPreviewCanvas.width,
        outfitPreviewCanvas.height
      );
    }
  }
  
  // Draw the remaining addons if it's addon or both, or if there's no selection yet
  if (outfitType !== 'full' || currentOutfitIndex < 0) {
    // Draw each addon on top of the base, except wings which are already drawn behind the outfit
    Object.entries(outfitAddons).forEach(([type, addon]) => {
      // Skip wings as they were already drawn behind the outfit
      if (addon && type !== 'wings') {
        outfitPreviewCtx.drawImage(
          spriteSheet,
          addon.x * SPRITE_SIZE,
          addon.y * SPRITE_SIZE,
          SPRITE_SIZE,
          SPRITE_SIZE,
          0, 0,
          outfitPreviewCanvas.width,
          outfitPreviewCanvas.height
        );
      }
    });
  }
}

// Get the selected outfit type
function getSelectedOutfitType() {
  for (const radio of outfitTypeRadios) {
    if (radio.checked) {
      return radio.value;
    }
  }
  return 'full'; // Default
}

// Add a new outfit
function addOutfit() {
  // Validate inputs
  if (!outfitNameInput.value) {
    alert('Please enter an outfit name');
    return;
  }
  
  const outfitType = getSelectedOutfitType();
  
  if (outfitType === 'full' || outfitType === 'both') {
    if (selectedOutfitX < 0 || selectedOutfitY < 0) {
      alert('Please select a base outfit sprite');
      return;
    }
  }
  
  if (outfitType === 'addon' || outfitType === 'both') {
    const hasAddons = Object.values(outfitAddons).some(addon => addon !== null);
    if (!hasAddons) {
      alert('Please select at least one addon');
      return;
    }
  }
  
  // Create the outfit object
  const outfit = {
    id: outfitIdInput.value ? parseInt(outfitIdInput.value) : outfits.length + 1,
    name: outfitNameInput.value,
    type: outfitType
  };
  
  // Add base outfit if applicable
  if (outfitType === 'full' || outfitType === 'both') {
    outfit.baseSprite = {
      x: selectedOutfitX,
      y: selectedOutfitY
    };
  }
  
  // Add addons if applicable
  if (outfitType === 'addon' || outfitType === 'both') {
    outfit.addons = {};
    
    // Only include non-null addons
    Object.entries(outfitAddons).forEach(([type, addon]) => {
      if (addon) {
        outfit.addons[type] = addon;
      }
    });
  }
  
  // Add to outfits array
  outfits.push(outfit);
  
  // Reset form and update UI
  clearOutfitForm();
  renderOutfitsList();
  saveOutfits();
}

// Update an existing outfit
function updateOutfit() {
  if (currentOutfitIndex < 0) return;
  
  // Validate inputs
  if (!outfitNameInput.value) {
    alert('Please enter an outfit name');
    return;
  }
  
  const outfitType = getSelectedOutfitType();
  
  if (outfitType === 'full' || outfitType === 'both') {
    if (selectedOutfitX < 0 || selectedOutfitY < 0) {
      alert('Please select a base outfit sprite');
      return;
    }
  }
  
  if (outfitType === 'addon' || outfitType === 'both') {
    const hasAddons = Object.values(outfitAddons).some(addon => addon !== null);
    if (!hasAddons) {
      alert('Please select at least one addon');
      return;
    }
  }
  
  // Create the outfit object
  const outfit = {
    id: outfits[currentOutfitIndex].id,
    name: outfitNameInput.value,
    type: outfitType
  };
  
  // Add base outfit if applicable
  if (outfitType === 'full' || outfitType === 'both') {
    outfit.baseSprite = {
      x: selectedOutfitX,
      y: selectedOutfitY
    };
  }
  
  // Add addons if applicable
  if (outfitType === 'addon' || outfitType === 'both') {
    outfit.addons = {};
    
    // Only include non-null addons
    Object.entries(outfitAddons).forEach(([type, addon]) => {
      if (addon) {
        outfit.addons[type] = addon;
      }
    });
  }
  
  // Update the outfit
  outfits[currentOutfitIndex] = outfit;
  
  // Reset form and update UI
  clearOutfitForm();
  renderOutfitsList();
  saveOutfits();
}

// Clear the outfit form
function clearOutfitForm() {
  outfitNameInput.value = '';
  outfitIdInput.value = '';
  document.getElementById('typeFullOutfit').checked = true; // Reset to full outfit
  
  // Clear all addons
  Object.keys(outfitAddons).forEach(type => {
    clearAddon(type);
  });
  
  // Reset selection
  selectedOutfitX = -1;
  selectedOutfitY = -1;
  selectedOutfitPosition.textContent = 'None';
  
  // Reset UI
  currentOutfitIndex = -1;
  addOutfitBtn.style.display = 'block';
  updateOutfitBtn.style.display = 'none';
  
  // Redraw preview
  drawOutfitPreview();
  drawOutfitSpriteSheet();
}

// Render the outfits list
function renderOutfitsList() {
  outfitsList.innerHTML = '';
  
  if (outfits.length === 0) {
    outfitsList.innerHTML = '<p>No outfits created yet</p>';
    return;
  }
  
  outfits.forEach((outfit, index) => {
    const outfitCard = document.createElement('div');
    outfitCard.className = 'outfit-card';
    
    // Create the card header
    const header = document.createElement('div');
    header.className = 'outfit-card-header';
    
    // Create a canvas for the preview
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = 64;
    previewCanvas.height = 64;
    previewCanvas.className = 'outfit-sprite';
    const previewCtx = previewCanvas.getContext('2d');
    
    // Draw the preview
    if (outfit.type === 'full' || outfit.type === 'both') {
      // Draw base outfit
      previewCtx.drawImage(
        spriteSheet,
        outfit.baseSprite.x * SPRITE_SIZE,
        outfit.baseSprite.y * SPRITE_SIZE,
        SPRITE_SIZE,
        SPRITE_SIZE,
        0, 0,
        64, 64
      );
    }
    
    if (outfit.type === 'addon' || outfit.type === 'both') {
      // Draw addons
      Object.values(outfit.addons).forEach(addon => {
        previewCtx.drawImage(
          spriteSheet,
          addon.x * SPRITE_SIZE,
          addon.y * SPRITE_SIZE,
          SPRITE_SIZE,
          SPRITE_SIZE,
          0, 0,
          64, 64
        );
      });
    }
    
    const title = document.createElement('h3');
    title.textContent = `${outfit.name} (ID: ${outfit.id})`;
    
    header.appendChild(previewCanvas);
    header.appendChild(title);
    
    // Create the outfit info
    const info = document.createElement('div');
    info.className = 'outfit-info';
    
    const typeInfo = document.createElement('p');
    typeInfo.textContent = `Type: ${outfit.type.charAt(0).toUpperCase() + outfit.type.slice(1)}`;
    info.appendChild(typeInfo);
    
    // Create the outfit addons section if applicable
    if (outfit.type === 'addon' || outfit.type === 'both') {
      const addonsSection = document.createElement('div');
      addonsSection.className = 'outfit-card-content';
      
      const addonsTitle = document.createElement('h4');
      addonsTitle.textContent = 'Addons:';
      addonsTitle.style.width = '100%';
      addonsSection.appendChild(addonsTitle);
      
      // Add each addon preview
      Object.entries(outfit.addons).forEach(([type, addon]) => {
        const addonCanvas = document.createElement('canvas');
        addonCanvas.width = 40;
        addonCanvas.height = 40;
        addonCanvas.className = 'outfit-addon';
        const addonCtx = addonCanvas.getContext('2d');
        
        addonCtx.drawImage(
          spriteSheet,
          addon.x * SPRITE_SIZE,
          addon.y * SPRITE_SIZE,
          SPRITE_SIZE,
          SPRITE_SIZE,
          0, 0,
          40, 40
        );
        
        const addonWrapper = document.createElement('div');
        addonWrapper.className = 'addon-wrapper';
        
        const addonLabel = document.createElement('div');
        addonLabel.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        addonLabel.style.fontSize = '0.8em';
        addonLabel.style.textAlign = 'center';
        
        addonWrapper.appendChild(addonCanvas);
        addonWrapper.appendChild(addonLabel);
        addonsSection.appendChild(addonWrapper);
      });
      
      outfitCard.appendChild(addonsSection);
    }
    
    // Create action buttons
    const actions = document.createElement('div');
    actions.className = 'outfit-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => editOutfit(index);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteOutfit(index);
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    // Assemble the card
    outfitCard.appendChild(header);
    outfitCard.appendChild(info);
    outfitCard.appendChild(actions);
    
    outfitsList.appendChild(outfitCard);
  });
}

// Edit an outfit
function editOutfit(index) {
  const outfit = outfits[index];
  
  // Set form values
  outfitNameInput.value = outfit.name;
  outfitIdInput.value = outfit.id;
  
  // Set outfit type
  document.getElementById(`type${outfit.type.charAt(0).toUpperCase() + outfit.type.slice(1)}`).checked = true;
  
  // Clear all addons first
  Object.keys(outfitAddons).forEach(type => {
    clearAddon(type);
  });
  
  // Set base outfit if applicable
  if (outfit.type === 'full' || outfit.type === 'both') {
    selectedOutfitX = outfit.baseSprite.x;
    selectedOutfitY = outfit.baseSprite.y;
    selectedOutfitPosition.textContent = `(${selectedOutfitX}, ${selectedOutfitY})`;
  } else {
    selectedOutfitX = -1;
    selectedOutfitY = -1;
    selectedOutfitPosition.textContent = 'None';
  }
  
  // Set addons if applicable
  if (outfit.type === 'addon' || outfit.type === 'both') {
    Object.entries(outfit.addons).forEach(([type, addon]) => {
      outfitAddons[type] = addon;
      drawAddonPreview(type);
    });
  }
  
  // Update UI
  currentOutfitIndex = index;
  addOutfitBtn.style.display = 'none';
  updateOutfitBtn.style.display = 'block';
  
  // Redraw preview
  drawOutfitPreview();
  drawOutfitSpriteSheet();
}

// Delete an outfit
function deleteOutfit(index) {
  if (confirm(`Are you sure you want to delete "${outfits[index].name}"?`)) {
    outfits.splice(index, 1);
    renderOutfitsList();
    saveOutfits();
  }
}

// Save outfits to the server
function saveOutfits() {
  fetch('/api/outfits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(outfits)
  })
  .then(response => response.json())
  .then(data => {
    console.log('Outfits saved:', data);
  })
  .catch(error => {
    console.error('Error saving outfits:', error);
  });
}

// Fetch outfits from the server
function fetchOutfits() {
  fetch('/api/outfits')
    .then(response => response.json())
    .then(data => {
      outfits = data;
      renderOutfitsList();
    })
    .catch(error => {
      console.error('Error fetching outfits:', error);
    });
}

// Download the outfits JSON
function downloadOutfitsJson() {
  if (outfits.length === 0) {
    alert('No outfits to download');
    return;
  }
  
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(outfits, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "outfits.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

// ==================== ANIMATION FUNCTIONS ====================

// Toggle animation options based on checkbox
function toggleAnimationOptions() {
  animationSpeedInput.disabled = !isAnimatedCheckbox.checked;
}

// Function to handle the map fill operation
function fillMapArea(x, y, itemId) {
  if (!mapData.layers[currentLayer]) {
    mapData.layers[currentLayer] = [];
  }
  
  // Get the target tile to determine what we're replacing
  const targetTiles = mapData.layers[currentLayer].filter(tile => 
    tile.x === x && tile.y === y
  );
  
  // Create a visited map to prevent revisiting the same tiles
  const visited = Array(mapData.width).fill().map(() => Array(mapData.height).fill(false));
  
  // Define recursive fill function
  function floodFill(x, y) {
    // Check boundaries
    if (x < 0 || x >= mapData.width || y < 0 || y >= mapData.height) {
      return;
    }
    
    // Check if already visited
    if (visited[x][y]) {
      return;
    }
    
    // Mark as visited
    visited[x][y] = true;
    
    // Check if this tile should be filled
    const currentTiles = mapData.layers[currentLayer].filter(tile => 
      tile.x === x && tile.y === y
    );
    
    // If it's not the same as our target, stop
    if (targetTiles.length > 0 && currentTiles.length > 0) {
      // If the tiles have different items, don't fill
      if (!currentTiles.every(ct => 
        targetTiles.some(tt => tt.itemId === ct.itemId)
      )) {
        return;
      }
    } else if (targetTiles.length === 0 && currentTiles.length > 0) {
      // Target is empty but current has items, stop
      return;
    } else if (targetTiles.length > 0 && currentTiles.length === 0) {
      // Target has items but current is empty, continue
    }
    
    // Remove existing items at this location
    mapData.layers[currentLayer] = mapData.layers[currentLayer].filter(tile => 
      !(tile.x === x && tile.y === y)
    );
    
    // Add the new item
    if (itemId !== null) {
      addItemToTile(x, y, currentLayer, itemId);
    }
    
    // Continue filling in each direction
    floodFill(x + 1, y);
    floodFill(x - 1, y);
    floodFill(x, y + 1);
    floodFill(x, y - 1);
  }
  
  // Start the fill process
  floodFill(x, y);
  
  // Redraw the map
  drawMap();
  
  // Save the map
  saveMap();
}

// When we create and add UI components, let's call a function to do this after DOM elements are available
function initializeMapEditorExtras() {
  // Set up event handlers
  const mapCanvas = document.getElementById('mapCanvas');
  const eraseModeCheckbox = document.getElementById('eraseMode');
  const removeItemBtn = document.getElementById('removeItemBtn');
  const toggleControlsBtn = document.getElementById('toggleControlsBtn');
  const mapControlsContainer = document.querySelector('.map-controls-container');
  
  // Set up controls toggle functionality
  if (toggleControlsBtn && mapControlsContainer) {
    toggleControlsBtn.addEventListener('click', function() {
      mapControlsContainer.classList.toggle('collapsed');
      
      if (mapControlsContainer.classList.contains('collapsed')) {
        toggleControlsBtn.textContent = 'Show Controls';
      } else {
        toggleControlsBtn.textContent = 'Hide Controls';
      }
    });
  }
  
  // Create and add fill mode toggle button
  const fillModeToggle = document.createElement('div');
  fillModeToggle.className = 'fill-mode-toggle map-control';
  fillModeToggle.innerHTML = `
    <label>
      <input type="checkbox" id="fillMode">
      Fill Mode
    </label>
  `;
  
  // Create and add map editor controls container
  const mapControls = document.createElement('div');
  mapControls.className = 'map-controls';
  
  // Create buttons and controls
  const fillEntireMapBtn = document.createElement('button');
  fillEntireMapBtn.id = 'fillEntireMap';
  fillEntireMapBtn.className = 'btn btn-sm btn-outline-secondary map-control';
  fillEntireMapBtn.textContent = 'Fill Entire Map';
  
  const fillMapWithBoundariesBtn = document.createElement('button');
  fillMapWithBoundariesBtn.id = 'fillMapWithBoundaries';
  fillMapWithBoundariesBtn.className = 'btn btn-sm btn-outline-secondary map-control';
  fillMapWithBoundariesBtn.textContent = 'Fill Open Areas';
  
  const resetSelectedBtn = document.createElement('button');
  resetSelectedBtn.id = 'resetSelected';
  resetSelectedBtn.className = 'btn btn-sm btn-outline-secondary map-control';
  resetSelectedBtn.textContent = 'Reset Selected';
  
  // Create animation toggle
  const animationToggle = document.createElement('div');
  animationToggle.className = 'animation-toggle map-control';
  animationToggle.innerHTML = `
    <label>
      <input type="checkbox" id="animationsEnabled" checked>
      Enable Animations
    </label>
  `;
  
  // Create clear lower layers toggle
  const clearLayersToggle = document.createElement('div');
  clearLayersToggle.className = 'clear-layers-toggle map-control';
  clearLayersToggle.innerHTML = `
    <label>
      <input type="checkbox" id="clearLowerLayers">
      Clear Lower Layers
    </label>
  `;
  
  // Add the controls to the container
  mapControls.appendChild(fillModeToggle);
  mapControls.appendChild(fillEntireMapBtn);
  mapControls.appendChild(fillMapWithBoundariesBtn);
  mapControls.appendChild(resetSelectedBtn);
  mapControls.appendChild(animationToggle);
  mapControls.appendChild(clearLayersToggle);
  
  // Create movement speed control
  const movementSpeedControl = document.createElement('div');
  movementSpeedControl.className = 'movement-speed-control map-control';
  movementSpeedControl.innerHTML = `
    <label for="movementSpeed">Movement Speed: </label>
    <input type="range" id="movementSpeed" min="1" max="10" value="5" style="vertical-align: middle;">
    <span id="movementSpeedValue">5</span>
  `;
  
  // Create and add map scroll/movement info
  const mapScrollInfo = document.createElement('div');
  mapScrollInfo.className = 'map-scroll-info';
  mapScrollInfo.innerHTML = `
    <div id="mapCoordinates">X: 0, Y: 0</div>
    <div>Selected Item: <span id="selectedItemDisplay">None</span></div>
    <div>Layer: <span id="selectedTileLayer">0</span></div>
  `;
  
  // Create and add resize controls
  const resizeControls = document.createElement('div');
  resizeControls.className = 'resize-controls map-control';
  resizeControls.innerHTML = `
    <button id="enlargeMapEditor" class="btn btn-sm btn-outline-secondary">1.5x</button>
    <button id="largeMapEditor" class="btn btn-sm btn-outline-secondary">2x</button>
    <button id="fullscreenMapEditor" class="btn btn-sm btn-outline-secondary">Full</button>
    <button id="resetMapEditorSize" class="btn btn-sm btn-outline-secondary">Reset</button>
  `;
  
  // Create and add custom size inputs
  const customSizeControls = document.createElement('div');
  customSizeControls.className = 'custom-size-controls map-control';
  customSizeControls.innerHTML = `
    <input type="number" id="customMapWidth" placeholder="Width" min="400" value="800">
    <input type="number" id="customMapHeight" placeholder="Height" min="300" value="600">
    <button id="applyCustomSize" class="btn btn-sm btn-outline-secondary">Set Size</button>
  `;
  
  // Add FPS counter
  const fpsCounter = document.createElement('div');
  fpsCounter.id = 'fpsCounter';
  fpsCounter.className = 'fps-counter';
  fpsCounter.textContent = 'FPS: 0';
  
  // Find a good place to add these elements
  const mapEditorContainer = document.querySelector('.map-editor-container');
  const tileInfoSection = document.querySelector('.tile-info');
  
  // Create a container for all map editor controls
  const mapEditorControls = document.createElement('div');
  mapEditorControls.className = 'map-editor-controls';
  
  // Add the controls to this container
  mapEditorControls.appendChild(mapControls);
  mapEditorControls.appendChild(movementSpeedControl);
  mapEditorControls.appendChild(mapScrollInfo);
  mapEditorControls.appendChild(resizeControls);
  mapEditorControls.appendChild(customSizeControls);
  mapEditorControls.appendChild(fpsCounter);
  
  // Add the controls after the tile information section
  if (tileInfoSection && !document.querySelector('.map-editor-controls')) {
    tileInfoSection.after(mapEditorControls);
  }
  
  // Create an improved items panel - only if one doesn't already exist
  let existingItemsPanel = document.getElementById('itemsPanel');
  if (!existingItemsPanel) {
    const itemsPanel = document.createElement('div');
    itemsPanel.id = 'itemsPanel';
    itemsPanel.className = 'items-panel';
    itemsPanel.innerHTML = `
      <div class="items-header">
        <h3>Items</h3>
        <div class="view-controls">
          <button id="gridViewBtn" class="view-btn active" title="Grid View">□□□</button>
          <button id="listViewBtn" class="view-btn" title="List View">≡</button>
        <button id="toggleItemsPanel">▢</button>
        </div>
      </div>
      <div class="items-search">
        <input type="text" id="itemSearch" placeholder="Search items...">
        <div class="items-categories">
          <button class="category-btn active" data-category="all">All</button>
          <button class="category-btn" data-category="ground">Ground</button>
          <button class="category-btn" data-category="wall">Wall</button>
          <button class="category-btn" data-category="decoration">Decoration</button>
          <button class="category-btn" data-category="item">Items</button>
        </div>
      </div>
      <div id="itemPaletteContainer" class="items-list-container">
        <div id="itemPalette" class="items-list grid-view"></div>
      </div>
    `;
    
    // Add the items panel to the map editor container
    if (mapEditorContainer) {
      mapEditorContainer.prepend(itemsPanel);
    }
  }
  
  // Set up event listeners
  const fillModeCheckbox = document.getElementById('fillMode');
  if (fillModeCheckbox) {
    fillModeCheckbox.addEventListener('change', toggleFillMode);
  }
  
  // Add event listeners for the new controls
  const animationsEnabledCheckbox = document.getElementById('animationsEnabled');
  if (animationsEnabledCheckbox) {
    animationsEnabledCheckbox.addEventListener('change', function() {
      animationsEnabled = this.checked;
      safeDrawMap(); // Redraw the map with new animation setting
    });
  }
  
  const clearLowerLayersCheckbox = document.getElementById('clearLowerLayers');
  if (clearLowerLayersCheckbox) {
    clearLowerLayersCheckbox.addEventListener('change', function() {
      clearLowerLayersOnDraw = this.checked;
    });
  }
  
  const resetSelectedButton = document.getElementById('resetSelected');
  if (resetSelectedButton) {
    resetSelectedButton.addEventListener('click', function() {
      // Deselect the current item
      selectedItemId = null;
      
      // Remove selected class from all palette items
      document.querySelectorAll('.palette-item.selected').forEach(el => {
        el.classList.remove('selected');
      });
      
      // Update display
      const selectedItemDisplay = document.getElementById('selectedItemDisplay');
      if (selectedItemDisplay) {
        selectedItemDisplay.textContent = 'None';
      }
    });
  }
  
  if (fillEntireMapBtn) {
    fillEntireMapBtn.addEventListener('click', () => {
      if (selectedItemId) {
        fillEntireMap(selectedItemId);
      } else {
        alert('Please select an item first');
      }
    });
  }
  
  if (fillMapWithBoundariesBtn) {
    fillMapWithBoundariesBtn.addEventListener('click', () => {
      if (selectedItemId) {
        fillMapWithBoundaries(selectedItemId);
      } else {
        alert('Please select an item first');
      }
    });
  }
  
  // Resize buttons
  const enlargeBtn = document.getElementById('enlargeMapEditor');
  const largeBtn = document.getElementById('largeMapEditor');
  const fullscreenBtn = document.getElementById('fullscreenMapEditor');
  const resetSizeBtn = document.getElementById('resetMapEditorSize');
  
  if (enlargeBtn) {
    enlargeBtn.addEventListener('click', () => resizeMapEditor(1.5));
  }
  
  if (largeBtn) {
    largeBtn.addEventListener('click', () => resizeMapEditor(2));
  }
  
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      const windowWidth = window.innerWidth - 50;
      const windowHeight = window.innerHeight - 200;
      resizeMapEditor(1, windowWidth, windowHeight);
    });
  }
  
  if (resetSizeBtn) {
    resetSizeBtn.addEventListener('click', () => resizeMapEditor(1));
  }
  
  // Custom size controls
  const applyCustomSizeBtn = document.getElementById('applyCustomSize');
  if (applyCustomSizeBtn) {
    applyCustomSizeBtn.addEventListener('click', () => {
      const width = parseInt(document.getElementById('customMapWidth').value);
      const height = parseInt(document.getElementById('customMapHeight').value);
      
      if (width && height && width >= 400 && height >= 300) {
        resizeMapEditor(1, width, height);
      } else {
        alert('Please enter valid dimensions (width min: 400, height min: 300)');
      }
    });
  }
  
  // Set up items panel toggle
  const toggleItemsPanelBtn = document.getElementById('toggleItemsPanel');
  if (toggleItemsPanelBtn) {
    toggleItemsPanelBtn.addEventListener('click', toggleItemsPanel);
  }
  
  // Set up item search
  const itemSearch = document.getElementById('itemSearch');
  if (itemSearch) {
    itemSearch.addEventListener('input', filterItems);
  }
  
  // Set up item category buttons
  const categoryButtons = document.querySelectorAll('.category-btn');
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      categoryButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      renderItemPalette();
    });
  });
  
  // Movement speed control
  const movementSpeedInput = document.getElementById('movementSpeed');
  const movementSpeedValue = document.getElementById('movementSpeedValue');
  
  if (movementSpeedInput && movementSpeedValue) {
    movementSpeedInput.addEventListener('input', () => {
      const value = movementSpeedInput.value;
      movementSpeed = parseInt(value);
      movementSpeedValue.textContent = value;
    });
  }
  
  // Set up FPS counter
  setupFPSCounter();
  
  // Apply the improved layout to the map editor
  setupImprovedLayout();
  
  // Set up event listeners for view toggle buttons
  const gridViewBtn = document.getElementById('gridViewBtn');
  const listViewBtn = document.getElementById('listViewBtn');
  const itemPalette = document.getElementById('itemPalette');
  
  if (gridViewBtn && listViewBtn && itemPalette) {
    gridViewBtn.addEventListener('click', () => {
      gridViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
      itemPalette.classList.remove('list-view');
      itemPalette.classList.add('grid-view');
      renderItemPalette();
    });
    
    listViewBtn.addEventListener('click', () => {
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
      itemPalette.classList.remove('grid-view');
      itemPalette.classList.add('list-view');
      renderItemPalette();
    });
  }
}

// Function to toggle items panel
function toggleItemsPanel() {
  const itemsPanel = document.getElementById('itemsPanel');
  itemsPanelVisible = !itemsPanelVisible;
  
  if (itemsPanel) {
    if (itemsPanelVisible) {
      itemsPanel.classList.remove('collapsed');
      document.getElementById('toggleItemsPanel').textContent = "▢";
    } else {
      itemsPanel.classList.add('collapsed');
      document.getElementById('toggleItemsPanel').textContent = "☰";
    }
    
    // Trigger resize to adjust map area
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }
}

// Filter items based on search input and category
function filterItems() {
  // Just call renderItemPalette which now handles all filtering
  renderItemPalette();
}

// Setup improved layout
function setupImprovedLayout() {
  // Reorganize the map editor container
  const mapEditorContainer = document.querySelector('.map-editor-container');
  if (!mapEditorContainer) return;
  
  // Add CSS to position the items panel on the left and the map content on the right
  const style = document.createElement('style');
  style.textContent = `
    .map-editor-container {
      display: flex;
      flex-direction: row;
      height: 100%;
      min-height: 600px;
      position: relative;
    }
    
    .items-panel {
      width: 250px;
      height: 100%;
      border-right: 1px solid #ccc;
      background: #f5f5f5;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      flex-shrink: 0;
    }
    
    .items-panel.collapsed {
      width: 40px;
    }
    
    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: #4CAF50;
      color: white;
    }
    
    .view-controls {
      display: flex;
      gap: 5px;
    }
    
    .view-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 2px 5px;
      border-radius: 3px;
    }
    
    .view-btn.active {
      background: rgba(255,255,255,0.2);
    }
    
    .items-header h3 {
      margin: 0;
    }
    
    .items-header button {
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
    }
    
    .items-search {
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
    
    .items-search input {
      width: 100%;
      padding: 5px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 5px;
    }
    
    .items-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 5px;
    }
    
    .category-btn {
      padding: 3px 5px;
      font-size: 0.8em;
      background: #eee;
      border: 1px solid #ddd;
      border-radius: 3px;
      cursor: pointer;
    }
    
    .category-btn.active {
      background: #4CAF50;
      color: white;
      border-color: #4CAF50;
    }
    
    .items-list-container {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }
    
    .items-list {
      height: 100%;
    }
    
    .items-list.grid-view {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5px;
    }
    
    .items-list.list-view {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    
    .palette-item {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 5px;
      background: white;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .palette-item:hover {
      background: #f0f0f0;
    }
    
    .palette-item.selected {
      border-color: #4CAF50;
      background: rgba(76, 175, 80, 0.2);
    }
    
    .palette-item.grid-item {
      text-align: center;
    }
    
    .palette-item.list-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .item-info {
      display: flex;
      flex-direction: column;
    }
    
    .item-id {
      font-size: 0.8em;
      color: #666;
    }
    
    .item-name {
      font-weight: bold;
    }
    
    .palette-item-info {
      font-size: 0.8em;
      margin-top: 5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .map-content {
      flex: 1;
      padding: 10px;
      overflow: auto;
      display: flex;
      flex-direction: column;
    }
    
    .map-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    .map-control {
      margin-right: 10px;
      margin-bottom: 10px;
    }
    
    .no-items {
      padding: 20px;
      text-align: center;
      color: #666;
    }
    
    .map-canvas-container {
      overflow: auto;
      border: 1px solid #ccc;
      background: #f9f9f9;
      flex: 1;
      min-height: 400px;
    }
  `;
  document.head.appendChild(style);
  
  // Create a content div to hold everything except the items panel
  const mapContent = document.createElement('div');
  mapContent.className = 'map-content';
  
  // Move all direct children except the items panel into the map content div
  Array.from(mapEditorContainer.children).forEach(child => {
    if (child.id !== 'itemsPanel') {
      mapContent.appendChild(child);
    }
  });
  
  // Remove any duplicate items panels if they exist
  const itemsPanels = document.querySelectorAll('#itemsPanel');
  if (itemsPanels.length > 1) {
    // Keep only the first one
    for (let i = 1; i < itemsPanels.length; i++) {
      itemsPanels[i].remove();
    }
  }
  
  // Remove any controls that are now positioned elsewhere
  const controlsToRemove = ['mapControls', 'fpsCounter', 'movementSpeedControl', 'mapScrollInfo', 'resizeControls', 'customSizeControls'];
  controlsToRemove.forEach(controlId => {
    const controlsInMapContent = mapContent.querySelectorAll(`.${controlId}, #${controlId}`);
    controlsInMapContent.forEach(control => {
      if (!control.closest('.map-editor-controls')) {
        control.remove();
      }
    });
  });
  
  // Add the content div to the container
  mapEditorContainer.appendChild(mapContent);
  
  // Initialize the view
  const itemPalette = document.getElementById('itemPalette');
  if (itemPalette && !itemPalette.classList.contains('grid-view') && !itemPalette.classList.contains('list-view')) {
    itemPalette.classList.add('grid-view');
  }
}

// Improved render item palette function
function renderImprovedItemPalette() {
  const itemPalette = document.getElementById('itemPalette');
  
  if (!itemPalette) return;
  
  // Clear existing palette items
  itemPalette.innerHTML = '';
  
  // Get the current category filter
  const activeCategory = document.querySelector('.category-btn.active')?.dataset.category || 'all';
  
  // Get search text
  const searchText = (document.getElementById('itemSearch')?.value || '').toLowerCase();
  
  // Filter items based on category and search text
  const filteredItems = items.filter(item => {
    // Check if item matches the category filter
    const matches = activeCategory === 'all' || getItemCategory(item) === activeCategory;
    
    // Check if item matches search text
    const searchMatches = !searchText || 
                          item.name.toLowerCase().includes(searchText) ||
                          item.id.toString().includes(searchText);
    
    return matches && searchMatches;
  });
  
  // Display a message if no items match the filter
  if (filteredItems.length === 0) {
    const noItems = document.createElement('div');
    noItems.className = 'no-items';
    noItems.textContent = 'No items match the current filter';
    itemPalette.appendChild(noItems);
    return;
  }
  
  // Group items by category
  const categories = {
    ground: ['grass', 'sand', 'water', 'floor', 'gravel', 'earth', 'ground', 'cobble', 'dirt'],
    wall: ['wall', 'rock', 'stone', 'brick'],
    decoration: ['torch', 'fire', 'statue', 'furniture', 'light'],
    item: ['sword', 'staff', 'club', 'armor', 'shield', 'helm', 'boot', 'ring', 'amulet', 'belt']
  };
  
  // Helper function definition removed - now using global getItemCategory function
  
  filteredItems.forEach(item => {
    const paletteItem = document.createElement('div');
    paletteItem.className = 'palette-item';
    paletteItem.dataset.itemId = item.id;
    paletteItem.dataset.category = getItemCategory(item);
    
    if (selectedItemId === item.id) {
      paletteItem.classList.add('selected');
    }
    
    // Create content wrapper for better styling
    const itemContent = document.createElement('div');
    itemContent.className = 'item-content';
    
    const itemCanvas = document.createElement('canvas');
    itemCanvas.width = 32;
    itemCanvas.height = 32;
    const itemCtx = itemCanvas.getContext('2d');
    
    // Draw the sprite
    if (item.sprites && item.sprites.length > 0) {
      // Draw the first sprite from the variants
      const firstSprite = item.sprites[0];
      itemCtx.drawImage(
        spriteSheet,
        firstSprite.x * SPRITE_SIZE,
        firstSprite.y * SPRITE_SIZE,
        SPRITE_SIZE,
        SPRITE_SIZE,
        0, 0,
        32, 32
      );
    } else if (item.sprite) {
      // Draw the single sprite
      itemCtx.drawImage(
        spriteSheet,
        item.sprite.x * SPRITE_SIZE,
        item.sprite.y * SPRITE_SIZE,
        SPRITE_SIZE,
        SPRITE_SIZE,
        0, 0,
        32, 32
      );
    }
    
    itemContent.appendChild(itemCanvas);
    
    // Add a small label with item name
    const label = document.createElement('div');
    label.className = 'item-name';
    label.textContent = item.name;
    
    itemContent.appendChild(label);
    paletteItem.appendChild(itemContent);
    
    // Event listener for selecting an item
    paletteItem.addEventListener('click', () => {
      // Deselect all items
      document.querySelectorAll('.palette-item').forEach(el => {
        el.classList.remove('selected');
      });
      
      // Select this item
      paletteItem.classList.add('selected');
      selectedItemId = item.id;
    });
    
    itemPalette.appendChild(paletteItem);
  });
}

// Enhanced resize function for map editor
function resizeMapEditor(zoomLevel, width, height) {
  const mapCanvasContainer = document.querySelector('.map-canvas-container');
  const mapEditorContainer = document.querySelector('.map-editor-container');
  
  if (zoomLevel) {
    mapZoom = zoomLevel;
  }
  
  // Adjust for the items panel width
  const itemsPanel = document.getElementById('itemsPanel');
  const itemsPanelWidth = itemsPanel ? (itemsPanelVisible ? itemsPanel.offsetWidth : 40) : 0;
  
  // Set specific width and height if provided
  if (width && height) {
    mapCanvasContainer.style.width = `${width}px`;
    mapCanvasContainer.style.height = `${height}px`;
  } else {
    // Default zoom based resize - consider available space
    const availableWidth = Math.max(600, window.innerWidth - itemsPanelWidth - 50);
    mapCanvasContainer.style.width = `${Math.min(availableWidth, 800 * mapZoom)}px`;
    mapCanvasContainer.style.height = `${600 * mapZoom}px`;
  }
  
  mapCanvas.style.transform = `scale(${mapZoom})`;
  mapCanvas.style.transformOrigin = 'top left';
  
  // Adjust container sizes
  if (mapEditorContainer) {
    mapEditorContainer.style.height = `${Math.max(600, parseInt(mapCanvasContainer.style.height, 10) + 50)}px`;
  }
  
  // Force redraw to ensure everything renders correctly
  drawMap();
}

// Fetch and load items
function fetchItems() {
  fetch('/api/items')
    .then(response => response.json())
    .then(data => {
      items = data;
      renderItemsList(); // Original function to maintain compatibility
      renderImprovedItemPalette(); // Using improved item palette rendering
    })
    .catch(error => {
      console.error('Error fetching items:', error);
      // Fallback to static JSON if the API fails
      loadItemsFromStaticJson();
    });
}

// Function to load items from a static JSON file as fallback
function loadItemsFromStaticJson() {
  fetch('/items.json')
    .then(response => response.json())
    .then(data => {
      items = data;
      renderItemsList();
      renderImprovedItemPalette();
    })
    .catch(error => {
      console.error('Error loading items from static JSON:', error);
    });
}

// Add a new variable for the items panel
let itemsPanelVisible = true;

// Set up FPS counter for performance monitoring
function setupFPSCounter() {
  const fpsCounter = document.getElementById('fpsCounter');
  let frameCount = 0;
  let lastTime = performance.now();
  
  function updateFPS() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
      fpsCounter.textContent = `FPS: ${fps}`;
      
      frameCount = 0;
      lastTime = currentTime;
    }
    
    requestAnimationFrame(updateFPS);
  }
  
  updateFPS();
}

// Toggle fill mode
function toggleFillMode() {
  const fillModeCheckbox = document.getElementById('fillMode');
  fillMode = fillModeCheckbox.checked;
  
  if (fillMode) {
    mapCanvas.classList.add('fill-mode');
    if (eraseMode) {
      // Turn off erase mode if fill mode is enabled
      eraseMode = false;
      document.getElementById('eraseMode').checked = false;
      mapCanvas.classList.remove('erase-mode');
    }
  } else {
    mapCanvas.classList.remove('fill-mode');
  }
}

// Add a utility function to safely redraw the map
function safeDrawMap() {
  // Only try to draw if the mapCanvas and mapCtx exist
  if (mapCanvas && mapCtx) {
    drawMap();
  } else {
    console.error('Map canvas or context not available');
  }
}

// Start the application when the page loads
window.onload = init; 