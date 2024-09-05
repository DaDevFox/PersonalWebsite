import React from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import { SetFullscreen } from "react-unity-webgl";

const rocketGameDir = "/demos/calculus-rocket-game";
const rocketGameUnityBuildName = "Build_WebGL_Opt";

export default function RocketGame() {
  var path = require("path");
  const { unityProvider, isLoaded, loadingProgression } = useUnityContext({
    loaderUrl: `${rocketGameDir}/${rocketGameUnityBuildName}.loader.js`,
    dataUrl: `${rocketGameDir}/${rocketGameUnityBuildName}.data`,
    frameworkUrl: `${rocketGameDir}/${rocketGameUnityBuildName}.framework.js`,
    codeUrl: `${rocketGameDir}/${rocketGameUnityBuildName}.wasm`,
  });

  // We'll round the loading progression to a whole number to represent the
  // percentage of the Unity Application that has loaded.
  const loadingPercentage = Math.round(loadingProgression * 100);

  return (
    <div className="container">
      {isLoaded === false && (
        // We'll conditionally render the loading overlay if the Unity
        // Application is not loaded.
        <div className="loading-overlay">
          <p>Loading... ({loadingPercentage}%)</p>
        </div>
      )}
      <Unity
        className="unity"
        unityProvider={unityProvider}
        style={{ width: "100%", height: "900px" }}
      />
    </div>
  );
}
