# LineBattleSimulation Integration - Complete

## ✅ Files Modified

### 1. `/src/app/page.js`
**Changes:**
- Replaced `VoronoiTerrainSimulation` import with `LineBattleSimulation`
- Renamed `voronoiMode` variable but kept using it for the "Games" section (for compatibility)
- Configured LineBattleSimulation with:
  - 3 unit types: Spearmen, Archers, Cavalry
  - 2 formations: Line, Wedge
  - Green battlefield background (#70cf9bff)
  - Team colors: Red (#DC143C) vs Blue (#1E90FF)
- Updated switch statement to handle `"linebattle"` mode
- Changed Games section to use `simulationMode="linebattle"`

### 2. `/src/simulation/components/EntityRenderer.js`
**Changes:**
- Added case for `"linebattle"` in the mode switch
- Created `renderLineBattle()` function that renders:
  - Unit circles with team-color borders and unit-type-color fills
  - Health bars (green → yellow → red)
  - Opacity fading for dead/respawning units
  - Formation indicators (small dots)

## 🎮 How It Works

When you scroll to the **Games** section:

1. **Initialization:**
   - All entities randomly assigned to Team 1 (Red) or Team 2 (Blue)
   - Each entity assigned a random unit type (Spearmen/Archers/Cavalry)
   - Two initial strategy brains created (one per team)

2. **Strategy Brain Behavior:**
   - Every 2-5 seconds, brains recalculate their formation
   - Brains evaluate available formations based on:
     - Unit composition (e.g., Wedge needs 70% melee units)
     - Experience level
   - Weighted random selection (higher weight = higher chance)
   - If formation uses only some units, remaining units get a new brain

3. **Combat:**
   - **Archers**: Range 80, fire every 1000ms
   - **Spearmen**: Melee range 15, attack every 1000ms
   - **Cavalry**: Charge damage when moving fast, melee when slow

4. **Death & Respawn:**
   - Dead units fade out over 1.5 seconds
   - Walk to nearest screen edge
   - Wait 3 seconds
   - Respawn at team spawn zone

5. **Formation Movement:**
   - Units move toward target positions at their unit speed
   - Formations rotate to face enemy
   - Separation force prevents clustering

## 🎨 Visual Indicators

- **Unit Colors:**
  - White = Spearmen
  - Light Gray = Archers  
  - Yellow = Cavalry

- **Team Colors:**
  - Red border = Team 1
  - Blue border = Team 2

- **Health Bars:**
  - Green = >50% health
  - Yellow = 25-50% health
  - Red = <25% health

## 🚀 Testing

To see the simulation:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to the site in your browser

3. Scroll down to the **"Games"** section

4. Watch the tactical battle unfold!

## 📊 Current Configuration

```javascript
{
  backgroundColor: "#70cf9bff",        // Green battlefield
  formationSpacing: 20,                // Space between units
  strategyRecalculationMinInterval: 2.0,  // Min seconds between strategy updates
  strategyRecalculationMaxInterval: 5.0,  // Max seconds between strategy updates
  fadeOutDuration: 1.5,                // Seconds to fade out when dead
  respawnDelay: 3.0,                   // Seconds before respawn
  separationDistance: 20,              // Boids separation range
  speedLimit: 2.0,                     // Max unit velocity
  showHealthBars: true,                // Display health bars
  team1Color: "#DC143C",               // Red team
  team2Color: "#1E90FF",               // Blue team
}
```

## 🔧 Customization

To add more formations, edit the `formations` array in `page.js`:

```javascript
{
  name: "Custom Formation",
  tag: "custom",
  requisite_skill: 0.5,  // Requires 50% experience
  evaluator: (enemy_formation, enemy_units, friendly_units) => {
    // Return 0 if can't use, >0 for priority weight
    return friendly_units.length >= 5 ? 1.5 : 0;
  },
  minUnits: 5,
  positions: [
    [0, 0],   // Center
    [1, 1],   // Diagonal positions
    [-1, 1],
    [1, -1],
    [-1, -1],
  ]
}
```

To add more unit types, add to the `unit_types` array:

```javascript
{
  id: 5,
  name: "Heavy Infantry",
  weight: 3,
  color: "#808080",  // Gray
  speed: 0.7,        // Slower
  meleeDamage: {
    damagePerAttack: 0.25,  // Higher damage
    attackInterval: 1500,    // Slower attack
  },
}
```

## 🎯 Next Steps

Potential enhancements:
- Add more formations (Pincer, Column, Square, etc.)
- Implement multi-phase formations (cavalry flanking)
- Add terrain effects
- Create experience-based formation unlocks
- Add visual indicators for formations (lines connecting units)
- Show brain targets with colored overlays
- Add unit selection and manual control

## 📝 Notes

- The simulation is completely self-contained and autonomous
- Strategy brains make all tactical decisions
- Units continuously respawn for endless battle
- Experience increases with kills (0.01 per kill)
- Higher experience unlocks formations with higher `requisite_skill`
