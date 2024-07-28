import { useEffect, useState, useRef } from "react";

export default function SectionBackdrop(props) {
  const [backgroundColor, setBackgroundColor] = useState("");
  const [scrollPosition, setScrollPosition] = useState({
    scrollTop: 0,
    scrollLeft: 0,
  });

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleScroll = () => {
    const position = window.pageYOffset;
    setScrollPosition(position);

    console.log(position);
    console.log(backgroundColor);
    if (position > 10) {
      setBackgroundColor(props.sectionRef1.current.getAttribute("colorMain"));
    } else {
      setBackgroundColor("white");
    }
  };

  console.log(props.children);
  return (
    <div
      style={{
        overflow: "auto",
        backgroundColor: { backgroundColor },
        transition: "background-color 0.5s ease",
      }}
      onScroll={handleScroll}
      className="backdrop"
    >
      {props.children}
    </div>
  );
}
