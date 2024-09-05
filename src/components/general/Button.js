import styles from "@/styles/component.module.css";

export default function Button({ onClick, children }) {
  return (
    <button className={styles.button} onClick={onClick}>
      {children}
    </button>
  );
}
