import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';

export const RemotionRoot: React.FC = () => {
  return (
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
  );
};
