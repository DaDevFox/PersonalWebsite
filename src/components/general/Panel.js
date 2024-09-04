import styles from "@/styles/component.module.css";

export default function Panel(props) {
  return <div className={styles.panel}>{props.children}</div>;
}
