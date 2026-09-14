import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

type ReelProps = {
  title: string;
  subtitle: string;
  cta: string;
};

export const Reel: React.FC<ReelProps> = ({title, subtitle, cta}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const intro = spring({fps, frame, config: {damping: 14, stiffness: 120}});
  const textY = interpolate(intro, [0, 1], [90, 0]);
  const textOpacity = interpolate(intro, [0, 1], [0, 1]);

  const cardStart = 85;
  const cardProgress = spring({
    fps,
    frame: Math.max(0, frame - cardStart),
    config: {damping: 16, stiffness: 110},
  });
  const cardScale = interpolate(cardProgress, [0, 1], [0.84, 1]);

  const ctaStart = 290;
  const ctaProgress = spring({
    fps,
    frame: Math.max(0, frame - ctaStart),
    config: {damping: 13, stiffness: 130},
  });

  const glowX = interpolate(frame, [0, 450], [-220, 980]);
  const glowY = interpolate(frame, [0, 450], [1700, 100]);

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #07111f 0%, #0b1730 48%, #090d18 100%)',
        color: '#ffffff',
        fontFamily: 'Inter, Arial, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: glowX,
          top: glowY,
          width: 520,
          height: 520,
          borderRadius: 999,
          background: 'rgba(68, 125, 255, 0.25)',
          filter: 'blur(90px)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 84,
          right: 84,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            padding: '14px 22px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.16)',
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          AI dla biznesu
        </div>

        <h1
          style={{
            margin: '38px 0 24px',
            fontSize: 104,
            lineHeight: 0.98,
            letterSpacing: -5,
            fontWeight: 900,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: 840,
            fontSize: 48,
            lineHeight: 1.16,
            color: 'rgba(255,255,255,0.78)',
            fontWeight: 600,
          }}
        >
          {subtitle}
        </p>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 74,
          right: 74,
          top: 770,
          height: 650,
          borderRadius: 54,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.16), rgba(255,255,255,0.055))',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: '0 50px 100px rgba(0,0,0,0.38)',
          transform: `scale(${cardScale})`,
          opacity: cardProgress,
          padding: 58,
          boxSizing: 'border-box',
        }}
      >
        <div style={{fontSize: 30, color: 'rgba(255,255,255,0.55)', marginBottom: 38}}>
          FLOWPILOT • WIADOMOŚCI
        </div>

        <div
          style={{
            padding: '34px 38px',
            borderRadius: 34,
            background: 'rgba(255,255,255,0.09)',
            fontSize: 38,
            lineHeight: 1.25,
            marginBottom: 24,
          }}
        >
          Klient: „Ile kosztuje wdrożenie automatyzacji?”
        </div>

        <div
          style={{
            marginLeft: 90,
            padding: '34px 38px',
            borderRadius: 34,
            background: 'linear-gradient(135deg, #3f73ff, #6d4dff)',
            fontSize: 38,
            lineHeight: 1.25,
            boxShadow: '0 22px 60px rgba(63,115,255,0.34)',
          }}
        >
          AI przygotowuje odpowiedź. Ty tylko zatwierdzasz.
        </div>

        <div
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 42,
            fontSize: 28,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <span>✓ szybciej</span>
          <span>✓ spójnie</span>
          <span>✓ pod kontrolą</span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 84,
          right: 84,
          bottom: 120,
          opacity: ctaProgress,
          transform: `translateY(${interpolate(ctaProgress, [0, 1], [80, 0])}px)`,
        }}
      >
        <div
          style={{
            fontSize: 30,
            color: 'rgba(255,255,255,0.58)',
            marginBottom: 18,
            fontWeight: 700,
          }}
        >
          MNIEJ KLIKANIA. WIĘCEJ SPRZEDAŻY.
        </div>
        <div
          style={{
            borderRadius: 30,
            padding: '30px 40px',
            textAlign: 'center',
            fontSize: 42,
            fontWeight: 900,
            background: '#ffffff',
            color: '#0b1020',
          }}
        >
          {cta}
        </div>
      </div>
    </AbsoluteFill>
  );
};
