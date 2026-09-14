import React from 'react';
import {Composition} from 'remotion';
import {FlowPilotAdFinal} from './FlowPilotAdFinal';
import {FlowPilotPromo} from './FlowPilotPromo';
import {Reel} from './Reel';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FlowPilotAdFinal"
        component={FlowPilotAdFinal}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="FlowPilotPromo"
        component={FlowPilotPromo}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="Reel"
        component={Reel}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'FlowPilot AI',
          subtitle: 'Automatyzuj obsługę klientów i odzyskaj czas',
          cta: 'Zobacz, jak to działa',
        }}
      />
    </>
  );
};
