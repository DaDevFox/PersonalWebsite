import { useEffect, useState, forwardRef, useRef } from "react";
// export default function SectionDefinition({
//   children,
//   colorMain,
//   colorAccent,
// }) {
//   const [height, setHeight] = useState(0);
//   const sizingRef = useRef(null);
//
//   useEffect(() => {
//     if (!sizingRef.current) return;
//
//     setHeight(sizingRef.current.offsetHeight);
//   }, []);
//
//   return forwardRef(output)
// }

const SectionDefinition = (props, ref) => (
  <div {...props} ref={ref}>
    {props.children}
  </div>
);
export default forwardRef(SectionDefinition);
