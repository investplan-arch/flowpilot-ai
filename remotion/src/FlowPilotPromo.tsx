import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const BG = '#07101f';
const PANEL = '#0e1a2d';
const PANEL_2 = '#14223a';
const TEXT = '#f7f9fc';
const MUTED = '#9aa8bf';
const BLUE = '#4f7cff';
const GREEN = '#55d692';

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const enter = (frame: number, fps: number, delay = 0) =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping: 18, stiffness: 150, mass: 0.8},
  });

const BrandPill: React.FC = () => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 20px',
      borderRadius: 999,
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      color: TEXT,
      fontSize: 26,
      fontWeight: 800,
      letterSpacing: -0.5,
    }}
  >
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: 99,
        background: BLUE,
        boxShadow: '0 0 30px rgba(79,124,255,.8)',
      }}
    />
    FlowPilot AI
  </div>
);

const Scene: React.FC<React.PropsWithChildren> = ({children}) => (
  <AbsoluteFill
    style={{
      background: BG,
      color: TEXT,
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      padding: '150px 78px 250px',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute',
        width: 650,
        height: 650,
        borderRadius: 999,
        right: -300,
        top: -220,
        background: 'rgba(79,124,255,0.18)',
        filter: 'blur(110px)',
      }}
    />
    {children}
  </AbsoluteFill>
);

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p1 = enter(frame, fps, 0);
  const p2 = enter(frame, fps, 10);
  const p3 = enter(frame, fps, 22);

  return (
    <Scene>
      <div style={{opacity: p1, transform: `translateY(${interpolate(p1, [0, 1], [32, 0])}px)`}}>
        <BrandPill />
      </div>

      <div
        style={{
          marginTop: 190,
          opacity: p2,
          transform: `translateY(${interpolate(p2, [0, 1], [70, 0])}px)`,
        }}
      >
        <div
          style={{
            fontSize: 104,
            lineHeight: 0.98,
            fontWeight: 950,
            letterSpacing: -6,
            maxWidth: 900,
          }}
        >
          Dziesiątki wiadomości dziennie?
        </div>
      </div>

      <div
        style={{
          marginTop: 52,
          fontSize: 52,
          lineHeight: 1.12,
          fontWeight: 700,
          color: MUTED,
          opacity: p3,
          transform: `translateY(${interpolate(p3, [0, 1], [42, 0])}px)`,
        }}
      >
        Nie odpisuj każdemu klientowi od zera.
      </div>
    </Scene>
  );
};

const Message: React.FC<{
  text: string;
  delay: number;
  align?: 'left' | 'right';
  accent?: boolean;
}> = ({text, delay, align = 'left', accent = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = enter(frame, fps, delay);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        opacity: p,
        transform: `translateY(${interpolate(p, [0, 1], [38, 0])}px) scale(${interpolate(p, [0, 1], [0.97, 1])})`,
      }}
    >
      <div
        style={{
          maxWidth: 760,
          background: accent ? BLUE : PANEL_2,
          padding: '26px 30px',
          borderRadius: 28,
          fontSize: 34,
          lineHeight: 1.2,
          fontWeight: 650,
          boxShadow: '0 18px 55px rgba(0,0,0,.24)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

const InboxScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = enter(frame, fps, 0);

  return (
    <Scene>
      <div style={{opacity: title}}>
        <div style={{fontSize: 30, color: MUTED, fontWeight: 800, letterSpacing: 0.4}}>KLIENT PISZE</div>
        <div style={{fontSize: 72, lineHeight: 1.02, fontWeight: 930, letterSpacing: -4, marginTop: 18}}>
          AI przygotowuje pierwszy draft.
        </div>
      </div>

      <div
        style={{
          marginTop: 110,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          padding: 36,
          background: PANEL,
          borderRadius: 44,
          border: '1px solid rgba(255,255,255,.09)',
          boxShadow: '0 40px 90px rgba(0,0,0,.32)',
        }}
      >
        <Message text="Dzień dobry, ile trwa wdrożenie?" delay={12} />
        <Message text="Czy możecie połączyć to z Messengerem?" delay={26} />
        <Message text="Tak. Mogę od razu rozpisać Ci, jak wygląda wdrożenie krok po kroku." delay={45} align="right" accent />
      </div>
    </Scene>
  );
};

const Step: React.FC<{
  index: string;
  title: string;
  detail: string;
  delay: number;
  active?: boolean;
}> = ({index, title, detail, delay, active = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = enter(frame, fps, delay);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '88px 1fr',
        gap: 24,
        alignItems: 'center',
        padding: '30px 34px',
        borderRadius: 30,
        background: active ? 'rgba(79,124,255,.16)' : PANEL,
        border: active ? '1px solid rgba(79,124,255,.55)' : '1px solid rgba(255,255,255,.08)',
        opacity: p,
        transform: `translateX(${interpolate(p, [0, 1], [55, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: active ? BLUE : PANEL_2,
          fontSize: 30,
          fontWeight: 900,
        }}
      >
        {index}
      </div>
      <div>
        <div style={{fontSize: 35, fontWeight: 900, letterSpacing: -1}}>{title}</div>
        <div style={{fontSize: 26, color: MUTED, marginTop: 5, lineHeight: 1.18}}>{detail}</div>
      </div>
    </div>
  );
};

const ApprovalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const buttonP = enter(frame, fps, 42);
  const sent = interpolate(frame, [78, 104], [0, 1], clamp);

  return (
    <Scene>
      <div style={{fontSize: 30, color: MUTED, fontWeight: 800}}>TY ZOSTAJESZ W KONTROLI</div>
      <div style={{fontSize: 76, lineHeight: 1.02, fontWeight: 940, letterSpacing: -4, marginTop: 18}}>
        Sprawdzasz. Zatwierdzasz. Gotowe.
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 24, marginTop: 90}}>
        <Step index="1" title="Wiadomość" detail="Klient pisze w swoim kanale." delay={8} />
        <Step index="2" title="Draft AI" detail="FlowPilot układa odpowiedź w kontekście rozmowy." delay={20} active />
        <Step index="3" title="Twoja akceptacja" detail="Jedno kliknięcie przed wysłaniem." delay={32} />
      </div>

      <div
        style={{
          marginTop: 42,
          height: 96,
          borderRadius: 28,
          background: sent > 0.5 ? GREEN : BLUE,
          color: sent > 0.5 ? '#062318' : TEXT,
          fontSize: 34,
          fontWeight: 950,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: buttonP,
          transform: `scale(${interpolate(buttonP, [0, 1], [0.94, 1])})`,
          boxShadow: sent > 0.5 ? '0 24px 70px rgba(85,214,146,.20)' : '0 24px 70px rgba(79,124,255,.24)',
        }}
      >
        {sent > 0.5 ? '✓ Odpowiedź wysłana' : 'Zatwierdź odpowiedź'}
      </div>
    </Scene>
  );
};

const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p1 = enter(frame, fps, 0);
  const p2 = enter(frame, fps, 12);
  const p3 = enter(frame, fps, 26);

  return (
    <Scene>
      <div style={{opacity: p1}}>
        <BrandPill />
      </div>

      <div
        style={{
          marginTop: 185,
          fontSize: 90,
          lineHeight: 0.98,
          fontWeight: 950,
          letterSpacing: -5,
          opacity: p2,
          transform: `translateY(${interpolate(p2, [0, 1], [55, 0])}px)`,
        }}
      >
        Mniej pisania ręcznie.
        <br />
        Więcej czasu na klienta.
      </div>

      <div
        style={{
          marginTop: 74,
          padding: '34px 38px',
          background: TEXT,
          color: '#09111e',
          borderRadius: 32,
          fontSize: 42,
          fontWeight: 950,
          textAlign: 'center',
          opacity: p3,
          transform: `scale(${interpolate(p3, [0, 1], [0.94, 1])})`,
        }}
      >
        Napisz „FLOW” po demo
      </div>

      <div style={{fontSize: 28, color: MUTED, marginTop: 28, opacity: p3, textAlign: 'center'}}>
        Automatyzacja odpowiedzi z akceptacją człowieka.
      </div>
    </Scene>
  );
};

export const FlowPilotPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{background: BG}}>
      <Sequence from={0} durationInFrames={90} premountFor={30}>
        <HookScene />
      </Sequence>
      <Sequence from={90} durationInFrames={150} premountFor={30}>
        <InboxScene />
      </Sequence>
      <Sequence from={240} durationInFrames={120} premountFor={30}>
        <ApprovalScene />
      </Sequence>
      <Sequence from={360} durationInFrames={90} premountFor={30}>
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  );
};
