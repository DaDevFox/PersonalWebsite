import { ReactTyped } from "react-typed";

export default function Section_TextLeft(props) {
  return (
    <div className="section_rect_left">
      <ReactTyped
        startWhenVisible
        className="title"
        strings={[props.title]}
        typeSpeed={10}
        showCursor={false}
      />
    </div>
  );
}
