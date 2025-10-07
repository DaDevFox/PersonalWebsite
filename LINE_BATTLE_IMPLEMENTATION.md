# Line Battle Simulation - Implementation Summary

## Overview
The LineBattleSimulation.js implements a tactical battle simulation where units are organized into formations controlled by "strategy brains" that make tactical decisions based on experience and enemy composition.

## Core Concepts

### Strategy Brain
A StrategyBrain is an AI controller that manages a group of units on one team:
- **Units**: List of unit indices controlled by this brain
- **Team**: Team number (1 or 2)
- **Experience**: 0-1 value that increases with successful kills, unlocking more formations
- **Target Brain**: The enemy formation/brain this brain is targeting
- **Formation**: The current formation this brain has selected
- **Next Recalc Time**: When to recalculate strategy (random interval)

### Formation Selection Algorithm
1. Brain chooses a random enemy brain as its target
2. Starting with ALL units, it evaluates all formations available at its experience level
3. Each formation's `evaluator` function returns a weight (0 = can't use, >0 = priority)
4. If total weight >= 1.0, perform weighted random selection:
   - Formation with weight 2 has 2/(2+1+1) = 50% chance
   - Formations with weight 1 each have 25% chance
5. If no valid formations, reduce unit count by 1 and try again
6. Once formation selected, brain splits:
   - Selected units stay with this brain in the chosen formation
   - Remaining units get a new brain with same experience level

### Unit Types
Configured via `params.unit_types`:
- **Spearmen**: Melee infantry
- **Archers**: Ranged units
- **Cavalry**: Fast units with charge damage
- **Artillery**: Long-range with splash damage

Each unit type has:
- `speed`: Movement speed multiplier
- `meleeDamage`: Close combat (damage per attack, attack interval)
- `rangedDamage`: Ranged combat (range, damage, interval, optional splash)
- `chargeDamage`: Momentum-based damage (requires minimum speed)

### Formations
Configured via `params.formations`:

```javascript
{
  name: "Line",
  tag: "line",
  requisite_skill: 0,  // Experience level required (0-1)
  evaluator: (enemy_formation, enemy_units, friendly_units) => {
    // Return weight (0 = can't use, higher = more priority)
    return 1.0;
  },
  minUnits: 1,
  positions: [
    [0, 0],    // Center
    [1, 0],    // Right
    [-1, 0],   // Left
    [2, 0],    // Further right
    // ... more positions
  ]
}
```

The evaluator receives:
- `enemy_formation`: The formation object of the target enemy
- `enemy_units`: Array of unit data for enemy units
- `friendly_units`: Array of unit data for units being evaluated

### Combat System

#### Ranged Combat
- Units with `rangedDamage` fire at enemies within range
- Respects `attackInterval` between shots
- Artillery can have `splash` damage affecting nearby units

#### Melee Combat  
- Units with `meleeDamage` attack enemies within 15 units
- Respects `attackInterval` between attacks

#### Charge Damage
- Units with `chargeDamage` deal bonus damage when moving fast
- Damage = `min(speed, momentumCap) * damagePerMomentum`
- Only applies if `speed >= minChargeSpeed`
- Unit slows down after impact

### Death and Respawn System
When a unit dies:
1. **Fade Out** (1.5s): Opacity reduces from 1.0 to 0
2. **Move to Edge**: Unit walks to nearest screen edge at low opacity
3. **Wait** (3.0s): Unit stays at edge
4. **Respawn**: Unit returns at team's spawn area with full health

Teams spawn on different sides:
- Team 1: Left 20% or Top 20% of map
- Team 2: Right 20% or Bottom 20% of map

### Formation Positioning
When a brain selects a formation:
1. Calculate enemy formation center
2. Calculate own unit center
3. Calculate angle to enemy
4. For each unit in formation:
   - Rotate formation position to face enemy
   - Apply spacing multiplier
   - Set target position halfway between formation and enemy

Units move toward their target positions at their unit type's speed.

### Separation Force (Boids)
Units maintain spacing using separation force:
- Repel from nearby units within `separationDistance` (20 units)
- Force strength: `separationForce` (15)
- Applied to all alive units to prevent clustering

## Configuration Parameters

```javascript
{
  // Combat
  baseFiringRange: 80,
  formationSpacing: 20,
  
  // AI Strategy
  strategyRecalculationMinInterval: 2.0,  // seconds
  strategyRecalculationMaxInterval: 5.0,  // seconds
  
  // Respawn
  fadeOutDuration: 1.5,    // seconds
  respawnDelay: 3.0,       // seconds
  respawnWalkSpeed: 0.5,   // speed multiplier
  
  // Movement
  separationDistance: 20,
  separationForce: 15,
  speedLimit: 2.0,
  dampingFactor: 0.95,
  
  // Visual
  showHealthBars: true,
  team1Color: "#DC143C",   // Red
  team2Color: "#1E90FF",   // Blue
}
```

## Rendering (EntityRenderer.js)

The `renderLineBattle` function visualizes:
- **Unit Circles**: Filled with unit type color, bordered with team color
- **Health Bars**: Show above units when damaged (green → yellow → red)
- **Opacity**: Fades out dead units during fade-out phase
- **Formation Indicators**: Small dots below units to show brain membership

## Future Enhancements (Prep Work Done)

### Multi-Step Formations
The system is prepared for formations with multiple movement phases:
- Phase 1: Cavalry flanks at cavalry speed
- Phase 2: Infantry advances at infantry speed  
- Phase 3: Cavalry charges into enemy rear

This would require:
- Adding `phases` array to formation definition
- Each phase has `positions`, `speed`, and `duration`
- Brain manages phase transitions

### Advanced Formation Evaluators
Current evaluators are simple. Future evaluators could:
- Check unit type ratios (need 70% melee for wedge)
- Respond to specific enemy formations
- Consider terrain advantages
- Factor in current health/casualties

### Experience-Based Formation Unlocks
Experience increases when a brain's unit gets a kill:
- `experience += 0.01` per kill
- Higher experience unlocks formations with higher `requisite_skill`
- Could add formation variants at 0.25, 0.5, 0.75, 1.0 experience levels

## Testing the Simulation

To use this simulation in your project:

1. Import it in a simulation section:
```javascript
import LineBattleSimulation from "@/simulation/modes/LineBattleSimulation";
```

2. Create an instance with custom config:
```javascript
const simulation = new LineBattleSimulation({
  unit_types: [...],
  formations: [...],
  // ... other params
});
```

3. The simulation will automatically:
   - Initialize units with random teams and types
   - Create initial strategy brains
   - Begin formation selection and combat
   - Respawn dead units continuously

The result is a dynamic tactical battle where formations constantly adapt to enemy movements and composition.
