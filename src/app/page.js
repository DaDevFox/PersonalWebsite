"use client";

import boid_styles from "../components/boids.module.css";
import styles from "@/styles/page.module.css";

import logo_gh from "@/media/GitHub_Invertocat_Dark.svg";
import logo_in from "@/media/In-Blue-72@2x.png";

import { createRef, forwardRef, useState, useRef, useEffect } from "react";

import Image from "next/image";
import Boids from "../components/boids";
import ContentOne from "./content-pane-1";
import ContentTwo from "./content-pane-2";
import SectionDefinition from "@/components/SectionDefinition";
import SectionBackdrop from "@/components/SectionBackdrop";

export default function Home() {
  const titleTextObjRef = useRef(null);

  const [titleWidth, setTitleWidth] = useState(0);
  const [titleHeight, setTitleHeight] = useState(0);
  const [titleX, setTitleX] = useState(0);
  const [titleY, setTitleY] = useState(0);

  const updateRefs = () => {
    setTitleWidth(titleTextObjRef.current.offsetWidth);
    setTitleHeight(titleTextObjRef.current.offsetHeight);
    setTitleX(titleTextObjRef.current.offsetLeft);
    setTitleY(titleTextObjRef.current.offsetTop);
  };

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

  useEffect(() => {
    updateRefs();
    window.addEventListener("resize", updateRefs);
  }, []);

  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);
  const section4Ref = useRef(null);

  return (
    <main className={styles.main}>
      <SectionBackdrop sectionRef1={section1Ref}>
        {/* Nav */}
        <SectionDefinition ref={section1Ref} colorMain={"#10009eb2"}>
          <Boids
            boid_size={10}
            count={100}
            envObject1Width={titleWidth}
            envObject1Height={titleHeight}
            envObject1X={titleX}
            envObject1Y={titleY}
          >
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
              /> */}{" "}
            </div>{" "}
            <ContentTwo />
            <Separator title="" />
          </Boids>
          <ContentOne />
        </SectionDefinition>
        {/* <SectionDefinition ref={section2Ref} colorMain={"#4c67fd"}> */}
        {/* </SectionDefinition> */}
      </SectionBackdrop>
    </main>
  );
}
