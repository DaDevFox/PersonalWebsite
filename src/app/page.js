/**
 * page.js - New simulation framework integration
 *
 * This demonstrates the new simulation framework with scroll-driven mode changes.
 */

"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";

// Simulation imports
import SimulationCanvas from "@/simulation/components/SimulationCanvas";
import SimulationSection from "@/simulation/components/SimulationSection";
import BoidsSimulation from "@/simulation/modes/BoidsSimulation";
import SpringSimulation from "@/simulation/modes/SpringSimulation";
import LineBattleSimulation from "@/simulation/modes/LineBattleSimulation";

// Existing component imports
import ContentOne from "./content-pane-1";
import ContentTwo from "./content-pane-2";
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
      entityCount: 60,
      speedLimit: 1.5,
      accelerationLimit: 0.1,
      separationForce: 100,
      separationDistance: 100,
      cohesionForce: 50,
      cohesionDistance: 200,
      alignmentForce: 100,
      alignmentDistance: 200,
      mouseSeparationForce: 200,
      mouseSeparationDistance: 100,
    })
  ).current;

  const springsMode = useRef(
    new SpringSimulation({
      backgroundColor: "#1a1a2e",
      entityCount: 60, // Reduced from 60
      tensioningRadius: 60,
      springConstantMin: 0.2,
      springConstantMax: 0.6,
      maxConnectionsPerEntity: 4,
      minSinks: 2, // Reduced from 3
      maxSinks: 4, // Reduced from 5
      gravitationalForce: 0.3,
      dampingFactor: 0.98,
      collisionRestitution: 0.8,
      speedLimit: 1.8, // Reduced from 2.5
      entityRadius: 8,
      lineCollisionThreshold: 12,
    })
  ).current;

  const voronoiMode = useRef(
    new LineBattleSimulation({
      backgroundColor: "#70cf9bff", // Green battlefield
      baseFiringRange: 80,
      formationSpacing: 20,
      strategyRecalculationMinInterval: 5.0,
      strategyRecalculationMaxInterval: 10.0,
      fadeOutDuration: 1.5,
      respawnDelay: 3.0,
      respawnWalkSpeed: 0.5,
      separationDistance: 20,
      separationForce: 15,
      speedLimit: 2.0,
      dampingFactor: 0.95,
      showHealthBars: false,
      team1Color: "#DC143C",
      team2Color: "#1E90FF",
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
      case "linebattle":
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
        boidSize={10}
      >
        {/* Section 1: Header with Boids Background */}
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
          <ContentTwo />
        </SimulationSection>

        {/* Section 2: Work Experience */}
        <SimulationSection
          title="Work Experience"
          simulationMode="boids"
          backgroundColor="transparent"
          onVisible={handleSectionVisible}
        ></SimulationSection>

        {/* Section 3: Projects (Springs) */}
        <SimulationSection
          title="Projects"
          simulationMode="springs"
          backgroundColor="transparent"
          onVisible={handleSectionVisible}
        >
          <div className={styles.content_container}>
            <p style={{ padding: "2rem" }}>
              <strong>Projects section</strong> - Spring simulation will go here
              once implemented.
            </p>
            {/* Add your projects content */}
          </div>
        </SimulationSection>

        {/* Section 4: Games (Line Battle) */}
        <SimulationSection
          title="Games"
          simulationMode="linebattle"
          backgroundColor="transparent"
          onVisible={handleSectionVisible}
        >
          <ContentOne />
          <div className={styles.content_container}>
            <p style={{ padding: "2rem" }}>
              <strong>Games section</strong> - Line battle simulation with
              tactical formations and strategy brains.
            </p>
            {/* Add your games content */}
          </div>
        </SimulationSection>

        {/* Section 5: Contact */}
        <SimulationSection
          title="Contact"
          simulationMode="boids"
          backgroundColor="rgba(255, 255, 255, 0.95)"
          onVisible={handleSectionVisible}
        >
          <div className={styles.content_container}>
            <p style={{ padding: "2rem" }}>
              <strong>Contact section</strong> - Contact information will go
              here.
            </p>
            {/* Add your contact content */}
          </div>
        </SimulationSection>
      </SimulationCanvas>
    </main>
  );
}
