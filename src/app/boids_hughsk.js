import { useState, useEffect } from "react";
import Image from "next/image";

import triangle from "./triangle.png";

var envObjectThreshold = 5;

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

  for (var i = 0; i < count ?? 50; i++) {
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
}

export default function World(props) {
  const [frameTime, setFrameTime] = useState();

  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  const handleResize = () => {
    if (viewportWidth != window.innerWidth) setViewportWidth(window.innerWidth);
    if (viewportHeight != window.innerHeight)
      setViewportHeight(window.innerHeight);
  };

  useEffect(() => {
    // resize tracking
    window.addEventListener("resize", handleResize);

    // boids init
    init(
      {
        speedLimit: 2.0,
        accelerationLimit: 0.5,
        separationForce: 0.15,
        separationDistance: 200,
        cohesionForce: 0.15,
        cohesionDistance: 400,
        alignmentForce: 0.5,
        alignmentDistance: 400,
        attractors: [
          [
            window.innerWidth, // x
            window.innerHeight, // y
            150, // dist
            0.25, // spd
          ],
        ],
      },
      props.count
    );

    // frame loop init
    let frameId;
    const frame = (time) => {
      setFrameTime(time);
      update(frameTime);
      frameId = requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  const rad2deg = 180 / Math.PI;

  return (
    <div>
      {boids.map((boid, index) => {
        return index > envObjectThreshold ? (
          <Image
            src={triangle}
            width={10}
            height={10}
            style={{
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

function update(frameTime, viewportWidth, viewportHeight) {
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
    attractors = opts.attractors || [],
    attractorCount = attractors.length,
    attractor,
    distSquared,
    currPos,
    length,
    target,
    ratio,
    edgeBuffer = 10;

  while (current--) {
    if (current <= envObjectThreshold) continue; // env objects do not get simulated
    sforceX = 0;
    sforceY = 0;
    cforceX = 0;
    cforceY = 0;
    aforceX = 0;
    aforceY = 0;

    currPos = boids[current];

    // // Attractors
    // target = attractorCount;
    // while (target--) {
    //   attractor = attractors[target];
    //   spareX = currPos[0] - attractor[0];
    //   spareY = currPos[1] - attractor[1];
    //   distSquared = spareX * spareX + spareY * spareY;

    //   if (distSquared < attractor[2] * attractor[2]) {
    //     length = hypot(spareX, spareY);
    //     boids[current][SPEEDX] -= (attractor[3] * spareX) / length || 0;
    //     boids[current][SPEEDY] -= (attractor[3] * spareY) / length || 0;
    //   }
    // }

    function distance(boidA, boidB) {
      // https://stackoverflow.com/questions/4978323/how-to-calculate-distance-between-two-rectangles-context-a-game-in-lua
      var centerAX = boidA[POSITIONX] + boidA[WIDTH] / 2;
      var centerAY = boidA[POSITIONY] + boidA[HEIGHT] / 2;

      var centerBX = boidB[POSITIONX] + boidB[WIDTH] / 2;
      var centerBY = boidB[POSITIONY] + boidB[HEIGHT] / 2;

      var dx = Math.max(
        0,
        Math.abs(centerAX - centerBX) - (boidB[WIDTH] + boidA[WIDTH])
      );
      var dy = Math.max(
        0,
        Math.abs(centerAY - centerBY) - (boidB[HEIGHT] + boidA[HEIGHT])
      );

      // var dx = Math.max(
      //   boidA[POSITIONX] - boidB[POSITIONX],
      //   0,
      //   boidB[POSITIONX] - (boidA[POSITIONX] + boidA[WIDTH])
      // );
      // var dy = Math.max(
      //   boidA[POSITIONY] - boidB[POSITIONY],
      //   0,
      //   boidB[POSITIONY] - (boidA[POSITIONY] + boidA[HEIGHT])
      // );
      return dx * dx + dy * dy;
    }

    target = size;
    while (target--) {
      if (target === current) continue;
      spareX = currPos[0] - boids[target][0];
      spareY = currPos[1] - boids[target][1];
      distSquared = distance(currPos, boids[target]);

      if (distSquared < sepDist) {
        sforceX += spareX;
        sforceY += spareY;
      } else {
        if (distSquared < cohDist) {
          cforceX += spareX;
          cforceY += spareY;
        }
        if (distSquared < aliDist) {
          aforceX += boids[target][SPEEDX];
          aforceY += boids[target][SPEEDY];
        }
      }
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
    if (boids[current][POSITIONX] < 0)
      boids[current][POSITIONX] = boids[current][POSITIONX] + window.innerWidth;
    if (boids[current][POSITIONY] > window.innerHeight)
      boids[current][POSITIONY] =
        boids[current][POSITIONY] % window.innerHeight;
    if (boids[current][POSITIONY] < 0)
      boids[current][POSITIONY] =
        boids[current][POSITIONY] + window.innerHeight;
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

function run(frameTime) {
  const time = getTime();
  update(frameTime);
  requestAnimationFrame(run);
}
