/**
 * SimulationCanvas.js
 *
 * React component that wraps the simulation engine and handles rendering.
 * Provides the main simulation display and interaction surface.
 */

"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import SimulationEngine from "../core/SimulationEngine";
import EntityRenderer from "./EntityRenderer";
import styles from "./simulation.module.css";

export default function SimulationCanvas({
  children,
  mode,
  onEngineReady,
  className = "",
  showEntities = true,
  boidSize = 10,
}) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Initialize simulation engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new SimulationEngine({
        maxEntities: 1000,
        targetFPS: 60,
      });

      if (onEngineReady) {
        onEngineReady(engineRef.current);
      }
    }
  }, [onEngineReady]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && engineRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        engineRef.current.updateBounds(width, height);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Start animation loop
  useEffect(() => {
    if (!engineRef.current) return;

    engineRef.current.start();
    let frameCount = 0;

    const animate = (timestamp) => {
      if (engineRef.current) {
        engineRef.current.tick(timestamp);

        // Trigger re-render every frame for DOM-based rendering
        frameCount++;
        if (frameCount % 1 === 0) {
          // Every frame
          setRenderTrigger((prev) => prev + 1);
        }
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (engineRef.current) {
        engineRef.current.pause();
      }
    };
  }, []);

  // Handle mode changes
  useEffect(() => {
    if (engineRef.current && mode) {
      engineRef.current.setMode(mode);
    }
  }, [mode]);

  // Handle mouse movement
  const handleMouseMove = useCallback((e) => {
    if (engineRef.current?.activeMode) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        engineRef.current.activeMode.onInteraction?.(
          engineRef.current.state,
          "mousemove",
          {
            position: {
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            },
          }
        );
      }
    }
  }, []);

  return (
    <>
      {/* Fixed background simulation layer */}
      <div
        ref={containerRef}
        className={`${styles.simulationCanvas} ${className}`}
        onMouseMove={handleMouseMove}
        style={{
          backgroundColor:
            engineRef.current?.state.backgroundColor || "transparent",
        }}
      >
        {/* Render entities if enabled */}
        {showEntities &&
          engineRef.current?.state &&
          engineRef.current.activeMode && (
            <EntityRenderer
              state={engineRef.current.state}
              mode={engineRef.current.activeMode}
              boidSize={boidSize}
            />
          )}
      </div>

      {/* Scrollable content container */}
      <div className={styles.scrollableContent}>{children}</div>
    </>
  );
}
