import styles from "@/styles/component.module.css";
import Panel from "./Panel";

export default function Selectable({ href, children }) {
  return (
    <div className={styles.selectable}>
      <a href={href}>
        <Panel>{children}</Panel>
      </a>
    </div>
  );
}
