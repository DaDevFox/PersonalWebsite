/**
 * EntityRenderer.js
 *
 * Renders simulation entities as DOM elements.
 * This is the bridge between the simulation state and visual representation.
 */

"use client";

import Image from "next/image";
import triangle from "@/media/triangle.png";
import styles from "./simulation.module.css";

/**
 * Calculate rendering position for split-pane layout
 * The simulation space is narrower (2 * paneWidth)
 * but entities wrap seamlessly across the gap
 */
function calculateRenderPosition(simulationX, simulationWidth, pane) {
  // Measure actual pane width from simulation width (which is 2 * paneWidth)
  const paneWidth = simulationWidth / 2;

  // Normalize position to 0-1 range
  const normalizedX = simulationX / simulationWidth;

  // Left pane shows first 50% of simulation space (0-0.5)
  // Right pane shows last 50% of simulation space (0.5-1.0)
  if (pane === "left") {
    // Map simulation range [0, simulationWidth * 0.5] to [0, paneWidth]
    if (normalizedX <= 0.5) {
      return {
        visible: true,
        x: normalizedX * 2 * paneWidth, // Scale 0-0.5 to 0-paneWidth
      };
    }
  } else if (pane === "right") {
    // Map simulation range [simulationWidth * 0.5, simulationWidth] to [0, paneWidth]
    if (normalizedX > 0.5) {
      return {
        visible: true,
        x: (normalizedX - 0.5) * 2 * paneWidth, // Scale 0.5-1.0 to 0-paneWidth
      };
    }
  }

  return { visible: false, x: 0 };
}

/**
 * Check if a spring connection should be rendered in the given pane
 * Also returns split information if the spring crosses the boundary
 */
function shouldRenderSpring(posA, posB, simulationWidth, pane) {
  const normA = posA[0] / simulationWidth;
  const normB = posB[0] / simulationWidth;

  // Calculate direct distance and wrapped distance
  const directDist = Math.abs(posB[0] - posA[0]);
  const wrappedDist = simulationWidth - directDist;

  // If wrapped distance is shorter, the spring should wrap around
  const shouldWrap = wrappedDist < directDist;

  if (shouldWrap) {
    // Spring wraps around - always crosses boundary
    return {
      shouldRender: true,
      crossesBoundary: true,
      wrapsAround: true,
      // Determine which point is on which side
      leftSideNorm: normA < normB ? normA : normB,
      rightSideNorm: normA < normB ? normB : normA,
      leftSideIsA: normA < normB,
    };
  }

  // Check if spring crosses the middle boundary (0.5) without wrapping
  const crossesBoundary =
    (normA <= 0.5 && normB > 0.5) || (normA > 0.5 && normB <= 0.5);

  if (crossesBoundary) {
    // Return information about which segment to render
    return {
      shouldRender: true,
      crossesBoundary: true,
      wrapsAround: false,
      isLeftSegment: pane === "left" ? normA <= 0.5 : normB <= 0.5,
    };
  }

  // Render if at least one endpoint is in this pane
  if (pane === "left") {
    return {
      shouldRender: normA <= 0.5 || normB <= 0.5,
      crossesBoundary: false,
      wrapsAround: false,
    };
  } else {
    return {
      shouldRender: normA > 0.5 || normB > 0.5,
      crossesBoundary: false,
      wrapsAround: false,
    };
  }
}

export function EntityRenderer({ state, mode, boidSize = 10, pane = "left" }) {
  if (!state || !mode) {
    return null;
  }

  const rad2deg = 180 / Math.PI;

  // Render based on simulation mode
  switch (mode.name) {
    case "boids":
      return renderBoids(state, boidSize, rad2deg, styles, pane);

    case "springs":
      return renderSprings(state, styles, pane);

    case "voronoi":
      return renderVoronoi(state, styles, pane);

    case "linebattle":
      return renderLineBattle(state, mode.params, styles, pane);

    default:
      return renderGeneric(state, styles, pane);
  }
}

// Boids rendering
function renderBoids(state, boidSize, rad2deg, styles, pane) {
  const entities = [];
  const simulationWidth = state.bounds.width;

  for (let i = 0; i < state.positions.length; i++) {
    // Skip environment objects (type 1)
    if (state.types[i] === 1) continue;

    const pos = state.positions[i];
    const acceleration = state.accelerations[i];
    const direction = state.directions[i];

    // Calculate rendering position for this pane
    const renderPos = calculateRenderPosition(pos[0], simulationWidth, pane);
    if (!renderPos.visible) continue;

    // Calculate opacity based on acceleration magnitude
    const accelMag =
      acceleration[0] * acceleration[0] + acceleration[1] * acceleration[1];
    const opacity = Math.min(100 * accelMag, 100);

    entities.push(
      <Image
        key={`boid-${i}-${pane}`}
        src={triangle}
        width={boidSize}
        height={boidSize}
        alt=""
        className={`${styles.entity} ${styles.entityTriangle}`}
        style={{
          position: "absolute",
          left: `${renderPos.x}px`,
          top: `${pos[1]}px`,
          transform: `rotate(${direction * rad2deg}deg)`,
          opacity: `${Math.max(20, opacity)}%`,
          pointerEvents: "none",
        }}
        unoptimized
      />
    );
  }

  return <>{entities}</>;
}

// Springs rendering
function renderSprings(state, styles, pane) {
  const springs = state.modeData.springs?.connections || [];
  const sinks = state.modeData.springs?.sinks || [];
  const simulationWidth = state.bounds.width;
  const paneWidth = simulationWidth / 2;

  return (
    <>
      {/* Render springs first (behind entities) */}
      {springs.map((spring, i) => {
        const posA = state.positions[spring.indexA];
        const posB = state.positions[spring.indexB];

        if (!posA || !posB) return null;

        // Check if this spring should be rendered in this pane
        const springInfo = shouldRenderSpring(
          posA,
          posB,
          simulationWidth,
          pane
        );
        if (!springInfo.shouldRender) return null;

        const renderPosA = calculateRenderPosition(
          posA[0],
          simulationWidth,
          pane
        );
        const renderPosB = calculateRenderPosition(
          posB[0],
          simulationWidth,
          pane
        );

        // Calculate displacement for variable width
        const currentDist = Math.sqrt(
          (posB[0] - posA[0]) * (posB[0] - posA[0]) +
            (posB[1] - posA[1]) * (posB[1] - posA[1])
        );
        const displacement = currentDist - spring.equilibriumLength;
        const width =
          2 +
          (displacement < 0
            ? Math.abs(displacement) * 0.02
            : -displacement * 0.01);
        const clampedWidth = Math.max(1, Math.min(4, width));

        // Handle springs that wrap around the simulation space
        if (springInfo.wrapsAround) {
          // This spring takes the shorter wrapped path
          // Determine which point is on the left vs right side of the wrap
          const leftPoint = springInfo.leftSideIsA ? posA : posB;
          const rightPoint = springInfo.leftSideIsA ? posB : posA;
          const leftRenderPos = springInfo.leftSideIsA
            ? renderPosA
            : renderPosB;
          const rightRenderPos = springInfo.leftSideIsA
            ? renderPosB
            : renderPosA;

          if (pane === "left") {
            // In left pane, draw from left point to the left edge (wrapping left from right edge)
            if (leftRenderPos.visible) {
              // Start at the left point, end at x=0 (left edge, coming from wrap)
              const startX = leftRenderPos.x;
              const startY = leftPoint[1];
              const endX = 0;
              // Interpolate Y: going from leftPoint to rightPoint wrapping around
              // The fraction of distance from left edge
              const totalWrappedX =
                leftPoint[0] + (simulationWidth - rightPoint[0]);
              const t = leftPoint[0] / totalWrappedX;
              const endY = leftPoint[1] + t * (rightPoint[1] - leftPoint[1]);

              const dx = endX - startX;
              const dy = endY - startY;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx);

              return (
                <div
                  key={`spring-wrap-left-${i}-${pane}`}
                  className={styles.spring}
                  style={{
                    position: "absolute",
                    left: `${startX}px`,
                    top: `${startY}px`,
                    width: `${length}px`,
                    height: `${clampedWidth}px`,
                    transform: `rotate(${angle}rad)`,
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    pointerEvents: "none",
                  }}
                />
              );
            }
          } else {
            // In right pane, draw from right edge (x=paneWidth, coming from wrap) to right point
            if (rightRenderPos.visible) {
              const startX = paneWidth;
              // Interpolate Y at the right edge
              const totalWrappedX =
                leftPoint[0] + (simulationWidth - rightPoint[0]);
              const tAtRightEdge = leftPoint[0] / totalWrappedX;
              const startY =
                leftPoint[1] + tAtRightEdge * (rightPoint[1] - leftPoint[1]);

              const endX = rightRenderPos.x;
              const endY = rightPoint[1];

              const dx = endX - startX;
              const dy = endY - startY;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx);

              return (
                <div
                  key={`spring-wrap-right-${i}-${pane}`}
                  className={styles.spring}
                  style={{
                    position: "absolute",
                    left: `${startX}px`,
                    top: `${startY}px`,
                    width: `${length}px`,
                    height: `${clampedWidth}px`,
                    transform: `rotate(${angle}rad)`,
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    pointerEvents: "none",
                  }}
                />
              );
            }
          }
          return null;
        }

        // Handle springs that cross the boundary (normal cross, not wrap)
        if (springInfo.crossesBoundary) {
          // Determine which endpoint is in this pane
          const normA = posA[0] / simulationWidth;
          const normB = posB[0] / simulationWidth;

          let startX, startY, endX, endY;

          if (pane === "left") {
            // Render segment from the left-side point to the right edge of left pane
            if (normA <= 0.5) {
              startX = renderPosA.x;
              startY = posA[1];
              // Interpolate to find Y position at the boundary
              const t = (0.5 - normA) / (normB - normA);
              endX = paneWidth;
              endY = posA[1] + t * (posB[1] - posA[1]);
            } else {
              startX = renderPosB.x;
              startY = posB[1];
              const t = (0.5 - normB) / (normA - normB);
              endX = paneWidth;
              endY = posB[1] + t * (posA[1] - posB[1]);
            }
          } else {
            // Render segment from the left edge of right pane to the right-side point
            if (normA > 0.5) {
              startX = 0;
              const t = (0.5 - normB) / (normA - normB);
              startY = posB[1] + t * (posA[1] - posB[1]);
              endX = renderPosA.x;
              endY = posA[1];
            } else {
              startX = 0;
              const t = (0.5 - normA) / (normB - normA);
              startY = posA[1] + t * (posB[1] - posA[1]);
              endX = renderPosB.x;
              endY = posB[1];
            }
          }

          const dx = endX - startX;
          const dy = endY - startY;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          return (
            <div
              key={`spring-split-${i}-${pane}`}
              className={styles.spring}
              style={{
                position: "absolute",
                left: `${startX}px`,
                top: `${startY}px`,
                width: `${length}px`,
                height: `${clampedWidth}px`,
                transform: `rotate(${angle}rad)`,
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                pointerEvents: "none",
              }}
            />
          );
        }

        // Normal spring rendering (both endpoints in same pane)
        if (!renderPosA.visible && !renderPosB.visible) return null;

        let startX = renderPosA.visible ? renderPosA.x : renderPosB.x;
        let startY = posA[1];
        let endX = renderPosB.visible ? renderPosB.x : renderPosA.x;
        let endY = posB[1];

        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        return (
          <div
            key={`spring-${i}-${pane}`}
            className={styles.spring}
            style={{
              position: "absolute",
              left: `${startX}px`,
              top: `${startY}px`,
              width: `${length}px`,
              height: `${clampedWidth}px`,
              transform: `rotate(${angle}rad)`,
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* Render entities */}
      {state.positions.map((pos, i) => {
        const renderPos = calculateRenderPosition(
          pos[0],
          simulationWidth,
          pane
        );
        if (!renderPos.visible) return null;

        const isSink = sinks.includes(i);
        const size = isSink ? 16 : 8;

        return (
          <div
            key={`spring-entity-${i}-${pane}`}
            className={`${styles.entity} ${styles.entityCircle} ${
              isSink ? styles.entityFilled : styles.entityHollow
            }`}
            style={{
              position: "absolute",
              left: `${renderPos.x - size / 2}px`,
              top: `${pos[1] - size / 2}px`,
              width: `${size}px`,
              height: `${size}px`,
              color: "white",
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
}

// Voronoi rendering
function renderVoronoi(state, styles, pane) {
  const teams = state.entityData?.teams || [];
  const health = state.entityData?.health || [];
  const showHealthBars =
    state.renderData?.showHealthBars !== undefined
      ? state.renderData.showHealthBars
      : true;
  const simulationWidth = state.bounds.width;

  const team1Color = "#DC143C"; // Crimson red (defenders)
  const team2Color = "#1E90FF"; // Dodger blue (attackers)

  return (
    <>
      {/* Note: Voronoi cells are not rendered in split-pane mode for simplicity */}
      {/* Only rendering units */}

      {/* Render all units (both teams) */}
      {state.positions.slice(0, state.entityCount).map((pos, idx) => {
        const renderPos = calculateRenderPosition(
          pos[0],
          simulationWidth,
          pane
        );
        if (!renderPos.visible) return null;

        const team = teams[idx] || 0;
        const hp = health[idx] || 1.0;

        // Skip dead units or seed points (Type 1)
        if (hp <= 0 || state.types[idx] === 1) return null;

        const teamColor = team === 1 ? team1Color : team2Color;
        const size = 10;

        // Get health bar color
        let healthColor = "#00FF00"; // Green
        if (hp <= 0.5) healthColor = "#FFFF00"; // Yellow
        if (hp <= 0.25) healthColor = "#FF0000"; // Red

        return (
          <div
            key={`unit-${idx}-${pane}`}
            style={{
              position: "absolute",
              left: `${renderPos.x - size / 2}px`,
              top: `${pos[1] - size / 2}px`,
              width: `${size}px`,
              height: `${size}px`,
              pointerEvents: "none",
              zIndex: 3,
            }}
          >
            {/* Unit circle */}
            <svg width={size} height={size}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 1}
                fill={teamColor}
                stroke="#000"
                strokeWidth={1.5}
              />
            </svg>

            {/* Health bar */}
            {showHealthBars && hp < 1.0 && (
              <div
                style={{
                  position: "absolute",
                  top: "-6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "16px",
                  height: "3px",
                  backgroundColor: "#333",
                  border: "1px solid #000",
                }}
              >
                <div
                  style={{
                    width: `${hp * 100}%`,
                    height: "100%",
                    backgroundColor: healthColor,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// Generic fallback rendering
function renderGeneric(state, styles, pane) {
  const simulationWidth = state.bounds.width;

  return (
    <>
      {state.positions.map((pos, i) => {
        const renderPos = calculateRenderPosition(
          pos[0],
          simulationWidth,
          pane
        );
        if (!renderPos.visible) return null;

        return (
          <div
            key={`entity-${i}-${pane}`}
            className={`${styles.entity} ${styles.entityCircle} ${styles.entityFilled}`}
            style={{
              position: "absolute",
              left: `${renderPos.x - 4}px`,
              top: `${pos[1] - 4}px`,
              width: "8px",
              height: "8px",
              backgroundColor: "white",
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
}

// Line battle rendering
function renderLineBattle(state, params, styles, pane) {
  const teams = state.entityData?.teams || [];
  const health = state.entityData?.health || [];
  const maxHealth = state.entityData?.maxHealth || [];
  const unitTypes = state.entityData?.unitType || [];
  const isDead = state.entityData?.isDead || [];
  const opacity = state.entityData?.opacity || [];
  const formationInfo = state.renderData?.formationInfo || [];
  const projectiles = state.renderData?.projectiles || [];
  const showHealthBars =
    state.renderData?.showHealthBars !== undefined
      ? state.renderData.showHealthBars
      : true;
  const simulationWidth = state.bounds.width;

  const team1Color = params?.team1Color || "#DC143C";
  const team2Color = params?.team2Color || "#1E90FF";
  const unit_types = params?.unit_types || [];

  // Only show formation info on left pane
  const showFormationInfo =
    pane === "left" && params?.showFormationInfo === true;

  return (
    <>
      {/* Formation info overlay - only on left pane */}
      {showFormationInfo && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            color: "white",
            fontFamily: "monospace",
            fontSize: "14px",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "10px",
            borderRadius: "5px",
            zIndex: 1000,
            pointerEvents: "none",
          }}
        >
          <div style={{ marginBottom: "5px", fontWeight: "bold" }}>
            Active Formations:
          </div>
          {formationInfo.map((info, i) => (
            <div
              key={`formation-info-${info.team}-${i}`}
              style={{
                marginBottom: "3px",
                color: info.team === 1 ? team1Color : team2Color,
              }}
            >
              Team {info.team}: {info.formationName} ({info.stateName}) -{" "}
              {info.unitCount} units (XP: {Math.floor(info.experience * 100)}%)
            </div>
          ))}
        </div>
      )}

      {/* Render projectiles (cannon shots and arrows) */}
      {projectiles.map((proj, i) => {
        const renderPos = calculateRenderPosition(
          proj.currentPos[0],
          simulationWidth,
          pane
        );
        if (!renderPos.visible) return null;

        const teamColor = proj.team === 1 ? team1Color : team2Color;

        if (proj.type === "cannonball") {
          // Render cannonball with trail and splash effect on impact
          const elapsed = Date.now() / 1000 - proj.startTime;
          const progress = Math.min(elapsed / proj.duration, 1.0);
          const isImpacting = progress >= 0.95;

          // Calculate render positions for target
          const renderTargetPos = calculateRenderPosition(
            proj.targetPos[0],
            simulationWidth,
            pane
          );

          return (
            <div
              key={`proj-cannonball-${proj.startTime}-${i}`}
              style={{ pointerEvents: "none" }}
            >
              {/* Cannonball - smaller size */}
              <div
                style={{
                  position: "absolute",
                  left: `${renderPos.x - 3}px`,
                  top: `${proj.currentPos[1] - 3}px`,
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#2C2C2C",
                  border: "1px solid #000",
                  boxShadow: "0 0 3px rgba(0, 0, 0, 0.6)",
                  zIndex: 5,
                }}
              />

              {/* Simple smoke trail behind */}
              <div
                style={{
                  position: "absolute",
                  left: `${renderPos.x - 4}px`,
                  top: `${proj.currentPos[1] - 4}px`,
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(80, 80, 80, 0.25)",
                  zIndex: 4,
                }}
              />

              {/* Static aiming indicator (dashed circle showing splash radius) - before impact */}
              {!isImpacting && proj.splash && renderTargetPos.visible && (
                <svg
                  style={{
                    position: "absolute",
                    left: `${renderTargetPos.x - proj.splash.radius}px`,
                    top: `${proj.targetPos[1] - proj.splash.radius}px`,
                    width: `${proj.splash.radius * 2}px`,
                    height: `${proj.splash.radius * 2}px`,
                    zIndex: 3,
                    pointerEvents: "none",
                  }}
                >
                  <circle
                    cx={proj.splash.radius}
                    cy={proj.splash.radius}
                    r={proj.splash.radius - 1}
                    fill="none"
                    stroke="rgba(255, 102, 0, 0.4)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                </svg>
              )}

              {/* Splash effect on impact - animated reticle that expands */}
              {isImpacting && proj.splash && renderTargetPos.visible && (
                <>
                  {/* Expanding splash circle with pulse animation */}
                  <svg
                    className={styles.splashPulse}
                    style={{
                      position: "absolute",
                      left: `${renderTargetPos.x - proj.splash.radius}px`,
                      top: `${proj.targetPos[1] - proj.splash.radius}px`,
                      width: `${proj.splash.radius * 2}px`,
                      height: `${proj.splash.radius * 2}px`,
                      zIndex: 4,
                      pointerEvents: "none",
                    }}
                  >
                    <circle
                      cx={proj.splash.radius}
                      cy={proj.splash.radius}
                      r={proj.splash.radius - 1}
                      fill="rgba(255, 102, 0, 0.2)"
                      stroke="#FF6600"
                      strokeWidth="2"
                    />
                  </svg>
                  {/* Inner flash */}
                  <div
                    className={styles.flashFade}
                    style={{
                      position: "absolute",
                      left: `${renderTargetPos.x - 8}px`,
                      top: `${proj.targetPos[1] - 8}px`,
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(255, 200, 0, 0.8)",
                      boxShadow: "0 0 12px rgba(255, 150, 0, 0.9)",
                      zIndex: 5,
                    }}
                  />
                </>
              )}
            </div>
          );
        } else if (proj.type === "arrow") {
          // Render arrow
          const dx = proj.targetPos[0] - proj.startPos[0];
          const dy = proj.targetPos[1] - proj.startPos[1];
          const angle = Math.atan2(dy, dx);
          const angleDeg = (angle * 180) / Math.PI;

          return (
            <div
              key={`proj-arrow-${proj.startTime}-${i}`}
              style={{
                position: "absolute",
                left: `${renderPos.x}px`,
                top: `${proj.currentPos[1]}px`,
                width: "2px",
                height: "2px",
                backgroundColor: teamColor,
                transform: `rotate(${angleDeg}deg)`,
                transformOrigin: "center",
                opacity: 0.8,
                boxShadow: `0 0 3px ${teamColor}`,
                zIndex: 5,
                pointerEvents: "none",
              }}
            >
              {/* Arrowhead */}
              <div
                style={{
                  position: "absolute",
                  right: "-3px",
                  top: "-2px",
                  width: 0,
                  height: 0,
                  borderLeft: "4px solid " + teamColor,
                  borderTop: "3px solid transparent",
                  borderBottom: "3px solid transparent",
                }}
              />
            </div>
          );
        }
        return null;
      })}

      {/* Render all units */}
      {state.positions.slice(0, state.entityCount).map((pos, idx) => {
        const renderPos = calculateRenderPosition(
          pos[0],
          simulationWidth,
          pane
        );
        if (!renderPos.visible) return null;

        const team = teams[idx] || 0;
        const hp = health[idx] || 1.0;
        const maxHp = maxHealth[idx] || 1.0;
        const unitTypeId = unitTypes[idx] || 0;
        const dead = isDead[idx] || false;
        const alpha = opacity[idx] || 1.0;

        // Get unit type info
        const unitType = unit_types.find((t) => t.id === unitTypeId);
        const unitColor = unitType?.color || "#FFFFFF";
        const isArtillery = unitType?.shape === "square";
        const isCavalry = unitType?.chargeDamage && unitType?.meleeDamage;

        const teamColor = team === 1 ? team1Color : team2Color;
        const size = 10;

        // Cavalry gets deeper, more saturated rendering
        const cavalryOpacity = isCavalry ? Math.min(1.0, alpha * 1.2) : alpha;
        const cavalryStrokeWidth = isCavalry ? 2.5 : 2;

        // Get health bar color
        let healthColor = "#00FF00"; // Green
        if (hp / maxHp <= 0.5) healthColor = "#FFFF00"; // Yellow
        if (hp / maxHp <= 0.25) healthColor = "#FF0000"; // Red

        return (
          <div
            key={`unit-linebattle-${idx}-${pane}`}
            style={{
              position: "absolute",
              left: `${renderPos.x - size / 2}px`,
              top: `${pos[1] - size / 2}px`,
              width: `${size}px`,
              height: `${size}px`,
              pointerEvents: "none",
              zIndex: dead ? 1 : 3,
              opacity: alpha,
            }}
          >
            {/* Unit shape - circle for most, square for artillery */}
            <svg width={size} height={size}>
              {isArtillery ? (
                // Artillery: Square shape
                <rect
                  x={1}
                  y={1}
                  width={size - 2}
                  height={size - 2}
                  fill={unitColor}
                  stroke={teamColor}
                  strokeWidth={2}
                  opacity={alpha}
                />
              ) : (
                // Others: Circle shape (cavalry gets thicker border & more opacity)
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={size / 2 - 1}
                  fill={unitColor}
                  stroke={teamColor}
                  strokeWidth={cavalryStrokeWidth}
                  opacity={cavalryOpacity}
                />
              )}
            </svg>

            {/* Health bar */}
            {showHealthBars && !dead && hp < maxHp && (
              <div
                style={{
                  position: "absolute",
                  top: "-6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "16px",
                  height: "3px",
                  backgroundColor: "#333",
                  border: "1px solid #000",
                }}
              >
                <div
                  style={{
                    width: `${(hp / maxHp) * 100}%`,
                    height: "100%",
                    backgroundColor: healthColor,
                  }}
                />
              </div>
            )}

            {/* Formation indicator (small dot for brains) */}
            {state.entityData?.brainId?.[idx] >= 0 && !dead && (
              <div
                style={{
                  position: "absolute",
                  bottom: "-4px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "3px",
                  height: "3px",
                  borderRadius: "50%",
                  backgroundColor: teamColor,
                  opacity: 0.6,
                }}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export default EntityRenderer;
