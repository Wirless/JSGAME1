# MSRE RPG - Game Development Plan

## Overview
MSRE RPG is a tileset-based multiplayer role-playing game with character progression, combat, and social features. The game uses JSON files to store item, map, and outfit data.

## Server Architecture

### Movement System
- Tileset-based movement using arrow keys
- Collision detection with non-walkable objects
- Map rendered based on `map.json` data structure
- Player position tracking on server for multiplayer synchronization

### Interaction System
- Right-click to interact with objects or target monsters
- Object interaction system scans for actionable items that have scripts
- Scripts are executed server-side with results sent to client

### Chat System
- Multi-channel chat system integrated into game UI
- Three main channels:
  - Game Chat: Player conversations
  - Server Log: System messages and events
  - Trade Channel: Economy and trading

## Client Features

### Account System
- Account registration with email verification
- Secure login system with encrypted passwords
- Account management interface
- Password recovery system

### Login Flow
1. Account registration (new users)
   - Email
   - Password (with strength requirements)
   - Username
2. Login screen
   - Email/username
   - Password
   - "Remember me" option
3. Character selection
4. Game entry

## Player Attributes

### Basic Information
- Name
- Race (Orc, Human, Elf, Dwarf)
- Outfit ID (referencing `outfits.json` for visual representation)

### Core Stats
- Health / Max Health
- Mana / Max Mana
- Strength (influences physical damage)
- Defense (reduces incoming damage)
- Dexterity (accuracy and critical hits)
- Agility (movement speed and dodge chance)
- Intelligence (magic power and mana regeneration)
- Luck (rare drops and critical hits)

### Skills
- Melee (improves combat with melee weapons)
- Distance (improves ranged weapon accuracy and damage)
- Magic (improves spell effectiveness)
- Alchemy (crafting potions and special items)
- Critical Hit Chance % (probability of landing critical hits)
- Critical Hit Multiplier (damage multiplier when critical hits occur)

## Game Mechanics

### Game World
- Maps loaded from `map.json`
- Tiles are rendered based on item sprites from `items.json`
- Initial spawn point determined by finding random walkable ground tile
- Map scrolling to follow player movement

### Monster System
- Monster attributes:
  - Name
  - Outfit ID (from `outfits.json`)
  - Health / Max Health
  - Attack damage
  - Movement speed
  - Aggression range (default: 6 tiles)
- Monster AI:
  - Detection of players within aggression range
  - Pathfinding to approach detected players
  - Combat initiation and attack patterns

### Combat System
- Target selection via right-click
- Auto-attack system with 2-second intervals
- Damage calculation:
  - Melee: Strength * Weapon damage * Melee skill modifier
  - Distance: Dexterity * Weapon damage * Distance skill modifier
  - Magic: Intelligence * Spell power * Magic skill modifier
- Hit chance calculated based on attacker skill and defender agility
- Critical hit system based on character stats
- Experience gain on successful hits and kills
- Skill progression based on usage

### UI Layout
- Main game window showing the tileset map
- Chat window (100px height) at bottom of game window
  - Tab system for different chat channels
- Skills window attached to top-right outside of game window
  - Display current skill levels
  - Progress bars for skill advancement
- Additional modular UI elements positioned outside but adjacent to game window

## Development Roadmap

### Phase 1: Core Systems
- Server-client architecture setup
- Map rendering from JSON
- Basic player movement
- Collision detection

### Phase 2: Game Mechanics
- Player attributes and stats
- Monster spawning and basic AI
- Combat system implementation
- Skill progression system

### Phase 3: User Interface
- Chat interface
- Skills window
- Character information panel
- Inventory system

### Phase 4: Account Management
- Registration and login systems
- Character creation
- Data persistence

### Phase 5: Polishing
- Animations
- Sound effects
- Bug fixes
- Performance optimization 