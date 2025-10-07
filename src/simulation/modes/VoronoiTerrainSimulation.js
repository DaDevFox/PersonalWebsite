/**
 * VoronoiSimulation.js
 *
 * Implements a team-based naval and land warfare simulation with Voronoi tessellation.
 * Pirate ships battle on water, land units form clusters and engage in combat.
 * Used for the "Games" section.
 */

import { BaseSimulationMode } from "../core/BaseSimulationMode";
import { PhysicsSystem } from "../core/PhysicsSystem";

// Simple 2D Perlin-like noise generator
class SimpleNoise {
  constructor(seed = 0) {
    this.seed = seed;
  }

  // Pseudo-random hash function
  hash(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
    return n - Math.floor(n);
  }

  // 2D noise function
  noise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    // Smoothstep interpolation
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);

    // Hash corners
    const a = this.hash(xi, yi);
    const b = this.hash(xi + 1, yi);
    const c = this.hash(xi, yi + 1);
    const d = this.hash(xi + 1, yi + 1);

    // Bilinear interpolation
    return (
      a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v
    );
  }
}

export class VoronoiTerrainSimulation extends BaseSimulationMode {
  constructor(config = {}) {
    super({
      name: "voronoi",
      backgroundColor: config.backgroundColor || "#87ceeb",
      ...config,
    });

    this.params = {
      // World generation
      minimumCells: config.minimumCells || 6,
      raisedPercentage: config.landPercentage || 0.4,
      minimumLandCells: config.minimumLandCells || 2,
      seedPointCount: config.seedPointCount || 30,

      // Naval combat parameters
      shipAwarenessDistance: config.shipAwarenessDistance || 200,
      shipFiringDistance: config.shipFiringDistance || 100,
      cohesionAlpha: config.cohesionAlpha || 0.3, // Scales friendly cohesion when enemy nearby
      cannonDamage: config.cannonDamage || 0.1, // Health lost per hit
      firingInterval: config.firingInterval || 1000, // ms between shots

      // Ship health and respawn
      maxShipHealth: config.maxShipHealth || 1.0,
      sinkingDuration: config.sinkingDuration || 2000, // ms to fully sink

      // Land combat parameters
      landAwarenessDistance: config.landAwarenessDistance || 150,
      clusterMinUnits: config.clusterMinUnits || 5,
      clusterMaxRowSize: config.clusterMaxRowSize || 5,
      clusterFormationSpacing: config.clusterFormationSpacing || 15,
      clusterPositionEpsilon: config.clusterPositionEpsilon || 10,
      landCombatInterval: config.landCombatInterval || 3000, // ms between calculations
      landCombatMaxLoss: config.landCombatMaxLoss || 5, // Max units lost per interval

      // Boids parameters for ships
      separationForce: config.separationForce || 40,
      separationDistance: config.separationDistance || 40,
      cohesionForce: config.cohesionForce || 20,
      cohesionDistance: config.cohesionDistance || 150,
      alignmentForce: config.alignmentForce || 15,
      alignmentDistance: config.alignmentDistance || 100,

      // Movement parameters
      speedLimit: config.speedLimit || 1.5,
      dampingFactor: config.dampingFactor || 0.98,

      // UI options
      showHealthBars:
        config.showHealthBars !== undefined ? config.showHealthBars : true,

      // Colors
      landColor: config.landColor || "#8B7355",
      waterColor: config.waterColor || "#4682B4",
      team1Color: config.team1Color || "#FF0000", // Red
      team2Color: config.team2Color || "#0000FF", // Blue
    };

    // Initialize noise generator
    this.noise = new SimpleNoise(Math.random() * 1000);
    this.time = 0;
    this.lastCombatUpdate = 0;
    this.lastLandCombat = 0;
  }

  async initialize(state, isFirstLoad = true) {
    // Get previous simulation mode from state
    const previousMode = state.activeSimulation;

    // Step 1: Determine if we need to reassign entity types
    // If transitioning from anything other than springs, randomly assign types
    if (previousMode !== "springs" && previousMode !== "voronoi") {
      // Randomly assign all existing entities to type 0 or type 1
      for (let i = 0; i < state.entityCount; i++) {
        state.types[i] = Math.random() < 0.5 ? 0 : 1;
      }
    }
    // If from springs, entities already have type 0 (joints) and type 1 (sinks) - keep them

    // Step 2: Collect all Type 1 entities as Voronoi seed points
    const seedPoints = [];
    for (let i = 0; i < state.entityCount; i++) {
      if (state.types[i] === 1) {
        seedPoints.push({
          x: state.positions[i][0],
          y: state.positions[i][1],
          index: i,
        });
      }
    }

    // Ensure minimum number of seed points
    while (
      seedPoints.length < this.params.minimumCells &&
      state.entityCount > 0
    ) {
      // Convert a random Type 0 entity to Type 1
      let idx = Math.floor(Math.random() * state.entityCount);
      while (state.types[idx] === 1 && seedPoints.length < state.entityCount) {
        idx = (idx + 1) % state.entityCount;
      }
      if (state.types[idx] !== 1) {
        state.types[idx] = 1;
        seedPoints.push({
          x: state.positions[idx][0],
          y: state.positions[idx][1],
          index: idx,
        });
      }
    }

    // Step 3: Generate Voronoi diagram from Type 1 entities
    const cells = seedPoints.map((seed) => {
      const isLand = Math.random() < this.params.raisedPercentage;
      const vertices = this.computeVoronoiCell(seed, seedPoints, state.bounds);

      return {
        center: [seed.x, seed.y],
        seedIndex: seed.index,
        isLand,
        vertices,
        radius: 80 + Math.random() * 40,
        landmassId: -1, // Will be assigned by flood fill
      };
    });

    // Ensure minimum number of land cells
    let landCount = cells.filter((cell) => cell.isLand).length;
    while (landCount < this.params.minimumLandCells) {
      const waterCells = cells.filter((cell) => !cell.isLand);
      if (waterCells.length === 0) break;
      const idx = Math.floor(Math.random() * waterCells.length);
      waterCells[idx].isLand = true;
      landCount++;
    }

    // Step 4: Flood fill to assign landmass IDs
    const landmasses = this.identifyLandmasses(cells);

    // Step 5: Assign teams and convert all water entities to pirate ships
    const ships = []; // All pirate ships (Type 2)
    const landUnits = []; // All land units (Type 0)

    // Initialize entity data arrays
    if (!state.entityData) state.entityData = {};
    state.entityData.teams = new Array(state.entityCount).fill(0);
    state.entityData.health = new Array(state.entityCount).fill(1.0);
    state.entityData.sinking = new Array(state.entityCount).fill(false);
    state.entityData.sinkStartTime = new Array(state.entityCount).fill(0);
    state.entityData.inSkirmish = new Array(state.entityCount).fill(false);
    state.entityData.targetEnemy = new Array(state.entityCount).fill(-1);
    state.entityData.lastFired = new Array(state.entityCount).fill(0);
    state.entityData.clusterId = new Array(state.entityCount).fill(-1);

    // Assign teams - ensure 50/50 split
    const allEntities = [];
    for (let i = 0; i < state.entityCount; i++) {
      if (state.types[i] !== 1) {
        // Not a seed point
        allEntities.push(i);
      }
    }

    // Shuffle and assign teams
    for (let i = allEntities.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allEntities[i], allEntities[j]] = [allEntities[j], allEntities[i]];
    }

    const halfPoint = Math.floor(allEntities.length / 2);
    allEntities.forEach((idx, i) => {
      state.entityData.teams[idx] = i < halfPoint ? 1 : 2;
    });

    // Convert entities based on nearest cell
    for (let i = 0; i < state.entityCount; i++) {
      if (state.types[i] === 1) continue; // Skip seed points

      // Find nearest cell
      const pos = state.positions[i];
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

      if (nearestCell) {
        if (nearestCell.isLand) {
          // Land unit
          state.types[i] = 0;
          landUnits.push(i);
        } else {
          // Pirate ship
          state.types[i] = 2;
          ships.push(i);
        }
      }
    }

    // Initialize mode-specific data
    state.modeData.voronoi = {
      cells,
      landmasses,
      ships,
      landUnits,
      skirmishes: [], // Active naval skirmishes
      clusters: [], // Land unit clusters
    };
  }

  /**
   * Identify landmasses using flood fill on connected land cells
   */
  identifyLandmasses(cells) {
    const landmasses = [];
    const visited = new Set();

    for (let i = 0; i < cells.length; i++) {
      if (!cells[i].isLand || visited.has(i)) continue;

      // Start a new landmass with flood fill
      const landmass = [];
      const queue = [i];
      visited.add(i);

      while (queue.length > 0) {
        const cellIdx = queue.shift();
        landmass.push(cellIdx);
        cells[cellIdx].landmassId = landmasses.length;

        // Check neighbors (cells that share vertices)
        for (let j = 0; j < cells.length; j++) {
          if (visited.has(j) || !cells[j].isLand) continue;

          // Check if cells are adjacent (share vertices)
          const isAdjacent = this.cellsAreAdjacent(cells[cellIdx], cells[j]);
          if (isAdjacent) {
            visited.add(j);
            queue.push(j);
          }
        }
      }

      landmasses.push(landmass);
    }

    return landmasses;
  }

  /**
   * Check if two cells are adjacent (share vertices)
   */
  cellsAreAdjacent(cellA, cellB) {
    const threshold = 5; // Vertices within this distance are considered the same
    for (const vA of cellA.vertices) {
      for (const vB of cellB.vertices) {
        const dist = Math.hypot(vA[0] - vB[0], vA[1] - vB[1]);
        if (dist < threshold) return true;
      }
    }
    return false;
  }

  /**
   * Compute Voronoi cell polygon vertices for a seed point
   * Uses the definition: a Voronoi cell is the region closer to this seed than any other
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

  update(state, deltaTime) {
    this.time += deltaTime / 1000;

    const { cells, ships, landUnits } = state.modeData.voronoi;

    // Ensure entityData exists
    if (!state.entityData) {
      state.entityData = {
        teams: [],
        health: [],
        sinking: [],
        sinkStartTime: [],
        inSkirmish: [],
        targetEnemy: [],
        lastFired: [],
        clusterId: [],
        clusterPositions: [], // Target position in cluster formation
        inCombat: [], // Whether unit is currently engaged in combat
      };
    }

    const teams = state.entityData.teams;
    const health = state.entityData.health;
    const sinking = state.entityData.sinking;
    const sinkStartTime = state.entityData.sinkStartTime;

    // Update sinking ships
    for (const shipIdx of ships) {
      if (sinking[shipIdx]) {
        const elapsed = this.time * 1000 - sinkStartTime[shipIdx];
        if (elapsed >= this.params.sinkingDuration) {
          // Respawn at random water cell edge
          this.respawnShip(state, shipIdx, cells);
          sinking[shipIdx] = false;
          health[shipIdx] = this.params.maxShipHealth;
        }
      }
    }

    // Naval combat - ships use boids with enemy awareness
    this.updateShips(
      state,
      deltaTime,
      ships,
      teams,
      health,
      sinking,
      sinkStartTime
    );

    // Land combat - form clusters and engage
    this.updateLandUnits(state, deltaTime, landUnits, teams, health, cells);

    // Integrate physics
    PhysicsSystem.integrate(state, deltaTime, {
      speedLimit: this.params.speedLimit,
      damping: this.params.dampingFactor,
    });

    // Wrap bounds
    PhysicsSystem.wrapBounds(state);
  }

  /**
   * Update ship movement and combat
   */
  updateShips(state, deltaTime, ships, teams, health, sinking, sinkStartTime) {
    const awarenessDistSq = this.params.shipAwarenessDistance ** 2;
    const firingDistSq = this.params.shipFiringDistance ** 2;

    for (const current of ships) {
      if (sinking[current] || health[current] <= 0) continue;

      const pos = state.positions[current];
      const myTeam = teams[current];

      // Find nearby ships by team
      const nearbyFriendly = [];
      const nearbyEnemy = [];

      for (const other of ships) {
        if (other === current || sinking[other]) continue;

        const dx = state.positions[other][0] - pos[0];
        const dy = state.positions[other][1] - pos[1];
        const distSq = dx * dx + dy * dy;

        if (distSq < awarenessDistSq) {
          if (teams[other] === myTeam) {
            nearbyFriendly.push({ idx: other, dx, dy, distSq });
          } else {
            nearbyEnemy.push({ idx: other, dx, dy, distSq });
          }
        }
      }

      // Apply boids forces
      this.applyBoidsForces(state, current, nearbyFriendly, nearbyEnemy);

      // Handle combat
      if (nearbyEnemy.length > 0) {
        // Find closest enemy
        nearbyEnemy.sort((a, b) => a.distSq - b.distSq);
        const closestEnemy = nearbyEnemy[0];

        if (closestEnemy.distSq < firingDistSq) {
          // In firing range - smoothly rotate to broadside (90 degrees to enemy)
          const angleToEnemy = Math.atan2(closestEnemy.dy, closestEnemy.dx);
          const targetAngle = angleToEnemy + Math.PI / 2; // Broadside is perpendicular

          // Smooth angle interpolation to avoid jitter
          let currentAngle = state.directions[current] || 0;
          let angleDiff = targetAngle - currentAngle;

          // Normalize angle difference to [-PI, PI]
          while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
          while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

          // Use fixed rotation speed for consistency
          const rotationSpeed = 0.05;
          if (Math.abs(angleDiff) > rotationSpeed) {
            currentAngle += Math.sign(angleDiff) * rotationSpeed;
          } else {
            currentAngle = targetAngle;
          }

          state.directions[current] = currentAngle;

          // Slow down significantly when trying to broadside
          state.velocities[current][0] *= 0.85;
          state.velocities[current][1] *= 0.85;

          // Fire at intervals only when properly aligned (within 10 degrees)
          const now = this.time * 1000;
          if (
            Math.abs(angleDiff) < 0.175 &&
            now - state.entityData.lastFired[current] >
              this.params.firingInterval
          ) {
            health[closestEnemy.idx] -= this.params.cannonDamage;
            state.entityData.lastFired[current] = now;

            if (health[closestEnemy.idx] <= 0) {
              // Start sinking
              sinking[closestEnemy.idx] = true;
              sinkStartTime[closestEnemy.idx] = now;
            }
          }
        } else {
          // Enemy in awareness range but not firing range - face direction of movement
          const vel = state.velocities[current];
          const speed = Math.hypot(vel[0], vel[1]);
          if (speed > 0.3) {
            state.directions[current] = Math.atan2(vel[1], vel[0]);
          }
        }
      } else {
        // No enemies - face direction of movement
        const vel = state.velocities[current];
        const speed = Math.hypot(vel[0], vel[1]);
        if (speed > 0.3) {
          state.directions[current] = Math.atan2(vel[1], vel[0]);
        }
      }
    }
  }

  /**
   * Apply boids forces to a ship
   */
  applyBoidsForces(state, current, nearbyFriendly, nearbyEnemy) {
    let sepX = 0,
      sepY = 0;
    let cohX = 0,
      cohY = 0;
    let alignX = 0,
      alignY = 0;

    const sepDistSq = this.params.separationDistance ** 2;
    const cohDistSq = this.params.cohesionDistance ** 2;
    const alignDistSq = this.params.alignmentDistance ** 2;

    // Separation (all nearby ships)
    const allNearby = [...nearbyFriendly, ...nearbyEnemy];
    for (const { dx, dy, distSq } of allNearby) {
      if (distSq < sepDistSq && distSq > 0) {
        sepX -= dx;
        sepY -= dy;
      }
    }

    // Cohesion and alignment (scaled based on enemy presence)
    const alpha = nearbyEnemy.length > 0 ? this.params.cohesionAlpha : 1.0;

    // Cohesion to friendly ships
    for (const { dx, dy, distSq } of nearbyFriendly) {
      if (distSq < cohDistSq) {
        cohX += dx;
        cohY += dy;
      }
      if (distSq < alignDistSq) {
        const other = nearbyFriendly.find(
          (n) => n.dx === dx && n.dy === dy
        ).idx;
        alignX += state.velocities[other][0];
        alignY += state.velocities[other][1];
      }
    }

    // Cohesion to enemy ships (when enemies nearby)
    if (nearbyEnemy.length > 0) {
      for (const { dx, dy, distSq } of nearbyEnemy) {
        if (distSq < cohDistSq) {
          cohX += (dx * (1 - alpha)) / alpha;
          cohY += (dy * (1 - alpha)) / alpha;
        }
      }
    }

    // Apply forces
    const sepLen = Math.hypot(sepX, sepY);
    if (sepLen > 0) {
      state.accelerations[current][0] +=
        (sepX / sepLen) * this.params.separationForce;
      state.accelerations[current][1] +=
        (sepY / sepLen) * this.params.separationForce;
    }

    const cohLen = Math.hypot(cohX, cohY);
    if (cohLen > 0) {
      state.accelerations[current][0] +=
        (cohX / cohLen) * this.params.cohesionForce * alpha;
      state.accelerations[current][1] +=
        (cohY / cohLen) * this.params.cohesionForce * alpha;
    }

    const alignLen = Math.hypot(alignX, alignY);
    if (alignLen > 0) {
      state.accelerations[current][0] +=
        (alignX / alignLen) * this.params.alignmentForce;
      state.accelerations[current][1] +=
        (alignY / alignLen) * this.params.alignmentForce;
    }
  }

  /**
   * Update land units - cluster formation and combat
   */
  updateLandUnits(state, deltaTime, landUnits, teams, health, cells) {
    if (landUnits.length === 0) return;

    // Ensure arrays are initialized
    if (!state.entityData.clusterId) state.entityData.clusterId = [];
    if (!state.entityData.clusterPositions)
      state.entityData.clusterPositions = [];

    const clusterId = state.entityData.clusterId;
    const clusterPositions = state.entityData.clusterPositions;

    // Step 1: Build clusters from current positions
    const clusters = new Map(); // clusterId -> {units: [], centerX, centerY, team}

    for (const idx of landUnits) {
      const myTeam = teams[idx];

      // Assign to team-based cluster (simple: one cluster per team for now)
      const assignedCluster = myTeam;
      clusterId[idx] = assignedCluster;

      // Add to cluster
      if (!clusters.has(assignedCluster)) {
        clusters.set(assignedCluster, {
          units: [],
          centerX: 0,
          centerY: 0,
          team: myTeam,
        });
      }

      clusters.get(assignedCluster).units.push(idx);
    }

    // Step 2: Calculate cluster centers (average of all unit positions)
    for (const cluster of clusters.values()) {
      let sumX = 0,
        sumY = 0;
      for (const idx of cluster.units) {
        sumX += state.positions[idx][0];
        sumY += state.positions[idx][1];
      }
      cluster.centerX = sumX / cluster.units.length;
      cluster.centerY = sumY / cluster.units.length;
    }

    // Step 3: Assign grid positions within each cluster
    for (const cluster of clusters.values()) {
      const units = cluster.units;
      const rowSize = Math.min(
        this.params.clusterMaxRowSize,
        Math.ceil(Math.sqrt(units.length))
      );
      const spacing = this.params.clusterFormationSpacing;

      for (let i = 0; i < units.length; i++) {
        const row = Math.floor(i / rowSize);
        const col = i % rowSize;

        // Center the formation
        const offsetX = (col - (rowSize - 1) / 2) * spacing;
        const offsetY =
          (row - (Math.ceil(units.length / rowSize) - 1) / 2) * spacing;

        clusterPositions[units[i]] = [
          cluster.centerX + offsetX,
          cluster.centerY + offsetY,
        ];
      }
    }

    // Step 4: Move units to their assigned positions
    for (const idx of landUnits) {
      const targetPos = clusterPositions[idx];
      if (!targetPos) {
        // Failsafe: if no target, stay still
        state.accelerations[idx] = [0, 0];
        continue;
      }

      const pos = state.positions[idx];
      const dx = targetPos[0] - pos[0];
      const dy = targetPos[1] - pos[1];
      const dist = Math.hypot(dx, dy);

      // Always clear previous accelerations for land units
      state.accelerations[idx] = [0, 0];

      if (dist > this.params.clusterPositionEpsilon) {
        // Move towards position with stronger force
        const force = 50;
        state.accelerations[idx][0] = (dx / dist) * force;
        state.accelerations[idx][1] = (dy / dist) * force;
      } else {
        // In position - apply strong damping
        state.velocities[idx][0] *= 0.5;
        state.velocities[idx][1] *= 0.5;
      }
    }

    // Step 5: Combat between nearby enemy clusters
    const now = this.time * 1000;
    if (now - this.lastLandCombat > this.params.landCombatInterval) {
      this.lastLandCombat = now;

      const clusterArray = Array.from(clusters.entries());

      for (let i = 0; i < clusterArray.length; i++) {
        const [, cluster1] = clusterArray[i];

        for (let j = i + 1; j < clusterArray.length; j++) {
          const [, cluster2] = clusterArray[j];

          // Only fight enemy clusters
          if (cluster1.team === cluster2.team) continue;

          // Check if close enough to engage
          const dx = cluster1.centerX - cluster2.centerX;
          const dy = cluster1.centerY - cluster2.centerY;
          const dist = Math.hypot(dx, dy);

          if (dist < this.params.landAwarenessDistance) {
            // Calculate casualties
            const size1 = cluster1.units.length;
            const size2 = cluster2.units.length;

            // Losses proportional to enemy size
            const ratio1 = size2 / (size1 + size2);
            const ratio2 = size1 / (size1 + size2);

            const maxLoss = this.params.landCombatMaxLoss;
            const losses1 = Math.floor(Math.random() * ratio1 * maxLoss);
            const losses2 = Math.floor(Math.random() * ratio2 * maxLoss);

            // Remove casualties
            for (let k = 0; k < losses1 && cluster1.units.length > 0; k++) {
              const victimIdx = cluster1.units.pop();
              // Mark for removal
              health[victimIdx] = 0;
            }

            for (let k = 0; k < losses2 && cluster2.units.length > 0; k++) {
              const victimIdx = cluster2.units.pop();
              // Mark for removal
              health[victimIdx] = 0;
            }
          }
        }
      }

      // Remove dead units from simulation
      const deadUnits = landUnits.filter((idx) => health[idx] <= 0);
      for (const idx of deadUnits) {
        // Remove from state by swapping with last entity
        const lastIdx = state.entityCount - 1;
        if (idx !== lastIdx) {
          // Swap positions, velocities, etc.
          state.positions[idx] = state.positions[lastIdx];
          state.velocities[idx] = state.velocities[lastIdx];
          state.accelerations[idx] = state.accelerations[lastIdx];
          state.directions[idx] = state.directions[lastIdx];
          state.types[idx] = state.types[lastIdx];

          // Swap entity data
          if (state.entityData) {
            const dataArrays = Object.keys(state.entityData);
            for (const key of dataArrays) {
              if (state.entityData[key][lastIdx] !== undefined) {
                state.entityData[key][idx] = state.entityData[key][lastIdx];
              }
            }
          }
        }

        // Reduce entity count
        state.entityCount--;
      }
    }
  }

  /**
   * Respawn ship at random water cell edge
   */
  respawnShip(state, shipIdx, cells) {
    const waterCells = cells.filter((c) => !c.isLand);
    if (waterCells.length === 0) return;

    const cell = waterCells[Math.floor(Math.random() * waterCells.length)];
    const vertices = cell.vertices;
    if (!vertices || vertices.length === 0) return;

    // Pick random edge vertex
    const vertexIdx = Math.floor(Math.random() * vertices.length);
    state.positions[shipIdx] = [...vertices[vertexIdx]];
    state.velocities[shipIdx] = [0, 0];
    state.accelerations[shipIdx] = [0, 0];
  }

  render(state, ctx) {
    return {
      entities: state.positions.map((pos, i) => ({
        index: i,
        position: pos,
        type: state.types[i],
        team: state.entityData?.teams?.[i] || 0,
        health: state.entityData?.health?.[i] || 1.0,
        sinking: state.entityData?.sinking?.[i] || false,
        direction: state.directions[i] || 0,
      })),
      cells: state.modeData.voronoi?.cells || [],
      showHealthBars: this.params.showHealthBars,
    };
  }
}

export default VoronoiHybridSimulation;
