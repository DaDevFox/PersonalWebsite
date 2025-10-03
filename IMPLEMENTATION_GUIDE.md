# Implementation Guide

## Quick Start

This guide will help you integrate the new simulation framework into your homepage.

## Step 1: Understanding the Architecture

The simulation framework consists of:

1. **Core Engine** (`SimulationEngine.js`): Manages entity lifecycle and coordinates updates
2. **Simulation Modes**: Individual simulations (Boids, Springs, Voronoi)
3. **React Components**: UI wrappers for the simulation
4. **Physics System**: Utility functions for common physics operations

## Step 2: Basic Integration Example

```jsx
'use client';

import { useRef, useState } from 'react';
import SimulationCanvas from '@/simulation/components/SimulationCanvas';
import SimulationSection from '@/simulation/components/SimulationSection';
import BoidsSimulation from '@/simulation/modes/BoidsSimulation';
import SpringSimulation from '@/simulation/modes/SpringSimulation';
import VoronoiSimulation from '@/simulation/modes/VoronoiSimulation';

export default function Home() {
  const engineRef = useRef(null);
  const [currentMode, setCurrentMode] = useState(null);
  
  // Create simulation mode instances
  const boidsMode = useRef(new BoidsSimulation({
    backgroundColor: '#10009eb2',
    entityCount: 100
  })).current;
  
  const springsMode = useRef(new SpringSimulation({
    backgroundColor: '#4c67fd',
    entityCount: 80
  })).current;
  
  const voronoiMode = useRef(new VoronoiSimulation({
    backgroundColor: '#87ceeb',
    seedPointCount: 30,
    birdCount: 100
  })).current;
  
  // Handle section visibility changes
  const handleSectionVisible = (modeName) => {
    let mode = null;
    
    switch(modeName) {
      case 'boids':
        mode = boidsMode;
        break;
      case 'springs':
        mode = springsMode;
        break;
      case 'voronoi':
        mode = voronoiMode;
        break;
    }
    
    if (mode && engineRef.current) {
      engineRef.current.setMode(mode);
      setCurrentMode(mode);
    }
  };
  
  return (
    <main>
      <SimulationCanvas
        mode={currentMode}
        onEngineReady={(engine) => {
          engineRef.current = engine;
          // Start with boids mode
          engine.setMode(boidsMode);
          setCurrentMode(boidsMode);
        }}
      >
        <SimulationSection
          title="Work Experience"
          simulationMode="boids"
          backgroundColor="rgba(255, 255, 255, 0.95)"
          onVisible={handleSectionVisible}
        >
          {/* Your work experience content here */}
          <YourContentComponent />
        </SimulationSection>
        
        <SimulationSection
          title="Projects"
          simulationMode="springs"
          backgroundColor="rgba(255, 255, 255, 0.95)"
          onVisible={handleSectionVisible}
        >
          {/* Your projects content here */}
          <YourProjectsComponent />
        </SimulationSection>
        
        <SimulationSection
          title="Games"
          simulationMode="voronoi"
          backgroundColor="rgba(255, 255, 255, 0.95)"
          onVisible={handleSectionVisible}
        >
          {/* Your games content here */}
          <YourGamesComponent />
        </SimulationSection>
        
        <SimulationSection
          title="Contact"
          simulationMode="boids"
          backgroundColor="rgba(255, 255, 255, 0.95)"
          onVisible={handleSectionVisible}
        >
          {/* Your contact content here */}
          <YourContactComponent />
        </SimulationSection>
      </SimulationCanvas>
    </main>
  );
}
```

## Step 3: Migrating from Old Boids Component

The old `Boids` component can be gradually replaced:

### Before:
```jsx
<Boids count={100} boid_size={10}>
  <Content />
</Boids>
```

### After:
```jsx
<SimulationCanvas mode={boidsMode}>
  <SimulationSection 
    simulationMode="boids"
    onVisible={handleSectionVisible}
  >
    <Content />
  </SimulationSection>
</SimulationCanvas>
```

## Step 4: Customizing Simulations

Each simulation mode accepts configuration:

### Boids Configuration
```javascript
const boidsMode = new BoidsSimulation({
  backgroundColor: '#10009eb2',
  entityCount: 100,
  speedLimit: 1.0,
  accelerationLimit: 0.5,
  separationForce: 50,
  separationDistance: 400,
  cohesionForce: 30,
  cohesionDistance: 800,
  alignmentForce: 40,
  alignmentDistance: 800,
  mouseSeparationForce: 1000,
  mouseSeparationDistance: 40
});
```

### Springs Configuration (TODO: Full implementation pending)
```javascript
const springsMode = new SpringSimulation({
  backgroundColor: '#4c67fd',
  entityCount: 80,
  tensioningRadius: 150,
  springConstantMin: 0.5,
  springConstantMax: 2.0,
  maxConnectionsPerEntity: 6,
  gravitationalForce: 0.1,
  dampingFactor: 0.95
});
```

### Voronoi Configuration (TODO: Full implementation pending)
```javascript
const voronoiMode = new VoronoiSimulation({
  backgroundColor: '#87ceeb',
  landPercentage: 0.5,
  seedPointCount: 30,
  birdCount: 100,
  shipSpeed: 0.3,
  landColor: '#c2b280'
});
```

## Step 5: Performance Monitoring

Enable performance overlay during development:

```jsx
import { useState, useEffect } from 'react';

function PerformanceOverlay({ engine }) {
  const [metrics, setMetrics] = useState({});
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (engine) {
        setMetrics(engine.getMetrics());
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [engine]);
  
  return (
    <div className={styles.performanceOverlay}>
      <div>FPS: {metrics.fps?.toFixed(1)}</div>
      <div>Entities: {metrics.entityCount}</div>
      <div>Update: {metrics.updateTime?.toFixed(2)}ms</div>
      <div>Render: {metrics.renderTime?.toFixed(2)}ms</div>
    </div>
  );
}
```

## Step 6: Adding Environment Objects (for Boids)

To add obstacles that boids avoid (like title text):

```jsx
const [titleBounds, setTitleBounds] = useState({});
const titleRef = useRef(null);

useEffect(() => {
  if (titleRef.current && engineRef.current) {
    const rect = titleRef.current.getBoundingClientRect();
    setTitleBounds(rect);
    
    // Update environment object in simulation
    if (engineRef.current.activeMode?.updateEnvObject) {
      engineRef.current.activeMode.updateEnvObject(
        engineRef.current.state,
        0, // index
        rect.left,
        rect.top,
        rect.width,
        rect.height
      );
    }
  }
}, []);

return (
  <h1 ref={titleRef}>Your Title</h1>
);
```

## Step 7: Future Enhancements

### Canvas Rendering (for better performance)
Currently, entities are rendered as DOM elements. For >500 entities, consider canvas rendering:

1. Add a `<canvas>` element to `SimulationCanvas`
2. Implement `render()` methods in simulation modes to draw on canvas
3. Toggle rendering mode via config

### Spatial Partitioning
For large entity counts, implement spatial hashing:

```javascript
// TODO: Implement in future iteration
import { SpatialHash } from '@/simulation/utils/SpatialHash';

const spatialHash = new SpatialHash(100); // 100px cell size
// Use in update() to optimize neighbor queries
```

### Web Workers
Offload physics calculations to background thread:

```javascript
// TODO: Implement in future iteration
const physicsWorker = new Worker('/workers/physics-worker.js');
```

## Current Status

✅ **Complete:**
- Core simulation engine
- Boids simulation (functional)
- Basic React integration
- Physics utilities
- Design documentation

⏳ **In Progress:**
- Spring simulation implementation
- Voronoi world generation
- Canvas rendering
- DOM entity rendering for Boids

📋 **TODO:**
- Complete Springs simulation logic
- Complete Voronoi simulation logic
- Implement transition animations between modes
- Add spatial partitioning
- Contact section simulation design
- Performance optimizations

## Troubleshooting

### Simulation not starting
- Check that `onEngineReady` callback is setting the initial mode
- Verify that `SimulationEngine.start()` is being called

### Poor performance
- Reduce entity count
- Enable spatial partitioning (when implemented)
- Switch to canvas rendering (when implemented)

### Entities not visible
- Check z-index layering in CSS
- Verify entity positions are within bounds
- Ensure simulation is running (`engine.isRunning === true`)

### Transitions not working
- Verify `IntersectionObserver` is supported in browser
- Check threshold and rootMargin settings
- Ensure `onVisible` callback is firing

## Next Steps

1. **Test the Boids migration**: Replace current Boids component with new framework
2. **Implement Springs simulation**: Complete the TODO items in `SpringSimulation.js`
3. **Implement Voronoi world**: Complete the TODO items in `VoronoiSimulation.js`
4. **Add DOM rendering**: Create React components to render entities
5. **Polish transitions**: Add smooth morphing between simulation modes
6. **Optimize performance**: Implement spatial hashing and canvas rendering

## Questions?

Refer to:
- `SIMULATION_DESIGN.md` for architectural details
- `SimulationEngine.js` for core API
- `BaseSimulationMode.js` for simulation interface
- Individual mode files for specific implementations
