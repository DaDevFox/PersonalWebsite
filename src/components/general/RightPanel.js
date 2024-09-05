import styles from "@/styles/component.module.css";

import Panel from "./Panel";

export default function RightPanel({ wide, children }) {
  return (
    <div className={wide ? styles.rightPanelWide : styles.rightPanelNarrow}>
      <Panel>{children}</Panel>
    </div>
  );
}
