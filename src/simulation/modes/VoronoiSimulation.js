/**
 * VoronoiSimulation.js
 *
 * Implements a procedurally generated world with Voronoi tessellation.
 * Fishing boats on water, people on land, with random walk behavior.
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

export class VoronoiSimulation extends BaseSimulationMode {
  constructor(config = {}) {
    super({
      name: "voronoi",
      backgroundColor: config.backgroundColor || "#87ceeb",
      ...config,
    });

    this.params = {
      // World generation
      landPercentage: config.landPercentage || 0.4,
      seedPointCount: config.seedPointCount || 30,

      // Entity counts
      fishingBoatCount: config.fishingBoatCount || 40, // Type 2 - on water
      peopleCount: config.peopleCount || 60, // Type 0 - on land

      // Movement parameters
      speedLimit: config.speedLimit || 1.5,

      // Random walk (Perlin-driven)
      noiseScale: config.noiseScale || 0.005,
      noiseInfluence: config.noiseInfluence || 0.8,
      randomWalkForce: config.randomWalkForce || 15,

      // Edge repulsion (keep entities away from land/water boundaries)
      edgeRepulsionForce: config.edgeRepulsionForce || 30,
      edgeRepulsionDistance: config.edgeRepulsionDistance || 50,

      // Simplified boids (separation only)
      separationForce: config.separationForce || 40,
      separationDistance: config.separationDistance || 40,

      // Colors
      landColor: config.landColor || "#8B7355",
      waterColor: config.waterColor || "#4682B4",
    };

    // Initialize noise generator
    this.noise = new SimpleNoise(Math.random() * 1000);
    this.time = 0;
  }

  async initialize(state, isFirstLoad = true) {
    // Initialize mode-specific data
    state.modeData.voronoi = {
      cells: [],
      landCells: [],
      waterCells: [],
      fishingBoats: [],
      people: [],
    };

    // Only clear and recreate entities on first load
    if (isFirstLoad) {
      // Clear existing entities
      state.positions = [];
      state.velocities = [];
      state.accelerations = [];
      state.directions = [];
      state.types = [];
      state.entityCount = 0;

      // Generate Voronoi seed points (Type 1 - non-simulated markers)
      const seedPoints = [];
      for (let i = 0; i < this.params.seedPointCount; i++) {
        const x = Math.random() * state.bounds.width;
        const y = Math.random() * state.bounds.height;

        state.positions[i] = [x, y];
        state.velocities[i] = [0, 0];
        state.accelerations[i] = [0, 0];
        state.directions[i] = 0;
        state.types[i] = 1; // Seed point (invisible)

        seedPoints.push({ x, y, index: i });
      }

      state.entityCount = this.params.seedPointCount;

      // Generate Voronoi cells with proper polygon vertices
      const cells = seedPoints.map((seed, idx) => {
        const isLand = Math.random() < this.params.landPercentage;

        // Compute Voronoi cell polygon vertices
        const vertices = this.computeVoronoiCell(
          seed,
          seedPoints,
          state.bounds
        );

        return {
          center: [seed.x, seed.y],
          isLand,
          vertices, // Actual polygon vertices
          radius: 80 + Math.random() * 40, // Keep for spawning entities
        };
      });

      state.modeData.voronoi.cells = cells;
      state.modeData.voronoi.landCells = cells
        .map((cell, idx) => (cell.isLand ? idx : -1))
        .filter((idx) => idx !== -1);
      state.modeData.voronoi.waterCells = cells
        .map((cell, idx) => (!cell.isLand ? idx : -1))
        .filter((idx) => idx !== -1);

      // Create people on land (Type 0)
      const people = [];
      for (let i = 0; i < this.params.peopleCount; i++) {
        const cellIdx =
          state.modeData.voronoi.landCells[
            Math.floor(Math.random() * state.modeData.voronoi.landCells.length)
          ];
        const cell = cells[cellIdx];

        // Random position within cell
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * cell.radius * 0.7;
        const x = cell.center[0] + Math.cos(angle) * radius;
        const y = cell.center[1] + Math.sin(angle) * radius;

        const idx = state.entityCount++;
        state.positions[idx] = [x, y];
        state.velocities[idx] = [
          PhysicsSystem.randomRange(-0.3, 0.3),
          PhysicsSystem.randomRange(-0.3, 0.3),
        ];
        state.accelerations[idx] = [0, 0];
        state.directions[idx] = Math.random() * Math.PI * 2;
        state.types[idx] = 0; // Person on land

        people.push(idx);
      }

      state.modeData.voronoi.people = people;

      // Create fishing boats on water (Type 2)
      const fishingBoats = [];
      for (let i = 0; i < this.params.fishingBoatCount; i++) {
        const cellIdx =
          state.modeData.voronoi.waterCells[
            Math.floor(Math.random() * state.modeData.voronoi.waterCells.length)
          ];
        const cell = cells[cellIdx];

        // Random position within cell
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * cell.radius * 0.7;
        const x = cell.center[0] + Math.cos(angle) * radius;
        const y = cell.center[1] + Math.sin(angle) * radius;

        const idx = state.entityCount++;
        state.positions[idx] = [x, y];
        state.velocities[idx] = [
          PhysicsSystem.randomRange(-0.3, 0.3),
          PhysicsSystem.randomRange(-0.3, 0.3),
        ];
        state.accelerations[idx] = [0, 0];
        state.directions[idx] = Math.random() * Math.PI * 2;
        state.types[idx] = 2; // Fishing boat on water

        fishingBoats.push(idx);
      }

      state.modeData.voronoi.fishingBoats = fishingBoats;
      return;
    }

    // On subsequent transitions, regenerate cells and classify existing entities
    // but don't move them
    const seedPoints = [];

    // Identify existing seed points
    for (let i = 0; i < state.entityCount; i++) {
      if (state.types[i] === 1) {
        seedPoints.push({
          x: state.positions[i][0],
          y: state.positions[i][1],
          index: i,
        });
      }
    }

    // Regenerate Voronoi cells based on current seed positions
    const cells = seedPoints.map((seed, idx) => {
      const isLand = Math.random() < this.params.landPercentage;
      return {
        center: [seed.x, seed.y],
        isLand,
        radius: 80 + Math.random() * 40,
      };
    });

    state.modeData.voronoi.cells = cells;
    state.modeData.voronoi.landCells = cells
      .map((cell, idx) => (cell.isLand ? idx : -1))
      .filter((idx) => idx !== -1);
    state.modeData.voronoi.waterCells = cells
      .map((cell, idx) => (!cell.isLand ? idx : -1))
      .filter((idx) => idx !== -1);

    // Classify existing entities as people or fishing boats based on entity count
    const people = [];
    const fishingBoats = [];

    for (let i = 0; i < state.entityCount; i++) {
      if (state.types[i] === 0) {
        people.push(i);
      } else if (state.types[i] === 2) {
        fishingBoats.push(i);
      }
      // Reset accelerations
      state.accelerations[i] = [0, 0];
    }

    state.modeData.voronoi.people = people;
    state.modeData.voronoi.fishingBoats = fishingBoats;
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

    const cells = state.modeData.voronoi.cells;
    const people = state.modeData.voronoi.people;
    const fishingBoats = state.modeData.voronoi.fishingBoats;

    const allMovingEntities = [...people, ...fishingBoats];

    // Update all moving entities
    for (const current of allMovingEntities) {
      const pos = state.positions[current];
      const isOnLand = state.types[current] === 0;

      // Pass 1: Separation force (simplified boids)
      let sepX = 0,
        sepY = 0;

      for (const other of allMovingEntities) {
        if (other === current) continue;

        const dx = pos[0] - state.positions[other][0];
        const dy = pos[1] - state.positions[other][1];
        const distSq = dx * dx + dy * dy;

        const sepDistSq =
          this.params.separationDistance * this.params.separationDistance;

        if (distSq < sepDistSq && distSq > 0) {
          sepX += dx;
          sepY += dy;
        }
      }

      // Apply separation
      const sepLength = PhysicsSystem.fastHypot(sepX, sepY);
      if (sepLength > 0) {
        state.accelerations[current][0] +=
          (this.params.separationForce * sepX) / sepLength;
        state.accelerations[current][1] +=
          (this.params.separationForce * sepY) / sepLength;
      }

      // Pass 2: Perlin-driven random walk
      const noiseX = this.noise.noise(
        pos[0] * this.params.noiseScale,
        pos[1] * this.params.noiseScale + this.time
      );
      const noiseY = this.noise.noise(
        pos[0] * this.params.noiseScale + 100,
        pos[1] * this.params.noiseScale + this.time + 100
      );

      // Convert noise (0-1) to direction (-1 to 1)
      const dirX = (noiseX - 0.5) * 2;
      const dirY = (noiseY - 0.5) * 2;

      state.accelerations[current][0] += dirX * this.params.randomWalkForce;
      state.accelerations[current][1] += dirY * this.params.randomWalkForce;

      // Pass 3: Edge repulsion (keep entities in their terrain type)
      const relevantCells = isOnLand
        ? state.modeData.voronoi.waterCells
        : state.modeData.voronoi.landCells;

      for (const cellIdx of relevantCells) {
        const cell = cells[cellIdx];
        const dx = pos[0] - cell.center[0];
        const dy = pos[1] - cell.center[1];
        const dist = PhysicsSystem.fastHypot(dx, dy);

        // Repel from opposite terrain type
        const edgeDist = dist - cell.radius;
        if (edgeDist < this.params.edgeRepulsionDistance) {
          const force =
            this.params.edgeRepulsionForce *
            (1 - edgeDist / this.params.edgeRepulsionDistance);
          if (dist > 0) {
            state.accelerations[current][0] += (dx / dist) * force;
            state.accelerations[current][1] += (dy / dist) * force;
          }
        }
      }
    }

    // Integrate physics
    PhysicsSystem.integrate(state, deltaTime, {
      speedLimit: this.params.speedLimit,
      damping: 0.98,
    });

    // Wrap bounds
    PhysicsSystem.wrapBounds(state);
  }

  render(state, ctx) {
    return {
      entities: state.positions.map((pos, i) => ({
        index: i,
        position: pos,
        type: state.types[i],
      })),
      cells: state.modeData.voronoi?.cells || [],
    };
  }
}

export default VoronoiSimulation;
