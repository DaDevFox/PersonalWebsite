/**
 * SpringSimulation.js
 *
 * Implements a spring network with gravitational sinks.
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
      tensioningRadius: config.tensioningRadius || 150,
      springConstantMin: config.springConstantMin || 0.5,
      springConstantMax: config.springConstantMax || 2.0,
      maxConnectionsPerEntity: config.maxConnectionsPerEntity || 6,
      gravitationalForce: config.gravitationalForce || 0.1,
      dampingFactor: config.dampingFactor || 0.95,
      collisionRestitution: config.collisionRestitution || 0.7,
      entityCount: config.entityCount || 80,
    };
  }

  async initialize(state) {
    // TODO: Implement spring network initialization
    // 1. Create springs between nearby entities
    // 2. Identify isolated entities as gravitational sinks (type 1)
    // 3. Store spring data in state.modeData.springs

    state.modeData.springs = {
      connections: [], // Array of {indexA, indexB, springConstant, equilibriumLength}
      sinks: [], // Array of entity indices that are gravitational sinks
    };

    console.log("SpringSimulation initialized (TODO: implement full logic)");
  }

  update(state, deltaTime) {
    // TODO: Implement spring physics
    // Pass 1: Collision resolution
    // Pass 2: Spring forces + gravitational attraction

    PhysicsSystem.integrate(state, deltaTime, {
      damping: this.params.dampingFactor,
    });

    PhysicsSystem.bounceBounds(state, this.params.collisionRestitution);
  }

  render(state, ctx) {
    // TODO: Render springs as lines with variable width
    // TODO: Render joints as hollow circles
    // TODO: Render sinks as filled circles

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
