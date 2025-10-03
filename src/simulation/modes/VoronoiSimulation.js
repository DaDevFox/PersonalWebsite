/**
 * VoronoiSimulation.js
 * 
 * Implements a procedurally generated world with Voronoi tessellation.
 * Fishing boats on water, people on land, with random walk behavior.
 * Used for the "Games" section.
 */

import { BaseSimulationMode } from '../core/BaseSimulationMode';
import { PhysicsSystem } from '../core/PhysicsSystem';

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
    return a * (1 - u) * (1 - v) +
           b * u * (1 - v) +
           c * (1 - u) * v +
           d * u * v;
  }
}

export class VoronoiSimulation extends BaseSimulationMode {
  constructor(config = {}) {
    super({
      name: 'voronoi',
      backgroundColor: config.backgroundColor || '#87ceeb',
      ...config
    });

    this.params = {
      // World generation
      landPercentage: config.landPercentage || 0.4,
      seedPointCount: config.seedPointCount || 30,
      
      // Entity counts
      fishingBoatCount: config.fishingBoatCount || 40,  // Type 2 - on water
      peopleCount: config.peopleCount || 60,             // Type 0 - on land
      
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
      landColor: config.landColor || '#8B7355',
      waterColor: config.waterColor || '#4682B4'
    };

    // Initialize noise generator
    this.noise = new SimpleNoise(Math.random() * 1000);
    this.time = 0;
  }

  async initialize(state) {
    // Clear existing entities
    state.positions = [];
    state.velocities = [];
    state.accelerations = [];
    state.directions = [];
    state.types = [];
    state.entityCount = 0;

    // Initialize mode-specific data
    state.modeData.voronoi = {
      cells: [],          // Voronoi cell data {center, isLand, polygon}
      landCells: [],      // Indices of land cells
      waterCells: [],     // Indices of water cells
      fishingBoats: [],   // Type 2 entity indices
      people: []          // Type 0 entity indices
    };

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

    // Generate Voronoi cells (simple implementation - each seed point is a cell)
    const cells = seedPoints.map((seed, idx) => {
      const isLand = Math.random() < this.params.landPercentage;
      return {
        center: [seed.x, seed.y],
        isLand,
        radius: 80 + Math.random() * 40 // Approximate cell size
      };
    });

    state.modeData.voronoi.cells = cells;
    state.modeData.voronoi.landCells = cells
      .map((cell, idx) => cell.isLand ? idx : -1)
      .filter(idx => idx !== -1);
    state.modeData.voronoi.waterCells = cells
      .map((cell, idx) => !cell.isLand ? idx : -1)
      .filter(idx => idx !== -1);

    // Create people on land (Type 0)
    const people = [];
    for (let i = 0; i < this.params.peopleCount; i++) {
      const cellIdx = state.modeData.voronoi.landCells[
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
        PhysicsSystem.randomRange(-0.3, 0.3)
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
      const cellIdx = state.modeData.voronoi.waterCells[
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
        PhysicsSystem.randomRange(-0.3, 0.3)
      ];
      state.accelerations[idx] = [0, 0];
      state.directions[idx] = Math.random() * Math.PI * 2;
      state.types[idx] = 2; // Fishing boat on water
      
      fishingBoats.push(idx);
    }

    state.modeData.voronoi.fishingBoats = fishingBoats;
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
      let sepX = 0, sepY = 0;
      
      for (const other of allMovingEntities) {
        if (other === current) continue;
        
        const dx = pos[0] - state.positions[other][0];
        const dy = pos[1] - state.positions[other][1];
        const distSq = dx * dx + dy * dy;
        
        const sepDistSq = this.params.separationDistance * this.params.separationDistance;
        
        if (distSq < sepDistSq && distSq > 0) {
          sepX += dx;
          sepY += dy;
        }
      }

      // Apply separation
      const sepLength = PhysicsSystem.fastHypot(sepX, sepY);
      if (sepLength > 0) {
        state.accelerations[current][0] += (this.params.separationForce * sepX) / sepLength;
        state.accelerations[current][1] += (this.params.separationForce * sepY) / sepLength;
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
      const relevantCells = isOnLand ? 
        state.modeData.voronoi.waterCells : 
        state.modeData.voronoi.landCells;

      for (const cellIdx of relevantCells) {
        const cell = cells[cellIdx];
        const dx = pos[0] - cell.center[0];
        const dy = pos[1] - cell.center[1];
        const dist = PhysicsSystem.fastHypot(dx, dy);
        
        // Repel from opposite terrain type
        const edgeDist = dist - cell.radius;
        if (edgeDist < this.params.edgeRepulsionDistance) {
          const force = this.params.edgeRepulsionForce * (1 - edgeDist / this.params.edgeRepulsionDistance);
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
      damping: 0.98
    });

    // Wrap bounds
    PhysicsSystem.wrapBounds(state);
  }

  render(state, ctx) {
    return {
      entities: state.positions.map((pos, i) => ({
        index: i,
        position: pos,
        type: state.types[i]
      })),
      cells: state.modeData.voronoi?.cells || []
    };
  }
}

export default VoronoiSimulation;
