/**
 * SimulationSection.js
 * 
 * React component that represents a page section with associated simulation.
 * Handles scroll detection and triggers simulation mode changes.
 */

'use client';

import { forwardRef, useEffect } from 'react';
import styles from './simulation.module.css';

const SimulationSection = forwardRef(({ 
  title, 
  simulationMode,
  backgroundColor,
  children,
  onVisible,
  className = ''
}, ref) => {
  
  // Set up intersection observer for visibility detection
  useEffect(() => {
    if (!ref?.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && onVisible) {
            onVisible(simulationMode);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '100px'
      }
    );

    observer.observe(ref.current);

    return () => {
      if (ref?.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, simulationMode, onVisible]);

  return (
    <section 
      ref={ref}
      className={`${styles.simulationSection} ${className}`}
      data-simulation-mode={simulationMode}
      style={{
        '--section-bg-color': backgroundColor || 'transparent'
      }}
    >
      {title && (
        <div className={styles.sectionSeparator}>
          <h2 className={styles.sectionTitle}>{title}</h2>
        </div>
      )}
      <div className={styles.sectionContent}>
        {children}
      </div>
    </section>
  );
});

SimulationSection.displayName = 'SimulationSection';

export default SimulationSection;
