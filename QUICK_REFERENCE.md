# Quick Reference Card

## Common Tasks & Code Snippets

### Create a New Simulation Mode

```javascript
import { BaseSimulationMode } from '@/simulation/core/BaseSimulationMode';
import { PhysicsSystem } from '@/simulation/core/PhysicsSystem';

export class MySimulation extends BaseSimulationMode {
  constructor(config = {}) {
    super({
      name: 'mymode',
      backgroundColor: '#000000',
      ...config
    });
    this.params = { /* your parameters */ };
  }

  async initialize(state) {
    // Create entities
    for (let i = 0; i < 100; i++) {
      state.positions[i] = [Math.random() * state.bounds.width, Math.random() * state.bounds.height];
      state.velocities[i] = [0, 0];
      state.accelerations[i] = [0, 0];
      state.directions[i] = 0;
      state.types[i] = 0;
    }
    state.entityCount = 100;
  }

  update(state, deltaTime) {
    // Apply your forces here
    PhysicsSystem.integrate(state, deltaTime);
    PhysicsSystem.wrapBounds(state);
  }

  render(state, ctx) {
    return { entities: state.positions.map((pos, i) => ({ position: pos, type: state.types[i] })) };
  }
}
```

---

### Add a New Page Section

```jsx
<SimulationSection
  title="Section Title"
  simulationMode="mymode"
  backgroundColor="rgba(255, 255, 255, 0.95)"
  onVisible={handleSectionVisible}
>
  <YourContentComponent />
</SimulationSection>
```

---

### Apply Force to Entity

```javascript
// Apply force
PhysicsSystem.applyForce(state, entityIndex, forceX, forceY);

// Or directly modify acceleration
state.accelerations[entityIndex][0] += forceX;
state.accelerations[entityIndex][1] += forceY;
```

---

### Calculate Distance Between Entities

```javascript
// Squared distance (faster, no sqrt)
const distSq = PhysicsSystem.distanceSquared(
  state.positions[i][0], state.positions[i][1],
  state.positions[j][0], state.positions[j][1]
);

if (distSq < thresholdSquared) {
  // Entities are within threshold
}

// Actual distance (when you need it)
const dist = PhysicsSystem.distance(
  state.positions[i][0], state.positions[i][1],
  state.positions[j][0], state.positions[j][1]
);
```

---

### Normalize a Vector

```javascript
const [nx, ny] = PhysicsSystem.normalize(vectorX, vectorY);

// Or with direction
const mag = PhysicsSystem.fastHypot(vectorX, vectorY);
const nx = vectorX / mag;
const ny = vectorY / mag;
```

---

### Limit Speed/Acceleration

```javascript
// In update() method
PhysicsSystem.integrate(state, deltaTime, {
  speedLimit: 1.0,
  accelerationLimit: 0.5,
  damping: 0.98
});

// Manual limiting
const [vx, vy] = PhysicsSystem.limitMagnitude(
  state.velocities[i][0],
  state.velocities[i][1],
  maxSpeed
);
state.velocities[i] = [vx, vy];
```

---

### Handle Boundaries

```javascript
// Wrap around (toroidal)
PhysicsSystem.wrapBounds(state);

// Bounce off edges
PhysicsSystem.bounceBounds(state, restitution);

// Custom boundary
if (state.positions[i][0] > state.bounds.width) {
  // Handle custom boundary logic
}
```

---

### Find Neighbors Within Radius

```javascript
const radius = 100;
const radiusSq = radius * radius;

for (let i = 0; i < state.entityCount; i++) {
  for (let j = i + 1; j < state.entityCount; j++) {
    const distSq = PhysicsSystem.distanceSquared(
      state.positions[i][0], state.positions[i][1],
      state.positions[j][0], state.positions[j][1]
    );
    
    if (distSq < radiusSq) {
      // i and j are neighbors
    }
  }
}
```

---

### Mouse Interaction

```javascript
// In your simulation mode class
onInteraction(state, eventType, eventData) {
  if (eventType === 'mousemove') {
    const mousePos = eventData.position;
    
    // Apply force away from mouse
    for (let i = 0; i < state.entityCount; i++) {
      const dx = state.positions[i][0] - mousePos.x;
      const dy = state.positions[i][1] - mousePos.y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq < 10000) { // Within 100px
        const force = 1000 / (distSq + 1);
        const mag = PhysicsSystem.fastHypot(dx, dy);
        state.accelerations[i][0] += (force * dx) / mag;
        state.accelerations[i][1] += (force * dy) / mag;
      }
    }
  }
}
```

---

### Get Performance Metrics

```javascript
// In a React component
const [metrics, setMetrics] = useState({});

useEffect(() => {
  const interval = setInterval(() => {
    if (engineRef.current) {
      setMetrics(engineRef.current.getMetrics());
    }
  }, 1000);
  
  return () => clearInterval(interval);
}, []);

// Display
<div>
  FPS: {metrics.fps?.toFixed(1)}<br/>
  Entities: {metrics.entityCount}<br/>
  Update: {metrics.updateTime?.toFixed(2)}ms
</div>
```

---

### Switch Simulation Mode

```javascript
// From a button or scroll handler
const newMode = new MySimulation({ /* config */ });
engineRef.current.setMode(newMode);
setCurrentMode(newMode);
```

---

### Random Utilities

```javascript
// Random float between min and max
const value = PhysicsSystem.randomRange(0, 100);

// Random integer
const index = PhysicsSystem.randomInt(0, state.entityCount);

// Random position in bounds
const x = Math.random() * state.bounds.width;
const y = Math.random() * state.bounds.height;

// Random direction (radians)
const angle = Math.random() * Math.PI * 2;
```

---

### Lerp & Smoothing

```javascript
// Linear interpolation
const current = PhysicsSystem.lerp(start, end, t); // t = 0 to 1

// Smooth transition
const smoothed = PhysicsSystem.lerp(current, target, 0.1); // 10% per frame

// Clamp value
const clamped = PhysicsSystem.clamp(value, 0, 100);

// Map from one range to another
const mapped = PhysicsSystem.map(value, 0, 100, 0, 1);
```

---

### Entity Type Management

```javascript
// Create different entity types
state.types[i] = 0; // Type 0: Regular entity
state.types[i] = 1; // Type 1: Environment/obstacle
state.types[i] = 2; // Type 2: Special entity
state.types[i] = 3; // Type 3: Custom type

// Filter by type
const type0Entities = [];
for (let i = 0; i < state.entityCount; i++) {
  if (state.types[i] === 0) {
    type0Entities.push(i);
  }
}
```

---

### Angle & Direction

```javascript
// Calculate angle from A to B
const angle = PhysicsSystem.angleTo(posA, posB);

// Update direction from velocity
state.directions[i] = Math.atan2(
  state.velocities[i][1],
  state.velocities[i][0]
);

// Convert to degrees (for CSS rotation)
const degrees = state.directions[i] * (180 / Math.PI);
```

---

### Store Mode-Specific Data

```javascript
// In initialize()
state.modeData.myMode = {
  springs: [],
  connections: [],
  customData: {}
};

// Access in update()
const springs = state.modeData.myMode.springs;

// Clean up in cleanup()
delete state.modeData.myMode;
```

---

### Pause/Resume Simulation

```javascript
// Pause
engineRef.current.pause();

// Resume
engineRef.current.resume();

// Check if running
if (engineRef.current.isRunning) {
  // Simulation is active
}
```

---

### Handle Window Resize

```javascript
// Automatically handled by SimulationCanvas
// But you can override in your mode:

onBoundsChange(state, width, height) {
  // Reposition entities if needed
  for (let i = 0; i < state.entityCount; i++) {
    state.positions[i][0] = Math.min(state.positions[i][0], width);
    state.positions[i][1] = Math.min(state.positions[i][1], height);
  }
}
```

---

### Create Environment Objects (Obstacles)

```javascript
// In BoidsSimulation or custom mode
updateEnvObject(state, index, x, y, width, height) {
  if (index < this.params.envObjectThreshold) {
    state.positions[index] = [x + width/2, y + height/2];
    state.types[index] = 1; // Mark as environment
  }
}

// Call from React component
useEffect(() => {
  if (elementRef.current && engineRef.current?.activeMode?.updateEnvObject) {
    const rect = elementRef.current.getBoundingClientRect();
    engineRef.current.activeMode.updateEnvObject(
      engineRef.current.state,
      0,
      rect.left,
      rect.top,
      rect.width,
      rect.height
    );
  }
}, []);
```

---

### Debug Entity State

```javascript
// Log entity info
console.log('Entity', i, {
  position: state.positions[i],
  velocity: state.velocities[i],
  acceleration: state.accelerations[i],
  direction: state.directions[i],
  type: state.types[i]
});

// Visualize forces (add to render)
if (DEBUG) {
  // Draw velocity vectors
  // Draw acceleration vectors
  // Draw force lines
}
```

---

## Configuration Cheat Sheet

### Boids
```javascript
{
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
}
```

### Springs (when implemented)
```javascript
{
  entityCount: 80,
  tensioningRadius: 150,
  springConstantMin: 0.5,
  springConstantMax: 2.0,
  maxConnectionsPerEntity: 6,
  gravitationalForce: 0.1,
  dampingFactor: 0.95,
  backgroundColor: '#4c67fd'
}
```

### Voronoi (when implemented)
```javascript
{
  landPercentage: 0.5,
  seedPointCount: 30,
  birdCount: 100,
  shipSpeed: 0.3,
  landColor: '#c2b280',
  backgroundColor: '#87ceeb'
}
```

---

## File Locations

- Core Engine: `src/simulation/core/SimulationEngine.js`
- Physics Utils: `src/simulation/core/PhysicsSystem.js`
- Base Mode: `src/simulation/core/BaseSimulationMode.js`
- Boids: `src/simulation/modes/BoidsSimulation.js`
- React Components: `src/simulation/components/`
- Styles: `src/simulation/components/simulation.module.css`
- Documentation: Root directory `*.md` files

---

## Troubleshooting Quick Checks

**Entities not visible?**
- Check EntityRenderer is integrated
- Verify z-index layering
- Check entity positions are in bounds

**Poor performance?**
- Reduce entity count
- Check for console errors
- Verify deltaTime is reasonable

**Simulation not updating?**
- Check engine.isRunning === true
- Verify requestAnimationFrame is running
- Check for errors in update() method

**Transitions not working?**
- Verify IntersectionObserver is firing
- Check threshold settings
- Ensure onVisible callback is connected

---

**Last Updated**: October 3, 2025
