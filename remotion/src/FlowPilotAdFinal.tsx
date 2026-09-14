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

const VOICEOVER =
  'https://storage.googleapis.com/adm--audio-playback--7d--public/mcp-preview/862b6424-2c5a-4666-9273-5f4186136381.mp3';

const C = {
  bg: '#050915',
  panel: '#0c1324',
  panel2: '#121d33',
  white: '#f8fbff',
  muted: '#98a6bd',
  blue: '#4f7cff',
  cyan: '#55d8ff',
  green: '#55df9a',
  red: '#ff596d',
  amber: '#ffb84d',
};

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const appear = (frame: number, fps: number, delay = 0) =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping: 16, stiffness: 190, mass: 0.72},
  });

const fade = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, start + 8, end - 8, end], [0, 1, 1, 0], clamp);

const Brand: React.FC = () => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 19px',
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,.13)',
      background: 'rgba(255,255,255,.06)',
      fontSize: 25,
      fontWeight: 850,
      letterSpacing: -0.5,
    }}
  >
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: 99,
        background: C.blue,
        boxShadow: '0 0 28px rgba(79,124,255,.95)',
      }}
    />
    FlowPilot AI
  </div>
);

const Shell: React.FC<React.PropsWithChildren<{frame: number}>> = ({frame, children}) => {
  const drift = interpolate(frame, [0, 600], [-130, 160], clamp);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 72% 9%, rgba(79,124,255,.19), transparent 34%), radial-gradient(circle at 10% 74%, rgba(85,216,255,.08), transparent 30%), ${C.bg}`,
        color: C.white,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.12,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          transform: `translateY(${drift}px)`,
        }}
      />
      <div style={{position: 'absolute', top: 74, left: 72, right: 72, height: 5, borderRadius: 99, background: 'rgba(255,255,255,.09)'}}>
        <div
          style={{
            height: '100%',
            width: `${interpolate(frame, [0, 599], [2, 100], clamp)}%`,
            borderRadius: 99,
            background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})`,
          }}
        />
      </div>
      {children}
    </AbsoluteFill>
  );
};

const CaptionRail: React.FC<{frame: number}> = ({frame}) => {
  const captions = [
    {from: 9, to: 50, text: 'Klient napisał.'},
    {from: 50, to: 104, text: 'Minuta później kupił u konkurencji?'},
    {from: 104, to: 205, text: 'FlowPilot przygotowuje odpowiedź, zanim otworzysz inbox.'},
    {from: 205, to: 300, text: 'Zna kontekst rozmowy, ton marki i daje gotowy draft.'},
    {from: 300, to: 388, text: 'Ty tylko sprawdzasz i zatwierdzasz.'},
    {from: 388, to: 450, text: 'Mniej ręcznego odpisywania.'},
    {from: 450, to: 510, text: 'Więcej obsłużonych klientów.'},
    {from: 510, to: 590, text: 'Napisz „FLOW” po demo.'},
  ];
  const current = captions.find((c) => frame >= c.from && frame < c.to);
  if (!current) return null;
  const local = frame - current.from;
  const p = Math.min(1, local / 5);

  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        bottom: 260,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          padding: '19px 27px',
          borderRadius: 24,
          background: 'rgba(2,5,12,.78)',
          border: '1px solid rgba(255,255,255,.13)',
          boxShadow: '0 20px 50px rgba(0,0,0,.28)',
          fontSize: 36,
          lineHeight: 1.12,
          textAlign: 'center',
          fontWeight: 850,
          letterSpacing: -1,
          opacity: p,
          transform: `translateY(${interpolate(p, [0, 1], [18, 0])}px)`,
        }}
      >
        {current.text}
      </div>
    </div>
  );
};

const HookScene: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const p1 = appear(frame, fps, 0);
  const p2 = appear(frame, fps, 18);
  const p3 = appear(frame, fps, 50);
  const shake = frame > 48 && frame < 70 ? Math.sin(frame * 1.9) * (70 - frame) * 0.6 : 0;

  return (
    <div style={{position: 'absolute', inset: 0, padding: '135px 74px 330px', boxSizing: 'border-box', opacity: fade(frame, 0, 112)}}>
      <div style={{opacity: p1}}><Brand /></div>

      <div style={{marginTop: 128, opacity: p1, transform: `translateY(${interpolate(p1, [0, 1], [42, 0])}px)`}}>
        <div style={{fontSize: 40, color: C.muted, fontWeight: 850, letterSpacing: 0.4}}>TWÓJ INBOX, 21:47</div>
        <div style={{fontSize: 116, lineHeight: 0.92, fontWeight: 980, letterSpacing: -7, marginTop: 18}}>
          KLIENT
          <br />
          NAPISAŁ.
        </div>
      </div>

      <div
        style={{
          marginTop: 62,
          display: 'flex',
          gap: 18,
          alignItems: 'center',
          opacity: p2,
          transform: `translateX(${shake}px) scale(${interpolate(p2, [0, 1], [0.94, 1])})`,
        }}
      >
        <div style={{fontSize: 86, fontWeight: 980, color: C.red, letterSpacing: -4}}>60 s</div>
        <div style={{fontSize: 42, lineHeight: 1.02, fontWeight: 850, maxWidth: 560}}>
          i dalej czeka
          <br />
          na odpowiedź
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 74,
          right: 74,
          bottom: 430,
          padding: '28px 32px',
          borderRadius: 30,
          background: 'rgba(255,89,109,.11)',
          border: '1px solid rgba(255,89,109,.36)',
          opacity: p3,
          transform: `translateY(${interpolate(p3, [0, 1], [35, 0])}px)`,
        }}
      >
        <div style={{fontSize: 29, fontWeight: 800, color: '#ff9aa7'}}>Najdroższa odpowiedź?</div>
        <div style={{fontSize: 43, lineHeight: 1.05, fontWeight: 920, marginTop: 8}}>Ta, której klient nie dostał na czas.</div>
      </div>
    </div>
  );
};

const ChatBubble: React.FC<{text: string; right?: boolean; accent?: boolean; p: number}> = ({text, right, accent, p}) => (
  <div style={{display: 'flex', justifyContent: right ? 'flex-end' : 'flex-start', opacity: p, transform: `translateY(${interpolate(p, [0, 1], [28, 0])}px)`}}>
    <div
      style={{
        maxWidth: 720,
        padding: '24px 28px',
        borderRadius: 28,
        background: accent ? `linear-gradient(135deg, ${C.blue}, #6d5cff)` : C.panel2,
        border: accent ? '1px solid rgba(255,255,255,.14)' : '1px solid rgba(255,255,255,.07)',
        fontSize: 33,
        lineHeight: 1.18,
        fontWeight: 700,
        boxShadow: '0 18px 50px rgba(0,0,0,.22)',
      }}
    >
      {text}
    </div>
  </div>
);

const DraftScene: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame - 104;
  const title = appear(local, fps, 0);
  const b1 = appear(local, fps, 18);
  const b2 = appear(local, fps, 42);
  const typing = interpolate(local, [48, 104], [0, 1], clamp);
  const chips = appear(local, fps, 92);
  const answer = 'Jasne — wdrożenie możemy zacząć od Messengera. Pokażę Ci najpierw prosty przepływ i zakres.';
  const chars = Math.floor(answer.length * typing);

  return (
    <div style={{position: 'absolute', inset: 0, padding: '130px 68px 330px', boxSizing: 'border-box', opacity: fade(frame, 100, 304)}}>
      <div style={{opacity: title}}>
        <div style={{fontSize: 28, color: C.cyan, fontWeight: 900, letterSpacing: 1}}>FLOWPILOT • LIVE DRAFT</div>
        <div style={{fontSize: 75, lineHeight: 1.0, fontWeight: 960, letterSpacing: -4, marginTop: 14}}>
          Zanim wejdziesz w inbox,
          <br />
          draft już czeka.
        </div>
      </div>

      <div
        style={{
          marginTop: 74,
          padding: 34,
          borderRadius: 42,
          background: 'rgba(12,19,36,.92)',
          border: '1px solid rgba(255,255,255,.09)',
          boxShadow: '0 34px 90px rgba(0,0,0,.34)',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <ChatBubble text="Hej, robicie automatyzację odpowiedzi na Messengerze?" p={b1} />
        <ChatBubble text={answer.slice(0, chars) + (typing < 1 ? '▍' : '')} right accent p={b2} />

        <div style={{display: 'flex', gap: 13, flexWrap: 'wrap', marginTop: 6, opacity: chips}}>
          {['Kontekst rozmowy ✓', 'Ton marki ✓', 'Warunki oferty ✓'].map((label) => (
            <div key={label} style={{padding: '12px 16px', borderRadius: 999, background: 'rgba(85,223,154,.09)', border: '1px solid rgba(85,223,154,.24)', color: '#9cf4c5', fontSize: 24, fontWeight: 820}}>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ApprovalScene: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame - 292;
  const title = appear(local, fps, 0);
  const left = appear(local, fps, 16);
  const right = appear(local, fps, 28);
  const button = appear(local, fps, 62);
  const sent = local > 102;

  return (
    <div style={{position: 'absolute', inset: 0, padding: '130px 68px 330px', boxSizing: 'border-box', opacity: fade(frame, 292, 440)}}>
      <div style={{opacity: title}}>
        <div style={{fontSize: 29, color: C.muted, fontWeight: 900}}>AI ROBI PIERWSZY KROK. TY MASZ OSTATNIE SŁOWO.</div>
        <div style={{fontSize: 78, lineHeight: 0.99, fontWeight: 970, letterSpacing: -4, marginTop: 18}}>Nie oddajesz kontroli.</div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 64}}>
        <div style={{padding: '30px 27px', borderRadius: 34, background: 'rgba(255,89,109,.08)', border: '1px solid rgba(255,89,109,.23)', opacity: left, transform: `translateX(${interpolate(left, [0, 1], [-34, 0])}px)`}}>
          <div style={{fontSize: 25, color: '#ff9aa7', fontWeight: 900}}>RĘCZNIE</div>
          <div style={{fontSize: 51, fontWeight: 960, marginTop: 16, letterSpacing: -2}}>Otwórz.</div>
          <div style={{fontSize: 51, fontWeight: 960, letterSpacing: -2}}>Przeczytaj.</div>
          <div style={{fontSize: 51, fontWeight: 960, letterSpacing: -2}}>Napisz.</div>
          <div style={{fontSize: 28, color: C.muted, marginTop: 18}}>Za każdym razem od zera.</div>
        </div>

        <div style={{padding: '30px 27px', borderRadius: 34, background: 'rgba(79,124,255,.12)', border: '1px solid rgba(79,124,255,.38)', opacity: right, transform: `translateX(${interpolate(right, [0, 1], [34, 0])}px)`}}>
          <div style={{fontSize: 25, color: '#9cb2ff', fontWeight: 900}}>FLOWPILOT</div>
          <div style={{fontSize: 51, fontWeight: 960, marginTop: 16, letterSpacing: -2}}>Sprawdź.</div>
          <div style={{fontSize: 51, fontWeight: 960, letterSpacing: -2}}>Kliknij.</div>
          <div style={{fontSize: 51, fontWeight: 960, color: C.green, letterSpacing: -2}}>Gotowe.</div>
          <div style={{fontSize: 28, color: C.muted, marginTop: 18}}>Draft jest już przygotowany.</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 35,
          height: 94,
          borderRadius: 28,
          background: sent ? C.green : C.blue,
          color: sent ? '#052017' : C.white,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          fontWeight: 960,
          opacity: button,
          transform: `scale(${interpolate(button, [0, 1], [0.93, 1])})`,
          boxShadow: sent ? '0 20px 70px rgba(85,223,154,.2)' : '0 20px 70px rgba(79,124,255,.26)',
        }}
      >
        {sent ? '✓ Odpowiedź wysłana' : 'Zatwierdź odpowiedź'}
      </div>
    </div>
  );
};

const ResultScene: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame - 432;
  const p1 = appear(local, fps, 0);
  const p2 = appear(local, fps, 12);
  const p3 = appear(local, fps, 30);

  const rows = [
    ['01', 'Klient pisze', 'Messenger / Instagram / formularz'],
    ['02', 'AI układa draft', 'w kontekście rozmowy'],
    ['03', 'Ty zatwierdzasz', 'bez automatycznej wysyłki'],
  ];

  return (
    <div style={{position: 'absolute', inset: 0, padding: '130px 68px 330px', boxSizing: 'border-box', opacity: fade(frame, 432, 518)}}>
      <div style={{opacity: p1}}><Brand /></div>
      <div style={{fontSize: 72, lineHeight: 1.0, fontWeight: 970, letterSpacing: -4, marginTop: 55, opacity: p2}}>
        Szybciej, ale nadal
        <br />
        po Twojemu.
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 55, opacity: p3}}>
        {rows.map(([n, title, detail], idx) => (
          <div key={n} style={{display: 'grid', gridTemplateColumns: '78px 1fr', gap: 22, alignItems: 'center', padding: '23px 26px', borderRadius: 28, background: idx === 1 ? 'rgba(79,124,255,.12)' : C.panel, border: idx === 1 ? '1px solid rgba(79,124,255,.35)' : '1px solid rgba(255,255,255,.07)'}}>
            <div style={{fontSize: 28, color: idx === 1 ? C.cyan : C.muted, fontWeight: 950}}>{n}</div>
            <div>
              <div style={{fontSize: 34, fontWeight: 930}}>{title}</div>
              <div style={{fontSize: 25, color: C.muted, marginTop: 3}}>{detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CtaScene: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame - 510;
  const p1 = appear(local, fps, 0);
  const p2 = appear(local, fps, 10);
  const p3 = appear(local, fps, 24);
  const glow = 0.65 + 0.35 * Math.sin(local / 8);

  return (
    <div style={{position: 'absolute', inset: 0, padding: '135px 74px 330px', boxSizing: 'border-box', opacity: fade(frame, 508, 600)}}>
      <div style={{opacity: p1}}><Brand /></div>
      <div style={{marginTop: 118, fontSize: 44, color: C.muted, fontWeight: 850, opacity: p2}}>CHCESZ ZOBACZYĆ TO NA SWOIM BIZNESIE?</div>
      <div style={{fontSize: 108, lineHeight: 0.92, fontWeight: 990, letterSpacing: -7, marginTop: 24, opacity: p2}}>
        NAPISZ
        <br />
        <span style={{color: C.cyan}}>„FLOW”</span>
      </div>
      <div style={{fontSize: 44, lineHeight: 1.08, fontWeight: 820, color: C.white, marginTop: 35, opacity: p3}}>
        i pokażę Ci demo procesu
        <br />
        krok po kroku.
      </div>

      <div
        style={{
          marginTop: 70,
          padding: '30px 34px',
          borderRadius: 30,
          background: C.white,
          color: '#07101f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 38,
          fontWeight: 960,
          opacity: p3,
          transform: `scale(${interpolate(p3, [0, 1], [0.93, 1])})`,
          boxShadow: `0 0 ${50 + 30 * glow}px rgba(85,216,255,.18)`,
        }}
      >
        <span>Wyślij: FLOW</span>
        <span style={{fontSize: 50}}>→</span>
      </div>
    </div>
  );
};

export const FlowPilotAdFinal: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Shell frame={frame}>
      <Audio src={staticFile('audio/bed.wav')} volume={0.10} />
      <Sequence from={9}>
        <Audio src={VOICEOVER} volume={1} />
      </Sequence>
      <Sequence from={7} durationInFrames={18}>
        <Audio src={staticFile('audio/notif.wav')} volume={0.85} />
      </Sequence>
      <Sequence from={365} durationInFrames={12}>
        <Audio src={staticFile('audio/click.wav')} volume={0.8} />
      </Sequence>
      <Sequence from={395} durationInFrames={20}>
        <Audio src={staticFile('audio/success.wav')} volume={0.75} />
      </Sequence>

      <HookScene frame={frame} />
      <DraftScene frame={frame} />
      <ApprovalScene frame={frame} />
      <ResultScene frame={frame} />
      <CtaScene frame={frame} />
      <CaptionRail frame={frame} />
    </Shell>
  );
};
