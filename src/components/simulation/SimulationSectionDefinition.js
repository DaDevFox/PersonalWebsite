import { useEffect, useState, forwardRef, useRef } from "react";

const SimulationSectionDefinition = (
  { children, colorMain, colorAccent, ...restProps },
  ref
) => (
  <div
    {...restProps}
    ref={ref}
    data-color-main={colorMain}
    data-color-accent={colorAccent}
  >
    {children}
  </div>
);

export default forwardRef(SimulationSectionDefinition);
