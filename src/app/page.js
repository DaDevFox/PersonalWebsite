import styles from "./page.module.css";

import { ReactComponent as Logo } from "./GitHub_Invertocat_Dark.svg";

import Image from "next/image";

export default function Home() {
  const LogoLink = (props) => (
    <a href={props.link} className={styles.link}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={props.fill}
        className={styles.link_image}
        viewbox={props.viewbox}
        stroke="currentColor"
        strokeWidth={2}
        width={props.size}
        height={props.size}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={props.d} />
      </svg>
    </a>
  );

  return (
    <main className={styles.main}>
      Nav
      <div className={styles.header_rect}>
        <div className={styles.title}>Mehul Tahiliani</div>
        <div className={styles.description}>description text</div>
      </div>
      <div className={styles.links}>
        <LogoLink
          link="https://github.com/DaDevFox"
          fill="black"
          size={120}
          viewbox="0 0 97.6 96"
          d="M48.9,0C21.8,0,0,22,0,49.2C0,71,14,89.4,33.4,95.9c2.4,0.5,3.3-1.1,3.3-2.4c0-1.1-0.1-5.1-0.1-9.1
          c-13.6,2.9-16.4-5.9-16.4-5.9c-2.2-5.7-5.4-7.2-5.4-7.2c-4.4-3,0.3-3,0.3-3c4.9,0.3,7.5,5.1,7.5,5.1c4.4,7.5,11.4,5.4,14.2,4.1
          c0.4-3.2,1.7-5.4,3.1-6.6c-10.8-1.1-22.2-5.4-22.2-24.3c0-5.4,1.9-9.8,5-13.2c-0.5-1.2-2.2-6.3,0.5-13c0,0,4.1-1.3,13.4,5.1
          c3.9-1.1,8.1-1.6,12.2-1.6s8.3,0.6,12.2,1.6c9.3-6.4,13.4-5.1,13.4-5.1c2.7,6.8,1,11.8,0.5,13c3.2,3.4,5,7.8,5,13.2
          c0,18.9-11.4,23.1-22.3,24.3c1.8,1.5,3.3,4.5,3.3,9.1c0,6.6-0.1,11.9-0.1,13.5c0,1.3,0.9,2.9,3.3,2.4C83.6,89.4,97.6,71,97.6,49.2
          C97.7,22,75.8,0,48.9,0z"
        />
        {/* <a href="https://www.linkedin.com/in/mehul-tahiliani-8b03b626b/" className={styles.link}>
          LinkedIn
        </a> */}
      </div>
      <div className={styles.content_container}>
        <div className={styles.full_row}>
          <div className={styles.left_wide}>
            <div className={styles.panel}></div>
          </div>

          <div className={styles.right_wide}>
            <div className={styles.panel}>
              <p className={styles.title}>proj title</p>
              <p className={styles.description}>proj description</p>
            </div>
          </div>
        </div>
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
