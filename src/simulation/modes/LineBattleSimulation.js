/**
 * LineBattleSimulation.js
 *
 * Tactical battle simulation with formation-based combat.
 * Teams form strategic formations and engage in line battles.
 * Used for the "Games" section.
 */

import { BaseSimulationMode } from "../core/BaseSimulationMode";
import { PhysicsSystem } from "../core/PhysicsSystem";

/**
 * StrategyBrain - AI controller for unit formations
 */
class StrategyBrain {
  constructor(units, team, experience = 0) {
    this.units = units; // Array of unit indices
    this.team = team;
    this.experience = experience; // Experience level (0-1)
    this.targetBrain = null; // Target enemy brain/formation
    this.formation = null; // Current formation object
    this.nextRecalcTime = 0; // When to recalculate strategy
  }

  /**
   * Select a formation for this brain's units
   */
  selectFormation(
    formations,
    allEnemyBrains,
    getUnitData,
    getEnemyUnitsForBrain
  ) {
    // Choose a random enemy target
    if (allEnemyBrains.length > 0) {
      this.targetBrain =
        allEnemyBrains[Math.floor(Math.random() * allEnemyBrains.length)];
    } else {
      this.targetBrain = null;
      return null;
    }

    const enemyFormation = this.targetBrain.formation;
    const enemyUnits = getEnemyUnitsForBrain(this.targetBrain);
    const friendlyUnits = this.units.map((idx) => getUnitData(idx));

    // Get formations we can use based on experience
    const availableFormations = formations.filter(
      (f) => f.requisite_skill <= this.experience
    );

    if (availableFormations.length === 0) return null;

    // Try with all units first, then reduce size
    let currentSize = this.units.length;

    while (currentSize > 0) {
      const testUnits = friendlyUnits.slice(0, currentSize);
      const weights = [];
      const formationOptions = [];

      // Evaluate all formations
      for (const formation of availableFormations) {
        if (currentSize < formation.minUnits) continue;
        if (currentSize > formation.positions.length) continue;

        const weight = formation.evaluator(
          enemyFormation,
          enemyUnits,
          testUnits
        );
        if (weight > 0) {
          weights.push(weight);
          formationOptions.push(formation);
        }
      }

      // If we have at least one valid formation, do weighted selection
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      if (totalWeight >= 1.0) {
        let random = Math.random() * totalWeight;
        for (let i = 0; i < formationOptions.length; i++) {
          random -= weights[i];
          if (random <= 0) {
            this.formation = formationOptions[i];
            // Only keep the units we're using
            this.units = this.units.slice(0, currentSize);
            return this.formation;
          }
        }
      }

      // Reduce size and try again
      currentSize--;
    }

    return null;
  }
}

export class LineBattleSimulation extends BaseSimulationMode {
  constructor(config = {}) {
    super({
      name: "linebattle",
      backgroundColor: config.backgroundColor || "#70cf9bff", // Green background
      ...config,
    });

    this.params = {
      unit_types: config.unit_types || [
        {
          id: 1,
          name: "Spearmen",
          weight: 2,
          color: "#FFFFFF",
          speed: 1.0,
          meleeDamage: {
            damagePerAttack: 0.15,
            attackInterval: 1000,
          },
        },
        {
          id: 2,
          name: "Archers",
          weight: 2,
          color: "#DDDDDD",
          speed: 1.0,
          rangedDamage: {
            range: 80,
            damagePerAttack: 0.1,
            attackInterval: 1000,
          },
        },
        {
          id: 3,
          name: "Cavalry",
          weight: 1.5,
          color: "#FFFF00",
          speed: 1.5,
          chargeDamage: {
            momentumCap: 1.0,
            damagePerMomentum: 0.4,
            minChargeSpeed: 1.0,
          },
          meleeDamage: { damagePerAttack: 0.05, attackInterval: 800 },
        },
        {
          id: 4,
          name: "Artillery",
          weight: 2,
          color: "#00FFFF",
          speed: 0.8,
          rangedDamage: {
            range: 150,
            splash: {
              radius: 15,
              falloff: 0.5,
            },
            damagePerAttack: 0.1,
            attackInterval: 1000,
          },
        },
      ],
      formations: config.formations || [
        {
          name: "Line",
          tag: "line",
          requisite_skill: 0,
          evaluator: (enemy_formation, enemy_units, friendly_units) => 1.0,
          minUnits: 1,
          positions: [
            [0, 0],
            [1, 0],
            [-1, 0],
            [2, 0],
            [-2, 0],
            [3, 0],
            [-3, 0],
            [4, 0],
            [-4, 0],
            [5, 0],
            [-5, 0],
            [6, 0],
            [-6, 0],
          ],
        },
        {
          name: "Wedge",
          tag: "wedge",
          requisite_skill: 0,
          evaluator: (enemy_formation, enemy_units, friendly_units) =>
            friendly_units.filter((unit) => unit.meleeDamage).length >=
            friendly_units.length * 0.7
              ? 1.2
              : 0.0,
          minUnits: 3,
          positions: [
            [0, 0],
            [1, -1],
            [-1, -1],
            [0, -1],
            [1, -2],
            [-1, -2],
            [2, -2],
            [-2, -2],
            [0, -2],
            [2, -3],
            [-2, -3],
            [3, -3],
            [-3, -3],
            [0, -3],
          ],
        },
      ],

      // Combat parameters
      baseFiringRange: config.baseFiringRange || 80,
      formationSpacing: config.formationSpacing || 20, // Space between units in formation

      // AI parameters
      strategyRecalculationMinInterval: 2.0,
      strategyRecalculationMaxInterval: 5.0,

      // Respawn parameters
      fadeOutDuration: 1.5, // seconds to fade out
      respawnDelay: 3.0, // seconds before respawning
      respawnWalkSpeed: 0.5, // speed when walking back from edge

      // Boids separation
      separationDistance: config.separationDistance || 20,
      separationForce: config.separationForce || 15,

      // Movement parameters
      speedLimit: config.speedLimit || 2.0,
      dampingFactor: config.dampingFactor || 0.95,

      // UI options
      showHealthBars:
        config.showHealthBars !== undefined ? config.showHealthBars : true,

      // Colors
      team1Color: config.team1Color || "#DC143C",
      team2Color: config.team2Color || "#1E90FF",
    };

    this.time = 0;
  }

  async initialize(state, isFirstLoad = true) {
    // Initialize entity data
    if (!state.entityData) state.entityData = {};
    state.entityData.teams = new Array(state.entityCount).fill(0);
    state.entityData.health = new Array(state.entityCount).fill(1.0);
    state.entityData.maxHealth = new Array(state.entityCount).fill(1.0);
    state.entityData.unitType = new Array(state.entityCount).fill(0);
    state.entityData.brainId = new Array(state.entityCount).fill(-1);
    state.entityData.formationPosition = new Array(state.entityCount).fill(
      null
    );
    state.entityData.targetPosition = new Array(state.entityCount).fill(null);
    state.entityData.lastFired = new Array(state.entityCount).fill(0);
    state.entityData.isDead = new Array(state.entityCount).fill(false);
    state.entityData.deathTime = new Array(state.entityCount).fill(0);
    state.entityData.respawnTime = new Array(state.entityCount).fill(0);
    state.entityData.opacity = new Array(state.entityCount).fill(1.0);

    // Randomly assign teams (50/50 split)
    const allEntities = [];
    for (let i = 0; i < state.entityCount; i++) {
      allEntities.push(i);
    }

    // Shuffle
    for (let i = allEntities.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allEntities[i], allEntities[j]] = [allEntities[j], allEntities[i]];
    }

    // Assign teams
    const halfPoint = Math.floor(allEntities.length / 2);
    allEntities.forEach((idx, i) => {
      state.entityData.teams[idx] = i < halfPoint ? 1 : 2;
    });

    // Randomly assign unit types from unit_types array
    for (let i = 0; i < state.entityCount; i++) {
      const unitType =
        this.params.unit_types[
          Math.floor(Math.random() * this.params.unit_types.length)
        ];
      state.entityData.unitType[i] = unitType.id;
    }

    // Initialize mode-specific data
    state.modeData.linebattle = {
      brains: [], // All strategy brains
      team1Brains: [],
      team2Brains: [],
    };

    // Create initial strategy brains (one per team)
    this.createInitialBrains(state);
  }

  /**
   * Create initial strategy brains for each team
   */
  createInitialBrains(state) {
    const team1Units = [];
    const team2Units = [];

    for (let i = 0; i < state.entityCount; i++) {
      if (state.entityData.isDead[i]) continue;

      if (state.entityData.teams[i] === 1) {
        team1Units.push(i);
      } else if (state.entityData.teams[i] === 2) {
        team2Units.push(i);
      }
    }

    const brain1 = new StrategyBrain(team1Units, 1, 0);
    const brain2 = new StrategyBrain(team2Units, 2, 0);

    // Schedule initial recalculation
    brain1.nextRecalcTime =
      this.time +
      this.params.strategyRecalculationMinInterval +
      Math.random() *
        (this.params.strategyRecalculationMaxInterval -
          this.params.strategyRecalculationMinInterval);

    brain2.nextRecalcTime =
      this.time +
      this.params.strategyRecalculationMinInterval +
      Math.random() *
        (this.params.strategyRecalculationMaxInterval -
          this.params.strategyRecalculationMinInterval);

    state.modeData.linebattle.brains = [brain1, brain2];
    state.modeData.linebattle.team1Brains = [brain1];
    state.modeData.linebattle.team2Brains = [brain2];

    // Assign brain IDs to units
    for (const idx of team1Units) {
      state.entityData.brainId[idx] = 0;
    }
    for (const idx of team2Units) {
      state.entityData.brainId[idx] = 1;
    }
  }

  /**
   * Get unit data for formation evaluation
   */
  getUnitData(state, unitIdx) {
    const unitTypeId = state.entityData.unitType[unitIdx];
    const unitType = this.params.unit_types.find((t) => t.id === unitTypeId);
    return {
      index: unitIdx,
      ...unitType,
    };
  }

  /**
   * Get enemy units for a brain's target
   */
  getEnemyUnitsForBrain(state, brain) {
    if (!brain) return [];
    return brain.units.map((idx) => this.getUnitData(state, idx));
  }

  /**
   * Recalculate formations for all brains
   */
  recalculateBrainFormations(state) {
    const { brains, team1Brains, team2Brains } = state.modeData.linebattle;

    // Process each brain that needs recalculation
    for (const brain of brains) {
      if (this.time < brain.nextRecalcTime) continue;
      if (brain.units.length === 0) continue;

      // Get enemy brains
      const enemyBrains = brain.team === 1 ? team2Brains : team1Brains;

      // Select formation
      const formation = brain.selectFormation(
        this.params.formations,
        enemyBrains.filter((b) => b.units.length > 0),
        (idx) => this.getUnitData(state, idx),
        (b) => this.getEnemyUnitsForBrain(state, b)
      );

      if (formation) {
        // Assign formation positions to units
        this.assignFormationPositions(state, brain, formation);

        // If this brain used only some of its units, create a new brain with the rest
        const originalUnits = state.entityData.brainId
          .map((brainId, idx) => (brainId === brains.indexOf(brain) ? idx : -1))
          .filter((idx) => idx !== -1 && !state.entityData.isDead[idx]);

        if (originalUnits.length > brain.units.length) {
          const remainingUnits = originalUnits.filter(
            (idx) => !brain.units.includes(idx)
          );

          // Create new brain with remaining units
          const newBrain = new StrategyBrain(
            remainingUnits,
            brain.team,
            brain.experience
          );
          newBrain.nextRecalcTime =
            this.time +
            this.params.strategyRecalculationMinInterval +
            Math.random() *
              (this.params.strategyRecalculationMaxInterval -
                this.params.strategyRecalculationMinInterval);

          brains.push(newBrain);
          if (brain.team === 1) {
            team1Brains.push(newBrain);
          } else {
            team2Brains.push(newBrain);
          }

          // Assign new brain ID to remaining units
          const newBrainId = brains.length - 1;
          for (const idx of remainingUnits) {
            state.entityData.brainId[idx] = newBrainId;
          }
        }
      }

      // Schedule next recalculation
      brain.nextRecalcTime =
        this.time +
        this.params.strategyRecalculationMinInterval +
        Math.random() *
          (this.params.strategyRecalculationMaxInterval -
            this.params.strategyRecalculationMinInterval);
    }
  }

  /**
   * Assign formation positions to units in a brain
   */
  assignFormationPositions(state, brain, formation) {
    if (!brain.targetBrain || brain.targetBrain.units.length === 0) return;

    // Calculate center of enemy formation
    const enemyUnits = brain.targetBrain.units.filter(
      (idx) => !state.entityData.isDead[idx]
    );
    if (enemyUnits.length === 0) return;

    let enemyCenterX = 0,
      enemyCenterY = 0;
    for (const idx of enemyUnits) {
      enemyCenterX += state.positions[idx][0];
      enemyCenterY += state.positions[idx][1];
    }
    enemyCenterX /= enemyUnits.length;
    enemyCenterY /= enemyUnits.length;

    // Calculate own center
    let ownCenterX = 0,
      ownCenterY = 0;
    for (const idx of brain.units) {
      ownCenterX += state.positions[idx][0];
      ownCenterY += state.positions[idx][1];
    }
    ownCenterX /= brain.units.length;
    ownCenterY /= brain.units.length;

    // Calculate angle to enemy
    const angleToEnemy = Math.atan2(
      enemyCenterY - ownCenterY,
      enemyCenterX - ownCenterX
    );

    // Assign positions based on formation
    const spacing = this.params.formationSpacing;
    for (
      let i = 0;
      i < brain.units.length && i < formation.positions.length;
      i++
    ) {
      const unitIdx = brain.units[i];
      const formPos = formation.positions[i];

      // Rotate formation to face enemy
      const rotatedX =
        formPos[0] * Math.cos(angleToEnemy) -
        formPos[1] * Math.sin(angleToEnemy);
      const rotatedY =
        formPos[0] * Math.sin(angleToEnemy) +
        formPos[1] * Math.cos(angleToEnemy);

      // Position relative to formation center
      state.entityData.formationPosition[unitIdx] = [
        ownCenterX + rotatedX * spacing,
        ownCenterY + rotatedY * spacing,
      ];

      // Set target as halfway to enemy
      state.entityData.targetPosition[unitIdx] = [
        (ownCenterX + rotatedX * spacing + enemyCenterX) / 2,
        (ownCenterY + rotatedY * spacing + enemyCenterY) / 2,
      ];
    }
  }

  /**
   * Apply boids separation force to units
   */
  applySeparation(state, unitIndices) {
    for (const idx of unitIndices) {
      const pos = state.positions[idx];
      let separationX = 0;
      let separationY = 0;
      let neighborCount = 0;

      for (const otherIdx of unitIndices) {
        if (idx === otherIdx) continue;

        const dx = pos[0] - state.positions[otherIdx][0];
        const dy = pos[1] - state.positions[otherIdx][1];
        const dist = Math.hypot(dx, dy);

        if (dist < this.params.separationDistance && dist > 0) {
          separationX +=
            (dx / dist) * (1 - dist / this.params.separationDistance);
          separationY +=
            (dy / dist) * (1 - dist / this.params.separationDistance);
          neighborCount++;
        }
      }

      if (neighborCount > 0) {
        state.accelerations[idx][0] +=
          separationX * this.params.separationForce;
        state.accelerations[idx][1] +=
          separationY * this.params.separationForce;
      }
    }
  }

  /**
   * Update unit positions and formations
   */
  updateUnits(state, deltaTime) {
    const aliveUnits = [];

    for (let i = 0; i < state.entityCount; i++) {
      if (state.entityData.isDead[i]) {
        // Handle dead units - fade out and respawn
        const timeSinceDeath = this.time - state.entityData.deathTime[i];

        if (timeSinceDeath < this.params.fadeOutDuration) {
          // Fading out
          state.entityData.opacity[i] =
            1.0 - timeSinceDeath / this.params.fadeOutDuration;
          state.accelerations[i] = [0, 0];
          state.velocities[i][0] *= 0.9;
          state.velocities[i][1] *= 0.9;
        } else if (this.time >= state.entityData.respawnTime[i]) {
          // Respawn
          this.respawnUnit(state, i);
        } else {
          // Move to edge and wait
          this.moveToEdge(state, i);
        }
        continue;
      }

      aliveUnits.push(i);

      // Get unit type
      const unitTypeId = state.entityData.unitType[i];
      const unitType = this.params.unit_types.find((t) => t.id === unitTypeId);
      if (!unitType) continue;

      // Move towards target position
      const targetPos = state.entityData.targetPosition[i];
      if (targetPos) {
        const pos = state.positions[i];
        const dx = targetPos[0] - pos[0];
        const dy = targetPos[1] - pos[1];
        const dist = Math.hypot(dx, dy);

        if (dist > 10) {
          // Move towards target at unit speed
          const force = 30 * unitType.speed;
          state.accelerations[i] = [(dx / dist) * force, (dy / dist) * force];
        } else {
          // At target - slow down
          state.accelerations[i] = [0, 0];
          state.velocities[i][0] *= 0.8;
          state.velocities[i][1] *= 0.8;
        }
      } else {
        state.accelerations[i] = [0, 0];
      }
    }

    // Apply separation
    this.applySeparation(state, aliveUnits);
  }

  /**
   * Move dead unit to edge of screen
   */
  moveToEdge(state, unitIdx) {
    const pos = state.positions[unitIdx];
    const bounds = state.bounds;

    // Find nearest edge
    const distToLeft = pos[0];
    const distToRight = bounds.width - pos[0];
    const distToTop = pos[1];
    const distToBottom = bounds.height - pos[1];

    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    let targetX = pos[0];
    let targetY = pos[1];

    if (minDist === distToLeft) {
      targetX = -50;
    } else if (minDist === distToRight) {
      targetX = bounds.width + 50;
    } else if (minDist === distToTop) {
      targetY = -50;
    } else {
      targetY = bounds.height + 50;
    }

    // Move towards edge
    const dx = targetX - pos[0];
    const dy = targetY - pos[1];
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      const force = 20 * this.params.respawnWalkSpeed;
      state.accelerations[unitIdx] = [(dx / dist) * force, (dy / dist) * force];
    } else {
      state.accelerations[unitIdx] = [0, 0];
      state.velocities[unitIdx] = [0, 0];
    }

    state.entityData.opacity[unitIdx] = 0.3;
  }

  /**
   * Respawn a unit at the edge
   */
  respawnUnit(state, unitIdx) {
    const bounds = state.bounds;
    const team = state.entityData.teams[unitIdx];

    // Respawn on team's side
    let x, y;

    if (team === 1) {
      // Team 1 spawns on left or top
      if (Math.random() < 0.5) {
        x = Math.random() * bounds.width * 0.2;
        y = Math.random() * bounds.height;
      } else {
        x = Math.random() * bounds.width;
        y = Math.random() * bounds.height * 0.2;
      }
    } else {
      // Team 2 spawns on right or bottom
      if (Math.random() < 0.5) {
        x = bounds.width * 0.8 + Math.random() * bounds.width * 0.2;
        y = Math.random() * bounds.height;
      } else {
        x = Math.random() * bounds.width;
        y = bounds.height * 0.8 + Math.random() * bounds.height * 0.2;
      }
    }

    state.positions[unitIdx] = [x, y];
    state.velocities[unitIdx] = [0, 0];
    state.accelerations[unitIdx] = [0, 0];
    state.entityData.health[unitIdx] = state.entityData.maxHealth[unitIdx];
    state.entityData.isDead[unitIdx] = false;
    state.entityData.opacity[unitIdx] = 1.0;
  }

  /**
   * Handle combat between units
   */
  handleCombat(state, deltaTime) {
    const now = this.time * 1000;

    // Find all alive units by team
    const team1Units = [];
    const team2Units = [];

    for (let i = 0; i < state.entityCount; i++) {
      if (state.entityData.isDead[i]) continue;

      if (state.entityData.teams[i] === 1) {
        team1Units.push(i);
      } else if (state.entityData.teams[i] === 2) {
        team2Units.push(i);
      }
    }

    // Process combat for each unit
    for (const unitIdx of [...team1Units, ...team2Units]) {
      const unitTypeId = state.entityData.unitType[unitIdx];
      const unitType = this.params.unit_types.find((t) => t.id === unitTypeId);
      if (!unitType) continue;

      const pos = state.positions[unitIdx];
      const team = state.entityData.teams[unitIdx];
      const enemies = team === 1 ? team2Units : team1Units;

      // Ranged combat
      if (unitType.rangedDamage) {
        const range = unitType.rangedDamage.range;
        const damage = unitType.rangedDamage.damagePerAttack;
        const interval = unitType.rangedDamage.attackInterval;

        for (const enemyIdx of enemies) {
          const enemyPos = state.positions[enemyIdx];
          const dist = Math.hypot(pos[0] - enemyPos[0], pos[1] - enemyPos[1]);

          if (dist <= range) {
            if (now - state.entityData.lastFired[unitIdx] > interval) {
              state.entityData.health[enemyIdx] -= damage;
              state.entityData.lastFired[unitIdx] = now;

              // Check for death
              if (state.entityData.health[enemyIdx] <= 0) {
                this.killUnit(state, enemyIdx);
              }

              break; // One target per attack
            }
          }
        }
      }

      // Melee combat
      if (unitType.meleeDamage) {
        const range = 15; // Melee range
        const damage = unitType.meleeDamage.damagePerAttack;
        const interval = unitType.meleeDamage.attackInterval;

        for (const enemyIdx of enemies) {
          const enemyPos = state.positions[enemyIdx];
          const dist = Math.hypot(pos[0] - enemyPos[0], pos[1] - enemyPos[1]);

          if (dist <= range) {
            if (now - state.entityData.lastFired[unitIdx] > interval) {
              state.entityData.health[enemyIdx] -= damage;
              state.entityData.lastFired[unitIdx] = now;

              if (state.entityData.health[enemyIdx] <= 0) {
                this.killUnit(state, enemyIdx);
              }

              break;
            }
          }
        }
      }

      // Charge damage (based on momentum)
      if (unitType.chargeDamage) {
        const vel = state.velocities[unitIdx];
        const speed = Math.hypot(vel[0], vel[1]);

        if (speed >= unitType.chargeDamage.minChargeSpeed) {
          const momentum = Math.min(speed, unitType.chargeDamage.momentumCap);
          const damage = momentum * unitType.chargeDamage.damagePerMomentum;

          for (const enemyIdx of enemies) {
            const enemyPos = state.positions[enemyIdx];
            const dist = Math.hypot(pos[0] - enemyPos[0], pos[1] - enemyPos[1]);

            if (dist <= 10) {
              state.entityData.health[enemyIdx] -= damage;

              if (state.entityData.health[enemyIdx] <= 0) {
                this.killUnit(state, enemyIdx);
              }

              // Slow down after charge impact
              state.velocities[unitIdx][0] *= 0.5;
              state.velocities[unitIdx][1] *= 0.5;

              break;
            }
          }
        }
      }
    }
  }

  /**
   * Mark a unit as dead and schedule respawn
   */
  killUnit(state, unitIdx) {
    state.entityData.isDead[unitIdx] = true;
    state.entityData.deathTime[unitIdx] = this.time;
    state.entityData.respawnTime[unitIdx] =
      this.time + this.params.fadeOutDuration + this.params.respawnDelay;

    // Increase experience of the brain that killed this unit (simplified)
    const brainId = state.entityData.brainId[unitIdx];
    if (brainId >= 0 && brainId < state.modeData.linebattle.brains.length) {
      const brain = state.modeData.linebattle.brains[brainId];
      if (brain) {
        brain.experience = Math.min(1.0, brain.experience + 0.01);
      }
    }
  }

  update(state, deltaTime) {
    this.time += deltaTime / 1000;

    // Recalculate brain formations
    this.recalculateBrainFormations(state);

    // Update unit positions
    this.updateUnits(state, deltaTime);

    // Handle combat
    this.handleCombat(state, deltaTime);

    // Integrate physics
    PhysicsSystem.integrate(state, deltaTime, {
      speedLimit: this.params.speedLimit,
      damping: this.params.dampingFactor,
    });

    // Wrap bounds
    PhysicsSystem.wrapBounds(state);
  }

  render(state, ctx) {
    return {
      entities: state.positions.slice(0, state.entityCount).map((pos, i) => ({
        index: i,
        position: pos,
        type: state.types[i],
        team: state.entityData?.teams?.[i] || 0,
        health: state.entityData?.health?.[i] || 1.0,
        maxHealth: state.entityData?.maxHealth?.[i] || 1.0,
        unitType: state.entityData?.unitType?.[i] || 0,
        isDead: state.entityData?.isDead?.[i] || false,
        opacity: state.entityData?.opacity?.[i] || 1.0,
        direction: state.directions[i] || 0,
      })),
      brains: state.modeData.linebattle?.brains || [],
      showHealthBars: this.params.showHealthBars,
    };
  }
}

export default LineBattleSimulation;
