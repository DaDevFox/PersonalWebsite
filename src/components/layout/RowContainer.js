import styles from "@/styles/component.module.css";

export default function RowContainer({ children }) {
  return <div className={styles.rowContainer}>{children}</div>;
}
