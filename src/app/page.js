import styles from "./page.module.css";

import logo_gh from "./GitHub_Invertocat_Dark.svg";

import Image from "next/image";

export default function Home() {
  const LogoLink = (props) => (
    <a href={props.link} className={styles.link}>
      <Image
        className={styles.link_image}
        width={props.size}
        height={props.size}
        // fill
        src={props.src}
        alt="GitHub Logo"
        unoptimized
      />
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
        <LogoLink size={50} link="https://github.com/DaDevFox" src={logo_gh} />
        {/* <a href="https://www.linkedin.com/in/mehul-tahiliani-8b03b626b/" className={styles.link}>
          LinkedIn
        </a> */}
      </div>
      <div className={styles.content_container}>
        <div className={styles.full_row}>
          <div className={styles.left_narrow}>
            <div className={styles.panel}></div>
          </div>

          <div className={styles.right_wide}>
            <div className={styles.panel}>
              <p className={styles.title}>proj title</p>
              <p className={styles.description}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                in reprehenderit in voluptate velit esse cillum dolore eu fugiat
                nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
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
