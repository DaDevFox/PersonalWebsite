// import { useState, useEffect } from "react";

// var boids = [];
// var opts,
//   POSITIONX = 0,
//   POSITIONY = 1,
//   SPEEDX = 2,
//   SPEEDY = 3,
//   ACCELERATIONX = 4,
//   ACCELERATIONY = 5;

// function init(options, count) {
//   opts = options;

//   for (var i = 0; i < count ?? 50; i++) {
//     boids[i] = [
//       Math.random() * window.innerWidth,
//       Math.random() * window.innerHeight, // position
//       0,
//       0, // speed
//       0,
//       0, // acceleration
//     ];
//   }
// }

// export default function World(props) {
//   const [frameTime, setFrameTime] = useState();

//   const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
//   const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

//   const handleResize = () => {
//     if (viewportWidth != window.innerWidth) setViewportWidth(window.innerWidth);
//     if (viewportHeight != window.innerHeight)
//       setViewportHeight(window.innerHeight);
//   };

//   useEffect(() => {
//     // resize tracking
//     window.addEventListener("resize", handleResize);

//     // boids init
//     init(
//       {
//         boids: 150,
//         speedLimit: 2,
//         accelerationLimit: 0.5,
//         attractors: [
//           [
//             window.innerWidth, // x
//             window.innerHeight, // y
//             150, // dist
//             0.25, // spd
//           ],
//         ],
//       },
//       props.count
//     );

//     // frame loop init
//     let frameId;
//     const frame = (time) => {
//       setFrameTime(time);
//       update(frameTime);
//       frameId = requestAnimationFrame(frame);
//     };
//     requestAnimationFrame(frame);
//     return () => {
//       window.removeEventListener("resize", handleResize);
//       cancelAnimationFrame(frameId);
//     };
//   }, []);

//   const html = <div></div>;

//   return (
//     <div>
//       {boids.map((boid) => {
//         return (
//           <div
//             style={{
//               backgroundColor: "black",
//               width: "10px",
//               height: "10px",
//               position: "absolute",
//               left: boid[0] + "px",
//               top: boid[1] + "px",
//             }}
//             className="boid"
//           ></div>
//         );
//       })}
//     </div>
//   );
// }

// function update(frameTime, viewportWidth, viewportHeight) {
//   //https://github.com/hughsk/boids/blob/master/index.js
//   var sepDist = Math.pow(opts.separationDistance || 60, 2),
//     sepForce = opts.separationForce || 0.15,
//     cohDist = Math.pow(opts.cohesionDistance || 180, 2),
//     cohForce = opts.cohesionForce || 0.1,
//     aliDist = Math.pow(opts.alignmentDistance || 180, 2),
//     aliForce = opts.alignmentForce || opts.alignment || 0.25,
//     speedLimitRoot = opts.speedLimit || 0,
//     speedLimit = Math.pow(speedLimitRoot, 2),
//     accelerationLimit = Math.pow(accelerationLimitRoot, 2),
//     accelerationLimitRoot = opts.accelerationLimit || 1,
//     size = boids.length,
//     current = size,
//     sforceX,
//     sforceY,
//     cforceX,
//     cforceY,
//     aforceX,
//     aforceY,
//     spareX,
//     spareY,
//     attractors = opts.attractors || [],
//     attractorCount = attractors.length,
//     attractor,
//     distSquared,
//     currPos,
//     length,
//     target,
//     ratio,
//     edgeBuffer = 10;

//   while (current--) {
//     sforceX = 0;
//     sforceY = 0;
//     cforceX = 0;
//     cforceY = 0;
//     aforceX = 0;
//     aforceY = 0;

//     currPos = boids[current];

//     // Attractors
//     target = attractorCount;
//     while (target--) {
//       attractor = attractors[target];
//       spareX = currPos[0] - attractor[0];
//       spareY = currPos[1] - attractor[1];
//       distSquared = spareX * spareX + spareY * spareY;

//       if (distSquared < attractor[2] * attractor[2]) {
//         length = hypot(spareX, spareY);
//         boids[current][SPEEDX] -= (attractor[3] * spareX) / length || 0;
//         boids[current][SPEEDY] -= (attractor[3] * spareY) / length || 0;
//       }
//     }

//     target = size;
//     while (target--) {
//       if (target === current) continue;
//       spareX = currPos[0] - boids[target][0];
//       spareY = currPos[1] - boids[target][1];
//       distSquared = spareX * spareX + spareY * spareY;

//       if (distSquared < sepDist) {
//         sforceX += spareX;
//         sforceY += spareY;
//       } else {
//         if (distSquared < cohDist) {
//           cforceX += spareX;
//           cforceY += spareY;
//         }
//         if (distSquared < aliDist) {
//           aforceX += boids[target][SPEEDX];
//           aforceY += boids[target][SPEEDY];
//         }
//       }
//     }

//     // Separation
//     length = hypot(sforceX, sforceY);
//     boids[current][ACCELERATIONX] += (sepForce * sforceX) / length || 0;
//     boids[current][ACCELERATIONY] += (sepForce * sforceY) / length || 0;
//     // Cohesion
//     length = hypot(cforceX, cforceY);
//     boids[current][ACCELERATIONX] -= (cohForce * cforceX) / length || 0;
//     boids[current][ACCELERATIONY] -= (cohForce * cforceY) / length || 0;
//     // Alignment
//     length = hypot(aforceX, aforceY);
//     boids[current][ACCELERATIONX] -= (aliForce * aforceX) / length || 0;
//     boids[current][ACCELERATIONY] -= (aliForce * aforceY) / length || 0;
//   }
//   current = size;

//   while (current--) {
//     if (accelerationLimit) {
//       distSquared =
//         boids[current][ACCELERATIONX] * boids[current][ACCELERATIONX] +
//         boids[current][ACCELERATIONY] * boids[current][ACCELERATIONY];
//       if (distSquared > accelerationLimit) {
//         ratio =
//           accelerationLimitRoot /
//           hypot(boids[current][ACCELERATIONX], boids[current][ACCELERATIONY]);
//         boids[current][ACCELERATIONX] *= ratio;
//         boids[current][ACCELERATIONY] *= ratio;
//       }
//     }

//     boids[current][SPEEDX] += boids[current][ACCELERATIONX];
//     boids[current][SPEEDY] += boids[current][ACCELERATIONY];

//     if (speedLimit) {
//       distSquared =
//         boids[current][SPEEDX] * boids[current][SPEEDX] +
//         boids[current][SPEEDY] * boids[current][SPEEDY];
//       if (distSquared > speedLimit) {
//         ratio =
//           speedLimitRoot /
//           hypot(boids[current][SPEEDX], boids[current][SPEEDY]);
//         boids[current][SPEEDX] *= ratio;
//         boids[current][SPEEDY] *= ratio;
//       }
//     }

//     boids[current][POSITIONX] += boids[current][SPEEDX];
//     boids[current][POSITIONY] += boids[current][SPEEDY];
//   }
// }

// function hypot(a, b) {
//   a = Math.abs(a);
//   b = Math.abs(b);
//   var lo = Math.min(a, b);
//   var hi = Math.max(a, b);
//   return (
//     hi +
//     (3 * lo) / 32 +
//     Math.max(0, 2 * lo - hi) / 8 +
//     Math.max(0, 4 * lo - hi) / 16
//   );
// }

// function run(frameTime) {
//   const time = getTime();
//   update(frameTime);
//   requestAnimationFrame(run);
// }
