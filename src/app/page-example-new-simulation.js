/**
 * page.js - Example integration of the new simulation framework
 *
 * This demonstrates how to use the simulation framework with the homepage.
 * Replace your existing page.js with this template and customize as needed.
 */

"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";

// Simulation imports
import SimulationCanvas from "@/simulation/components/SimulationCanvas";
import SimulationSection from "@/simulation/components/SimulationSection";
import BoidsSimulation from "@/simulation/modes/BoidsSimulation";
import SpringSimulation from "@/simulation/modes/SpringSimulation";
import VoronoiHybridSimulation from "@/simulation/modes/VoronoiHybridSimulation";

// Existing component imports
import GamesContent from "./games-content";
import ProjectContent from "./project-content";
import styles from "@/styles/page.module.css";
import logo_gh from "@/media/GitHub_Invertocat_Dark.svg";

export default function Home() {
  const engineRef = useRef(null);
  const [currentMode, setCurrentMode] = useState(null);
  const titleTextObjRef = useRef(null);

  // Create simulation mode instances (memoized)
  const boidsMode = useRef(
    new BoidsSimulation({
      backgroundColor: "#10009eb2",
      entityCount: 100,
      speedLimit: 1.0,
      accelerationLimit: 0.5,
      separationForce: 50,
      separationDistance: 400,
      cohesionForce: 30,
      cohesionDistance: 800,
      alignmentForce: 40,
      alignmentDistance: 800,
    })
  ).current;

  const springsMode = useRef(
    new SpringSimulation({
      backgroundColor: "#4c67fd",
      entityCount: 80,
    })
  ).current;

  const voronoiMode = useRef(
    new VoronoiHybridSimulation({
      backgroundColor: "#87ceeb",
      seedPointCount: 30,
      birdCount: 100,
    })
  ).current;

  // Handle section visibility changes
  const handleSectionVisible = (modeName) => {
    let mode = null;

    switch (modeName) {
      case "boids":
        mode = boidsMode;
        break;
      case "springs":
        mode = springsMode;
        break;
      case "voronoi":
        mode = voronoiMode;
        break;
      default:
        mode = boidsMode;
    }

    if (mode && engineRef.current && mode !== currentMode) {
      engineRef.current.setMode(mode);
      setCurrentMode(mode);
    }
  };

  // Update environment objects (for title text obstacle in boids)
  useEffect(() => {
    const updateTitleBounds = () => {
      if (titleTextObjRef.current && engineRef.current) {
        const rect = titleTextObjRef.current.getBoundingClientRect();

        // Update environment object in boids simulation if active
        if (
          engineRef.current.activeMode === boidsMode &&
          boidsMode.updateEnvObject
        ) {
          boidsMode.updateEnvObject(
            engineRef.current.state,
            0,
            rect.left,
            rect.top,
            rect.width,
            rect.height
          );
        }
      }
    };

    updateTitleBounds();
    window.addEventListener("resize", updateTitleBounds);

    return () => {
      window.removeEventListener("resize", updateTitleBounds);
    };
  }, [boidsMode]);

  // Components
  const LogoLink = (props) => (
    <a href={props.link} className={styles.link}>
      <Image
        className={
          props.roundedCorners ? styles.link_image : styles.link_image_unrounded
        }
        width={props.size}
        height={props.size}
        src={props.src}
        alt={props.alt}
        unoptimized
      />
    </a>
  );

  const Header = () => (
    <div className={styles.header_rect}>
      <div ref={titleTextObjRef} className={styles.title}>
        Mehul Tahiliani
      </div>
      <div className={styles.description}>Software Developer</div>
    </div>
  );

  return (
    <main className={styles.main}>
      <SimulationCanvas
        mode={currentMode}
        onEngineReady={(engine) => {
          engineRef.current = engine;
          // Start with boids mode
          engine.setMode(boidsMode);
          setCurrentMode(boidsMode);
        }}
      >
        {/* Section 1: Work Experience (Boids) */}
        <SimulationSection
          title=""
          simulationMode="boids"
          backgroundColor="transparent"
          onVisible={handleSectionVisible}
        >
          <Header />
          <div className={styles.links}>
            <LogoLink
              roundedCorners={true}
              size={30}
              link="https://github.com/DaDevFox"
              src={logo_gh}
              alt="GitHub"
            />
          </div>
          <ProjectContent />
        </SimulationSection>

        {/* Section 2: Projects (Springs) */}
        <SimulationSection
          title="Work Experience"
          simulationMode="boids"
          backgroundColor="rgba(255, 255, 255, 0.95)"
          onVisible={handleSectionVisible}
        >
          <GamesContent />
        </SimulationSection>

        {/* Section 3: Games (Voronoi World) */}
        <SimulationSection
          title="Projects"
          simulationMode="springs"
          backgroundColor="rgba(255, 255, 255, 0.95)"
          onVisible={handleSectionVisible}
        >
          <div className={styles.content_container}>
            <p>Projects content goes here...</p>
            {/* Add your projects content */}
          </div>
        </SimulationSection>

        <SimulationSection
          title="Games"
          simulationMode="voronoi"
          backgroundColor="rgba(255, 255, 255, 0.95)"
          onVisible={handleSectionVisible}
        >
          <div className={styles.content_container}>
            <p>Games content goes here...</p>
            {/* Add your games content */}
          </div>
        </SimulationSection>

        {/* Section 4: Contact */}
        <SimulationSection
          title="Contact"
          simulationMode="boids"
          backgroundColor="rgba(255, 255, 255, 0.95)"
          onVisible={handleSectionVisible}
        >
          <div className={styles.content_container}>
            <p>Contact information goes here...</p>
            {/* Add your contact content */}
          </div>
        </SimulationSection>
      </SimulationCanvas>
    </main>
  );
}
