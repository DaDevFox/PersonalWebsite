# Simulation Framework

A flexible, performant Entity Component System-inspired simulation framework for interactive web experiences.

## Overview

This simulation framework provides a generic, reusable system for creating interactive particle simulations that respond to user scroll position and interaction. Built with React and Next.js, it uses a data-oriented design with parallel arrays for optimal performance.

## Features

- **🎯 Entity Component System (Simplified)**: Data-oriented architecture with parallel arrays for cache efficiency
- **🔄 Multiple Simulation Modes**: Easily switch between different simulations (Boids, Springs, Voronoi)
- **📜 Scroll-Driven**: Simulations change based on which page section is visible
- **🖱️ Interactive**: Mouse tracking and interaction support
- **⚡ Performant**: Optimized physics calculations and rendering
- **🎨 Customizable**: Extensive configuration options for each simulation mode
- **📱 Responsive**: Adapts to window resizing and different screen sizes

## Architecture

```
src/simulation/
├── core/
│   ├── SimulationEngine.js        # Core ECS engine
│   ├── BaseSimulationMode.js      # Abstract base class for modes
│   └── PhysicsSystem.js           # Physics utilities
├── modes/
│   ├── BoidsSimulation.js         # Flocking behavior
│   ├── SpringSimulation.js        # Spring network physics
│   └── VoronoiSimulation.js       # Procedural world generation
├── components/
│   ├── SimulationCanvas.js        # React wrapper
│   ├── SimulationSection.js       # Section container
│   └── simulation.module.css      # Styles
└── utils/
    └── (future utilities)
```

## Quick Start

### Installation

```bash
# Already integrated into this Next.js project
# No additional dependencies required for basic functionality
```

### Basic Usage

```jsx
import SimulationCanvas from '@/simulation/components/SimulationCanvas';
import SimulationSection from '@/simulation/components/SimulationSection';
import BoidsSimulation from '@/simulation/modes/BoidsSimulation';

function MyPage() {
  const boidsMode = new BoidsSimulation({ entityCount: 100 });
  
  return (
    <SimulationCanvas mode={boidsMode}>
      <SimulationSection 
        title="My Section"
        simulationMode="boids"
      >
        <YourContent />
      </SimulationSection>
    </SimulationCanvas>
  );
}
```

## Simulation Modes

### 1. Boids Simulation ✅ (Implemented)

Flocking behavior inspired by birds/fish. Entities follow three rules:
- **Separation**: Avoid crowding neighbors
- **Cohesion**: Move toward the average position of neighbors
- **Alignment**: Match velocity with neighbors

**Configuration:**
```javascript
new BoidsSimulation({
  entityCount: 100,
  speedLimit: 1.0,
  accelerationLimit: 0.5,
  separationForce: 50,
  separationDistance: 400,
  cohesionForce: 30,
  cohesionDistance: 800,
  alignmentForce: 40,
  alignmentDistance: 800,
  backgroundColor: '#10009eb2'
});
```

### 2. Spring Simulation ⏳ (In Progress)

Interconnected particles with spring forces and gravitational sinks.

**Configuration:**
```javascript
new SpringSimulation({
  entityCount: 80,
  tensioningRadius: 150,
  springConstantMin: 0.5,
  springConstantMax: 2.0,
  maxConnectionsPerEntity: 6,
  gravitationalForce: 0.1,
  dampingFactor: 0.95,
  backgroundColor: '#4c67fd'
});
```

### 3. Voronoi World Simulation ⏳ (In Progress)

Procedurally generated world with land/water and roaming entities.

**Configuration:**
```javascript
new VoronoiSimulation({
  landPercentage: 0.5,
  seedPointCount: 30,
  birdCount: 100,
  shipSpeed: 0.3,
  landColor: '#c2b280',
  backgroundColor: '#87ceeb'
});
```

## API Reference

### SimulationEngine

The core engine that manages entities and coordinates updates.

```javascript
const engine = new SimulationEngine({
  maxEntities: 1000,
  targetFPS: 60,
  maxDeltaTime: 100
});

// Entity management
engine.addEntity([x, y], [vx, vy], [ax, ay], direction, type);
engine.removeEntity(index);
engine.clearEntities();

// Mode control
engine.setMode(simulationMode);
engine.start();
engine.pause();

// Updates
engine.tick(timestamp);
engine.render(context);

// Utilities
engine.updateBounds(width, height);
engine.getMetrics();
```

### BaseSimulationMode

Abstract class for creating custom simulations.

```javascript
class MySimulation extends BaseSimulationMode {
  async initialize(state) {
    // Setup entities and initial conditions
  }
  
  update(state, deltaTime) {
    // Physics and logic updates
  }
  
  render(state, ctx) {
    // Rendering logic
  }
  
  async cleanup(state) {
    // Cleanup before transition
  }
}
```

### PhysicsSystem

Utility functions for common physics operations.

```javascript
import { PhysicsSystem } from '@/simulation/core/PhysicsSystem';

// Vector operations
const [nx, ny] = PhysicsSystem.normalize(x, y);
const dist = PhysicsSystem.distance(x1, y1, x2, y2);
const distSq = PhysicsSystem.distanceSquared(x1, y1, x2, y2);

// Physics integration
PhysicsSystem.integrate(state, deltaTime, {
  speedLimit: 1.0,
  accelerationLimit: 0.5,
  damping: 0.98
});

// Boundary handling
PhysicsSystem.wrapBounds(state);
PhysicsSystem.bounceBounds(state, restitution);

// Utilities
const value = PhysicsSystem.lerp(a, b, t);
const clamped = PhysicsSystem.clamp(value, min, max);
const rand = PhysicsSystem.randomRange(min, max);
```

## Creating Custom Simulations

1. **Extend BaseSimulationMode**:

```javascript
import { BaseSimulationMode } from '@/simulation/core/BaseSimulationMode';
import { PhysicsSystem } from '@/simulation/core/PhysicsSystem';

export class MyCustomSimulation extends BaseSimulationMode {
  constructor(config = {}) {
    super({
      name: 'custom',
      backgroundColor: '#000000',
      ...config
    });
  }

  async initialize(state) {
    // Create entities
    for (let i = 0; i < 50; i++) {
      state.positions[i] = [Math.random() * width, Math.random() * height];
      state.velocities[i] = [0, 0];
      state.accelerations[i] = [0, 0];
      state.directions[i] = 0;
      state.types[i] = 0;
    }
    state.entityCount = 50;
  }

  update(state, deltaTime) {
    // Apply forces
    for (let i = 0; i < state.entityCount; i++) {
      PhysicsSystem.applyForce(state, i, forceX, forceY);
    }
    
    // Integrate
    PhysicsSystem.integrate(state, deltaTime);
    PhysicsSystem.wrapBounds(state);
  }

  render(state, ctx) {
    // Return render data or implement canvas rendering
    return { entities: state.positions };
  }
}
```

2. **Register and use**:

```jsx
const customMode = new MyCustomSimulation({ /* config */ });

<SimulationCanvas mode={customMode}>
  <SimulationSection simulationMode="custom">
    <Content />
  </SimulationSection>
</SimulationCanvas>
```

## Performance Optimization

### Current Optimizations
- Parallel arrays for cache efficiency
- Squared distance calculations (avoid sqrt)
- Fast approximate hypot function
- Delta time clamping

### Planned Optimizations
- [ ] Spatial partitioning (grid-based spatial hash)
- [ ] Frustum culling (pause off-screen simulations)
- [ ] Canvas rendering (replace DOM elements)
- [ ] Web Workers (offload physics to background thread)
- [ ] Level of Detail (reduce entity count/update rate for distant sections)

## Browser Support

- Modern browsers with ES6+ support
- IntersectionObserver API required (all modern browsers)
- RequestAnimationFrame support (all modern browsers)

## Development

### Running Locally

```bash
npm run dev
# Visit http://localhost:3000
```

### Debugging

Enable performance overlay:
```jsx
<PerformanceOverlay engine={engineRef.current} />
```

### Testing

```bash
npm test
# (Tests to be implemented)
```

## Roadmap

- [x] Core simulation engine
- [x] Boids simulation
- [x] React component integration
- [x] Basic documentation
- [ ] Complete Spring simulation
- [ ] Complete Voronoi simulation
- [ ] Canvas rendering system
- [ ] Transition animations between modes
- [ ] Spatial partitioning
- [ ] Web Worker support
- [ ] Contact section simulation
- [ ] Performance benchmarks
- [ ] Unit tests
- [ ] Interactive demo page

## Contributing

This is a personal project, but feel free to fork and adapt for your own use!

## License

MIT License - feel free to use and modify.

## Credits

- Boids algorithm inspired by [Craig Reynolds' work](https://www.red3d.com/cwr/boids/)
- Fast hypot approximation from [hughsk/boids](https://github.com/hughsk/boids)

## Contact

Mehul Tahiliani
- GitHub: [@DaDevFox](https://github.com/DaDevFox)

---

**Last Updated**: October 3, 2025  
**Version**: 0.1.0  
**Status**: Active Development
