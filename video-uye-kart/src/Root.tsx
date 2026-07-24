import React from "react";
import { Composition } from "remotion";
import { UyeKartTanitim, TOTAL } from "./Video";
import { FPS, WIDTH, HEIGHT } from "./theme";

export const Root: React.FC = () => {
  return (
    <Composition
      id="UyeKartTanitim"
      component={UyeKartTanitim}
      durationInFrames={TOTAL}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
