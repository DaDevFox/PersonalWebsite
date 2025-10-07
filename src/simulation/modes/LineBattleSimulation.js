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
          color: "#FFFFFF",
          speed: 1.0,
          rangedDamage: {
            range: config.baseFiringRange || 80,
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
      const enemyBrains =
        brain.team === 1 ? team2Brains : team1Brains;

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
    for (let i = 0; i < brain.units.length && i < formation.positions.length; i++) {
      const unitIdx = brain.units[i];
      const formPos = formation.positions[i];

      // Rotate formation to face enemy
      const rotatedX =
        formPos[0] * Math.cos(angleToEnemy) - formPos[1] * Math.sin(angleToEnemy);
      const rotatedY =
        formPos[0] * Math.sin(angleToEnemy) + formPos[1] * Math.cos(angleToEnemy);

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
    for (let i = 0; i < state.entityCount; i++) {
      if (state.types[i] === 1) {
        type1Entities.push(i);
      }
    }

    // Step 2: Select random ~50% of Type 0 entities to include in Voronoi diagram
    const type0Entities = [];
    for (let i = 0; i < state.entityCount; i++) {
      if (state.types[i] === 0) {
        type0Entities.push(i);
      }
    }

    const voronoiType0Count = Math.floor(
      type0Entities.length * this.params.voronoiEntityPercentage
    );
    const shuffled = [...type0Entities].sort(() => Math.random() - 0.5);
    const selectedType0ForVoronoi = shuffled.slice(0, voronoiType0Count);

    // Step 3: Create Voronoi seed points (Type 1 + selected Type 0)
    const allVoronoiSeeds = [
      ...type1Entities.map((idx) => ({
        x: state.positions[idx][0],
        y: state.positions[idx][1],
        index: idx,
        isRaisedTerrain: true, // Type 1 = raised terrain
      })),
      ...selectedType0ForVoronoi.map((idx) => ({
        x: state.positions[idx][0],
        y: state.positions[idx][1],
        index: idx,
        isRaisedTerrain: false, // Type 0 = lowland
      })),
    ];

    // Step 4: Generate Voronoi cells
    const cells = allVoronoiSeeds.map((seed) => {
      const vertices = this.computeVoronoiCell(
        seed,
        allVoronoiSeeds,
        state.bounds
      );

      let terrainType = "lowland"; // default

      if (seed.isRaisedTerrain) {
        terrainType = "raised";
      } else {
        // Randomly assign forest or water to some lowland cells
        const rand = Math.random();
        if (rand < this.params.forestPercentage) {
          terrainType = "forest";
        } else if (
          rand <
          this.params.forestPercentage + this.params.waterPercentage
        ) {
          terrainType = "water";
        }
      }

      return {
        center: [seed.x, seed.y],
        seedIndex: seed.index,
        terrainType, // "raised", "lowland", "forest", or "water"
        vertices,
      };
    });

    // Step 5: Assign teams based on entity positions
    if (!state.entityData) state.entityData = {};
    state.entityData.teams = new Array(state.entityCount).fill(0);
    state.entityData.health = new Array(state.entityCount).fill(1.0);
    state.entityData.lastFired = new Array(state.entityCount).fill(0);
    state.entityData.companyId = new Array(state.entityCount).fill(-1);
    state.entityData.targetPosition = new Array(state.entityCount).fill(null);
    state.entityData.isGathered = new Array(state.entityCount).fill(false);

    // Assign teams: entities on raised terrain = Team 1, others = Team 2
    for (let i = 0; i < state.entityCount; i++) {
      const pos = state.positions[i];

      // Find which cell this entity is in
      let nearestCell = null;
      let minDist = Infinity;

      for (const cell of cells) {
        const dx = pos[0] - cell.center[0];
        const dy = pos[1] - cell.center[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestCell = cell;
        }
      }

      if (nearestCell && nearestCell.terrainType === "raised") {
        state.entityData.teams[i] = 1; // Defenders (Red)
      } else {
        state.entityData.teams[i] = 2; // Attackers (Blue)
      }
    }

    // Step 6: Initialize mode-specific data
    state.modeData.voronoi = {
      cells,
      companies: [], // Team 2 companies
    };
  }

  /**
   * Compute Voronoi cell polygon vertices for a seed point
   */
  computeVoronoiCell(seed, allSeeds, bounds) {
    const vertices = [];
    const numRays = 32; // Number of rays to cast for approximation

    // Cast rays in all directions from seed point
    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      // Binary search for the edge of the Voronoi cell along this ray
      let minDist = 0;
      let maxDist = Math.max(bounds.width, bounds.height) * 2;

      for (let iter = 0; iter < 20; iter++) {
        const testDist = (minDist + maxDist) / 2;
        const testX = seed.x + dx * testDist;
        const testY = seed.y + dy * testDist;

        // Check if this point is closest to our seed
        let closestToSeed = true;
        const distToSeed = testDist;

        for (const other of allSeeds) {
          if (other === seed) continue;

          const distToOther = Math.hypot(testX - other.x, testY - other.y);
          if (distToOther < distToSeed - 0.1) {
            closestToSeed = false;
            break;
          }
        }

        if (closestToSeed) {
          minDist = testDist;
        } else {
          maxDist = testDist;
        }
      }

      // Add vertex at the boundary
      const vertexX = seed.x + dx * minDist;
      const vertexY = seed.y + dy * minDist;

      // Clip to bounds
      const clippedX = Math.max(0, Math.min(bounds.width, vertexX));
      const clippedY = Math.max(0, Math.min(bounds.height, vertexY));

      vertices.push([clippedX, clippedY]);
    }

    return vertices;
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
   * Get the terrain type at a specific position
   */
  getTerrainAtPosition(pos, cells) {
    let nearestCell = null;
    let minDist = Infinity;

    for (const cell of cells) {
      const dx = pos[0] - cell.center[0];
      const dy = pos[1] - cell.center[1];
      const dist = Math.hypot(dx, dy);

      if (dist < minDist) {
        minDist = dist;
        nearestCell = cell;
      }
    }

    return nearestCell ? nearestCell.terrainType : "lowland";
  }

  update(state, deltaTime) {
    this.time += deltaTime / 1000;

    const { cells } = state.modeData.voronoi;
    const teams = state.entityData.teams;

    // Separate units by team
    const team1Units = []; // Defenders on raised terrain
    const team2Units = []; // Attackers

    for (let i = 0; i < state.entityCount; i++) {
      if (teams[i] === 1) {
        team1Units.push(i);
      } else if (teams[i] === 2) {
        team2Units.push(i);
      }
    }

    // Update Team 1 (Defenders) - move to perimeter
    this.updateDefenders(state, team1Units, cells);

    // Update Team 2 (Attackers) - gather in forests, then attack
    this.updateAttackers(state, team2Units, cells);

    // Handle combat
    this.handleCombat(state, team1Units, team2Units, cells);

    // Integrate physics
    PhysicsSystem.integrate(state, deltaTime, {
      speedLimit: this.params.speedLimit,
      damping: this.params.dampingFactor,
    });

    // Wrap bounds
    PhysicsSystem.wrapBounds(state);
  }

  /**
   * Check if an edge of a raised terrain cell borders lowland terrain
   */
  edgeBordersLowland(edgePoint, cells) {
    // Check if the point just outside this edge is in lowland terrain
    let nearestCell = null;
    let minDist = Infinity;

    for (const cell of cells) {
      const dx = edgePoint[0] - cell.center[0];
      const dy = edgePoint[1] - cell.center[1];
      const dist = Math.hypot(dx, dy);

      if (dist < minDist) {
        minDist = dist;
        nearestCell = cell;
      }
    }

    return nearestCell && nearestCell.terrainType === "lowland";
  }

  /**
   * Update Team 1 defenders - move to perimeter edges that border lowland terrain
   */
  updateDefenders(state, defenders, cells) {
    const inset = this.params.perimeterInset;

    for (const idx of defenders) {
      const pos = state.positions[idx];

      // Ensure defender is on raised terrain
      const currentTerrain = this.getTerrainAtPosition(pos, cells);

      // Find the raised terrain cell this defender is in/near
      let nearestRaisedCell = null;
      let minDist = Infinity;

      for (const cell of cells) {
        if (cell.terrainType !== "raised") continue;

        const dx = pos[0] - cell.center[0];
        const dy = pos[1] - cell.center[1];
        const dist = Math.hypot(dx, dy);

        if (dist < minDist) {
          minDist = dist;
          nearestRaisedCell = cell;
        }
      }

      if (!nearestRaisedCell) continue;

      // If defender fell off raised terrain, pull them back strongly
      if (currentTerrain !== "raised") {
        const dx = nearestRaisedCell.center[0] - pos[0];
        const dy = nearestRaisedCell.center[1] - pos[1];
        const dist = Math.hypot(dx, dy);

        const force = 70; // Strong pull back to raised terrain
        state.accelerations[idx] = [(dx / dist) * force, (dy / dist) * force];
        continue;
      }

      // Find closest point on perimeter edges that border lowland terrain
      const vertices = nearestRaisedCell.vertices;
      let closestPerimeterPoint = null;
      let minPerimeterDist = Infinity;

      for (let i = 0; i < vertices.length; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];

        // Get point on edge
        const edgeDx = v2[0] - v1[0];
        const edgeDy = v2[1] - v1[1];
        const edgeLen = Math.hypot(edgeDx, edgeDy);

        if (edgeLen === 0) continue;

        // Project position onto edge
        const t = Math.max(
          0,
          Math.min(
            1,
            ((pos[0] - v1[0]) * edgeDx + (pos[1] - v1[1]) * edgeDy) /
              (edgeLen * edgeLen)
          )
        );

        const edgePoint = [v1[0] + t * edgeDx, v1[1] + t * edgeDy];

        // Check if this edge borders lowland terrain
        // Test point slightly outside the edge (away from center)
        const toCenterDx = nearestRaisedCell.center[0] - edgePoint[0];
        const toCenterDy = nearestRaisedCell.center[1] - edgePoint[1];
        const toCenterLen = Math.hypot(toCenterDx, toCenterDy);

        if (toCenterLen === 0) continue;

        const testPoint = [
          edgePoint[0] - (toCenterDx / toCenterLen) * 5, // 5 units outside
          edgePoint[1] - (toCenterDy / toCenterLen) * 5,
        ];

        // Only consider edges that border lowland
        if (!this.edgeBordersLowland(testPoint, cells)) continue;

        // Inset point towards center
        const insetPoint = [
          edgePoint[0] + (toCenterDx / toCenterLen) * inset,
          edgePoint[1] + (toCenterDy / toCenterLen) * inset,
        ];

        const distToInset = Math.hypot(
          pos[0] - insetPoint[0],
          pos[1] - insetPoint[1]
        );

        if (distToInset < minPerimeterDist) {
          minPerimeterDist = distToInset;
          closestPerimeterPoint = insetPoint;
        }
      }

      // Move towards perimeter point if on raised terrain, or back to raised terrain if off it
      if (currentTerrain !== "raised") {
        // Pull back to raised terrain
        const dx = nearestRaisedCell.center[0] - pos[0];
        const dy = nearestRaisedCell.center[1] - pos[1];
        const dist = Math.hypot(dx, dy);

        const force = 60; // Strong pull back
        state.accelerations[idx] = [(dx / dist) * force, (dy / dist) * force];
      } else if (closestPerimeterPoint) {
        const dx = closestPerimeterPoint[0] - pos[0];
        const dy = closestPerimeterPoint[1] - pos[1];
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
          // Slow, orderly movement with slight randomness
          const force = 25 * this.params.formationMoveSpeed;
          const perturbX =
            (Math.random() - 0.5) * this.params.formationRandomPerturbation;
          const perturbY =
            (Math.random() - 0.5) * this.params.formationRandomPerturbation;

          state.accelerations[idx] = [
            (dx / dist) * force + perturbX,
            (dy / dist) * force + perturbY,
          ];
        } else {
          // In position - stop moving with strong damping
          state.accelerations[idx] = [0, 0];
          state.velocities[idx][0] *= 0.2;
          state.velocities[idx][1] *= 0.2;
        }
      }
    }

    // Apply separation force to keep defenders spaced out
    this.applySeparation(state, defenders);
  }

  /**
   * Update Team 2 attackers - gather in forests, avoid water, form companies, then attack
   */
  updateAttackers(state, attackers, cells) {
    const companyId = state.entityData.companyId;

    // Find forest cells
    const forestCells = cells.filter((c) => c.terrainType === "forest");
    const waterCells = cells.filter((c) => c.terrainType === "water");
    const raisedCells = cells.filter((c) => c.terrainType === "raised");

    // Assign attackers to companies
    const companies = new Map();

    for (const idx of attackers) {
      let assignedCompany = companyId[idx];

      // Assign to nearest company or create new one
      if (assignedCompany === -1 || !companies.has(assignedCompany)) {
        // Find nearest company with space
        let nearestCompany = -1;
        let nearestDist = Infinity;

        for (const [cid, company] of companies) {
          if (company.units.length >= this.params.companyMaxSize) continue;

          const avgX =
            company.units.reduce((sum, i) => sum + state.positions[i][0], 0) /
            company.units.length;
          const avgY =
            company.units.reduce((sum, i) => sum + state.positions[i][1], 0) /
            company.units.length;
          const dist = Math.hypot(
            state.positions[idx][0] - avgX,
            state.positions[idx][1] - avgY
          );

          if (dist < nearestDist && dist < 150) {
            nearestDist = dist;
            nearestCompany = cid;
          }
        }

        if (nearestCompany !== -1) {
          assignedCompany = nearestCompany;
        } else {
          assignedCompany = companies.size;
        }

        companyId[idx] = assignedCompany;
      }

      if (!companies.has(assignedCompany)) {
        companies.set(assignedCompany, {
          units: [],
          gatherPoint: null,
          isAttacking: false,
        });
      }

      companies.get(assignedCompany).units.push(idx);
    }

    // For each company, determine behavior
    for (const company of companies.values()) {
      // Find nearest forest as gather point
      if (!company.gatherPoint && forestCells.length > 0) {
        const avgX =
          company.units.reduce((sum, i) => sum + state.positions[i][0], 0) /
          company.units.length;
        const avgY =
          company.units.reduce((sum, i) => sum + state.positions[i][1], 0) /
          company.units.length;

        let nearestForest = null;
        let minDist = Infinity;

        for (const forest of forestCells) {
          const dist = Math.hypot(
            avgX - forest.center[0],
            avgY - forest.center[1]
          );
          if (dist < minDist) {
            minDist = dist;
            nearestForest = forest;
          }
        }

        company.gatherPoint = nearestForest ? nearestForest.center : null;
      }

      // Check if company is gathered (% of units within gather distance)
      let gatheredCount = 0;
      if (company.gatherPoint) {
        for (const idx of company.units) {
          const dist = Math.hypot(
            state.positions[idx][0] - company.gatherPoint[0],
            state.positions[idx][1] - company.gatherPoint[1]
          );
          if (dist < this.params.forestGatherDistance) {
            gatheredCount++;
          }
        }
      }

      const gatherRatio = gatheredCount / company.units.length;
      company.isAttacking = gatherRatio >= this.params.attackTriggerThreshold;

      // Move units
      for (const idx of company.units) {
        const pos = state.positions[idx];
        const currentTerrain = this.getTerrainAtPosition(pos, cells);

        state.accelerations[idx] = [0, 0];

        // Enforce terrain boundaries - keep attackers off raised terrain
        if (currentTerrain === "raised") {
          // Find nearest non-raised terrain and push unit there
          let nearestNonRaised = null;
          let minDist = Infinity;

          for (const cell of cells) {
            if (cell.terrainType === "raised") continue;

            const dx = cell.center[0] - pos[0];
            const dy = cell.center[1] - pos[1];
            const dist = Math.hypot(dx, dy);

            if (dist < minDist) {
              minDist = dist;
              nearestNonRaised = cell;
            }
          }

          if (nearestNonRaised) {
            const dx = nearestNonRaised.center[0] - pos[0];
            const dy = nearestNonRaised.center[1] - pos[1];
            const dist = Math.hypot(dx, dy);
            const force = 80; // Strong push away from raised terrain
            state.accelerations[idx] = [
              (dx / dist) * force,
              (dy / dist) * force,
            ];
          }
          continue; // Skip normal movement while being pushed off raised terrain
        }

        if (company.isAttacking) {
          // Attack nearest raised terrain - stop at firing range, don't enter it
          if (raisedCells.length > 0) {
            let nearestRaised = null;
            let minDist = Infinity;

            for (const raised of raisedCells) {
              const dist = Math.hypot(
                pos[0] - raised.center[0],
                pos[1] - raised.center[1]
              );
              if (dist < minDist) {
                minDist = dist;
                nearestRaised = raised;
              }
            }

            if (nearestRaised) {
              // Stop at firing range - stay at 75% of max range for safety
              const optimalRange = this.params.baseFiringRange * 0.75;
              const dx = nearestRaised.center[0] - pos[0];
              const dy = nearestRaised.center[1] - pos[1];
              const dist = Math.hypot(dx, dy);

              if (dist > optimalRange + 15) {
                // Move closer slowly in formation
                const force = 18 * this.params.formationMoveSpeed;
                const perturbX =
                  (Math.random() - 0.5) *
                  this.params.formationRandomPerturbation;
                const perturbY =
                  (Math.random() - 0.5) *
                  this.params.formationRandomPerturbation;

                state.accelerations[idx] = [
                  (dx / dist) * force + perturbX,
                  (dy / dist) * force + perturbY,
                ];
              } else if (dist < optimalRange - 15) {
                // Too close to enemy raised terrain, back away
                const force = 12;
                state.accelerations[idx] = [
                  -(dx / dist) * force,
                  -(dy / dist) * force,
                ];
              } else {
                // At optimal firing range - hold position
                state.velocities[idx][0] *= 0.6;
                state.velocities[idx][1] *= 0.6;
              }
            }
          }
        } else {
          // Gather at forest in formation
          if (company.gatherPoint) {
            const dx = company.gatherPoint[0] - pos[0];
            const dy = company.gatherPoint[1] - pos[1];
            const dist = Math.hypot(dx, dy);

            if (dist > this.params.forestGatherDistance) {
              // Move to forest slowly in formation
              const force = 18 * this.params.formationMoveSpeed;
              const perturbX =
                (Math.random() - 0.5) * this.params.formationRandomPerturbation;
              const perturbY =
                (Math.random() - 0.5) * this.params.formationRandomPerturbation;

              state.accelerations[idx] = [
                (dx / dist) * force + perturbX,
                (dy / dist) * force + perturbY,
              ];
            } else {
              // Near forest - slow down and hold position
              state.velocities[idx][0] *= 0.4;
              state.velocities[idx][1] *= 0.4;
            }
          }
        }

        // Avoid water
        for (const water of waterCells) {
          const dx = state.positions[idx][0] - water.center[0];
          const dy = state.positions[idx][1] - water.center[1];
          const dist = Math.hypot(dx, dy);

          if (dist < 100) {
            const avoidForce = 50 * (1 - dist / 100);
            state.accelerations[idx][0] += (dx / dist) * avoidForce;
            state.accelerations[idx][1] += (dy / dist) * avoidForce;
          }
        }
      }
    }

    // Apply separation force to keep attackers spaced out
    this.applySeparation(state, attackers);

    state.modeData.voronoi.companies = Array.from(companies.values());
  }

  /**
   * Handle combat between teams
   */
  handleCombat(state, defenders, attackers, cells) {
    const health = state.entityData.health;
    const lastFired = state.entityData.lastFired;
    const now = this.time * 1000;

    // Defenders can fire at attackers (doubled range on raised terrain, can't hit units in forest)
    for (const defIdx of defenders) {
      if (health[defIdx] <= 0) continue;

      const defPos = state.positions[defIdx];

      // Check if defender is on raised terrain
      let onRaisedTerrain = false;
      for (const cell of cells) {
        if (cell.terrainType === "raised") {
          const dist = Math.hypot(
            defPos[0] - cell.center[0],
            defPos[1] - cell.center[1]
          );
          if (dist < 80) {
            onRaisedTerrain = true;
            break;
          }
        }
      }

      const firingRange =
        this.params.baseFiringRange *
        (onRaisedTerrain ? this.params.raisedTerrainRangeMultiplier : 1.0);

      // Find targets in range
      for (const attIdx of attackers) {
        if (health[attIdx] <= 0) continue;

        const attPos = state.positions[attIdx];
        const dx = attPos[0] - defPos[0];
        const dy = attPos[1] - defPos[1];
        const dist = Math.hypot(dx, dy);

        if (dist > firingRange) continue;

        // Check if attacker is in forest (can't be hit)
        let inForest = false;
        for (const cell of cells) {
          if (cell.terrainType === "forest") {
            const cellDist = Math.hypot(
              attPos[0] - cell.center[0],
              attPos[1] - cell.center[1]
            );
            if (cellDist < 60) {
              inForest = true;
              break;
            }
          }
        }

        if (inForest) continue;

        // Fire if interval allows
        if (now - lastFired[defIdx] > this.params.firingInterval) {
          health[attIdx] -= this.params.damagePerHit;
          lastFired[defIdx] = now;
          break; // One target at a time
        }
      }
    }

    // Attackers can fire back at defenders (base range only)
    for (const attIdx of attackers) {
      if (health[attIdx] <= 0) continue;

      const attPos = state.positions[attIdx];

      for (const defIdx of defenders) {
        if (health[defIdx] <= 0) continue;

        const defPos = state.positions[defIdx];
        const dx = defPos[0] - attPos[0];
        const dy = defPos[1] - attPos[1];
        const dist = Math.hypot(dx, dy);

        if (dist > this.params.baseFiringRange) continue;

        if (now - lastFired[attIdx] > this.params.firingInterval) {
          health[defIdx] -= this.params.damagePerHit;
          lastFired[attIdx] = now;
          break;
        }
      }
    }

    // Remove dead units
    for (let i = state.entityCount - 1; i >= 0; i--) {
      if (health[i] <= 0) {
        // Swap with last entity and reduce count
        const lastIdx = state.entityCount - 1;
        if (i !== lastIdx) {
          state.positions[i] = state.positions[lastIdx];
          state.velocities[i] = state.velocities[lastIdx];
          state.accelerations[i] = state.accelerations[lastIdx];
          state.directions[i] = state.directions[lastIdx];
          state.types[i] = state.types[lastIdx];

          if (state.entityData) {
            const dataArrays = Object.keys(state.entityData);
            for (const key of dataArrays) {
              if (state.entityData[key][lastIdx] !== undefined) {
                state.entityData[key][i] = state.entityData[key][lastIdx];
              }
            }
          }
        }
        state.entityCount--;
      }
    }
  }

  render(state, ctx) {
    return {
      entities: state.positions.slice(0, state.entityCount).map((pos, i) => ({
        index: i,
        position: pos,
        type: state.types[i],
        team: state.entityData?.teams?.[i] || 0,
        health: state.entityData?.health?.[i] || 1.0,
        direction: state.directions[i] || 0,
      })),
      cells: state.modeData.voronoi?.cells || [],
      showHealthBars: this.params.showHealthBars,
    };
  }
}

export default LineBattleSimulation;
