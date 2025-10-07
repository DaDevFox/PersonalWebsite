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

export function EntityRenderer({ state, mode, boidSize = 10 }) {
  if (!state || !mode) {
    return null;
  }

  const rad2deg = 180 / Math.PI;

  // Render based on simulation mode
  switch (mode.name) {
    case "boids":
      return renderBoids(state, boidSize, rad2deg, styles);

    case "springs":
      return renderSprings(state, styles);

    case "voronoi":
      return renderVoronoi(state, styles);

    case "linebattle":
      return renderLineBattle(state, mode.params, styles);

    default:
      return renderGeneric(state, styles);
  }
}

// Boids rendering
function renderBoids(state, boidSize, rad2deg, styles) {
  const entities = [];

  for (let i = 0; i < state.positions.length; i++) {
    // Skip environment objects (type 1)
    if (state.types[i] === 1) continue;

    const pos = state.positions[i];
    const acceleration = state.accelerations[i];
    const direction = state.directions[i];

    // Calculate opacity based on acceleration magnitude
    const accelMag =
      acceleration[0] * acceleration[0] + acceleration[1] * acceleration[1];
    const opacity = Math.min(100 * accelMag, 100);

    entities.push(
      <Image
        key={`boid-${i}`}
        src={triangle}
        width={boidSize}
        height={boidSize}
        alt=""
        className={`${styles.entity} ${styles.entityTriangle}`}
        style={{
          position: "absolute",
          left: `${pos[0]}px`,
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
function renderSprings(state, styles) {
  const springs = state.modeData.springs?.connections || [];
  const sinks = state.modeData.springs?.sinks || [];

  return (
    <>
      {/* Render springs first (behind entities) */}
      {springs.map((spring, i) => {
        const posA = state.positions[spring.indexA];
        const posB = state.positions[spring.indexB];

        if (!posA || !posB) return null;

        const dx = posB[0] - posA[0];
        const dy = posB[1] - posA[1];
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Calculate displacement for variable width
        const currentDist = length;
        const displacement = currentDist - spring.equilibriumLength;
        // Width increases when compressed, decreases when stretched
        const width =
          2 +
          (displacement < 0
            ? Math.abs(displacement) * 0.02
            : -displacement * 0.01);
        const clampedWidth = Math.max(1, Math.min(4, width));

        return (
          <div
            key={`spring-${i}`}
            className={styles.spring}
            style={{
              position: "absolute",
              left: `${posA[0]}px`,
              top: `${posA[1]}px`,
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
        const isSink = sinks.includes(i);
        const size = isSink ? 16 : 8;

        return (
          <div
            key={`spring-entity-${i}`}
            className={`${styles.entity} ${styles.entityCircle} ${
              isSink ? styles.entityFilled : styles.entityHollow
            }`}
            style={{
              position: "absolute",
              left: `${pos[0] - size / 2}px`,
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
function renderVoronoi(state, styles) {
  const cells = state.modeData.voronoi?.cells || [];
  const teams = state.entityData?.teams || [];
  const health = state.entityData?.health || [];
  const showHealthBars =
    state.renderData?.showHealthBars !== undefined
      ? state.renderData.showHealthBars
      : true;

  // Color scheme for terrain types
  const raisedTerrainColor = "#8B7355"; // Dark earth brown
  const lowlandColor = "#C2B280"; // Sandy/tan
  const forestColor = "#228B22"; // Forest green
  const waterColor = "#4682B4"; // Steel blue
  const team1Color = "#DC143C"; // Crimson red (defenders)
  const team2Color = "#1E90FF"; // Dodger blue (attackers)

  return (
    <>
      {/* SVG layer for Voronoi cells */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {/* Render Voronoi cells as polygons */}
        {cells.map((cell, i) => {
          if (!cell.vertices || cell.vertices.length < 3) return null;

          // Convert vertices array to SVG polygon points string
          const points = cell.vertices.map((v) => `${v[0]},${v[1]}`).join(" ");

          // Determine cell color based on terrain type
          let fillColor = lowlandColor; // default
          let strokeColor = "#A0826D";

          if (cell.terrainType === "raised") {
            fillColor = raisedTerrainColor;
            strokeColor = "#6B5344";
          } else if (cell.terrainType === "forest") {
            fillColor = forestColor;
            strokeColor = "#1B6B1B";
          } else if (cell.terrainType === "water") {
            fillColor = waterColor;
            strokeColor = "#36648B";
          }

          return (
            <g key={`voronoi-cell-${i}`}>
              <polygon
                points={points}
                fill={fillColor}
                fillOpacity={1}
                stroke={strokeColor}
                strokeWidth={2}
                strokeOpacity={0.6}
              />
            </g>
          );
        })}
      </svg>

      {/* Render all units (both teams) */}
      {state.positions.slice(0, state.entityCount).map((pos, idx) => {
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
            key={`unit-${idx}`}
            style={{
              position: "absolute",
              left: `${pos[0] - size / 2}px`,
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
function renderGeneric(state, styles) {
  return (
    <>
      {state.positions.map((pos, i) => {
        return (
          <div
            key={`entity-${i}`}
            className={`${styles.entity} ${styles.entityCircle} ${styles.entityFilled}`}
            style={{
              position: "absolute",
              left: `${pos[0] - 4}px`,
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
function renderLineBattle(state, params, styles) {
  const teams = state.entityData?.teams || [];
  const health = state.entityData?.health || [];
  const maxHealth = state.entityData?.maxHealth || [];
  const unitTypes = state.entityData?.unitType || [];
  const isDead = state.entityData?.isDead || [];
  const opacity = state.entityData?.opacity || [];
  const formationInfo = state.renderData?.formationInfo || [];
  const showHealthBars =
    state.renderData?.showHealthBars !== undefined
      ? state.renderData.showHealthBars
      : true;

  const team1Color = params?.team1Color || "#DC143C";
  const team2Color = params?.team2Color || "#1E90FF";
  const unit_types = params?.unit_types || [];

  return (
    <>
      {/* Formation info overlay */}
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
            key={`formation-${i}`}
            style={{
              marginBottom: "3px",
              color: info.team === 1 ? team1Color : team2Color,
            }}
          >
            Team {info.team}: {info.formationName} ({info.stateName}) - {info.unitCount} units (XP: {Math.floor(info.experience * 100)}%)
          </div>
        ))}
      </div>

      {/* Render all units */}
      {state.positions.slice(0, state.entityCount).map((pos, idx) => {
        const team = teams[idx] || 0;
        const hp = health[idx] || 1.0;
        const maxHp = maxHealth[idx] || 1.0;
        const unitTypeId = unitTypes[idx] || 0;
        const dead = isDead[idx] || false;
        const alpha = opacity[idx] || 1.0;

        // Get unit type info
        const unitType = unit_types.find((t) => t.id === unitTypeId);
        const unitColor = unitType?.color || "#FFFFFF";

        const teamColor = team === 1 ? team1Color : team2Color;
        const size = 10;

        // Get health bar color
        let healthColor = "#00FF00"; // Green
        if (hp / maxHp <= 0.5) healthColor = "#FFFF00"; // Yellow
        if (hp / maxHp <= 0.25) healthColor = "#FF0000"; // Red

        return (
          <div
            key={`unit-${idx}`}
            style={{
              position: "absolute",
              left: `${pos[0] - size / 2}px`,
              top: `${pos[1] - size / 2}px`,
              width: `${size}px`,
              height: `${size}px`,
              pointerEvents: "none",
              zIndex: dead ? 1 : 3,
              opacity: alpha,
            }}
          >
            {/* Unit circle with team color border and unit type color fill */}
            <svg width={size} height={size}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 1}
                fill={unitColor}
                stroke={teamColor}
                strokeWidth={2}
                opacity={alpha}
              />
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
