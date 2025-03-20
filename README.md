# JS Game Editor

A web-based sprite sheet editor for game items and maps. This tool allows you to select sprites from a tileset, create JSON item definitions with various properties, and build maps using those items for your Java game.

## Features

### Item Editor
- Load and display sprite sheets with 32x32 pixel tiles
- Select individual sprites from the sheet
- Create item objects with the following properties:
  - Walkable
  - Blocking
  - Useable
  - Pickupable
  - Action script
  - Container size
  - Floor change
- Edit and delete existing items
- Download the complete items.json file

### Map Editor
- Create maps with customizable dimensions
- Multiple layers support (Z-axis)
- Place multiple items on a single tile
- Edit and delete items on tiles
- Move between layers
- Download the complete map.json file

## Setup

1. Install dependencies:
```
npm install
```

2. Place your tileset.png file in the project root directory

3. Start the server:
```
npm start
```

4. Open your browser and navigate to http://localhost:4200

## Usage

### Item Editor
1. View the sprite sheet and select a sprite by clicking on it
2. Fill in the item properties in the form
3. Click "Add Item" to create a new item definition
4. View all created items in the list below
5. Edit or delete items as needed
6. Use the "Download Items JSON" button to export your item definitions

### Map Editor
1. Set the map dimensions and click "Create/Reset Map" to initialize
2. Select an item from the palette on the left
3. Click on the map to place the selected item at that position
4. Use the Layer controls to navigate between different Z-levels
5. Click on a tile to see all items placed on it
6. Select an item from the tile list and click "Remove Selected Item" to delete it
7. Use the "Download Map JSON" button to export your map definition

## Map JSON Format
The map is saved in the following format:
```json
{
  "width": 20,
  "height": 20,
  "layers": [
    [
      { "x": 0, "y": 0, "itemId": 1 },
      { "x": 1, "y": 0, "itemId": 2 }
    ],
    [
      { "x": 0, "y": 0, "itemId": 3 }
    ]
  ]
}
```
Where each layer is an array of items with their positions and IDs.

## API Endpoints

- `GET /api/items` - Retrieve the current item definitions
- `POST /api/items` - Save item definitions
- `GET /api/map` - Retrieve the current map data
- `POST /api/map` - Save map data

## Project Structure

- `server.js` - Express server with API endpoints
- `public/index.html` - Main HTML interface
- `public/css/styles.css` - CSS styles
- `public/js/app.js` - Client-side JavaScript logic
- `items.json` - Generated JSON file with item definitions
- `map.json` - Generated JSON file with map data

## Tips

- Use the zoom controls to better view the sprite sheet details
- When adding items to the map, make sure to select the correct layer
- Items on lower layers will be drawn first, then higher layers on top
- The map editor supports multiple items per tile across different layers 