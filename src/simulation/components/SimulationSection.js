/**
 * SimulationSection.js
 *
 * React component that represents a page section with associated simulation.
 * Handles scroll detection and triggers simulation mode changes.
 */

"use client";

import { useEffect, useRef } from "react";
import styles from "./simulation.module.css";

export default function SimulationSection({
  title,
  simulationMode,
  backgroundColor,
  children,
  onVisible,
  className = "",
  minHeight = "100vh", // New prop for configurable height
  titleHeight = "200px", // New prop for title area height
  contentPadding = "1rem 17.5vw", // New prop for content padding
}) {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);

  // Set up intersection observer for visibility detection
  useEffect(() => {
    if (!sectionRef.current) return;

    // If section has a title, observe the title element for precise transitions
    // Otherwise, observe the whole section (for header section)
    const targetElement =
      title && titleRef.current ? titleRef.current : sectionRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && onVisible) {
            onVisible(simulationMode);
          }
        });
      },
      {
        threshold: title ? 0 : 0.3, // Title: trigger when it appears; No title: wait for 30%
        rootMargin: title ? "-100px 0px 0px 0px" : "100px", // Title: trigger when near top; No title: early trigger
      }
    );

    observer.observe(targetElement);

    return () => {
      if (targetElement) {
        observer.unobserve(targetElement);
      }
    };
  }, [simulationMode, onVisible, title]);

  return (
    <section
      ref={sectionRef}
      className={`${styles.simulationSection} ${className}`}
      data-simulation-mode={simulationMode}
      style={{
        "--section-bg-color": backgroundColor || "transparent",
        "--section-min-height": minHeight,
        "--title-height": titleHeight,
        "--content-padding": contentPadding,
      }}
    >
      {title && (
        <div className={styles.sectionSeparator}>
          <h2 ref={titleRef} className={styles.sectionTitle}>
            {title}
          </h2>
        </div>
      )}
      <div className={styles.sectionContent}>{children}</div>
    </section>
  );
}
