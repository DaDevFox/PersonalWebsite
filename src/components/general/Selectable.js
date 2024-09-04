import styles from "@/styles/component.module.css";
import Panel from "./Panel";

export default function Selectable(props) {
  return (
    <div className={styles.selectable}>
      <Panel>{props.children}</Panel>
    </div>
  );
}
