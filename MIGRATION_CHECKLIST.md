# Migration Checklist

## From Old Boids Component to New Simulation Framework

This checklist will help you migrate from the existing boids implementation to the new simulation framework.

---

## Phase 1: Setup & Preparation ✅

- [x] Create core simulation engine
- [x] Create base simulation mode class
- [x] Create physics utilities
- [x] Create React wrapper components
- [x] Create design documentation
- [x] Create implementation guide

---

## Phase 2: Boids Migration ✅ COMPLETE

### Step 1: Review Current Implementation
- [x] Review existing `src/components/simulation/boids.js`
- [x] Note custom props being passed (envObject positions, etc.)
- [x] Identify all places where Boids component is used
- [x] Take screenshots/video of current behavior for comparison

### Step 2: Test New Boids Simulation
- [x] Create a test page with new simulation framework
- [x] Verify boids behavior matches old implementation
- [x] Test mouse interaction
- [x] Test environment object avoidance
- [x] Test resize behavior
- [x] Test performance (FPS, smoothness)

### Step 3: Create Entity Rendering Component ✅
**Created `src/simulation/components/EntityRenderer.js`**

- [x] Create EntityRenderer component
- [x] Integrate with SimulationCanvas
- [x] Test entity visibility and rendering

### Step 4: Update SimulationCanvas ✅
- [x] Add state updates to trigger re-renders
- [x] Integrate EntityRenderer
- [x] Test rendering performance

### Step 5: Replace in page.js ✅
- [x] Backup current `src/app/page.js` (saved as page.js.backup)
- [x] Copy `src/app/page-example-new-simulation.js` to `src/app/page.js`
- [x] Adjust content components as needed
- [x] Test in development server
- [x] Verify all functionality works

### Step 6: Clean Up
- [ ] Remove old boids component (after confirming new one works - DEFER)
- [ ] Remove old simulation section components if no longer needed (DEFER)
- [ ] Update imports throughout codebase (DEFER)
- [ ] Clean up unused styles (DEFER)

**Note**: Deferring cleanup until spring simulation is also working to ensure we have a fallback.

---

## Phase 3: Spring Simulation Implementation 📋

### Requirements Analysis
- [ ] Define exact spring physics equations
- [ ] Determine collision detection algorithm (point-line vs point-point)
- [ ] Decide on spring rendering strategy (SVG lines vs Canvas)

### Implementation
- [ ] Implement spring network initialization
  - [ ] Find nearby entities within tensioningRadius
  - [ ] Create spring connections with random constants
  - [ ] Cap connections per entity
  - [ ] Identify gravitational sinks (isolated entities)

- [ ] Implement physics update (Pass 1: Collisions)
  - [ ] Point-line collision detection for springs
  - [ ] Collision response with restitution

- [ ] Implement physics update (Pass 2: Forces)
  - [ ] Spring force calculation: F = -k(x - x₀)
  - [ ] Gravitational attraction to sinks
  - [ ] Apply damping

- [ ] Implement rendering
  - [ ] Render springs as lines with variable width
  - [ ] Render joints as hollow circles
  - [ ] Render sinks as filled circles

### Testing
- [ ] Test spring initialization
- [ ] Test collision resolution
- [ ] Test spring forces
- [ ] Test gravitational attraction
- [ ] Verify visual appearance
- [ ] Performance test with 80-100 entities

---

## Phase 4: Voronoi World Implementation 📋

### Dependencies
- [ ] Research Voronoi/Delaunay libraries
  - Option 1: d3-delaunay (recommended)
  - Option 2: Custom Fortune's algorithm
  - Option 3: Delaunay triangulation + circumcenters
- [ ] Install chosen library: `npm install d3-delaunay`

### Perlin Noise
- [ ] Research Perlin noise libraries
  - Option 1: simplex-noise
  - Option 2: Custom implementation
- [ ] Install if needed: `npm install simplex-noise`

### Implementation
- [ ] Implement Voronoi generation
  - [ ] Generate diagram from Type 1 entities
  - [ ] Extract cell polygons
  - [ ] Store cell data

- [ ] Implement land/water assignment
  - [ ] Randomly select cells for land (~50%)
  - [ ] Store terrain type per cell

- [ ] Implement entity reassignment
  - [ ] Type 1 in water → Type 3 (ships)
  - [ ] Type 1 in land → remain Type 1
  - [ ] Type 0 → birds/people (boids behavior)

- [ ] Implement ship movement
  - [ ] Perlin noise-based random walk
  - [ ] Constrain to water regions
  - [ ] Smooth turning

- [ ] Implement rendering
  - [ ] Render Voronoi cells with fill
  - [ ] Render ships
  - [ ] Render birds/people

### Testing
- [ ] Test Voronoi generation
- [ ] Test land/water distribution
- [ ] Test entity reassignment
- [ ] Test ship movement
- [ ] Test bird behavior
- [ ] Test boundary collision
- [ ] Verify visual appearance

---

## Phase 5: Transition System 📋

### Design
- [ ] Define transition strategies for each mode pair
  - [ ] Boids → Springs
  - [ ] Springs → Voronoi
  - [ ] Voronoi → Contact (TBD)
  - [ ] Reverse transitions

### Implementation
- [ ] Create TransitionManager class
- [ ] Implement transition strategies
- [ ] Add easing functions
- [ ] Handle entity count changes (spawn/despawn)
- [ ] Implement type migration animations

### Testing
- [ ] Test each transition direction
- [ ] Verify smoothness
- [ ] Test rapid scrolling
- [ ] Test edge cases (reverse before complete)

---

## Phase 6: Canvas Rendering (Optional Performance Boost) 📋

### Setup
- [ ] Add canvas element to SimulationCanvas
- [ ] Implement canvas context setup
- [ ] Add rendering mode toggle

### Implementation
- [ ] Implement canvas rendering for Boids
- [ ] Implement canvas rendering for Springs
- [ ] Implement canvas rendering for Voronoi
- [ ] Add option to switch between DOM/Canvas rendering

### Testing
- [ ] Compare performance (DOM vs Canvas)
- [ ] Test with varying entity counts
- [ ] Verify visual parity with DOM rendering

---

## Phase 7: Contact Section Simulation 📋

### Design
- [ ] Brainstorm simulation concept for contact section
- [ ] Define entity behaviors
- [ ] Create design document section

### Implementation
- [ ] Create ContactSimulation class
- [ ] Implement initialization
- [ ] Implement update logic
- [ ] Implement rendering

### Testing
- [ ] Test simulation behavior
- [ ] Test transition to/from other modes
- [ ] Verify visual appeal

---

## Phase 8: Performance Optimization 📋

### Spatial Partitioning
- [ ] Implement SpatialHash class
- [ ] Integrate into Boids update
- [ ] Integrate into Springs update
- [ ] Benchmark performance improvement

### Frustum Culling
- [ ] Detect when section is off-screen
- [ ] Pause simulation updates for off-screen sections
- [ ] Resume when section becomes visible
- [ ] Test scroll performance

### Web Workers (Advanced)
- [ ] Create physics worker
- [ ] Implement message passing
- [ ] Transfer computation to worker
- [ ] Benchmark performance

---

## Phase 9: Polish & Refinement 🎨

### Visual Enhancements
- [ ] Add particle trails (optional)
- [ ] Add glow effects (optional)
- [ ] Smooth color transitions between sections
- [ ] Motion blur (optional)

### Accessibility
- [ ] Add "reduce motion" preference support
- [ ] Provide static fallback option
- [ ] Ensure keyboard navigation works
- [ ] Test with screen readers

### Documentation
- [ ] Add JSDoc comments to all public methods
- [ ] Create API documentation
- [ ] Add more code examples
- [ ] Create video demonstrations

---

## Phase 10: Testing & Deployment ✅

### Testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS, Android)
- [ ] Performance testing on low-end devices
- [ ] Accessibility audit

### Deployment
- [ ] Build production version
- [ ] Test production build
- [ ] Deploy to staging
- [ ] Review staging site
- [ ] Deploy to production

---

## Current Status Summary

### ✅ Complete
- Core simulation engine architecture
- Physics utilities and helper functions
- Boids simulation logic (needs rendering integration)
- React component structure
- Comprehensive documentation

### 🔄 In Progress
- Entity rendering component
- SimulationCanvas integration
- Boids migration testing

### 📋 Not Started
- Spring simulation implementation
- Voronoi world implementation
- Transition system
- Canvas rendering
- Contact section design
- Performance optimizations

---

## Next Immediate Steps

1. **Create EntityRenderer component** (Step 2.3)
2. **Update SimulationCanvas to use EntityRenderer** (Step 2.4)
3. **Test new Boids simulation** (Step 2.2)
4. **Migrate page.js** (Step 2.5)
5. **Implement Spring simulation** (Phase 3)

---

## Notes

- The framework is designed to be incrementally adoptable
- You can run old and new systems side-by-side during migration
- Performance should be monitored throughout
- User experience should remain consistent or improve

**Start Date**: October 3, 2025  
**Target Completion**: TBD  
**Priority**: High
