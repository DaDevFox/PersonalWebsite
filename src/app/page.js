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
import VoronoiSimulation from "@/simulation/modes/VoronoiSimulation";

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
    new VoronoiSimulation({
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
          backgroundColor="rgba(255, 255, 255, 0.95)"
          onVisible={handleSectionVisible}
        >
          <ContentOne />
        </SimulationSection>

        {/* Section 3: Projects (Springs - TODO: implement) */}
        <SimulationSection
          title="Projects"
          simulationMode="springs"
          backgroundColor="rgba(255, 255, 255, 0.95)"
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

        {/* Section 4: Games (Voronoi - TODO: implement) */}
        <SimulationSection
          title="Games"
          simulationMode="voronoi"
          backgroundColor="rgba(255, 255, 255, 0.95)"
          onVisible={handleSectionVisible}
        >
          <div className={styles.content_container}>
            <p style={{ padding: "2rem" }}>
              <strong>Games section</strong> - Voronoi world simulation will go
              here once implemented.
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
