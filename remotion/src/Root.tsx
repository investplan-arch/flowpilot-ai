import React from 'react';
import {AbsoluteFill, Composition, interpolate, useCurrentFrame} from 'remotion';
import {FlowPilotAdFinal} from './FlowPilotAdFinal';
import {FlowPilotExplainerMarketing} from './FlowPilotExplainerMarketing';
import {FlowPilotPromo} from './FlowPilotPromo';
import {Reel} from './Reel';

const FONT = 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';

const syncedCaptions = [
  {from: 11, to: 55, text: 'Klient napisał właśnie teraz.'},
  {from: 80, to: 114, text: 'Ty odpiszesz za godzinę?'},
  {from: 131, to: 186, text: 'W tym czasie może już kupić u konkurencji.'},
  {from: 204, to: 277, text: 'FlowPilot czyta wiadomość i przygotowuje odpowiedź.'},
  {from: 292, to: 313, text: 'Ty sprawdzasz.'},
  {from: 327, to: 347, text: 'Zatwierdzasz.'},
  {from: 356, to: 370, text: 'Gotowe.'},
  {from: 375, to: 404, text: 'Szybciej odpowiadasz.'},
  {from: 407, to: 439, text: 'Mniej leadów przepada.'},
  {from: 458, to: 487, text: 'Chcesz zobaczyć demo?'},
  {from: 492, to: 511, text: 'Napisz: FLOW.'},
];

const CaptionRepair: React.FC<{frame: number}> = ({frame}) => {
  const current = syncedCaptions.find((item) => frame >= item.from && frame < item.to);
  const lightScene = (frame >= 118 && frame < 413) || frame >= 538;
  const background = lightScene ? '#f3f4f7' : '#090b10';

  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 160, height: 118, background, zIndex: 120}} />
      {current ? (
        <div style={{position: 'absolute', left: 62, right: 62, bottom: 192, display: 'flex', justifyContent: 'center', zIndex: 130}}>
          <div style={{padding: '12px 18px', borderRadius: 13, background: 'rgba(9,11,16,.94)', color: '#fff', fontFamily: FONT, fontSize: 28, lineHeight: 1.15, fontWeight: 800, letterSpacing: -0.6, textAlign: 'center', boxShadow: '0 10px 35px rgba(0,0,0,.14)'}}>{current.text}</div>
        </div>
      ) : null}
    </>
  );
};

const TransitionRepair: React.FC<{frame: number}> = ({frame}) => {
  if (frame >= 110 && frame < 118) {
    return <AbsoluteFill style={{zIndex: 220, background: 'linear-gradient(135deg,#11141d 0%,#335cff 100%)'}} />;
  }

  if (frame >= 405 && frame < 413) {
    const p = interpolate(frame, [405, 409, 413], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return (
      <AbsoluteFill style={{zIndex: 220, background: '#090b10', color: '#fff', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontSize: 112, fontWeight: 950, letterSpacing: -7, opacity: p}}>GOTOWE.</div>
      </AbsoluteFill>
    );
  }

  if (frame >= 530 && frame < 538) {
    return <AbsoluteFill style={{zIndex: 220, background: '#090b10'}} />;
  }

  return null;
};

const FinalAdWrapper: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <FlowPilotAdFinal />
      <CaptionRepair frame={frame} />
      <TransitionRepair frame={frame} />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="FlowPilotAdFinal" component={FinalAdWrapper} durationInFrames={660} fps={30} width={1080} height={1920} />
      <Composition id="FlowPilotExplainer" component={FlowPilotExplainerMarketing} durationInFrames={1140} fps={30} width={1080} height={1920} />
      <Composition id="FlowPilotPromo" component={FlowPilotPromo} durationInFrames={450} fps={30} width={1080} height={1920} />
      <Composition id="Reel" component={Reel} durationInFrames={450} fps={30} width={1080} height={1920} defaultProps={{title: 'FlowPilot AI', subtitle: 'Automatyzuj obsługę klientów i odzyskaj czas', cta: 'Zobacz, jak to działa'}} />
    </>
  );
};
