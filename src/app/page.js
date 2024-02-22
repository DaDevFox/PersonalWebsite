"use client";

import styles from "./page.module.css";

import logo_gh from "./GitHub_Invertocat_Dark.svg";
import logo_in from "./In-Blue-72@2x.png";

import { forwardRef, useState, useRef, useEffect } from "react";

import Image from "next/image";
import Boids from "./boids";
import ContentOne from "./content-pane-1";
import ContentTwo from "./content-pane-2";

import Head from "next/head";

export default function Home() {
  const titleTextObjRef = useRef(null);
  const finalBoidElementRef = useRef(null);

  const [titleWidth, setTitleWidth] = useState(0);
  const [titleHeight, setTitleHeight] = useState(0);
  const [titleX, setTitleX] = useState(0);
  const [titleY, setTitleY] = useState(0);

  const [boidAreaHeight, setBoidAreaHeight] = useState();

  const updateRefs = () => {
    // if (finalBoidElementRef.current != null)

    setBoidAreaHeight(
      finalBoidElementRef.current.offsetTop +
        finalBoidElementRef.current.offsetHeight
    );

    setTitleWidth(titleTextObjRef.current.offsetWidth);
    setTitleHeight(titleTextObjRef.current.offsetHeight);
    setTitleX(titleTextObjRef.current.offsetLeft);
    setTitleY(titleTextObjRef.current.offsetTop);
  };

  useEffect(() => {
    updateRefs();
    window.addEventListener("resize", updateRefs);
  }, []);

  const LogoLink = (props) => (
    <a href={props.link} className={styles.link}>
      <Image
        className={
          props.roundedCorners ? styles.link_image : styles.link_image_unrounded
        }
        width={props.size}
        height={props.size}
        // fill
        src={props.src}
        alt={props.alt}
        unoptimized
      />
    </a>
  );

  const Header = (props) => (
    <div className={styles.header_rect}>
      <div ref={titleTextObjRef} className={styles.title}>
        Mehul Tahiliani
      </div>
      <div className={styles.description}>Software Developer </div>
    </div>
  );

  const Separator = forwardRef((props, ref) => (
    <div ref={ref} className={"section_separator"}>
      <div className={"title"}>{props.title}</div>
    </div>
  ));

  return (
    <main className={styles.main}>
      {/* Nav */}
      <Boids
        boid_size={10}
        count={100}
        envObject1Width={titleWidth}
        envObject1Height={titleHeight}
        envObject1X={titleX}
        envObject1Y={titleY}
        height={boidAreaHeight}
      />
      <Header />
      <div className={styles.links}>
        <LogoLink
          roundedCorners={true}
          size={30}
          link="https://github.com/DaDevFox"
          src={logo_gh}
        />
        {/* <LogoLink size={30} link="https://github.com/DaDevFox" src={logo_in} /> */}
        {/* <LogoLink
          size={50}
          link="https://www.linkedin.com/in/mehul-tahiliani-8b03b626b/"
          src={logo_in}
        /> */}
      </div>
      <ContentOne />
      <Separator title="" ref={finalBoidElementRef} />
      <ContentTwo />
    </main>
  );
}
