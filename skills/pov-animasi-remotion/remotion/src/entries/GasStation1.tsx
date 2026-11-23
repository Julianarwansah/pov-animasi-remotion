// Per-episode Remotion entry: LAST GAS STATION — Part 1 (stills + render hanya episode ini).
import React from "react";
import { registerRoot, Composition } from "remotion";
import { GasStation1, GAS1_FRAMES } from "../videos/gas1/Film";

const Root: React.FC = () => <Composition id="GasStation1" component={GasStation1} durationInFrames={GAS1_FRAMES} fps={30} width={1080} height={1920} />;
registerRoot(Root);
