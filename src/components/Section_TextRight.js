import { ReactTyped } from "react-typed";

export default function Section_TextRight(props) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className={"section_rect_right"}>
        <ReactTyped
          startWhenVisible
          className={"title"}
          strings={[props.title]}
          typeSpeed={10}
          showCursor={false}
        />
        <div className={"section_text_separator"}></div>
      </div>
    </div>
  );
}
