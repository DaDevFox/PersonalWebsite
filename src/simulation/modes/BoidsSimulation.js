/**
 * BoidsSimulation.js
 *
 * Implements flocking behavior using separation, cohesion, and alignment rules.
 * Used for the "Work Experience" section.
 */

import { BaseSimulationMode } from "../core/BaseSimulationMode";
import { PhysicsSystem } from "../core/PhysicsSystem";

export class BoidsSimulation extends BaseSimulationMode {
  constructor(config = {}) {
    super({
      name: "boids",
      backgroundColor: config.backgroundColor || "#10009eb2",
      ...config,
    });

    // Boids-specific configuration
    this.params = {
      speedLimit: config.speedLimit || 1.0,
      accelerationLimit: config.accelerationLimit || 0.5,
      separationForce: config.separationForce || 50,
      separationDistance: config.separationDistance || 400,
      cohesionForce: config.cohesionForce || 30,
      cohesionDistance: config.cohesionDistance || 800,
      alignmentForce: config.alignmentForce || 40,
      alignmentDistance: config.alignmentDistance || 800,
      mouseSeparationForce: config.mouseSeparationForce || 1000,
      mouseSeparationDistance: config.mouseSeparationDistance || 40,
      entityCount: config.entityCount || 100,
      envObjectThreshold: config.envObjectThreshold || 1,
    };

    this.mousePosition = null;
  }

  async initialize(state, isFirstLoad = true) {
    // Only clear and recreate entities on first load
    if (isFirstLoad) {
      // Clear existing entities
      state.positions = [];
      state.velocities = [];
      state.accelerations = [];
      state.directions = [];
      state.types = [];
      state.entityCount = 0;

      // Initialize mode-specific data
      state.modeData.boids = {
        envObjects: [],
        mousePosition: null,
      };

      // Create environment objects (Type 1 - non-simulated)
      // These act as obstacles that boids avoid
      for (let i = 0; i < this.params.envObjectThreshold; i++) {
        state.positions[i] = [0, 0];
        state.velocities[i] = [0, 0];
        state.accelerations[i] = [0, 0];
        state.directions[i] = 0;
        state.types[i] = 1;
      }

      // Create boids (Type 0 - simulated)
      for (
        let i = this.params.envObjectThreshold;
        i < this.params.entityCount;
        i++
      ) {
        state.positions[i] = [
          Math.random() * state.bounds.width,
          Math.random() * state.bounds.height,
        ];
        state.velocities[i] = [
          PhysicsSystem.randomRange(-0.5, 0.5),
          PhysicsSystem.randomRange(-0.5, 0.5),
        ];
        state.accelerations[i] = [0, 0];
        state.directions[i] = Math.random() * Math.PI * 2;
        state.types[i] = 0;
      }

      state.entityCount = this.params.entityCount;
    } else {
      // On subsequent transitions, just reinitialize mode data without moving entities
      state.modeData.boids = {
        envObjects: [],
        mousePosition: null,
      };

      // Reset accelerations but keep positions/velocities
      for (let i = 0; i < state.entityCount; i++) {
        state.accelerations[i] = [0, 0];
      }
    }
  }

  update(state, deltaTime) {
    const sepDist =
      this.params.separationDistance * this.params.separationDistance;
    const cohDist = this.params.cohesionDistance * this.params.cohesionDistance;
    const aliDist =
      this.params.alignmentDistance * this.params.alignmentDistance;
    const sepForce = this.params.separationForce;
    const cohForce = this.params.cohesionForce;
    const aliForce = this.params.alignmentForce;
    const mouseSepDist =
      this.params.mouseSeparationDistance * this.params.mouseSeparationDistance;
    const mouseSepForce = this.params.mouseSeparationForce;

    // Calculate forces for each boid
    for (
      let current = this.params.envObjectThreshold;
      current < state.entityCount;
      current++
    ) {
      let sforceX = 0,
        sforceY = 0; // Separation
      let cforceX = 0,
        cforceY = 0; // Cohesion
      let aforceX = 0,
        aforceY = 0; // Alignment

      const currPos = state.positions[current];

      // Check against all other entities
      for (let target = 0; target < state.entityCount; target++) {
        if (target === current) continue;

        const spareX = currPos[0] - state.positions[target][0];
        const spareY = currPos[1] - state.positions[target][1];
        const distSquared = PhysicsSystem.distanceSquared(
          currPos[0],
          currPos[1],
          state.positions[target][0],
          state.positions[target][1]
        );

        // Separation (avoid crowding)
        if (distSquared < sepDist) {
          sforceX += spareX;
          sforceY += spareY;
        }

        // Cohesion (move towards group center)
        if (distSquared < cohDist) {
          cforceX += spareX;
          cforceY += spareY;
        }
        // Alignment (match velocity with neighbors)
        if (distSquared < aliDist) {
          aforceX += state.velocities[target][0];
          aforceY += state.velocities[target][1];
        }
      }

      // Mouse separation
      if (this.mousePosition) {
        const m_spareX = currPos[0] - this.mousePosition.x;
        const m_spareY = currPos[1] - this.mousePosition.y;
        const distSquared = m_spareX * m_spareX + m_spareY * m_spareY;

        if (distSquared < mouseSepDist && distSquared > 0) {
          const length = PhysicsSystem.fastHypot(m_spareX, m_spareY);
          if (length > 0) {
            state.accelerations[current][0] +=
              (mouseSepForce * m_spareX) / length;
            state.accelerations[current][1] +=
              (mouseSepForce * m_spareY) / length;
          }
        }
      }

      // Apply separation force
      let length = PhysicsSystem.fastHypot(sforceX, sforceY);
      if (length > 0) {
        state.accelerations[current][0] += (sepForce * sforceX) / length;
        state.accelerations[current][1] += (sepForce * sforceY) / length;
      }

      // Apply cohesion force (negative to attract)
      length = PhysicsSystem.fastHypot(cforceX, cforceY);
      if (length > 0) {
        state.accelerations[current][0] -= (cohForce * cforceX) / length;
        state.accelerations[current][1] -= (cohForce * cforceY) / length;
      }

      // Apply alignment force (negative to match)
      length = PhysicsSystem.fastHypot(aforceX, aforceY);
      if (length > 0) {
        state.accelerations[current][0] -= (aliForce * aforceX) / length;
        state.accelerations[current][1] -= (aliForce * aforceY) / length;
      }
    }

    // Integrate physics
    PhysicsSystem.integrate(state, deltaTime, {
      speedLimit: this.params.speedLimit,
      accelerationLimit: this.params.accelerationLimit,
    });

    // Wrap around boundaries
    PhysicsSystem.wrapBounds(state);
  }

  render(state, ctx) {
    // Rendering will be handled by React components for now
    // In future, can implement canvas rendering here
    return {
      entities: state.positions.map((pos, i) => ({
        index: i,
        position: pos,
        velocity: state.velocities[i],
        direction: state.directions[i],
        type: state.types[i],
      })),
    };
  }

  onInteraction(state, eventType, eventData) {
    if (eventType === "mousemove") {
      this.mousePosition = eventData.position;
      state.modeData.boids.mousePosition = eventData.position;
    }
  }

  updateEnvObject(state, index, x, y, width, height) {
    if (index < this.params.envObjectThreshold) {
      state.positions[index] = [x, y];
      state.modeData.boids.envObjects[index] = { x, y, width, height };
    }
  }
}

export default BoidsSimulation;
