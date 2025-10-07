/**
 * VoronoiTerrainSimulation.js
 *
 * Simplified terrain-based battle simulation.
 * Team 1 (Red) defends raised terrain from Team 2 (Blue) who gather in forests.
 * Used for the "Games" section.
 */

import { BaseSimulationMode } from "../core/BaseSimulationMode";
import { PhysicsSystem } from "../core/PhysicsSystem";

export class VoronoiTerrainSimulation extends BaseSimulationMode {
  constructor(config = {}) {
    super({
      name: "voronoi",
      backgroundColor: config.backgroundColor || "#D4C5A0", // Light tan/beige background
      ...config,
    });

    this.params = {
      // Voronoi generation
      voronoiEntityPercentage: config.voronoiEntityPercentage || 0.5, // ~50% of non-Type1 entities in diagram
      
      // Terrain types
      forestPercentage: config.forestPercentage || 0.15, // % of lowland cells that are forest
      waterPercentage: config.waterPercentage || 0.15, // % of lowland cells that are water
      
      // Combat parameters
      baseFiringRange: config.baseFiringRange || 80,
      raisedTerrainRangeMultiplier: config.raisedTerrainRangeMultiplier || 2.0,
      firingInterval: config.firingInterval || 1000, // ms between shots
      damagePerHit: config.damagePerHit || 0.15,
      
      // Team 1 (Defenders) parameters
      perimeterInset: config.perimeterInset || 20, // Distance from cell edge
      
      // Team 2 (Attackers) parameters
      companyMaxSize: config.companyMaxSize || 8, // Max units per company
      companyFormationSpacing: config.companyFormationSpacing || 12,
      companyPositionEpsilon: config.companyPositionEpsilon || 8,
      forestGatherDistance: config.forestGatherDistance || 100, // How close to forest to gather
      attackTriggerThreshold: config.attackTriggerThreshold || 0.7, // % of company formed to attack
      
      // Formation movement
      formationMoveSpeed: config.formationMoveSpeed || 0.8, // Slower, more orderly movement
      formationRandomPerturbation: config.formationRandomPerturbation || 2, // Small random offset
      
      // Boids separation
      separationDistance: config.separationDistance || 20, // Distance to maintain from other units
      separationForce: config.separationForce || 15, // Strength of separation force
      
      // Movement parameters
      speedLimit: config.speedLimit || 2.0,
      dampingFactor: config.dampingFactor || 0.95,
      
      // UI options
      showHealthBars: config.showHealthBars !== undefined ? config.showHealthBars : true,

      // Colors
      raisedTerrainColor: config.raisedTerrainColor || "#8B7355", // Dark earth brown
      lowlandColor: config.lowlandColor || "#C2B280", // Sandy/tan
      forestColor: config.forestColor || "#228B22", // Forest green
      waterColor: config.waterColor || "#4682B4", // Steel blue
      team1Color: config.team1Color || "#DC143C", // Crimson red (defenders)
      team2Color: config.team2Color || "#1E90FF", // Dodger blue (attackers)
    };

    this.time = 0;
  }

  async initialize(state, isFirstLoad = true) {
    // Step 1: Collect all Type 1 entities - these will ALL be raised terrain
    const type1Entities = [];
    for (let i = 0; i < state.entityCount; i++) {
      if (state.types[i] === 1) {
        type1Entities.push(i);
      }
    }

    // Step 2: Select random ~50% of Type 0 entities to include in Voronoi diagram
    const type0Entities = [];
    for (let i = 0; i < state.entityCount; i++) {
      if (state.types[i] === 0) {
        type0Entities.push(i);
      }
    }

    const voronoiType0Count = Math.floor(
      type0Entities.length * this.params.voronoiEntityPercentage
    );
    const shuffled = [...type0Entities].sort(() => Math.random() - 0.5);
    const selectedType0ForVoronoi = shuffled.slice(0, voronoiType0Count);

    // Step 3: Create Voronoi seed points (Type 1 + selected Type 0)
    const allVoronoiSeeds = [
      ...type1Entities.map((idx) => ({
        x: state.positions[idx][0],
        y: state.positions[idx][1],
        index: idx,
        isRaisedTerrain: true, // Type 1 = raised terrain
      })),
      ...selectedType0ForVoronoi.map((idx) => ({
        x: state.positions[idx][0],
        y: state.positions[idx][1],
        index: idx,
        isRaisedTerrain: false, // Type 0 = lowland
      })),
    ];

    // Step 4: Generate Voronoi cells
    const cells = allVoronoiSeeds.map((seed) => {
      const vertices = this.computeVoronoiCell(seed, allVoronoiSeeds, state.bounds);
      
      let terrainType = "lowland"; // default
      
      if (seed.isRaisedTerrain) {
        terrainType = "raised";
      } else {
        // Randomly assign forest or water to some lowland cells
        const rand = Math.random();
        if (rand < this.params.forestPercentage) {
          terrainType = "forest";
        } else if (rand < this.params.forestPercentage + this.params.waterPercentage) {
          terrainType = "water";
        }
      }

      return {
        center: [seed.x, seed.y],
        seedIndex: seed.index,
        terrainType, // "raised", "lowland", "forest", or "water"
        vertices,
      };
    });

    // Step 5: Assign teams based on entity positions
    if (!state.entityData) state.entityData = {};
    state.entityData.teams = new Array(state.entityCount).fill(0);
    state.entityData.health = new Array(state.entityCount).fill(1.0);
    state.entityData.lastFired = new Array(state.entityCount).fill(0);
    state.entityData.companyId = new Array(state.entityCount).fill(-1);
    state.entityData.targetPosition = new Array(state.entityCount).fill(null);
    state.entityData.isGathered = new Array(state.entityCount).fill(false);

    // Assign teams: entities on raised terrain = Team 1, others = Team 2
    for (let i = 0; i < state.entityCount; i++) {
      const pos = state.positions[i];
      
      // Find which cell this entity is in
      let nearestCell = null;
      let minDist = Infinity;

      for (const cell of cells) {
        const dx = pos[0] - cell.center[0];
        const dy = pos[1] - cell.center[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestCell = cell;
        }
      }

      if (nearestCell && nearestCell.terrainType === "raised") {
        state.entityData.teams[i] = 1; // Defenders (Red)
      } else {
        state.entityData.teams[i] = 2; // Attackers (Blue)
      }
    }

    // Step 6: Initialize mode-specific data
    state.modeData.voronoi = {
      cells,
      companies: [], // Team 2 companies
    };
  }

  /**
   * Compute Voronoi cell polygon vertices for a seed point
   */
  computeVoronoiCell(seed, allSeeds, bounds) {
    const vertices = [];
    const numRays = 32; // Number of rays to cast for approximation

    // Cast rays in all directions from seed point
    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      // Binary search for the edge of the Voronoi cell along this ray
      let minDist = 0;
      let maxDist = Math.max(bounds.width, bounds.height) * 2;

      for (let iter = 0; iter < 20; iter++) {
        const testDist = (minDist + maxDist) / 2;
        const testX = seed.x + dx * testDist;
        const testY = seed.y + dy * testDist;

        // Check if this point is closest to our seed
        let closestToSeed = true;
        const distToSeed = testDist;

        for (const other of allSeeds) {
          if (other === seed) continue;

          const distToOther = Math.hypot(testX - other.x, testY - other.y);
          if (distToOther < distToSeed - 0.1) {
            closestToSeed = false;
            break;
          }
        }

        if (closestToSeed) {
          minDist = testDist;
        } else {
          maxDist = testDist;
        }
      }

      // Add vertex at the boundary
      const vertexX = seed.x + dx * minDist;
      const vertexY = seed.y + dy * minDist;

      // Clip to bounds
      const clippedX = Math.max(0, Math.min(bounds.width, vertexX));
      const clippedY = Math.max(0, Math.min(bounds.height, vertexY));

      vertices.push([clippedX, clippedY]);
    }

    return vertices;
  }

  /**
   * Apply boids separation force to units
   */
  applySeparation(state, unitIndices) {
    for (const idx of unitIndices) {
      const pos = state.positions[idx];
      let separationX = 0;
      let separationY = 0;
      let neighborCount = 0;

      for (const otherIdx of unitIndices) {
        if (idx === otherIdx) continue;

        const dx = pos[0] - state.positions[otherIdx][0];
        const dy = pos[1] - state.positions[otherIdx][1];
        const dist = Math.hypot(dx, dy);

        if (dist < this.params.separationDistance && dist > 0) {
          separationX += (dx / dist) * (1 - dist / this.params.separationDistance);
          separationY += (dy / dist) * (1 - dist / this.params.separationDistance);
          neighborCount++;
        }
      }

      if (neighborCount > 0) {
        state.accelerations[idx][0] += separationX * this.params.separationForce;
        state.accelerations[idx][1] += separationY * this.params.separationForce;
      }
    }
  }

  /**
   * Get the terrain type at a specific position
   */
  getTerrainAtPosition(pos, cells) {
    let nearestCell = null;
    let minDist = Infinity;

    for (const cell of cells) {
      const dx = pos[0] - cell.center[0];
      const dy = pos[1] - cell.center[1];
      const dist = Math.hypot(dx, dy);

      if (dist < minDist) {
        minDist = dist;
        nearestCell = cell;
      }
    }

    return nearestCell ? nearestCell.terrainType : "lowland";
  }

  update(state, deltaTime) {
    this.time += deltaTime / 1000;

    const { cells } = state.modeData.voronoi;
    const teams = state.entityData.teams;

    // Separate units by team
    const team1Units = []; // Defenders on raised terrain
    const team2Units = []; // Attackers
    
    for (let i = 0; i < state.entityCount; i++) {
      if (teams[i] === 1) {
        team1Units.push(i);
      } else if (teams[i] === 2) {
        team2Units.push(i);
      }
    }

    // Update Team 1 (Defenders) - move to perimeter
    this.updateDefenders(state, team1Units, cells);

    // Update Team 2 (Attackers) - gather in forests, then attack
    this.updateAttackers(state, team2Units, cells);

    // Handle combat
    this.handleCombat(state, team1Units, team2Units, cells);

    // Integrate physics
    PhysicsSystem.integrate(state, deltaTime, {
      speedLimit: this.params.speedLimit,
      damping: this.params.dampingFactor,
    });

    // Wrap bounds
    PhysicsSystem.wrapBounds(state);
  }

  /**
   * Check if an edge of a raised terrain cell borders lowland terrain
   */
  edgeBordersLowland(edgePoint, cells) {
    // Check if the point just outside this edge is in lowland terrain
    let nearestCell = null;
    let minDist = Infinity;

    for (const cell of cells) {
      const dx = edgePoint[0] - cell.center[0];
      const dy = edgePoint[1] - cell.center[1];
      const dist = Math.hypot(dx, dy);

      if (dist < minDist) {
        minDist = dist;
        nearestCell = cell;
      }
    }

    return nearestCell && nearestCell.terrainType === "lowland";
  }

  /**
   * Update Team 1 defenders - move to perimeter edges that border lowland terrain
   */
  updateDefenders(state, defenders, cells) {
    const inset = this.params.perimeterInset;

    for (const idx of defenders) {
      const pos = state.positions[idx];

      // Ensure defender is on raised terrain
      const currentTerrain = this.getTerrainAtPosition(pos, cells);
      
      // Find the raised terrain cell this defender is in/near
      let nearestRaisedCell = null;
      let minDist = Infinity;

      for (const cell of cells) {
        if (cell.terrainType !== "raised") continue;

        const dx = pos[0] - cell.center[0];
        const dy = pos[1] - cell.center[1];
        const dist = Math.hypot(dx, dy);

        if (dist < minDist) {
          minDist = dist;
          nearestRaisedCell = cell;
        }
      }

      if (!nearestRaisedCell) continue;

      // If defender fell off raised terrain, pull them back strongly
      if (currentTerrain !== "raised") {
        const dx = nearestRaisedCell.center[0] - pos[0];
        const dy = nearestRaisedCell.center[1] - pos[1];
        const dist = Math.hypot(dx, dy);
        
        const force = 70; // Strong pull back to raised terrain
        state.accelerations[idx] = [(dx / dist) * force, (dy / dist) * force];
        continue;
      }

      // Find closest point on perimeter edges that border lowland terrain
      const vertices = nearestRaisedCell.vertices;
      let closestPerimeterPoint = null;
      let minPerimeterDist = Infinity;

      for (let i = 0; i < vertices.length; i++) {
        const v1 = vertices[i];
        const v2 = vertices[(i + 1) % vertices.length];

        // Get point on edge
        const edgeDx = v2[0] - v1[0];
        const edgeDy = v2[1] - v1[1];
        const edgeLen = Math.hypot(edgeDx, edgeDy);

        if (edgeLen === 0) continue;

        // Project position onto edge
        const t = Math.max(
          0,
          Math.min(
            1,
            ((pos[0] - v1[0]) * edgeDx + (pos[1] - v1[1]) * edgeDy) / (edgeLen * edgeLen)
          )
        );

        const edgePoint = [v1[0] + t * edgeDx, v1[1] + t * edgeDy];

        // Check if this edge borders lowland terrain
        // Test point slightly outside the edge (away from center)
        const toCenterDx = nearestRaisedCell.center[0] - edgePoint[0];
        const toCenterDy = nearestRaisedCell.center[1] - edgePoint[1];
        const toCenterLen = Math.hypot(toCenterDx, toCenterDy);
        
        if (toCenterLen === 0) continue;
        
        const testPoint = [
          edgePoint[0] - (toCenterDx / toCenterLen) * 5, // 5 units outside
          edgePoint[1] - (toCenterDy / toCenterLen) * 5
        ];

        // Only consider edges that border lowland
        if (!this.edgeBordersLowland(testPoint, cells)) continue;

        // Inset point towards center
        const insetPoint = [
          edgePoint[0] + (toCenterDx / toCenterLen) * inset,
          edgePoint[1] + (toCenterDy / toCenterLen) * inset,
        ];

        const distToInset = Math.hypot(pos[0] - insetPoint[0], pos[1] - insetPoint[1]);

        if (distToInset < minPerimeterDist) {
          minPerimeterDist = distToInset;
          closestPerimeterPoint = insetPoint;
        }
      }

      // Move towards perimeter point if on raised terrain, or back to raised terrain if off it
      if (currentTerrain !== "raised") {
        // Pull back to raised terrain
        const dx = nearestRaisedCell.center[0] - pos[0];
        const dy = nearestRaisedCell.center[1] - pos[1];
        const dist = Math.hypot(dx, dy);
        
        const force = 60; // Strong pull back
        state.accelerations[idx] = [(dx / dist) * force, (dy / dist) * force];
      } else if (closestPerimeterPoint) {
        const dx = closestPerimeterPoint[0] - pos[0];
        const dy = closestPerimeterPoint[1] - pos[1];
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
          // Slow, orderly movement with slight randomness
          const force = 25 * this.params.formationMoveSpeed;
          const perturbX = (Math.random() - 0.5) * this.params.formationRandomPerturbation;
          const perturbY = (Math.random() - 0.5) * this.params.formationRandomPerturbation;
          
          state.accelerations[idx] = [
            (dx / dist) * force + perturbX,
            (dy / dist) * force + perturbY
          ];
        } else {
          // In position - stop moving with strong damping
          state.accelerations[idx] = [0, 0];
          state.velocities[idx][0] *= 0.2;
          state.velocities[idx][1] *= 0.2;
        }
      }
    }
    
    // Apply separation force to keep defenders spaced out
    this.applySeparation(state, defenders);
  }

  /**
   * Update Team 2 attackers - gather in forests, avoid water, form companies, then attack
   */
  updateAttackers(state, attackers, cells) {
    const companyId = state.entityData.companyId;

    // Find forest cells
    const forestCells = cells.filter((c) => c.terrainType === "forest");
    const waterCells = cells.filter((c) => c.terrainType === "water");
    const raisedCells = cells.filter((c) => c.terrainType === "raised");

    // Assign attackers to companies
    const companies = new Map();
    
    for (const idx of attackers) {
      let assignedCompany = companyId[idx];

      // Assign to nearest company or create new one
      if (assignedCompany === -1 || !companies.has(assignedCompany)) {
        // Find nearest company with space
        let nearestCompany = -1;
        let nearestDist = Infinity;

        for (const [cid, company] of companies) {
          if (company.units.length >= this.params.companyMaxSize) continue;

          const avgX = company.units.reduce((sum, i) => sum + state.positions[i][0], 0) / company.units.length;
          const avgY = company.units.reduce((sum, i) => sum + state.positions[i][1], 0) / company.units.length;
          const dist = Math.hypot(state.positions[idx][0] - avgX, state.positions[idx][1] - avgY);

          if (dist < nearestDist && dist < 150) {
            nearestDist = dist;
            nearestCompany = cid;
          }
        }

        if (nearestCompany !== -1) {
          assignedCompany = nearestCompany;
        } else {
          assignedCompany = companies.size;
        }

        companyId[idx] = assignedCompany;
      }

      if (!companies.has(assignedCompany)) {
        companies.set(assignedCompany, { units: [], gatherPoint: null, isAttacking: false });
      }

      companies.get(assignedCompany).units.push(idx);
    }

    // For each company, determine behavior
    for (const company of companies.values()) {
      // Find nearest forest as gather point
      if (!company.gatherPoint && forestCells.length > 0) {
        const avgX = company.units.reduce((sum, i) => sum + state.positions[i][0], 0) / company.units.length;
        const avgY = company.units.reduce((sum, i) => sum + state.positions[i][1], 0) / company.units.length;

        let nearestForest = null;
        let minDist = Infinity;

        for (const forest of forestCells) {
          const dist = Math.hypot(avgX - forest.center[0], avgY - forest.center[1]);
          if (dist < minDist) {
            minDist = dist;
            nearestForest = forest;
          }
        }

        company.gatherPoint = nearestForest ? nearestForest.center : null;
      }

      // Check if company is gathered (% of units within gather distance)
      let gatheredCount = 0;
      if (company.gatherPoint) {
        for (const idx of company.units) {
          const dist = Math.hypot(
            state.positions[idx][0] - company.gatherPoint[0],
            state.positions[idx][1] - company.gatherPoint[1]
          );
          if (dist < this.params.forestGatherDistance) {
            gatheredCount++;
          }
        }
      }

      const gatherRatio = gatheredCount / company.units.length;
      company.isAttacking = gatherRatio >= this.params.attackTriggerThreshold;

      // Move units
      for (const idx of company.units) {
        const pos = state.positions[idx];
        const currentTerrain = this.getTerrainAtPosition(pos, cells);
        
        state.accelerations[idx] = [0, 0];

        // Enforce terrain boundaries - keep attackers off raised terrain
        if (currentTerrain === "raised") {
          // Find nearest non-raised terrain and push unit there
          let nearestNonRaised = null;
          let minDist = Infinity;

          for (const cell of cells) {
            if (cell.terrainType === "raised") continue;

            const dx = cell.center[0] - pos[0];
            const dy = cell.center[1] - pos[1];
            const dist = Math.hypot(dx, dy);

            if (dist < minDist) {
              minDist = dist;
              nearestNonRaised = cell;
            }
          }

          if (nearestNonRaised) {
            const dx = nearestNonRaised.center[0] - pos[0];
            const dy = nearestNonRaised.center[1] - pos[1];
            const dist = Math.hypot(dx, dy);
            const force = 80; // Strong push away from raised terrain
            state.accelerations[idx] = [(dx / dist) * force, (dy / dist) * force];
          }
          continue; // Skip normal movement while being pushed off raised terrain
        }

        if (company.isAttacking) {
          // Attack nearest raised terrain - stop at firing range, don't enter it
          if (raisedCells.length > 0) {
            let nearestRaised = null;
            let minDist = Infinity;

            for (const raised of raisedCells) {
              const dist = Math.hypot(
                pos[0] - raised.center[0],
                pos[1] - raised.center[1]
              );
              if (dist < minDist) {
                minDist = dist;
                nearestRaised = raised;
              }
            }

            if (nearestRaised) {
              // Stop at firing range - stay at 75% of max range for safety
              const optimalRange = this.params.baseFiringRange * 0.75;
              const dx = nearestRaised.center[0] - pos[0];
              const dy = nearestRaised.center[1] - pos[1];
              const dist = Math.hypot(dx, dy);
              
              if (dist > optimalRange + 15) {
                // Move closer slowly in formation
                const force = 18 * this.params.formationMoveSpeed;
                const perturbX = (Math.random() - 0.5) * this.params.formationRandomPerturbation;
                const perturbY = (Math.random() - 0.5) * this.params.formationRandomPerturbation;
                
                state.accelerations[idx] = [
                  (dx / dist) * force + perturbX,
                  (dy / dist) * force + perturbY
                ];
              } else if (dist < optimalRange - 15) {
                // Too close to enemy raised terrain, back away
                const force = 12;
                state.accelerations[idx] = [
                  -(dx / dist) * force,
                  -(dy / dist) * force
                ];
              } else {
                // At optimal firing range - hold position
                state.velocities[idx][0] *= 0.6;
                state.velocities[idx][1] *= 0.6;
              }
            }
          }
        } else {
          // Gather at forest in formation
          if (company.gatherPoint) {
            const dx = company.gatherPoint[0] - pos[0];
            const dy = company.gatherPoint[1] - pos[1];
            const dist = Math.hypot(dx, dy);

            if (dist > this.params.forestGatherDistance) {
              // Move to forest slowly in formation
              const force = 18 * this.params.formationMoveSpeed;
              const perturbX = (Math.random() - 0.5) * this.params.formationRandomPerturbation;
              const perturbY = (Math.random() - 0.5) * this.params.formationRandomPerturbation;
              
              state.accelerations[idx] = [
                (dx / dist) * force + perturbX,
                (dy / dist) * force + perturbY
              ];
            } else {
              // Near forest - slow down and hold position
              state.velocities[idx][0] *= 0.4;
              state.velocities[idx][1] *= 0.4;
            }
          }
        }

        // Avoid water
        for (const water of waterCells) {
          const dx = state.positions[idx][0] - water.center[0];
          const dy = state.positions[idx][1] - water.center[1];
          const dist = Math.hypot(dx, dy);

          if (dist < 100) {
            const avoidForce = 50 * (1 - dist / 100);
            state.accelerations[idx][0] += (dx / dist) * avoidForce;
            state.accelerations[idx][1] += (dy / dist) * avoidForce;
          }
        }
      }
    }

    // Apply separation force to keep attackers spaced out
    this.applySeparation(state, attackers);

    state.modeData.voronoi.companies = Array.from(companies.values());
  }

  /**
   * Handle combat between teams
   */
  handleCombat(state, defenders, attackers, cells) {
    const health = state.entityData.health;
    const lastFired = state.entityData.lastFired;
    const now = this.time * 1000;

    // Defenders can fire at attackers (doubled range on raised terrain, can't hit units in forest)
    for (const defIdx of defenders) {
      if (health[defIdx] <= 0) continue;

      const defPos = state.positions[defIdx];
      
      // Check if defender is on raised terrain
      let onRaisedTerrain = false;
      for (const cell of cells) {
        if (cell.terrainType === "raised") {
          const dist = Math.hypot(defPos[0] - cell.center[0], defPos[1] - cell.center[1]);
          if (dist < 80) {
            onRaisedTerrain = true;
            break;
          }
        }
      }

      const firingRange = this.params.baseFiringRange * 
        (onRaisedTerrain ? this.params.raisedTerrainRangeMultiplier : 1.0);

      // Find targets in range
      for (const attIdx of attackers) {
        if (health[attIdx] <= 0) continue;

        const attPos = state.positions[attIdx];
        const dx = attPos[0] - defPos[0];
        const dy = attPos[1] - defPos[1];
        const dist = Math.hypot(dx, dy);

        if (dist > firingRange) continue;

        // Check if attacker is in forest (can't be hit)
        let inForest = false;
        for (const cell of cells) {
          if (cell.terrainType === "forest") {
            const cellDist = Math.hypot(attPos[0] - cell.center[0], attPos[1] - cell.center[1]);
            if (cellDist < 60) {
              inForest = true;
              break;
            }
          }
        }

        if (inForest) continue;

        // Fire if interval allows
        if (now - lastFired[defIdx] > this.params.firingInterval) {
          health[attIdx] -= this.params.damagePerHit;
          lastFired[defIdx] = now;
          break; // One target at a time
        }
      }
    }

    // Attackers can fire back at defenders (base range only)
    for (const attIdx of attackers) {
      if (health[attIdx] <= 0) continue;

      const attPos = state.positions[attIdx];

      for (const defIdx of defenders) {
        if (health[defIdx] <= 0) continue;

        const defPos = state.positions[defIdx];
        const dx = defPos[0] - attPos[0];
        const dy = defPos[1] - attPos[1];
        const dist = Math.hypot(dx, dy);

        if (dist > this.params.baseFiringRange) continue;

        if (now - lastFired[attIdx] > this.params.firingInterval) {
          health[defIdx] -= this.params.damagePerHit;
          lastFired[attIdx] = now;
          break;
        }
      }
    }

    // Remove dead units
    for (let i = state.entityCount - 1; i >= 0; i--) {
      if (health[i] <= 0) {
        // Swap with last entity and reduce count
        const lastIdx = state.entityCount - 1;
        if (i !== lastIdx) {
          state.positions[i] = state.positions[lastIdx];
          state.velocities[i] = state.velocities[lastIdx];
          state.accelerations[i] = state.accelerations[lastIdx];
          state.directions[i] = state.directions[lastIdx];
          state.types[i] = state.types[lastIdx];

          if (state.entityData) {
            const dataArrays = Object.keys(state.entityData);
            for (const key of dataArrays) {
              if (state.entityData[key][lastIdx] !== undefined) {
                state.entityData[key][i] = state.entityData[key][lastIdx];
              }
            }
          }
        }
        state.entityCount--;
      }
    }
  }

  render(state, ctx) {
    return {
      entities: state.positions.slice(0, state.entityCount).map((pos, i) => ({
        index: i,
        position: pos,
        type: state.types[i],
        team: state.entityData?.teams?.[i] || 0,
        health: state.entityData?.health?.[i] || 1.0,
        direction: state.directions[i] || 0,
      })),
      cells: state.modeData.voronoi?.cells || [],
      showHealthBars: this.params.showHealthBars,
    };
  }
}

export default VoronoiTerrainSimulation;
