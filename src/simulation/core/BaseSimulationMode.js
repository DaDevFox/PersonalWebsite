/**
 * BaseSimulationMode.js
 *
 * Abstract base class for all simulation modes.
 * Defines the interface that all simulation modes must implement.
 */

export class BaseSimulationMode {
  constructor(config = {}) {
    this.config = config;
    this.name = config.name || "unnamed";
    this.backgroundColor = config.backgroundColor || "#000000";
  }

  /**
   * Initialize the simulation mode
   * Called when the mode becomes active
   *
   * @param {Object} state - The simulation state object
   */
  async initialize(state) {
    throw new Error("initialize() must be implemented by subclass");
  }

  /**
   * Update the simulation by one frame
   *
   * @param {Object} state - The simulation state object
   * @param {number} deltaTime - Time elapsed since last frame (ms)
   */
  update(state, deltaTime) {
    throw new Error("update() must be implemented by subclass");
  }

  /**
   * Render the current simulation state
   *
   * @param {Object} state - The simulation state object
   * @param {CanvasRenderingContext2D|Object} ctx - Rendering context
   */
  render(state, ctx) {
    throw new Error("render() must be implemented by subclass");
  }

  /**
   * Cleanup before transitioning to another mode
   *
   * @param {Object} state - The simulation state object
   */
  async cleanup(state) {
    // Default: clear mode-specific data
    state.modeData = {};
  }

  /**
   * Handle bounds change (e.g., window resize)
   * Optional override
   *
   * @param {Object} state - The simulation state object
   * @param {number} width - New width
   * @param {number} height - New height
   */
  onBoundsChange(state, width, height) {
    // Default: clamp existing entity positions to new bounds without changing count
    // This prevents entities from being outside visible area and ensures
    // entity count stays constant across resize events
    for (let i = 0; i < state.entityCount; i++) {
      // Clamp X position
      if (state.positions[i][0] > width) {
        state.positions[i][0] = width * Math.random(); // Redistribute within new bounds
      }
      // Clamp Y position
      if (state.positions[i][1] > height) {
        state.positions[i][1] = height * Math.random(); // Redistribute within new bounds
      }
    }
  }

  /**
   * Handle user interaction
   * Optional override
   *
   * @param {Object} state - The simulation state object
   * @param {string} eventType - Type of interaction ('click', 'hover', etc.)
   * @param {Object} eventData - Event data (position, etc.)
   */
  onInteraction(state, eventType, eventData) {
    // Default: do nothing
    // Subclasses can override if needed
  }
}

export default BaseSimulationMode;
