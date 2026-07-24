import React from "react";
import { Composition } from "remotion";
import { DrClinicReklam, TOTAL } from "./Reklam";
import { FPS, WIDTH, HEIGHT } from "./theme";

export const Root: React.FC = () => (
  <Composition
    id="DrClinicReklam"
    component={DrClinicReklam}
    durationInFrames={TOTAL}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
