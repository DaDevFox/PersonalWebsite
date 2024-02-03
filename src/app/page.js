"use client";

import styles from "./page.module.css";

import logo_gh from "./GitHub_Invertocat_Dark.svg";
import logo_in from "./In-Blue-72@2x.png";

import Image from "next/image";

import World from "./boids_hughsk";

import { useState, useEffect } from "react";
import ContentOne from "./content-pane-1";
import ContentTwo from "./content-pane-2";

export default function Home() {
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
      <div className={styles.title}>Mehul Tahiliani</div>
      <div className={styles.description}>Software Developer </div>
    </div>
  );

  const Separator = (props) => (
    <div className={"section_separator"}>
      <div className={"title"}>{props.title}</div>
    </div>
  );

  return (
    <main className={styles.main}>
      {/* Nav */}
      <World count={150} />
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
      <Separator title="" />
      <ContentTwo />
      {/* <div className={styles.grid}>
        <a
          href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>
            Docs <span>-&gt;</span>
          </h2>
          <p>Find in-depth information about Next.js features and API.</p>
        </a>

        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>
            Learn <span>-&gt;</span>
          </h2>
          <p>Learn about Next.js in an interactive course with&nbsp;quizzes!</p>
        </a>

        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>
            Templates <span>-&gt;</span>
          </h2>
          <p>Explore starter templates for Next.js.</p>
        </a>

        <a
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className={styles.card}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2>
            Deploy <span>-&gt;</span>
          </h2>
          <p>
            Instantly deploy your Next.js site to a shareable URL with Vercel.
          </p>
        </a>
      </div> */}
    </main>
  );
}
