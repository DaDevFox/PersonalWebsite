import { ReactTyped } from "react-typed";
import styles from "@/styles/component.module.css";

export default function SectionTitle({ title, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className={styles.sectionTitle}>
        <h1 className={styles.title} style={{ fontSize: "2rem" }}>
          <ReactTyped
            startWhenVisible
            className="title"
            strings={[title]}
            typeSpeed={10}
            showCursor={false}
          />
          {children}
        </h1>
      </div>
    </div>
  );
}
