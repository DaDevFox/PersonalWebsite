/**
 * EntityRenderer.js
 *
 * Renders simulation entities as DOM elements.
 * This is the bridge between the simulation state and visual representation.
 */

"use client";

import Image from "next/image";
import triangle from "@/media/triangle.png";
import shipBase from "@/media/ship_base.svg";
import animatedShipBase from "@/media/animated_ship_base.svg";
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
  const ships = state.modeData.voronoi?.ships || [];
  const landUnits = state.modeData.voronoi?.landUnits || [];
  const teams = state.entityData?.teams || [];
  const health = state.entityData?.health || [];
  const sinking = state.entityData?.sinking || [];
  const showHealthBars =
    state.renderData?.showHealthBars !== undefined
      ? state.renderData.showHealthBars
      : true;

  const landColor = "#C2B280"; // Sandy beige
  const waterColor = "#4682B4"; // Steel blue
  const team1Color = "#FF0000"; // Red
  const team2Color = "#0000FF"; // Blue

  return (
    <>
      {/* SVG layer for Voronoi cells with sand texture */}
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
        {/* Define sand texture pattern */}
        <defs>
          {/* Sand noise overlay for land - subtle grain */}
          <filter id="sandTexture">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="3"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 0.15 0"
              result="noise"
            />
            <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
          </filter>
        </defs>

        {/* Render Voronoi cells as actual polygons */}
        {cells.map((cell, i) => {
          if (!cell.vertices || cell.vertices.length < 3) return null;

          // Convert vertices array to SVG polygon points string
          const points = cell.vertices.map((v) => `${v[0]},${v[1]}`).join(" ");

          return (
            <g key={`voronoi-cell-${i}`}>
              {/* Main cell polygon - fully opaque sand */}
              <polygon
                points={points}
                fill={cell.isLand ? landColor : waterColor}
                fillOpacity={cell.isLand ? 1 : 0}
                stroke={cell.isLand ? "#A0826D" : "#36648B"}
                strokeWidth={1}
                strokeOpacity={0}
                filter={cell.isLand ? "url(#sandTexture)" : "none"}
              />
            </g>
          );
        })}
      </svg>

      {/* Render pirate ships */}
      {ships.map((shipIdx) => {
        const pos = state.positions[shipIdx];
        const team = teams[shipIdx] || 1;
        const hp = health[shipIdx] || 1.0;
        const isSinking = sinking[shipIdx] || false;
        const direction = state.directions[shipIdx] || 0;
        const vel = state.velocities[shipIdx] || [0, 0];
        const isMoving = Math.hypot(vel[0], vel[1]) > 0.1;

        const size = 32; // Larger for better visibility

        // Calculate opacity for sinking ships
        const opacity = isSinking ? Math.max(0, hp) : 1.0;

        // Get health bar color
        let healthColor = "#00FF00"; // Green
        if (hp <= 0.5) healthColor = "#FFFF00"; // Yellow
        if (hp <= 0.25) healthColor = "#FF0000"; // Red

        return (
          <div
            key={`ship-${shipIdx}`}
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
            {/* Ship graphic */}
            <div
              style={{
                width: "100%",
                height: "100%",
                transform: `rotate(${direction}rad)`,
                transformOrigin: "center",
                opacity: opacity,
                transition: isSinking ? "opacity 2s linear" : "none",
              }}
            >
              <Image
                src={isMoving ? animatedShipBase : shipBase}
                alt="ship"
                width={size}
                height={size}
                style={{
                  filter:
                    team === 1
                      ? "hue-rotate(0deg) saturate(1.5)" // Red team
                      : "hue-rotate(240deg) saturate(1.5)", // Blue team
                }}
              />
            </div>

            {/* Health bar */}
            {showHealthBars && hp < 1.0 && !isSinking && (
              <div
                style={{
                  position: "absolute",
                  top: "-6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "24px",
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

      {/* Render land units */}
      {landUnits.map((unitIdx) => {
        const pos = state.positions[unitIdx];
        const team = teams[unitIdx] || 1;
        const teamColor = team === 1 ? team1Color : team2Color;

        const size = 8;

        return (
          <svg
            key={`land-unit-${unitIdx}`}
            style={{
              position: "absolute",
              left: `${pos[0] - size / 2}px`,
              top: `${pos[1] - size / 2}px`,
              width: `${size}px`,
              height: `${size}px`,
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 1}
              fill={teamColor}
              stroke="#000"
              strokeWidth={1}
            />
          </svg>
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

export default EntityRenderer;
