# 🎖️ Tactical Formations Guide

## Visual Unit Guide

### Unit Types
- **Spearmen** 🛡️ - Light gray circles - Basic melee infantry
- **Archers** 🏹 - Soft green circles - Ranged infantry
- **Cavalry** 🐴 - Deep gold circles (thicker border, more saturated) - Fast charging units
- **Artillery** 🎯 - Brown squares - Long-range splash damage units

### Team Colors
- **Team 1**: Red border
- **Team 2**: Blue border

---

## Formation Tiers

### 🟢 BASIC FORMATIONS (0% Experience)
Unlocked from the start. Simple, reliable tactics.

#### **Line**
- **Strength**: Universal, adaptable
- **Best For**: Any unit composition
- **States**: Form Up → Advance → Engage
- **Min Units**: 1
- **Strategy**: Classic battle line, advances in unison then charges

#### **Skirmish Line**
- **Strength**: Ranged harassment
- **Best For**: 50%+ ranged units
- **States**: Deploy → Fire
- **Min Units**: 3
- **Strategy**: Spread formation for ranged fire, maintains 90-120 unit distance
- **Bonus Weight**: +30% if mostly ranged

#### **Archer Wall**
- **Strength**: Concentrated ranged fire
- **Best For**: 60%+ archers
- **States**: Form Wall → Volley Fire
- **Min Units**: 4
- **Strategy**: Dense archer formation, stays at 80-100 unit range for sustained volleys
- **Bonus Weight**: +50% if heavy archer composition

---

### 🔵 INTERMEDIATE FORMATIONS (15% Experience)
Requires some battlefield experience. More specialized tactics.

#### **Wedge**
- **Strength**: Melee breakthrough
- **Best For**: 70%+ melee units
- **States**: Form Wedge → Charge
- **Min Units**: 3
- **Strategy**: Spearhead formation for penetrating enemy lines
- **Bonus Weight**: +20% if heavy melee

#### **Column**
- **Strength**: Rapid repositioning
- **Best For**: Mobile warfare
- **States**: Form Column → March → Deploy
- **Min Units**: 3
- **Strategy**: Narrow formation for movement, spreads out for engagement
- **Experience**: 15%

#### **Staggered Line**
- **Strength**: Continuous fire
- **Best For**: Ranged units (3+)
- **States**: Setup → Sustained Fire
- **Min Units**: 4
- **Strategy**: Alternating rows allow uninterrupted shooting at 85-110 units
- **Experience**: 15%

---

### 🟣 ADVANCED FORMATIONS (30% Experience)
For seasoned commanders. Complex multi-phase maneuvers.

#### **Crescent**
- **Strength**: Envelopment
- **Best For**: Mixed unit compositions (melee + ranged)
- **States**: Form Crescent → Envelop → Close
- **Min Units**: 5
- **Strategy**: Curved formation wraps around enemy flanks
- **Bonus Weight**: +40% if unit variety
- **Experience**: 30%

#### **Artillery Battery**
- **Strength**: Devastating bombardment
- **Best For**: 2+ artillery units
- **States**: Dig In → Bombardment
- **Min Units**: 2
- **Strategy**: Static artillery line at 130-140 unit range, maximum splash damage
- **Bonus Weight**: +100% if artillery present!
- **Experience**: 30%

#### **Checkerboard**
- **Strength**: Defensive depth
- **Best For**: Large forces (6+ units)
- **States**: Deploy → Advance → Engage
- **Min Units**: 6
- **Strategy**: Layered formation allows rear units to support front
- **Bonus Weight**: +20% for larger armies
- **Experience**: 30%

---

### 🔴 ELITE FORMATIONS (50% Experience)
Master-level tactics requiring significant experience.

#### **Hammer & Anvil**
- **Strength**: Combined arms perfection
- **Best For**: 2+ cavalry AND 3+ infantry
- **States**: Position Anvil → Engage Center → Hammer Strike
- **Min Units**: 5
- **Strategy**: Infantry pins enemy (anvil), cavalry strikes flanks (hammer)
- **Bonus Weight**: +150% if composition matches!
- **Experience**: 50%

#### **Testudo**
- **Strength**: Anti-ranged defense
- **Best For**: 4+ spearmen vs 3+ enemy ranged
- **States**: Form Testudo → Advance Slowly → Break & Engage
- **Min Units**: 4
- **Strategy**: Tight defensive formation advances under fire, then breaks for melee
- **Bonus Weight**: +100% when facing heavy ranged
- **Experience**: 50%

#### **Oblique Order**
- **Strength**: Overwhelming one flank
- **Best For**: Large armies (7+ units)
- **States**: Form Oblique → Wheel Forward → Crush Flank
- **Min Units**: 7
- **Strategy**: Angled line concentrates force on enemy's weak flank
- **Bonus Weight**: +60% for larger forces
- **Experience**: 50%

---

### 🟠 MASTER FORMATIONS (70% Experience)
Legendary tactics for veteran commanders.

#### **Horns of the Buffalo**
- **Strength**: Multi-pronged assault
- **Best For**: Mixed armies with cavalry, melee, AND ranged (8+ units)
- **States**: Form Buffalo → Pin Center → Envelop Horns
- **Min Units**: 8
- **Strategy**: Center pins, horns envelop, reserve reinforces - the ultimate tactic
- **Bonus Weight**: +200% for full unit variety!
- **Experience**: 70%

#### **Cantabrian Circle**
- **Strength**: Hit-and-run harassment
- **Best For**: 4+ cavalry units
- **States**: Form Circle → Harass
- **Min Units**: 4
- **Strategy**: Cavalry circles at 70-100 unit range, continuous pressure
- **Bonus Weight**: +150% for cavalry-heavy
- **Experience**: 70%

#### **Triple Line**
- **Strength**: Sustained combat
- **Best For**: Large disciplined armies (9+ units)
- **States**: Deploy Lines → First Line Engage → Commit Reserves
- **Min Units**: 9
- **Strategy**: Three lines: first engages, second supports, third reinforces
- **Bonus Weight**: +80% for large armies
- **Experience**: 70%

---

### 🏆 LEGENDARY FORMATION (90% Experience)
The pinnacle of military achievement.

#### **Macedonian Phalanx**
- **Strength**: Unstoppable spear wall
- **Best For**: 8+ spearmen (pure infantry)
- **States**: Form Phalanx → Lock Shields → Advance Wall → Spear Storm
- **Min Units**: 8
- **Strategy**: Dense spear formation advances relentlessly, 4-state progression
- **Bonus Weight**: +300% for pure spearmen armies!
- **Experience**: 90%
- **Notes**: The most powerful formation in the game when conditions are met

---

## Formation State Mechanics

### State Properties
Each formation state has 4 key properties:

1. **requireInPosition** - If true, waits for all units to be within 15 units of target position
2. **runAtFullCumulativeSpeed** - If true, entire formation moves at slowest unit's speed (cohesion)
3. **desiredDistanceToTarget** - How far from enemy to position formation center
4. **minDuration** - Minimum time (seconds) to remain in this state

### Distance Ranges
- **Melee Range**: 0-30 units
- **Close Range**: 30-70 units
- **Medium Range**: 70-120 units
- **Long Range**: 120-150 units
- **Artillery Range**: 150+ units

### Speed Modes
- **Individual Speed**: Each unit moves at its own speed (cavalry rushes ahead)
- **Cumulative Speed**: Formation moves at slowest unit's speed (stays together)

---

## Tactical Tips

### 🎯 For Ranged Armies
1. Start with **Skirmish Line** or **Archer Wall**
2. Progress to **Staggered Line** at 15% XP
3. If you get artillery, **Artillery Battery** at 30% XP is devastating
4. Maintain distance! Let your range advantage work

### ⚔️ For Melee Armies
1. **Line** is safe, **Wedge** is aggressive (15% XP)
2. **Column** (15% XP) helps you reposition quickly
3. **Testudo** (50% XP) protects against enemy archers
4. **Macedonian Phalanx** (90% XP) is the ultimate spearmen formation

### 🐴 For Cavalry Forces
1. Use **Wedge** (15% XP) for direct charges
2. **Cantabrian Circle** (70% XP) for harassment
3. Cavalry works best in **Hammer & Anvil** (50% XP) with infantry support
4. Take advantage of individual speed in final charges

### 🎨 For Mixed Armies
1. **Line** and **Staggered Line** work with any mix
2. **Crescent** (30% XP) uses variety well
3. **Hammer & Anvil** (50% XP) is perfect for cavalry + infantry
4. **Horns of the Buffalo** (70% XP) requires all three types but is incredibly powerful

### 📈 Experience Gain
- Experience increases with each victory
- Higher-level formations have stronger bonuses (see weights)
- Elite/Master formations can turn the tide of battle
- Strategy brains remember experience across respawns

---

## Formation Selection Algorithm

Formations are selected using **weighted random selection**:

1. Filter available formations by experience level
2. Check minimum unit requirements
3. Evaluate each formation's evaluator function
4. Multiply base weight by evaluator result
5. Randomly select based on cumulative weights

**Example**: Artillery Battery with 2 artillery units gets weight 2.0, while Line gets 1.0. Artillery Battery is 2x more likely to be chosen!

---

## Visual Indicators

### Formation Info Display
Top-left overlay shows:
- Team number (1 or 2)
- Formation name
- Current state name
- Living unit count
- Experience percentage

**Example**: `Team 1: Crescent (Envelop) - 7 units (XP: 45%)`

### Unit Indicators
- **Unit Type**: Color shows type (gray=spear, green=archer, gold=cavalry, brown=artillery)
- **Team**: Border color (red or blue)
- **Shape**: Circles for most units, **squares for artillery**
- **Formation**: Small dot below units in formations
- **Health**: Bar above damaged units (green→yellow→red)
- **Opacity**: Fading units are dead/respawning

---

## Strategy Tips

1. **Match formation to composition** - Check the "Best For" field
2. **Watch experience levels** - Better formations unlock at 15%, 30%, 50%, 70%, 90%
3. **Ranged formations maintain distance** - Use states to control engagement range
4. **Cavalry formations use individual speed** - Let fast units flank
5. **Elite formations have huge weight bonuses** - They're worth the XP requirement
6. **Artillery Battery is the ranged king** - 2x weight when conditions met
7. **Horns of the Buffalo is the ultimate** - 3x weight for mixed armies
8. **Macedonian Phalanx is unstoppable** - 4x weight for pure spearmen, but needs 90% XP

---

## Formation Comparison Chart

| Formation | XP | Min Units | Best Comp | Weight Bonus | Key Feature |
|-----------|-----|-----------|-----------|--------------|-------------|
| Line | 0% | 1 | Any | - | Universal |
| Skirmish Line | 0% | 3 | 50% Ranged | +30% | Spread ranged fire |
| Archer Wall | 0% | 4 | 60% Archers | +50% | Dense volleys |
| Wedge | 15% | 3 | 70% Melee | +20% | Breakthrough |
| Column | 15% | 3 | Any | -10% | Mobility |
| Staggered Line | 15% | 4 | 3+ Ranged | +10% | Continuous fire |
| Crescent | 30% | 5 | Mixed | +40% | Envelopment |
| Artillery Battery | 30% | 2 | 2+ Artillery | +100% | Bombardment |
| Checkerboard | 30% | 6 | Large force | +20% | Depth |
| Hammer & Anvil | 50% | 5 | 2 Cav + 3 Inf | +150% | Combined arms |
| Testudo | 50% | 4 | vs Ranged | +100% | Anti-ranged |
| Oblique Order | 50% | 7 | Large force | +60% | Flank focus |
| Horns of Buffalo | 70% | 8 | All types | +200% | Multi-prong |
| Cantabrian Circle | 70% | 4 | 4+ Cavalry | +150% | Harassment |
| Triple Line | 70% | 9 | Large force | +80% | Reserves |
| Macedonian Phalanx | 90% | 8 | 8+ Spearmen | +300% | Ultimate wall |

---

## Unit Spawn Probabilities

- **Spearmen**: 40% (Most common)
- **Archers**: 35% (Common)
- **Cavalry**: 15% (Rare)
- **Artillery**: 10% (Rarest)

Build your strategy around what spawns!
