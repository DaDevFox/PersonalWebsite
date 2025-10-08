/**
 * SimulationCanvas.js
 *
 * React component that wraps the simulation engine and handles rendering.
 * Provides the main simulation display and interaction surface.
 */

"use client";

import { useRef, useEffect, useCallback, useState } from "react";
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
  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);
  const engineRef = useRef(null);
  const animationFrameRef = useRef(null);
  // Force React re-render on each animation frame for DOM-based entity rendering
  // eslint-disable-next-line no-unused-vars
  const [renderTick, setRenderTick] = useState(0);

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
      if (containerRef.current && engineRef.current && leftPaneRef.current) {
        // Measure the actual pane width from the DOM
        const paneWidth = leftPaneRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        // Total simulation width is 2 * pane width (left + right)
        const totalSimulationWidth = paneWidth * 2;

        engineRef.current.updateBounds(totalSimulationWidth, height);
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
        engineRef.current.render(); // Update render data

        // Trigger React re-render every frame for DOM-based rendering
        frameCount++;
        setRenderTick(frameCount);
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
      {/* Left pane simulation */}
      <div
        ref={leftPaneRef}
        className={`${styles.simulationCanvasLeft} ${className}`}
        onMouseMove={handleMouseMove}
        style={{
          backgroundColor:
            engineRef.current?.state.backgroundColor || "transparent",
        }}
      >
        {/* Render entities if enabled - LEFT PANE */}
        {showEntities &&
          engineRef.current?.state &&
          engineRef.current.activeMode && (
            <EntityRenderer
              state={engineRef.current.state}
              mode={engineRef.current.activeMode}
              boidSize={boidSize}
              pane="left"
            />
          )}
      </div>

      {/* Right pane simulation */}
      <div
        ref={rightPaneRef}
        className={`${styles.simulationCanvasRight} ${className}`}
        onMouseMove={handleMouseMove}
        style={{
          backgroundColor:
            engineRef.current?.state.backgroundColor || "transparent",
        }}
      >
        {/* Render entities if enabled - RIGHT PANE */}
        {showEntities &&
          engineRef.current?.state &&
          engineRef.current.activeMode && (
            <EntityRenderer
              state={engineRef.current.state}
              mode={engineRef.current.activeMode}
              boidSize={boidSize}
              pane="right"
            />
          )}
      </div>

      {/* Hidden container for size measurement */}
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          visibility: "hidden",
        }}
      />

      {/* Scrollable content container */}
      <div className={styles.scrollableContent}>{children}</div>
    </>
  );
}
