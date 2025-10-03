/**
 * SpringSimulation.js
 *
 * Implements a spring network with gravitational sinks and line-point collisions.
 * Used for the "Projects" section.
 */

import { BaseSimulationMode } from "../core/BaseSimulationMode";
import { PhysicsSystem } from "../core/PhysicsSystem";

export class SpringSimulation extends BaseSimulationMode {
  constructor(config = {}) {
    super({
      name: "springs",
      backgroundColor: config.backgroundColor || "#4c67fd",
      ...config,
    });

    this.params = {
      // Spring network parameters
      tensioningRadius: config.tensioningRadius || 150,
      springConstantMin: config.springConstantMin || 0.3,
      springConstantMax: config.springConstantMax || 0.8,
      maxConnectionsPerEntity: config.maxConnectionsPerEntity || 5,
      minSinks: config.minSinks || 3,
      maxSinks: config.maxSinks || 6,

      // Physics parameters
      gravitationalForce: config.gravitationalForce || 0.5,
      dampingFactor: config.dampingFactor || 0.98,
      collisionRestitution: config.collisionRestitution || 0.7,
      speedLimit: config.speedLimit || 3.0,

      // Collision parameters
      entityRadius: config.entityRadius || 8,
      lineCollisionThreshold: config.lineCollisionThreshold || 10,

      entityCount: config.entityCount || 80,
    };
  }

  async initialize(state, isFirstLoad = true) {
    // Initialize mode-specific data
    state.modeData.springs = {
      connections: [], // Array of {indexA, indexB, springConstant, equilibriumLength}
      sinks: [], // Array of entity indices that are gravitational sinks (Type 1)
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

      // Create regular entities (Type 0 - joints)
      for (let i = 0; i < this.params.entityCount; i++) {
        state.positions[i] = [
          PhysicsSystem.randomRange(50, state.bounds.width - 50),
          PhysicsSystem.randomRange(50, state.bounds.height - 50),
        ];
        state.velocities[i] = [
          PhysicsSystem.randomRange(-0.5, 0.5),
          PhysicsSystem.randomRange(-0.5, 0.5),
        ];
        state.accelerations[i] = [0, 0];
        state.directions[i] = 0;
        state.types[i] = 0; // Joint
      }

      state.entityCount = this.params.entityCount;
    } else {
      // Reset accelerations but keep positions/velocities
      for (let i = 0; i < state.entityCount; i++) {
        state.accelerations[i] = [0, 0];
      }
    }

    // Always recreate spring connections based on current positions
    const connections = [];
    for (let i = 0; i < state.entityCount; i++) {
      const neighbors = [];

      // Find nearby entities
      for (let j = 0; j < state.entityCount; j++) {
        if (i === j) continue;

        const distSq = PhysicsSystem.distanceSquared(
          state.positions[i][0],
          state.positions[i][1],
          state.positions[j][0],
          state.positions[j][1]
        );

        if (
          distSq <
          this.params.tensioningRadius * this.params.tensioningRadius
        ) {
          neighbors.push({ index: j, distSq });
        }
      }

      // Sort by distance and connect to nearest neighbors
      neighbors.sort((a, b) => a.distSq - b.distSq);
      const connectTo = Math.min(
        this.params.maxConnectionsPerEntity,
        neighbors.length
      );

      for (let k = 0; k < connectTo; k++) {
        const j = neighbors[k].index;

        // Avoid duplicate connections (i-j and j-i)
        const exists = connections.some(
          (c) =>
            (c.indexA === i && c.indexB === j) ||
            (c.indexA === j && c.indexB === i)
        );

        if (!exists) {
          const dist = Math.sqrt(neighbors[k].distSq);
          connections.push({
            indexA: i,
            indexB: j,
            springConstant: PhysicsSystem.randomRange(
              this.params.springConstantMin,
              this.params.springConstantMax
            ),
            equilibriumLength: dist,
          });
        }
      }
    }

    state.modeData.springs.connections = connections;

    // Identify gravitational sinks (entities with few connections)
    const connectionCounts = new Array(state.entityCount).fill(0);
    connections.forEach((c) => {
      connectionCounts[c.indexA]++;
      connectionCounts[c.indexB]++;
    });

    const sinkCount =
      PhysicsSystem.randomRange(
        this.params.minSinks,
        this.params.maxSinks + 1
      ) | 0;
    const sinks = [];

    // Pick entities with fewest connections as sinks
    const sortedByConnections = connectionCounts
      .map((count, idx) => ({ idx, count }))
      .sort((a, b) => a.count - b.count);

    for (let i = 0; i < Math.min(sinkCount, sortedByConnections.length); i++) {
      const idx = sortedByConnections[i].idx;
      state.types[idx] = 1; // Mark as sink
      sinks.push(idx);
    }

    state.modeData.springs.sinks = sinks;
  }

  update(state, deltaTime) {
    const connections = state.modeData.springs.connections;
    const sinks = state.modeData.springs.sinks;
    const lineThreshold = this.params.lineCollisionThreshold;

    // Pass 1: Line-point collision detection and resolution
    for (let i = 0; i < state.entityCount; i++) {
      for (const spring of connections) {
        // Skip if entity is part of this spring
        if (i === spring.indexA || i === spring.indexB) continue;

        const point = state.positions[i];
        const lineA = state.positions[spring.indexA];
        const lineB = state.positions[spring.indexB];

        // Calculate closest point on line segment to entity
        const { distance, closestPoint } = this.pointToLineDistance(
          point,
          lineA,
          lineB
        );

        // Check for collision
        if (distance < lineThreshold) {
          // Calculate collision normal (from line to point)
          const normalX = point[0] - closestPoint[0];
          const normalY = point[1] - closestPoint[1];
          const normalLength = PhysicsSystem.fastHypot(normalX, normalY);

          if (normalLength > 0) {
            const nx = normalX / normalLength;
            const ny = normalY / normalLength;

            // Separate entities from line
            const overlap = lineThreshold - distance;
            state.positions[i][0] += nx * overlap * 0.5;
            state.positions[i][1] += ny * overlap * 0.5;

            // Apply collision impulse (simplified momentum conservation)
            const relVelX = state.velocities[i][0];
            const relVelY = state.velocities[i][1];
            const velAlongNormal = relVelX * nx + relVelY * ny;

            if (velAlongNormal < 0) {
              const impulse =
                -(1 + this.params.collisionRestitution) * velAlongNormal;
              state.velocities[i][0] += impulse * nx;
              state.velocities[i][1] += impulse * ny;
            }
          }
        }
      }
    }

    // TODO: pass 2: circle-circle collisions

    // Pass 3: Spring forces
    for (const spring of connections) {
      const posA = state.positions[spring.indexA];
      const posB = state.positions[spring.indexB];

      const dx = posB[0] - posA[0];
      const dy = posB[1] - posA[1];
      const currentLength = PhysicsSystem.fastHypot(dx, dy);

      if (currentLength > 0) {
        // Hooke's law: F = -k * (x - x0)
        const displacement = currentLength - spring.equilibriumLength;
        const forceMagnitude = spring.springConstant * displacement;

        const forceX = (dx / currentLength) * forceMagnitude;
        const forceY = (dy / currentLength) * forceMagnitude;

        // Apply equal and opposite forces
        state.accelerations[spring.indexA][0] += forceX;
        state.accelerations[spring.indexA][1] += forceY;
        state.accelerations[spring.indexB][0] -= forceX;
        state.accelerations[spring.indexB][1] -= forceY;
      }
    }

    // Pass 4: Gravitational attraction to sinks
    for (let i = 0; i < state.entityCount; i++) {
      if (state.types[i] === 1) continue; // Sinks don't attract themselves

      for (const sinkIdx of sinks) {
        const dx = state.positions[sinkIdx][0] - state.positions[i][0];
        const dy = state.positions[sinkIdx][1] - state.positions[i][1];
        const distSq = dx * dx + dy * dy;

        if (distSq > 100) {
          // Avoid extreme forces at close range
          const dist = Math.sqrt(distSq);
          const force = this.params.gravitationalForce / distSq;

          state.accelerations[i][0] += (dx / dist) * force * 1000;
          state.accelerations[i][1] += (dy / dist) * force * 1000;
        }
      }
    }

    // Integrate physics
    PhysicsSystem.integrate(state, deltaTime, {
      damping: this.params.dampingFactor,
      speedLimit: this.params.speedLimit,
    });

    // Bounce off boundaries
    PhysicsSystem.bounceBounds(state, this.params.collisionRestitution);
  }

  /**
   * Calculate distance from point to line segment
   * Returns { distance, closestPoint }
   */
  pointToLineDistance(point, lineA, lineB) {
    const [px, py] = point;
    const [ax, ay] = lineA;
    const [bx, by] = lineB;

    // Vector from A to B
    const abx = bx - ax;
    const aby = by - ay;

    // Vector from A to P
    const apx = px - ax;
    const apy = py - ay;

    // Project P onto AB, clamped to segment
    const abLengthSq = abx * abx + aby * aby;

    if (abLengthSq === 0) {
      // Line segment is a point
      return {
        distance: PhysicsSystem.fastHypot(apx, apy),
        closestPoint: [ax, ay],
      };
    }

    let t = (apx * abx + apy * aby) / abLengthSq;
    t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]

    // Closest point on segment
    const closestX = ax + t * abx;
    const closestY = ay + t * aby;

    // Distance from point to closest point
    const distance = PhysicsSystem.fastHypot(px - closestX, py - closestY);

    return {
      distance,
      closestPoint: [closestX, closestY],
    };
  }

  render(state, ctx) {
    return {
      entities: state.positions.map((pos, i) => ({
        index: i,
        position: pos,
        type: state.types[i],
      })),
      springs: state.modeData.springs?.connections || [],
    };
  }
}

export default SpringSimulation;
