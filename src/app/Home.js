"use client";
import styles from "./page.module.css";
import logo_gh from "./GitHub_Invertocat_Dark.svg";
import Image from "next/image";
import Section_TextRight from "./Section_TextRight";
import Row_ImageLeft from "./Row_ImageLeft";
import ContentOne from "./content-pane-1";

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
    <div className={styles.section_separator}>
      <div className={styles.title}>{props.title}</div>
    </div>
  );
  const Row_ImageRight = (props) => (
    <div className={styles.full_row}>
      <div className={styles.left_wide}>
        <div className={styles.panel}>
          <p className={styles.title}>{props.title}</p> <p> </p>
          {/* <ReactTyped
              startWhenVisible
              className={styles.title}
              strings={[props.title]}
              showCursor={false}
            /> */}
          <p className={styles.description}>{props.description}</p>
        </div>
      </div>
      <div className={styles.right_narrow}>
        <div className={styles.panel}>
          <Image
            width={props.image_size}
            height={props.image_size}
            src={props.image_src}
            alt={props.image_alt}
            unoptimized // for now; followup on payment req
          />
        </div>
      </div>
    </div>
  );

  return (
    <main className={styles.main}>
      Nav
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
      <div className={styles.content_container}>
        <Section_TextRight title="Contact" />
        <Row_ImageLeft
          image_size={100}
          image_alt="GitHub Logo"
          image_src={logo_gh}
          title="proj title"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum."
        />
        <Row_ImageRight
          iamge_size={100}
          image_alt="GitHub Logo"
          image_src={logo_gh}
          title="proj title"
          description="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
          enim ad minim veniam, quis nostrud exercitation ullamco laboris
          nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
          in reprehenderit in voluptate velit esse cillum dolore eu fugiat
          nulla pariatur. Excepteur sint occaecat cupidatat non proident,
          sunt in culpa qui officia deserunt mollit anim id est laborum."
        />
      </div>
      <div className={styles.grid}>
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
      </div>
    </main>
  );
}
