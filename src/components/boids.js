import { useState, useEffect, useRef } from "react";
import Image from "next/image";

import triangle from "@/media/triangle.png";

var envObjectThreshold = 1;

var envObject1 = [];

//TODO: switch to canvas implementation: https://medium.com/@pdx.lucasm/canvas-with-react-js-32e133c05258

var boids = [];
var opts,
  POSITIONX = 0,
  POSITIONY = 1,
  WIDTH = 2,
  HEIGHT = 3,
  SPEEDX = 4,
  SPEEDY = 5,
  ACCELERATIONX = 6,
  ACCELERATIONY = 7;

function init(options, count) {
  opts = options;

  for (var i = 0; i < count; i++)
    boids[i] = [
      Math.random() * window.innerWidth,
      Math.random() * window.innerHeight, // position
      10,
      10, // size
      0,
      0, // speed
      0,
      0, // acceleration
    ];
}

export default function Boids(props) {
  // const [mousePosition, setMousePosition] = useState({ x: null, y: null });

  const [frameTime, setFrameTime] = useState();

  const [simulationWidth, setSimulationWidth] = useState(0);
  // const [simulationHeight, setSimulationHeight] = useState(0);

  const simulationHeightRef = useRef(0);
  const mousePositionRef = useRef({ x: null, y: null });

  simulationHeightRef.current = props.height;

  const handleResize = () => {
    if (simulationWidth != window.innerWidth)
      setSimulationWidth(window.innerWidth);

    var body = document.body,
      html = document.documentElement;

    // var height = Math.max(
    //   window.innerHeight,
    //   body.offsetHeight,
    //   html.clientHeight,
    //   html.offsetHeight,
    //   window.document.body.offsetHeight
    // );

    // if (props.height != undefined) height = props.height;

    // if (simulationHeight != height) setSimulationHeight(height);
  };

  useEffect(() => {
    // resize tracking
    window.addEventListener("resize", handleResize);
    handleResize();

    // boids init
    init(
      {
        speedLimit: 1.0,
        accelerationLimit: 0.5,
        separationForce: 50,
        separationDistance: 400,
        cohesionForce: 30,
        cohesionDistance: 800,
        alignmentForce: 40,
        alignmentDistance: 800,
      },
      props.count,
    );

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    // frame loop init
    let frameId;
    const frame = (time) => {
      setFrameTime(time);
      update(
        frameTime,
        mousePositionRef.current,
        window.innerWidth,
        simulationHeightRef.current,
      );
      frameId = requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    const updateMousePosition = (ev) => {
      mousePositionRef.current = {
        x: ev.clientX - ev.target.offsetLeft,
        y: ev.clientY - ev.target.offsetTop,
      };
    };
    document.onmousemove = updateMousePosition;
    // window.addEventListener("mousemove", updateMousePosition);
    return () => {
      // window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);

  try {
    envObject1 = [
      props.envObject1X,
      props.envObject1Y,
      props.envObject1Width,
      props.envObject1Height,
      0,
      0,
      0,
      0,
    ];
  } catch (ex) {}

  const rad2deg = 180 / Math.PI;

  return (
    <div
      className="boids_container"
      style={{ height: simulationHeightRef.current }}
    >
      {boids.map((boid, index) => {
        return index > envObjectThreshold ? (
          <Image
            src={triangle}
            width={props.boid_size}
            height={props.boid_size}
            style={{
              opacity:
                100 *
                  (boid[ACCELERATIONX] * boid[ACCELERATIONX] +
                    boid[ACCELERATIONY] * boid[ACCELERATIONY]) +
                "%",
              position: "absolute",
              left: boid[0] + "px",
              top: boid[1] + "px",
              transform:
                "rotate(" +
                Math.atan2(boid[SPEEDY], boid[SPEEDX]) * rad2deg +
                "deg)",
            }}
            className="boid"
          />
        ) : (
          ""
        );
      })}
    </div>
  );
}

function distance(boidA, boidB) {
  var dx = boidA[POSITIONX] - boidB[POSITIONX];
  var dy = boidA[POSITIONY] - boidB[POSITIONY];

  return dx * dx + dy * dy;

  // // https://stackoverflow.com/questions/4978323/how-to-calculate-distance-between-two-rectangles-context-a-game-in-lua
  // var centerAX = boidA[POSITIONX] + boidA[WIDTH] / 2;
  // var centerAY = boidA[POSITIONY] + boidA[HEIGHT] / 2;

  // var centerBX = boidB[POSITIONX] + boidB[WIDTH] / 2;
  // var centerBY = boidB[POSITIONY] + boidB[HEIGHT] / 2;

  // var closestPointX = Math.max(
  //   boidB[POSITIONX],
  //   Math.min(boidA[POSITIONX], boidB[POSITIONX] + boidB[WIDTH])
  // );

  // var closestPointY = Math.max(
  //   boidB[POSITIONY],
  //   Math.min(boidA[POSITIONY], boidB[POSITIONX] + boidB[WIDTH])
  // );

  // var dx = boidA[POSITIONX] - closestPointX;
  // var dy = boidA[POSITIONY] - closestPointY;

  // return dx * dx + dy * dy;
}

function update(frameTime, mousePosition, simulationWidth, simulationHeight) {
  //https://github.com/hughsk/boids/blob/master/index.js
  var sepDist = Math.pow(opts.separationDistance || 60, 2),
    sepForce = opts.separationForce || 0.15,
    cohDist = Math.pow(opts.cohesionDistance || 250, 2),
    cohForce = opts.cohesionForce || 0.25,
    aliDist = Math.pow(opts.alignmentDistance || 250, 2),
    aliForce = opts.alignmentForce || opts.alignment || 1.0,
    speedLimitRoot = opts.speedLimit || 0,
    speedLimit = Math.pow(speedLimitRoot, 2),
    accelerationLimit = Math.pow(accelerationLimitRoot, 2),
    accelerationLimitRoot = opts.accelerationLimit || 1,
    size = boids.length,
    current = size,
    sforceX,
    sforceY,
    cforceX,
    cforceY,
    aforceX,
    aforceY,
    spareX,
    spareY,
    distSquared,
    currPos,
    length,
    target,
    ratio,
    edgeBuffer = 10;
  boids[0] = envObject1;
  // console.log(boids[0]);

  while (current--) {
    if (current <= envObjectThreshold) continue; // env objects do not get simulated
    sforceX = 0;
    sforceY = 0;
    cforceX = 0;
    cforceY = 0;
    aforceX = 0;
    aforceY = 0;

    currPos = boids[current];

    target = size;
    while (target--) {
      if (target === current) continue;
      spareX = currPos[0] - boids[target][0];
      spareY = currPos[1] - boids[target][1];
      distSquared = distance(currPos, boids[target]);

      if (distSquared < sepDist * sepDist) {
        sforceX += spareX;
        sforceY += spareY;
      } else {
        if (distSquared < cohDist * cohDist) {
          cforceX += spareX;
          cforceY += spareY;
        }
        if (distSquared < aliDist * aliDist) {
          aforceX += boids[target][SPEEDX];
          aforceY += boids[target][SPEEDY];
        }
      }
    }

    // Separation from Mouse

    if (mousePosition != null) {
      var m_spareX = currPos[0] - mousePosition.x;
      var m_spareY = currPos[1] - mousePosition.y;
      distSquared = m_spareX * m_spareX + m_spareY * m_spareY;

      var m_sepDist = 40;
      var m_sforceX = 0;
      var m_sforceY = 0;
      var m_sepForce = 1000;
      if (distSquared < m_sepDist * m_sepDist) {
        console.log("repulsing: " + mousePosition.x + ", " + mousePosition.y);
        m_sforceX += m_spareX;
        m_sforceY += m_spareY;
      }

      length = hypot(m_sforceX, m_sforceY);
      boids[current][ACCELERATIONX] += (m_sepForce * m_sforceX) / length || 0;
      boids[current][ACCELERATIONY] += (m_sepForce * m_sforceY) / length || 0;
    }
    // Separation
    length = hypot(sforceX, sforceY);
    boids[current][ACCELERATIONX] += (sepForce * sforceX) / length || 0;
    boids[current][ACCELERATIONY] += (sepForce * sforceY) / length || 0;
    // Cohesion
    length = hypot(cforceX, cforceY);
    boids[current][ACCELERATIONX] -= (cohForce * cforceX) / length || 0;
    boids[current][ACCELERATIONY] -= (cohForce * cforceY) / length || 0;
    // Alignment
    length = hypot(aforceX, aforceY);
    boids[current][ACCELERATIONX] -= (aliForce * aforceX) / length || 0;
    boids[current][ACCELERATIONY] -= (aliForce * aforceY) / length || 0;
  }
  current = size;

  while (current--) {
    if (accelerationLimit) {
      distSquared =
        boids[current][ACCELERATIONX] * boids[current][ACCELERATIONX] +
        boids[current][ACCELERATIONY] * boids[current][ACCELERATIONY];
      if (distSquared > accelerationLimit) {
        ratio =
          accelerationLimitRoot /
          hypot(boids[current][ACCELERATIONX], boids[current][ACCELERATIONY]);
        boids[current][ACCELERATIONX] *= ratio;
        boids[current][ACCELERATIONY] *= ratio;
      }
    }

    boids[current][SPEEDX] += boids[current][ACCELERATIONX];
    boids[current][SPEEDY] += boids[current][ACCELERATIONY];

    if (speedLimit) {
      distSquared =
        boids[current][SPEEDX] * boids[current][SPEEDX] +
        boids[current][SPEEDY] * boids[current][SPEEDY];
      if (distSquared > speedLimit) {
        ratio =
          speedLimitRoot /
          hypot(boids[current][SPEEDX], boids[current][SPEEDY]);
        boids[current][SPEEDX] *= ratio;
        boids[current][SPEEDY] *= ratio;
      }
    }

    boids[current][POSITIONX] += boids[current][SPEEDX];
    boids[current][POSITIONY] += boids[current][SPEEDY];

    if (boids[current][POSITIONX] > window.innerWidth)
      boids[current][POSITIONX] = boids[current][POSITIONX] % window.innerWidth;
    if (boids[current][POSITIONX] < -edgeBuffer)
      boids[current][POSITIONX] = boids[current][POSITIONX] + window.innerWidth;
    if (boids[current][POSITIONY] > simulationHeight)
      boids[current][POSITIONY] = boids[current][POSITIONY] % simulationHeight;
    if (boids[current][POSITIONY] < -edgeBuffer)
      boids[current][POSITIONY] = boids[current][POSITIONY] + simulationHeight;
  }
}

function hypot(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  var lo = Math.min(a, b);
  var hi = Math.max(a, b);
  return (
    hi +
    (3 * lo) / 32 +
    Math.max(0, 2 * lo - hi) / 8 +
    Math.max(0, 4 * lo - hi) / 16
  );
}
