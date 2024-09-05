import { useEffect, useState, useRef } from "react";

export default function SimulationSections({
  children,
  sectionRef1,
  sectionRef2,
  sectionRef3,
  sectionRef4,
}) {
  // const [backgroundColor, setBackgroundColor] = useState(
  //   sectionRef1?.current?.getAttribute("colorMain") || "#10009eb2",
  // );
  // const [{ x, y }, scrollTo] = useWindowScroll();
  // const colorswitchLead = 100;

  // useEffect(() => {
  //   if (
  //     sectionRef4 &&
  //     sectionRef4.current &&
  //     sectionRef4.current.getBoundingClientRect().top < colorswitchLead
  //   )
  //     setBackgroundColor(sectionRef4.current.getAttribute("colorMain"));
  //   else if (
  //     sectionRef3 &&
  //     sectionRef3.current &&
  //     sectionRef3.current.getBoundingClientRect().top < colorswitchLead
  //   )
  //     setBackgroundColor(sectionRef3.current.getAttribute("colorMain"));
  //   else if (
  //     sectionRef2 &&
  //     sectionRef2.current &&
  //     sectionRef2.current.getBoundingClientRect().top < colorswitchLead
  //   )
  //     setBackgroundColor(sectionRef2.current.getAttribute("colorMain"));
  //   else if (sectionRef1 && sectionRef1.current)
  //     setBackgroundColor(sectionRef1.current.getAttribute("colorMain"));
  // }, [y]);

  return (
    <div
      style={{
        position: "sticky",
        overflow: "hidden",
        backgroundColor: "#10009eb2",
        transition: "background-color 0.5s ease",
        zIndex: "5",
      }}
      className="backdrop"
    >
      {children}
    </div>
  );
}
