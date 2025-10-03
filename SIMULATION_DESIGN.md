# Simulation Framework Design Document

## Overview
This document outlines the design for a generic Entity Component System (ECS)-inspired simulation framework for the personal website. The framework supports dynamic simulations that change based on scroll position and user interaction.

## Architecture

### Core Concepts

#### 1. Entity Component System (Simplified)
Unlike traditional ECS architectures, this implementation uses a **data-oriented approach** with parallel arrays for performance:

- **Entities**: Identified by array indices
- **Components**: Stored as parallel arrays (positions, velocities, accelerations, directions, types)
- **Systems**: Functions that operate on component arrays

#### 2. Simulation Frame
The central simulation container that manages:
- Entity lifecycle
- Physics updates
- Rendering
- Transitions between simulation modes

### Data Structure

```javascript
// Entity data stored in parallel arrays for cache efficiency
const simulationState = {
  // Core physics components
  positions: [[x, y], ...],           // Float32Array or regular array
  velocities: [[vx, vy], ...],        // Velocity vectors
  accelerations: [[ax, ay], ...],     // Acceleration vectors
  directions: [angle, ...],           // Direction in radians
  types: [type, ...],                 // Integer type identifier
  
  // Metadata
  entityCount: 0,
  maxEntities: 1000,
  
  // Simulation-specific data
  springs: [],                        // For spring simulation
  voronoiCells: [],                   // For world simulation
  
  // Rendering state
  activeSimulation: 'boids',          // 'boids', 'springs', 'world', null
  backgroundColor: '#10009eb2',
  
  // Performance tracking
  lastFrameTime: 0,
  deltaTime: 0
};
```

### Simulation Modes

#### Mode 1: Boids (Section: Work Experience)
**Description**: Flocking bird-like objects using separation, cohesion, and alignment rules.

**Entity Types**:
- Type 0: Standard boid (triangular bird)
- Type 1: Environmental obstacle (non-simulated)

**Visual Representation**:
- SVG triangle pointing in direction of motion
- Opacity based on acceleration magnitude
- Color: Primary theme color

**Physics**:
- Separation force: Repulsion from nearby entities
- Cohesion force: Attraction to group center
- Alignment force: Velocity matching with neighbors
- Mouse repulsion: Strong repulsion from cursor

**Parameters**:
```javascript
{
  speedLimit: 1.0,
  accelerationLimit: 0.5,
  separationForce: 50,
  separationDistance: 400,
  cohesionForce: 30,
  cohesionDistance: 800,
  alignmentForce: 40,
  alignmentDistance: 800,
  entityCount: 100
}
```

---

#### Mode 2: Spring Network (Section: Projects)
**Description**: A bouncy network of interconnected particles with gravitational sinks.

**Entity Types**:
- Type 0: Joint (connected particle, hollow circle)
- Type 1: Gravitational sink (isolated particle, filled circle)

**Initialization**:
1. Snapshot initial positions of all entities
2. Find all entity pairs within `tensioningRadius`
3. Create spring connections with:
   - Random spring constant (k): 0.5 - 2.0
   - Equilibrium distance: Initial distance between entities
   - Cap maximum connections per entity (e.g., 6)
4. Entities with no connections become Type 1 (gravitational sinks)

**Physics (Two-Pass Update)**:

**Pass 1: Collision Resolution**
- Point-line collision detection for all springs
- Separation force applied to resolve collisions
- Simple impulse-based response

**Pass 2: Forces**
- Spring forces: `F = -k * (current_distance - equilibrium_distance)`
- Gravitational attraction to Type 1 entities (small magnitude)
- Damping to prevent infinite oscillation

**Visual Representation**:
- Type 0 (Joints): Small hollow circles (5-8px diameter)
- Type 1 (Sinks): Larger filled circles (12-16px diameter)
- Springs: Lines with variable stroke width
  - Width increases when compressed (displacement < 0)
  - Width decreases when stretched (displacement > 0)
  - Base width: 2px, range: 1px - 4px

**Parameters**:
```javascript
{
  tensioningRadius: 150,
  springConstantMin: 0.5,
  springConstantMax: 2.0,
  maxConnectionsPerEntity: 6,
  gravitationalForce: 0.1,
  dampingFactor: 0.95,
  collisionRestitution: 0.7,
  entityCount: 80,
  backgroundColor: '#4c67fd'
}
```

---

#### Mode 3: Voronoi World (Section: Games)
**Description**: A procedurally generated world with land/water, ships, and birds/people.

**Initialization Sequence**:
1. **Voronoi Generation**:
   - Select all Type 1 entities as seed points
   - Generate Voronoi diagram using Fortune's algorithm or Delaunay triangulation
   - Store cell information per entity

2. **Land/Water Assignment**:
   - Randomly select ~50% of Voronoi cells to become land
   - Remaining cells become water
   - Store terrain type per cell

3. **Entity Type Reassignment**:
   - Type 1 entities in water cells → Type 3 (Ships)
   - Type 1 entities in land cells → remain Type 1 (now representing land)
   - Type 0 entities → Birds/People (retain Type 0)

**Entity Types**:
- Type 0: Birds/People (boids behavior, free movement)
- Type 1: Land markers (static, define terrain)
- Type 3: Ships (random walk in water only)

**Physics & Behavior**:

**Type 0 (Birds/People)**:
- Same boids algorithm as Section 1
- Potential variation: Land-roaming people or fishing boats
- Collision avoidance with land boundaries

**Type 3 (Ships)**:
- Perlin noise-based random walk
- Constrained to water regions
- Slow, smooth turning
- Optional: Avoid land boundaries

**Visual Representation**:
- Voronoi cells:
  - Land: Filled with sandy color (#c2b280, #e0d8b0)
  - Water: Transparent or light blue (#87ceeb30)
- Type 0: Small bird/person sprites or simple dots (3-5px)
- Type 1: Not rendered (or small land markers)
- Type 3: Larger ship sprites (10-15px), possibly triangular

**Parameters**:
```javascript
{
  landPercentage: 0.5,
  seedPointCount: 30,
  birdCount: 100,
  shipSpeed: 0.3,
  perlinNoiseScale: 0.01,
  backgroundColor: '#87ceeb',
  landColor: '#c2b280',
  waterColor: '#87ceeb30'
}
```

---

#### Mode 4: Contact (TBD)
**Placeholder**: To be designed based on thematic requirements.

**Potential Ideas**:
- Particle messaging system
- Network graph of connections
- Flowing data streams
- Constellation patterns

---

## Transition System

### Transition Manager
Handles smooth morphing between simulation modes.

**Transition Strategies**:

1. **Boids → Springs**:
   - Preserve entity positions
   - Initialize velocities to current boid velocities
   - Create spring network based on current spatial distribution
   - Fade out triangles, fade in circles and springs

2. **Springs → Voronoi World**:
   - Type 1 entities (gravitational sinks) become Voronoi seed points
   - Maintain positions, reset velocities
   - Generate Voronoi tessellation
   - Assign land/water based on random selection
   - Reassign entity types

3. **General Transition**:
   - Duration: 1-2 seconds
   - Easing: Cubic ease-in-out
   - Entity count adjustment: Spawn/despawn entities smoothly
   - Type migration: Gradual visual morphing

**Transition Triggers**:
- **Scroll Position**: Section enters viewport (with lead offset)
- **Hover**: User hovers over section separator
- **Manual**: Explicit user interaction (future)

---

## Implementation Structure

### File Organization

```
src/
├── simulation/
│   ├── core/
│   │   ├── SimulationEngine.js       # Core ECS engine
│   │   ├── EntityManager.js          # Entity lifecycle management
│   │   ├── PhysicsSystem.js          # Physics utilities
│   │   └── RenderSystem.js           # Rendering utilities
│   ├── modes/
│   │   ├── BoidsSimulation.js        # Mode 1: Boids
│   │   ├── SpringSimulation.js       # Mode 2: Spring Network
│   │   ├── VoronoiSimulation.js      # Mode 3: Voronoi World
│   │   └── ContactSimulation.js      # Mode 4: TBD
│   ├── transitions/
│   │   ├── TransitionManager.js      # Manages transitions
│   │   └── TransitionStrategies.js   # Specific transition logic
│   ├── utils/
│   │   ├── VoronoiGenerator.js       # Voronoi/Delaunay algorithms
│   │   ├── PerlinNoise.js            # Noise generation
│   │   └── SpatialHash.js            # Spatial partitioning for performance
│   └── components/
│       ├── SimulationCanvas.js       # React wrapper component
│       └── SimulationSection.js      # Section container
└── app/
    └── page.js                        # Main page integration
```

### Core Classes/Modules

#### SimulationEngine
```javascript
class SimulationEngine {
  constructor(config) {
    this.state = initializeState(config);
    this.activeMode = null;
    this.isRunning = false;
  }
  
  tick(deltaTime) {
    if (!this.activeMode) return;
    this.activeMode.update(this.state, deltaTime);
  }
  
  setMode(mode, transitionConfig) {
    // Handle transition
  }
  
  render(canvas) {
    if (!this.activeMode) return;
    this.activeMode.render(this.state, canvas);
  }
}
```

#### BaseSimulationMode (Abstract)
```javascript
class BaseSimulationMode {
  constructor(config) {
    this.config = config;
  }
  
  initialize(state) {
    // Setup entities, initial conditions
  }
  
  update(state, deltaTime) {
    // Physics update logic
  }
  
  render(state, ctx) {
    // Rendering logic
  }
  
  cleanup(state) {
    // Prepare for transition
  }
}
```

---

## Page Integration

### Section Structure

```jsx
<main>
  <SimulationCanvas ref={canvasRef}>
    <SimulationSection 
      title="Work Experience" 
      simulationMode="boids"
      backgroundColor="#10009eb2"
    >
      <ContentPane1 />
    </SimulationSection>
    
    <SimulationSection 
      title="Projects" 
      simulationMode="springs"
      backgroundColor="#4c67fd"
    >
      <ContentPane2 />
    </SimulationSection>
    
    <SimulationSection 
      title="Games" 
      simulationMode="voronoi"
      backgroundColor="#87ceeb"
    >
      <ContentPane3 />
    </SimulationSection>
    
    <SimulationSection 
      title="Contact" 
      simulationMode="contact"
      backgroundColor="#1a1a2e"
    >
      <ContentPane4 />
    </SimulationSection>
  </SimulationCanvas>
</main>
```

### Section Layout
- **Content Pane**: Opaque/translucent background, contains text/images
- **Separator**: Transparent area between sections where simulation is visible
- **Simulation Layer**: Fixed/sticky background layer, changes based on scroll

---

## Performance Optimizations

### Current Optimizations
1. **Parallel Arrays**: Cache-friendly data layout
2. **Squared Distance**: Avoid sqrt() in distance calculations
3. **Fast Hypot**: Approximate hypot for performance

### Planned Optimizations
1. **Spatial Partitioning**: Grid-based spatial hash for neighbor queries
2. **Frustum Culling**: Halt simulation updates outside viewport
3. **Level of Detail**: Reduce entity count/update rate for off-screen sections
4. **Web Workers**: Offload physics calculations to background thread
5. **Canvas Rendering**: Replace DOM elements with canvas for thousands of entities
6. **RequestAnimationFrame Throttling**: Adaptive frame rate based on performance

### Spatial Hash Example
```javascript
class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }
  
  insert(entity, position) {
    const key = this.getKey(position);
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key).push(entity);
  }
  
  getNearby(position, radius) {
    // Return entities in nearby cells
  }
}
```

---

## Rendering Strategy

### Current: DOM-based
- Each entity is a React component
- Position via absolute positioning
- Rotation via CSS transform
- Good for <100 entities

### Future: Canvas-based
- Single canvas element
- Render all entities in requestAnimationFrame
- Better performance for >500 entities
- Easier complex effects (trails, particles)

### Hybrid Approach
- Canvas for simulation particles
- DOM for UI elements and important visual elements
- Best of both worlds

---

## Scroll Integration

### Intersection Observer
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const mode = entry.target.dataset.simulationMode;
      transitionToMode(mode);
    }
  });
}, {
  threshold: 0.3,  // Trigger when 30% visible
  rootMargin: '100px'  // Lead offset
});
```

### Scroll Position Tracking
- Track scroll position via `window.scrollY`
- Calculate which section is active
- Trigger transitions with hysteresis to prevent flickering

---

## Future Enhancements

### Interactive Features
- Click to spawn entities
- Drag to create forces/obstacles
- Parameter tweaking UI (for development)

### Visual Polish
- Particle trails
- Glow effects
- Smooth color transitions
- Motion blur

### Accessibility
- Reduce motion option
- Static fallback for accessibility
- Keyboard navigation support

### Analytics
- Track simulation performance
- Monitor user interaction patterns
- A/B test different simulation parameters

---

## Testing Strategy

### Unit Tests
- Physics calculations (forces, collisions)
- Spatial partitioning correctness
- Voronoi generation

### Integration Tests
- Transition smoothness
- Memory leak detection
- Performance benchmarks

### Visual Tests
- Screenshot comparison
- Animation smoothness metrics
- Cross-browser compatibility

---

## Configuration

### Global Config
```javascript
const SIMULATION_CONFIG = {
  targetFPS: 60,
  maxDeltaTime: 100,  // Prevent physics explosions
  enableWebWorkers: false,  // Future
  renderingMode: 'dom',  // 'dom' or 'canvas'
  enableSpatialHash: true,
  spatialHashCellSize: 100
};
```

### Per-Mode Config
Defined in each simulation mode file with sensible defaults, overridable via props.

---

## Migration Path

### Phase 1: Core Framework ✅ (This Document)
- Design document
- File structure
- Core interfaces

### Phase 2: Boids Migration
- Extract existing boids logic into new structure
- Implement SimulationEngine
- Test with current UI

### Phase 3: Spring Simulation
- Implement spring physics
- Spring rendering
- Boids→Springs transition

### Phase 4: Voronoi World
- Implement Voronoi generator
- World initialization
- Springs→Voronoi transition

### Phase 5: Polish & Optimization
- Canvas rendering
- Performance tuning
- Visual effects

### Phase 6: Contact Section
- Design and implement final simulation
- Complete transition system

---

## Dependencies

### Required
- React 18+ (already installed)
- Next.js (already installed)

### Optional (Future)
- `d3-delaunay`: Voronoi/Delaunay generation
- `simplex-noise`: Perlin noise for random walks
- `gl-matrix`: Fast vector/matrix math (if going WebGL route)

---

## Notes & Decisions

### Why Parallel Arrays?
- Better cache locality than array of objects
- Easier SIMD optimization (future)
- More natural for WebGL/compute shaders (future)

### Why Not Full ECS?
- Overkill for relatively simple simulations
- Performance benefits negligible at this scale
- Simpler mental model for maintenance

### Design Trade-offs
- **Simplicity vs. Flexibility**: Chose simplicity, can extend later
- **Performance vs. Features**: Prioritized smooth animation over entity count
- **Realism vs. Aesthetics**: Sacrificed physics accuracy for visual appeal

---

## Contact & Maintenance

This is a living document. Update as design evolves.

**Last Updated**: October 3, 2025
**Version**: 1.0.0
**Author**: Mehul Tahiliani
