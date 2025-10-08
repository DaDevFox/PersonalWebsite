/**
 * PhysicsSystem.js
 *
 * Core physics utilities for simulations.
 * Provides common physics calculations and helper functions.
 */

/**
 * Fast approximate hypot (magnitude of 2D vector)
 * More performant than Math.hypot or Math.sqrt(x*x + y*y)
 */
export function fastHypot(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return (
    hi +
    (3 * lo) / 32 +
    Math.max(0, 2 * lo - hi) / 8 +
    Math.max(0, 4 * lo - hi) / 16
  );
}

/**
 * Calculate squared distance between two points
 * Avoids expensive sqrt operation
 */
export function distanceSquared(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

/**
 * Calculate distance between two points
 */
export function distance(x1, y1, x2, y2) {
  return Math.sqrt(distanceSquared(x1, y1, x2, y2));
}

/**
 * Normalize a 2D vector
 * Returns [x, y] normalized to unit length
 */
export function normalize(x, y) {
  const len = fastHypot(x, y);
  if (len === 0) return [0, 0];
  return [x / len, y / len];
}

/**
 * Limit a vector to a maximum magnitude
 */
export function limitMagnitude(x, y, maxMagnitude) {
  const magSquared = x * x + y * y;
  if (magSquared > maxMagnitude * maxMagnitude) {
    const ratio = maxMagnitude / fastHypot(x, y);
    return [x * ratio, y * ratio];
  }
  return [x, y];
}

/**
 * Apply force to an entity
 * Modifies acceleration in place
 */
export function applyForce(state, entityIndex, forceX, forceY) {
  state.accelerations[entityIndex][0] += forceX;
  state.accelerations[entityIndex][1] += forceY;
}

/**
 * Integrate physics for all entities
 * Updates velocities and positions based on accelerations
 */
export function integrate(state, deltaTime, options = {}) {
  const {
    speedLimit = null,
    accelerationLimit = null,
    damping = 1.0,
  } = options;

  const dt = deltaTime / 16.67; // Normalize to ~60fps

  for (let i = 0; i < state.entityCount; i++) {
    // Limit acceleration if specified
    if (accelerationLimit !== null) {
      const [ax, ay] = limitMagnitude(
        state.accelerations[i][0],
        state.accelerations[i][1],
        accelerationLimit
      );
      state.accelerations[i][0] = ax;
      state.accelerations[i][1] = ay;
    }

    // Update velocity
    state.velocities[i][0] += state.accelerations[i][0] * dt;
    state.velocities[i][1] += state.accelerations[i][1] * dt;

    // Apply damping
    if (damping !== 1.0) {
      state.velocities[i][0] *= damping;
      state.velocities[i][1] *= damping;
    }

    // Limit speed if specified
    if (speedLimit !== null) {
      const [vx, vy] = limitMagnitude(
        state.velocities[i][0],
        state.velocities[i][1],
        speedLimit
      );
      state.velocities[i][0] = vx;
      state.velocities[i][1] = vy;
    }

    // Update position
    state.positions[i][0] += state.velocities[i][0] * dt;
    state.positions[i][1] += state.velocities[i][1] * dt;

    // Update direction based on velocity
    if (state.velocities[i][0] !== 0 || state.velocities[i][1] !== 0) {
      state.directions[i] = Math.atan2(
        state.velocities[i][1],
        state.velocities[i][0]
      );
    }

    // Reset acceleration for next frame
    state.accelerations[i][0] = 0;
    state.accelerations[i][1] = 0;
  }
}

/**
 * Wrap positions around boundaries (toroidal topology)
 */
export function wrapBounds(state, bounds = null) {
  const { width, height } = bounds || state.bounds;

  for (let i = 0; i < state.entityCount; i++) {
    // Wrap X - handle multiple boundary crossings
    while (state.positions[i][0] > width) {
      state.positions[i][0] -= width;
    }
    while (state.positions[i][0] < 0) {
      state.positions[i][0] += width;
    }

    // Wrap Y - handle multiple boundary crossings
    while (state.positions[i][1] > height) {
      state.positions[i][1] -= height;
    }
    while (state.positions[i][1] < 0) {
      state.positions[i][1] += height;
    }
  }
}

/**
 * Bounce entities off boundaries
 * Inverts velocity and applies restitution
 */
export function bounceBounds(state, restitution = 0.8, bounds = null) {
  const { width, height } = bounds || state.bounds;

  for (let i = 0; i < state.entityCount; i++) {
    // Bounce X
    if (state.positions[i][0] > width) {
      state.positions[i][0] = width;
      state.velocities[i][0] *= -restitution;
    } else if (state.positions[i][0] < 0) {
      state.positions[i][0] = 0;
      state.velocities[i][0] *= -restitution;
    }

    // Bounce Y
    if (state.positions[i][1] > height) {
      state.positions[i][1] = height;
      state.velocities[i][1] *= -restitution;
    } else if (state.positions[i][1] < 0) {
      state.positions[i][1] = 0;
      state.velocities[i][1] *= -restitution;
    }
  }
}

/**
 * Bounce entities off boundaries for split-pane mode
 * Only bounces on top/bottom edges, wraps on left/right
 */
export function bounceBoundsSplitPane(state, restitution = 0.8, bounds = null) {
  const { width, height } = bounds || state.bounds;

  for (let i = 0; i < state.entityCount; i++) {
    // Wrap X (no bounce on left/right in split-pane mode)
    while (state.positions[i][0] > width) {
      state.positions[i][0] -= width;
    }
    while (state.positions[i][0] < 0) {
      state.positions[i][0] += width;
    }

    // Bounce Y (still bounce on top/bottom)
    if (state.positions[i][1] > height) {
      state.positions[i][1] = height;
      state.velocities[i][1] *= -restitution;
    } else if (state.positions[i][1] < 0) {
      state.positions[i][1] = 0;
      state.velocities[i][1] *= -restitution;
    }
  }
}

/**
 * Calculate angle from entity A to entity B
 */
export function angleTo(posA, posB) {
  return Math.atan2(posB[1] - posA[1], posB[0] - posA[0]);
}

/**
 * Linear interpolation
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Clamp value between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Map value from one range to another
 */
export function map(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Random float between min and max
 */
export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Random integer between min (inclusive) and max (exclusive)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export const PhysicsSystem = {
  fastHypot,
  distanceSquared,
  distance,
  normalize,
  limitMagnitude,
  applyForce,
  integrate,
  wrapBounds,
  bounceBounds,
  bounceBoundsSplitPane,
  angleTo,
  lerp,
  clamp,
  map,
  randomRange,
  randomInt,
};

export default PhysicsSystem;
