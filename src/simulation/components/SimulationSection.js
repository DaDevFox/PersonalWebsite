/**
 * SimulationSection.js
 * 
 * React component that represents a page section with associated simulation.
 * Handles scroll detection and triggers simulation mode changes.
 */

'use client';

import { useEffect, useRef } from 'react';
import styles from './simulation.module.css';

export default function SimulationSection({ 
  title, 
  simulationMode,
  backgroundColor,
  children,
  onVisible,
  className = ''
}) {
  const sectionRef = useRef(null);
  
  // Set up intersection observer for visibility detection
  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && onVisible) {
            onVisible(simulationMode);
          }
        });
      },
      {
        threshold: 0.1,      // Trigger early - when just 10% visible
        rootMargin: '-50px'  // Negative margin - wait until section is slightly IN viewport
      }
    );

    observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [simulationMode, onVisible]);

  return (
    <section 
      ref={sectionRef}
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
}
