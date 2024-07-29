import { useEffect, useState, useRef } from "react";
import { useWindowScroll } from "@uidotdev/usehooks";

export default function SectionBackdrop({
  children,
  sectionRef1,
  sectionRef2,
  sectionRef3,
  sectionRef4,
}) {
  const [backgroundColor, setBackgroundColor] = useState("white");
  const [{ x, y }, scrollTo] = useWindowScroll();
  const colorswitchLead = 200;

  useEffect(() => {
    console.log(sectionRef2.current.getBoundingClientRect().top);

    if (
      sectionRef4 &&
      sectionRef4.current &&
      sectionRef4.current.getBoundingClientRect().top < colorswitchLead
    )
      setBackgroundColor(sectionRef4.current.getAttribute("colorMain"));
    else if (
      sectionRef3 &&
      sectionRef3.current &&
      sectionRef3.current.getBoundingClientRect().top < colorswitchLead
    )
      setBackgroundColor(sectionRef3.current.getAttribute("colorMain"));
    else if (
      sectionRef2 &&
      sectionRef2.current &&
      sectionRef2.current.getBoundingClientRect().top < colorswitchLead
    )
      setBackgroundColor(sectionRef2.current.getAttribute("colorMain"));
    else if (sectionRef1 && sectionRef1.current)
      setBackgroundColor(sectionRef1.current.getAttribute("colorMain"));
  }, [y]);

  const handleScroll = () => {};

  console.log(children);
  return (
    <div
      style={{
        overflow: "auto",
        backgroundColor: backgroundColor,
        transition: "background-color 0.5s ease",
      }}
      className="backdrop"
    >
      {children}
    </div>
  );
}
