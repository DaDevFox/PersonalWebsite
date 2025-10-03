/**
 * EntityRenderer.js
 * 
 * Renders simulation entities as DOM elements.
 * This is the bridge between the simulation state and visual representation.
 */

'use client';

import Image from 'next/image';
import triangle from '@/media/triangle.png';
import styles from './simulation.module.css';

export function EntityRenderer({ state, mode, boidSize = 10 }) {
  if (!state || !mode) {
    return null;
  }

  const rad2deg = 180 / Math.PI;

  // Render based on simulation mode
  switch (mode.name) {
    case 'boids':
      return renderBoids(state, boidSize, rad2deg, styles);
    
    case 'springs':
      return renderSprings(state, styles);
    
    case 'voronoi':
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
      acceleration[0] * acceleration[0] +
      acceleration[1] * acceleration[1];
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
          position: 'absolute',
          left: `${pos[0]}px`,
          top: `${pos[1]}px`,
          transform: `rotate(${direction * rad2deg}deg)`,
          opacity: `${Math.max(20, opacity)}%`,
          pointerEvents: 'none',
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
        const width = 2 + (displacement < 0 ? Math.abs(displacement) * 0.02 : -displacement * 0.01);
        const clampedWidth = Math.max(1, Math.min(4, width));

        return (
          <div
            key={`spring-${i}`}
            className={styles.spring}
            style={{
              position: 'absolute',
              left: `${posA[0]}px`,
              top: `${posA[1]}px`,
              width: `${length}px`,
              height: `${clampedWidth}px`,
              transform: `rotate(${angle}rad)`,
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              pointerEvents: 'none',
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
              position: 'absolute',
              left: `${pos[0] - size / 2}px`,
              top: `${pos[1] - size / 2}px`,
              width: `${size}px`,
              height: `${size}px`,
              color: 'white',
              pointerEvents: 'none',
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
  const fishingBoats = state.modeData.voronoi?.fishingBoats || [];
  const landColor = '#C2B280';      // Sandy beige
  const waterColor = '#4682B4';     // Steel blue

  return (
    <>
      {/* SVG layer for Voronoi cells with sand texture */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        {/* Define sand texture pattern */}
        <defs>
          {/* Sand noise filter for land */}
          <filter id="sandTexture">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.9" 
              numOctaves="4" 
              result="noise"
            />
            <feColorMatrix 
              in="noise" 
              type="matrix"
              values="0 0 0 0 0.76
                      0 0 0 0 0.70
                      0 0 0 0 0.50
                      0 0 0 0.4 0"
            />
            <feComposite operator="in" in2="SourceGraphic"/>
          </filter>
        </defs>

        {/* Render Voronoi cells as actual polygons */}
        {cells.map((cell, i) => {
          if (!cell.vertices || cell.vertices.length < 3) return null;
          
          // Convert vertices array to SVG polygon points string
          const points = cell.vertices
            .map(v => `${v[0]},${v[1]}`)
            .join(' ');
          
          return (
            <g key={`voronoi-cell-${i}`}>
              {/* Main cell polygon */}
              <polygon
                points={points}
                fill={cell.isLand ? landColor : waterColor}
                fillOpacity={cell.isLand ? 0.85 : 0}
                stroke={cell.isLand ? '#A0826D' : '#36648B'}
                strokeWidth={1}
                strokeOpacity={cell.isLand ? 0.6 : 0.3}
                filter={cell.isLand ? 'url(#sandTexture)' : 'none'}
              />
            </g>
          );
        })}
      </svg>
      
      {/* Render entities - make boats larger and more visible */}
      {state.positions.map((pos, i) => {
        // Skip seed points (Type 1)
        if (state.types[i] === 1) return null;

        const isFishingBoat = fishingBoats.includes(i);
        
        // Fishing boats are larger and more visible, people are small dots
        const size = isFishingBoat ? 12 : 5;
        const color = isFishingBoat ? '#8B4513' : '#2C1810';
        const strokeColor = isFishingBoat ? '#5C2E0A' : 'none';

        return (
          <svg
            key={`voronoi-entity-${i}`}
            style={{
              position: 'absolute',
              left: `${pos[0] - size / 2}px`,
              top: `${pos[1] - size / 2}px`,
              width: `${size}px`,
              height: `${size}px`,
              pointerEvents: 'none',
              zIndex: 2
            }}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 1}
              fill={color}
              stroke={strokeColor}
              strokeWidth={isFishingBoat ? 1 : 0}
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
              position: 'absolute',
              left: `${pos[0] - 4}px`,
              top: `${pos[1] - 4}px`,
              width: '8px',
              height: '8px',
              backgroundColor: 'white',
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </>
  );
}

export default EntityRenderer;
