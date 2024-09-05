import styles from "@/styles/component.module.css";

import Panel from "./Panel";

export default function LeftPanel({ wide, children }) {
  return (
    <div className={wide ? styles.leftPanelWide : styles.leftPanelNarrow}>
      <Panel>{children}</Panel>
    </div>
  );
}
