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
  if (!state || !mode) return null;

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
  return (
    <>
      {state.positions.map((pos, i) => {
        // Skip environment objects (type 1)
        if (state.types[i] === 1) return null;

        const velocity = state.velocities[i];
        const acceleration = state.accelerations[i];
        const direction = state.directions[i];

        // Calculate opacity based on acceleration magnitude
        const accelMag =
          acceleration[0] * acceleration[0] + acceleration[1] * acceleration[1];
        const opacity = Math.min(100 * accelMag, 100);

        return (
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
              opacity: `${opacity}%`,
              pointerEvents: "none",
            }}
            unoptimized
          />
        );
      })}
    </>
  );
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
  const birds = state.modeData.voronoi?.birds || [];

  return (
    <>
      {/* Render Voronoi cells (land/water) - TODO: implement when Voronoi is complete */}

      {/* Render entities */}
      {state.positions.map((pos, i) => {
        if (state.types[i] === 1) return null; // Skip land markers

        const isShip = ships.includes(i);
        const size = isShip ? 12 : 5;
        const color = isShip ? "#8B4513" : "#333";

        return (
          <div
            key={`voronoi-entity-${i}`}
            className={`${styles.entity} ${styles.entityCircle} ${styles.entityFilled}`}
            style={{
              position: "absolute",
              left: `${pos[0] - size / 2}px`,
              top: `${pos[1] - size / 2}px`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              pointerEvents: "none",
            }}
          />
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
