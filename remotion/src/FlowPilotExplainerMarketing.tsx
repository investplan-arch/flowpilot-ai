import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FlowPilotExplainer} from './FlowPilotExplainer';

const CTA_AUDIO =
  'https://storage.googleapis.com/adm--audio-playback--7d--public/mcp-preview/0276a6e4-340e-490c-91af-e2705a09d277.mp3';

const CTA_START = 700;

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const MarketingClose: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame - CTA_START;
  if (local < 0) return null;

  const intro = spring({
    frame: local,
    fps,
    config: {damping: 18, stiffness: 150, mass: 0.8},
  });
  const button = spring({
    frame: Math.max(0, local - 58),
    fps,
    config: {damping: 16, stiffness: 180, mass: 0.72},
  });
  const footer = spring({
    frame: Math.max(0, local - 108),
    fps,
    config: {damping: 18, stiffness: 165, mass: 0.8},
  });
  const pulse = 1 + 0.018 * Math.sin(local / 9);

  return (
    <AbsoluteFill
      style={{
        zIndex: 300,
        background:
          'radial-gradient(circle at 78% 8%, rgba(79,106,255,.33), transparent 34%), linear-gradient(160deg,#090b10 0%,#101626 54%,#0b1020 100%)',
        color: '#fff',
        fontFamily:
          'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 78,
          left: 62,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: intro,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: '#335cff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 28px rgba(51,92,255,.35)',
          }}
        >
          <div
            style={{
              width: 15,
              height: 15,
              borderRadius: 99,
              border: '4px solid #fff',
              borderTopColor: 'transparent',
            }}
          />
        </div>
        <div style={{fontSize: 30, fontWeight: 870, letterSpacing: -1.1}}>FlowPilot</div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 62,
          right: 62,
          top: 310,
          opacity: intro,
          transform: `translateY(${interpolate(intro, [0, 1], [36, 0], clamp)}px)`,
        }}
      >
        <div style={{fontSize: 27, color: '#9fa7b8', fontWeight: 820, letterSpacing: 0.8}}>
          FLOWPILOT DLA TWOJEJ FIRMY
        </div>
        <div
          style={{
            fontSize: 98,
            lineHeight: 0.94,
            fontWeight: 960,
            letterSpacing: -6,
            marginTop: 22,
          }}
        >
          MNIEJ
          <br />
          ODPISYWANIA.
          <br />
          <span style={{color: '#86a0ff'}}>WIĘCEJ CZASU</span>
          <br />
          NA SPRZEDAŻ.
        </div>

        <div
          style={{
            marginTop: 42,
            fontSize: 31,
            lineHeight: 1.23,
            color: '#c6cad4',
            fontWeight: 680,
            maxWidth: 820,
          }}
        >
          Pokażemy Ci na Twoim przykładzie, co można usprawnić i zautomatyzować bez oddawania kontroli nad rozmową.
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 62,
          right: 62,
          bottom: 355,
          opacity: button,
          transform: `scale(${interpolate(button, [0, 1], [0.94, 1], clamp) * pulse})`,
        }}
      >
        <div
          style={{
            padding: '30px 34px',
            borderRadius: 28,
            background: '#fff',
            color: '#0d111d',
            boxShadow: '0 26px 80px rgba(0,0,0,.28)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{fontSize: 20, color: '#6c7380', fontWeight: 760}}>WYŚLIJ WIADOMOŚĆ</div>
            <div style={{fontSize: 52, fontWeight: 960, letterSpacing: -2.4, marginTop: 5}}>
              NAPISZ: FLOW
            </div>
          </div>
          <div
            style={{
              width: 78,
              height: 78,
              borderRadius: 24,
              background: '#335cff',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 46,
              fontWeight: 900,
            }}
          >
            →
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 62,
          right: 62,
          bottom: 180,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#9da4b2',
          fontSize: 21,
          fontWeight: 720,
          opacity: footer,
        }}
      >
        <span>Twoja firma</span>
        <span>•</span>
        <span>Twój proces</span>
        <span>•</span>
        <span>Twoja decyzja</span>
      </div>
    </AbsoluteFill>
  );
};

export const FlowPilotExplainerMarketing: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <FlowPilotExplainer />
      <Sequence from={CTA_START}>
        <Audio src={CTA_AUDIO} volume={1} />
      </Sequence>
      <Sequence from={CTA_START}>
        <Audio src={staticFile('audio/bed.wav')} volume={0.055} />
      </Sequence>
      <Sequence from={CTA_START + 58} durationInFrames={18}>
        <Audio src={staticFile('audio/success.wav')} volume={0.28} />
      </Sequence>
      <MarketingClose frame={frame} />
    </AbsoluteFill>
  );
};
