# LineBattleSimulation - New Features Implementation Summary

## 🎯 Completed Features

### 1. **Multi-Step Formation States** ✅

Formations now support sequential states that control how units prepare and engage:

```javascript
states: [
  {
    name: "Form Up",              // State name (displayed in UI)
    requireInPosition: true,       // Wait for all units to reach position
    runAtFullCumulativeSpeed: false,  // Units move at individual speeds
    desiredDistanceToTarget: 300,  // Form up 300 units from enemy
    minDuration: 0,                // No minimum duration
  },
  {
    name: "Advance",
    requireInPosition: false,      // Don't wait, start immediately
    runAtFullCumulativeSpeed: true,   // Move at slowest unit's speed
    desiredDistanceToTarget: 100,  // Get closer
    minDuration: 2,                // Advance for at least 2 seconds
  },
  {
    name: "Engage",
    requireInPosition: false,
    runAtFullCumulativeSpeed: false,  // Full speed charge!
    desiredDistanceToTarget: 0,    // Close to melee range
    minDuration: 0,
  },
]
```

**How It Works:**
- Each brain starts at state 0 when formation is selected
- States advance when conditions are met:
  - `requireInPosition: true` → waits for all units within 15 units of target position
  - `minDuration` → minimum time in seconds before advancing
- Formation positions are recalculated for each state based on `desiredDistanceToTarget`
- `runAtFullCumulativeSpeed: true` → formation moves at slowest unit's speed (keeps units together)
- `runAtFullCumulativeSpeed: false` → units move at individual speeds (allows cavalry to flank)

### 2. **Weighted Unit Spawn Probabilities** ✅

Units now spawn based on configurable probabilities:

```javascript
unit_types: [
  {
    id: 1,
    name: "Spearmen",
    spawnProbability: 0.4,  // 40% chance
    // ... other stats
  },
  {
    id: 2,
    name: "Archers",
    spawnProbability: 0.35, // 35% chance
    // ... other stats
  },
  {
    id: 3,
    name: "Cavalry",
    spawnProbability: 0.15, // 15% chance (rare!)
    // ... other stats
  },
  {
    id: 4,
    name: "Artillery",
    spawnProbability: 0.1,  // 10% chance (rarest!)
    // ... other stats
  },
]
```

**Implementation:**
- Uses cumulative probability distribution
- Each unit rolls a random number and selects type based on accumulated probabilities
- Total probabilities should sum to 1.0
- Makes artillery and cavalry rare/special units

### 3. **Splash Damage System** ✅

Artillery and other units can now deal area-of-effect damage:

```javascript
rangedDamage: {
  range: 150,
  splash: {
    radius: 15,           // Damage radius around impact point
    falloff: 0.5,         // Damage at edge = 50% of center damage
  },
  damagePerAttack: 0.1,
  attackInterval: 1500,
}
```

**How It Works:**
- Direct hit deals full damage to primary target
- All enemies within `radius` of impact point take splash damage
- Damage scales linearly from 100% at center to `falloff` percentage at edge
- Example: 15-unit radius with 0.5 falloff:
  - Center: 100% damage
  - 7.5 units away: 75% damage
  - 15 units away (edge): 50% damage
- Each splash target is checked for death

### 4. **Formation Info Display** ✅

Real-time formation information overlay shows:
- Team number (1 or 2)
- Formation name (e.g., "Line", "Wedge")
- Current state name (e.g., "Form Up", "Advance", "Engage")
- Number of living units in formation
- Experience level (0-100%)

**Display:**
```
Active Formations:
Team 1: Line (Advance) - 12 units (XP: 3%)
Team 2: Wedge (Engage) - 8 units (XP: 5%)
```

Rendered in top-left corner with:
- Semi-transparent black background
- Team-colored text
- Monospace font for alignment
- Non-interactive (pointer-events: none)

## 📊 Updated Formations

### Line Formation (3-State)
1. **Form Up** (300 units away) → Wait for all units → Individual speeds
2. **Advance** (100 units away) → At least 2 seconds → Cumulative speed (stays together)
3. **Engage** (0 distance) → Full speed → Individual speeds

### Wedge Formation (2-State)
1. **Form Wedge** (250 units away) → Wait for all units → Individual speeds
2. **Charge** (0 distance) → Full speed → Individual speeds

## 🔧 Technical Implementation

### New StrategyBrain Properties
```javascript
{
  currentStateIndex: 0,      // Which state we're in (0, 1, 2...)
  stateStartTime: 0,         // When current state began (for minDuration)
  allUnitsInPosition: false, // Whether all units are in formation positions
}
```

### New Update Flow
1. **updateFormationStates()** - Check state progression conditions
   - Check if units are in position (within 15-unit threshold)
   - Check if minimum duration met
   - Advance state index if conditions met
   - Recalculate positions for new state

2. **updateUnits()** - Move units with speed modifiers
   - Calculate formation cumulative speeds
   - Apply appropriate speed (individual vs cumulative)
   - Handle dead units (fade, move to edge, respawn)

3. **handleCombat()** - Process all damage types
   - Ranged: Direct hit + splash damage
   - Melee: Close range
   - Charge: Momentum-based

### Formation Position Calculation
```javascript
// Calculate target formation center based on desired distance
if (desiredDist > 0 && distToEnemy > desiredDist) {
  // Position formation at exact distance from enemy
  const ratio = desiredDist / distToEnemy;
  formationCenterX = enemyCenterX + (ownCenterX - enemyCenterX) * ratio;
  formationCenterY = enemyCenterY + (ownCenterY - enemyCenterY) * ratio;
} else {
  // Move toward enemy center
  formationCenterX = enemyCenterX;
  formationCenterY = enemyCenterY;
}
```

## 🎮 Example Usage Scenarios

### Scenario 1: Mixed-Speed Formation
Team 1 has Spearmen (speed: 1.0) and Cavalry (speed: 1.5):

**State 1 - Form Up** (requireInPosition: true, runAtFullCumulativeSpeed: false)
- Cavalry reaches position faster
- Formation waits for slower spearmen
- Transition once all are in position

**State 2 - Advance** (runAtFullCumulativeSpeed: true)
- Both move at speed 1.0 (slowest unit)
- Formation stays tight

**State 3 - Engage** (runAtFullCumulativeSpeed: false)
- Cavalry charges at speed 1.5
- Spearmen advance at speed 1.0
- Cavalry hits enemy first

### Scenario 2: Artillery Barrage
Artillery (splash radius: 15) fires at clustered enemies:
- Direct hit: 0.1 damage to primary target
- Unit 5 units away: ~0.083 damage (83%)
- Unit 10 units away: ~0.067 damage (67%)
- Unit 15 units away: 0.05 damage (50% - falloff value)
- Unit 16 units away: 0 damage (outside radius)

## 🚀 Future Enhancement Ideas

### Multi-Phase Cavalry Flanking
```javascript
states: [
  {
    name: "Form Center",
    desiredDistanceToTarget: 300,
    requireInPosition: true,
    runAtFullCumulativeSpeed: false,
  },
  {
    name: "Flank Movement",
    // Cavalry moves to sides at full speed
    // Infantry holds position
    positions: [
      // Infantry positions stay same
      // Cavalry positions move to flanks
    ],
    minDuration: 3,
  },
  {
    name: "Pincer Attack",
    // Cavalry charges from sides
    // Infantry charges from center
    desiredDistanceToTarget: 0,
  },
]
```

### Unit-Specific State Behavior
- Add `unitTypeOverrides` to states
- Different positions/speeds per unit type
- Cavalry flanks while infantry advances

### Dynamic State Conditions
- Add `advanceCondition` callback
- Check enemy positions, casualties, morale
- Adaptive tactical decisions

## 📝 Testing Checklist

- [x] Units spawn with correct probabilities (40% spearmen, 35% archers, 15% cavalry, 10% artillery)
- [x] Formations show state names in UI overlay
- [x] Multi-state formations progress correctly
- [x] `requireInPosition` waits for all units
- [x] `minDuration` enforced before state advance
- [x] `runAtFullCumulativeSpeed` slows fast units to match slow ones
- [x] Splash damage hits multiple units
- [x] Splash damage scales with distance (falloff)
- [x] Formation info displays team, name, state, count, XP
- [x] State resets to 0 when new formation selected

## 🎨 Visual Indicators

Current display shows:
- **Overlay**: Formation states in top-left
- **Units**: Colored by type and team
- **Health bars**: When damaged
- **Opacity**: Fading dead units

Could add:
- Lines connecting units in same formation
- State progress bar
- Formation shapes on ground
- Splash damage visual effects
- Speed indicators (arrows showing cumulative vs individual)

## Configuration in page.js

The LineBattleSimulation is configured in `page.js` with all parameters. Unit types and formations can be customized there without changing the simulation code.

Current setup:
- 4 unit types with spawn probabilities
- 2 formations (Line with 3 states, Wedge with 2 states)
- Green battlefield background
- Red vs Blue teams
- Health bars enabled
