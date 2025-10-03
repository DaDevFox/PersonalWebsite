/**
 * SimulationEngine.js
 *
 * Core engine for managing entity simulations using a simplified ECS approach.
 * Manages entity lifecycle, physics updates, and rendering coordination.
 */

export class SimulationEngine {
  constructor(config = {}) {
    this.config = {
      maxEntities: config.maxEntities || 1000,
      targetFPS: config.targetFPS || 60,
      maxDeltaTime: config.maxDeltaTime || 100,
      enableSpatialHash: config.enableSpatialHash || true,
      spatialHashCellSize: config.spatialHashCellSize || 100,
      ...config,
    };

    // Initialize simulation state
    this.state = this.initializeState();

    // Active simulation mode
    this.activeMode = null;

    // Runtime state
    this.isRunning = false;
    this.lastFrameTime = 0;
    this.frameCount = 0;

    // Performance tracking
    this.performanceMetrics = {
      fps: 60,
      updateTime: 0,
      renderTime: 0,
    };
  }

  /**
   * Initialize the core simulation state with parallel arrays
   */
  initializeState() {
    return {
      // Core entity components (parallel arrays for cache efficiency)
      positions: [], // [[x, y], ...]
      velocities: [], // [[vx, vy], ...]
      accelerations: [], // [[ax, ay], ...]
      directions: [], // [angle in radians, ...]
      types: [], // [integer type, ...]

      // Metadata
      entityCount: 0,
      maxEntities: this.config.maxEntities,

      // Simulation-specific data (populated by modes)
      modeData: {},

      // Rendering state
      activeSimulation: null,
      backgroundColor: "#10009eb2",

      // Performance tracking
      lastFrameTime: 0,
      deltaTime: 0,

      // Bounds (updated from canvas/viewport)
      bounds: {
        width: typeof window !== "undefined" ? window.innerWidth : 1920,
        height: typeof window !== "undefined" ? window.innerHeight : 1080,
      },
    };
  }

  /**
   * Add a new entity to the simulation
   * @returns {number} Entity index
   */
  addEntity(
    position = [0, 0],
    velocity = [0, 0],
    acceleration = [0, 0],
    direction = 0,
    type = 0
  ) {
    if (this.state.entityCount >= this.state.maxEntities) {
      console.warn("Max entity count reached");
      return -1;
    }

    const index = this.state.entityCount;

    this.state.positions[index] = position;
    this.state.velocities[index] = velocity;
    this.state.accelerations[index] = acceleration;
    this.state.directions[index] = direction;
    this.state.types[index] = type;

    this.state.entityCount++;

    return index;
  }

  /**
   * Remove an entity from the simulation
   * Uses swap-and-pop for O(1) removal
   */
  removeEntity(index) {
    if (index < 0 || index >= this.state.entityCount) return;

    const lastIndex = this.state.entityCount - 1;

    // Swap with last element
    if (index !== lastIndex) {
      this.state.positions[index] = this.state.positions[lastIndex];
      this.state.velocities[index] = this.state.velocities[lastIndex];
      this.state.accelerations[index] = this.state.accelerations[lastIndex];
      this.state.directions[index] = this.state.directions[lastIndex];
      this.state.types[index] = this.state.types[lastIndex];
    }

    // Remove last element
    this.state.positions.pop();
    this.state.velocities.pop();
    this.state.accelerations.pop();
    this.state.directions.pop();
    this.state.types.pop();

    this.state.entityCount--;
  }

  /**
   * Clear all entities
   */
  clearEntities() {
    this.state.positions = [];
    this.state.velocities = [];
    this.state.accelerations = [];
    this.state.directions = [];
    this.state.types = [];
    this.state.entityCount = 0;
  }

  /**
   * Set the active simulation mode
   * @param {BaseSimulationMode} mode - The simulation mode to activate
   * @param {Object} transitionConfig - Transition configuration
   */
  async setMode(mode, transitionConfig = {}) {
    const previousMode = this.activeMode;

    // Cleanup previous mode if exists
    if (previousMode) {
      await previousMode.cleanup(this.state);
    }

    // Set new mode
    this.activeMode = mode;

    if (mode) {
      // Initialize new mode
      await mode.initialize(this.state);
      this.state.activeSimulation = mode.name;
      this.state.backgroundColor =
        mode.backgroundColor || this.state.backgroundColor;
    }
  }

  /**
   * Update simulation by one frame
   * @param {number} timestamp - Current timestamp from requestAnimationFrame
   */
  tick(timestamp) {
    if (!this.isRunning || !this.activeMode) return;

    // Calculate delta time
    const deltaTime = timestamp - this.lastFrameTime;
    const clampedDelta = Math.min(deltaTime, this.config.maxDeltaTime);

    this.state.deltaTime = clampedDelta;
    this.state.lastFrameTime = timestamp;
    this.lastFrameTime = timestamp;

    // Update active mode
    const updateStart = performance.now();
    this.activeMode.update(this.state, clampedDelta);
    this.performanceMetrics.updateTime = performance.now() - updateStart;

    // Update performance metrics
    this.frameCount++;
    if (this.frameCount % 60 === 0) {
      this.performanceMetrics.fps = 1000 / deltaTime;
    }
  }

  /**
   * Render the current simulation state
   * @param {CanvasRenderingContext2D|Object} ctx - Rendering context
   */
  render(ctx) {
    if (!this.activeMode) return;

    const renderStart = performance.now();
    this.activeMode.render(this.state, ctx);
    this.performanceMetrics.renderTime = performance.now() - renderStart;
  }

  /**
   * Start the simulation loop
   */
  start() {
    this.isRunning = true;
  }

  /**
   * Pause the simulation loop
   */
  pause() {
    this.isRunning = false;
  }

  /**
   * Resume the simulation loop
   */
  resume() {
    this.isRunning = true;
  }

  /**
   * Update simulation bounds (e.g., on window resize)
   */
  updateBounds(width, height) {
    this.state.bounds.width = width;
    this.state.bounds.height = height;

    this.activeMode?.onBoundsChange?.(this.state, width, height);
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    return {
      ...this.performanceMetrics,
      entityCount: this.state.entityCount,
    };
  }
}

export default SimulationEngine;
