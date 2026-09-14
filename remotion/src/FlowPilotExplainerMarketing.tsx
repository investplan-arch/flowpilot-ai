import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FlowPilotExplainer} from './FlowPilotExplainer';

const VOICEOVER =
  'https://cdn.creativeclaw.co/u/5df41fd6/audio/a5f76cbf-61c0-4c61-9914-4ace786ee2ad.mp3';

const BROLL_DAY =
  'https://cdn.creativeclaw.co/u/5df41fd6/images/ea216ca2-aa94-4095-940b-b22bf9e4e90a.png';
const BROLL_NIGHT =
  'https://cdn.creativeclaw.co/u/5df41fd6/images/b58b00bb-680a-4d5c-8a28-df2a9534e9fa.png';

const CTA_START = 828;
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

type CaptionSegment = {
  from: number;
  to: number;
  text: string;
  accent?: string;
  zone: 'bottom' | 'top' | 'mid' | 'cta';
};

const captions: CaptionSegment[] = [
  {from: 14, to: 82, text: 'Jeśli codziennie odpowiadasz', accent: 'codziennie', zone: 'bottom'},
  {from: 82, to: 132, text: 'klientom na te same pytania', accent: 'same', zone: 'bottom'},
  {from: 132, to: 190, text: 'FlowPilot może zdjąć z Ciebie tę pracę', accent: 'FlowPilot', zone: 'bottom'},
  {from: 218, to: 290, text: 'Wiadomość trafia do jednego panelu', accent: 'jednego panelu', zone: 'top'},
  {from: 290, to: 368, text: 'System sprawdza przebieg rozmowy', accent: 'sprawdza', zone: 'top'},
  {from: 368, to: 445, text: 'i przygotowuje propozycję odpowiedzi', accent: 'propozycję', zone: 'top'},
  {from: 458, to: 505, text: 'Ty ją czytasz', accent: 'Ty', zone: 'top'},
  {from: 505, to: 548, text: 'poprawiasz, jeśli chcesz…', accent: 'poprawiasz', zone: 'top'},
  {from: 548, to: 575, text: 'i zatwierdzasz', accent: 'zatwierdzasz', zone: 'top'},
  {from: 585, to: 655, text: 'Odpowiadasz szybciej', accent: 'szybciej', zone: 'mid'},
  {from: 655, to: 718, text: 'Masz mniej chaosu', accent: 'mniej chaosu', zone: 'mid'},
  {from: 718, to: 830, text: 'i nie tracisz klientów przez zbyt późną odpowiedź', accent: 'nie tracisz klientów', zone: 'mid'},
  {from: 844, to: 910, text: 'Prowadzisz firmę?', accent: 'firmę', zone: 'cta'},
  {from: 910, to: 982, text: 'Napisz teraz słowo: FLOW', accent: 'FLOW', zone: 'cta'},
  {from: 982, to: 1065, text: 'Pokażemy Ci to na Twoim przykładzie', accent: 'Twoim przykładzie', zone: 'cta'},
  {from: 1065, to: 1128, text: 'Zobacz, ile czasu możesz odzyskać', accent: 'odzyskać', zone: 'cta'},
];

const BrollShot: React.FC<{src: string; start: number; end: number; frame: number; direction?: 1 | -1}> = ({
  src,
  start,
  end,
  frame,
  direction = 1,
}) => {
  if (frame < start || frame >= end) return null;
  const local = frame - start;
  const duration = end - start;
  const fadeIn = interpolate(local, [0, 8], [0, 1], clamp);
  const fadeOut = interpolate(local, [duration - 8, duration], [1, 0], clamp);
  const scale = interpolate(local, [0, duration], direction === 1 ? [1.02, 1.085] : [1.085, 1.02], clamp);
  const y = interpolate(local, [0, duration], direction === 1 ? [0, -18] : [-18, 0], clamp);

  return (
    <AbsoluteFill style={{zIndex: 220, overflow: 'hidden', opacity: fadeIn * fadeOut, background: '#090b10'}}>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translateY(${y}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(4,7,13,.16) 0%, rgba(4,7,13,.02) 38%, rgba(4,7,13,.72) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 70,
          left: 58,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 999,
          background: 'rgba(8,11,18,.62)',
          border: '1px solid rgba(255,255,255,.12)',
          color: '#fff',
          fontSize: 20,
          fontWeight: 820,
          backdropFilter: 'blur(10px)',
        }}
      >
        <span style={{width: 10, height: 10, borderRadius: 99, background: '#ff5c67'}} />
        Tak wygląda codzienny chaos
      </div>
    </AbsoluteFill>
  );
};

const BrollMontage: React.FC<{frame: number}> = ({frame}) => (
  <>
    <BrollShot src={BROLL_DAY} start={8} end={98} frame={frame} direction={1} />
    <BrollShot src={BROLL_NIGHT} start={90} end={202} frame={frame} direction={-1} />
  </>
);

const DynamicCaption: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const item = captions.find((x) => frame >= x.from && frame < x.to);
  if (!item) return null;

  const local = frame - item.from;
  const intro = spring({frame: local, fps, config: {damping: 18, stiffness: 210, mass: 0.62}});
  const exit = interpolate(frame, [item.to - 6, item.to], [1, 0], clamp);
  const opacity = intro * exit;
  const translate = interpolate(intro, [0, 1], [18, 0], clamp);

  const positionStyle: React.CSSProperties =
    item.zone === 'top'
      ? {top: 92, left: 210, right: 210}
      : item.zone === 'mid'
        ? {top: 455, left: 90, right: 90}
        : item.zone === 'cta'
          ? {top: 185, left: 90, right: 90}
          : {bottom: 105, left: 72, right: 72};

  const pieces = item.accent ? item.text.split(item.accent) : [item.text];

  return (
    <div style={{position: 'absolute', zIndex: 600, display: 'flex', justifyContent: 'center', pointerEvents: 'none', ...positionStyle, opacity, transform: `translateY(${translate}px)`}}>
      <div style={{maxWidth: 880, padding: '15px 22px', borderRadius: 18, background: 'rgba(8,11,18,.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', color: '#fff', fontSize: item.zone === 'cta' ? 36 : 31, lineHeight: 1.14, fontWeight: 830, letterSpacing: -0.8, textAlign: 'center', boxShadow: '0 14px 42px rgba(0,0,0,.20)', border: '1px solid rgba(255,255,255,.08)'}}>
        {item.accent ? (
          <>
            {pieces[0]}
            <span style={{color: '#91a7ff', fontWeight: 950}}>{item.accent}</span>
            {pieces[1]}
          </>
        ) : item.text}
      </div>
    </div>
  );
};

const MarketingClose: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame - CTA_START;
  if (local < 0) return null;

  const intro = spring({frame: local, fps, config: {damping: 18, stiffness: 150, mass: 0.8}});
  const button = spring({frame: Math.max(0, local - 65), fps, config: {damping: 16, stiffness: 180, mass: 0.72}});
  const footer = spring({frame: Math.max(0, local - 115), fps, config: {damping: 18, stiffness: 165, mass: 0.8}});
  const pulse = 1 + 0.012 * Math.sin(local / 10);

  return (
    <AbsoluteFill style={{zIndex: 300, background: 'radial-gradient(circle at 78% 8%, rgba(79,106,255,.34), transparent 34%), linear-gradient(160deg,#090b10 0%,#101626 54%,#0b1020 100%)', color: '#fff', fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: 74, left: 62, display: 'flex', alignItems: 'center', gap: 12, opacity: intro}}>
        <div style={{width: 38, height: 38, borderRadius: 12, background: '#335cff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 28px rgba(51,92,255,.35)'}}>
          <div style={{width: 15, height: 15, borderRadius: 99, border: '4px solid #fff', borderTopColor: 'transparent'}} />
        </div>
        <div style={{fontSize: 30, fontWeight: 870, letterSpacing: -1.1}}>FlowPilot</div>
      </div>

      <div style={{position: 'absolute', left: 62, right: 62, top: 330, opacity: intro, transform: `translateY(${interpolate(intro, [0, 1], [36, 0], clamp)}px)`}}>
        <div style={{fontSize: 27, color: '#9fa7b8', fontWeight: 820, letterSpacing: 0.8}}>FLOWPILOT DLA TWOJEJ FIRMY</div>
        <div style={{fontSize: 96, lineHeight: .94, fontWeight: 960, letterSpacing: -5.8, marginTop: 22}}>
          MNIEJ<br/>POWTARZALNEJ<br/><span style={{color: '#86a0ff'}}>PRACY.</span>
        </div>
        <div style={{fontSize: 40, lineHeight: 1.08, color: '#d5d8df', marginTop: 30, fontWeight: 820}}>Więcej czasu na klientów<br/>i sprzedaż.</div>
      </div>

      <div style={{position: 'absolute', left: 62, right: 62, bottom: 350, opacity: button, transform: `scale(${interpolate(button, [0, 1], [0.94, 1], clamp) * pulse})`}}>
        <div style={{padding: '30px 34px', borderRadius: 28, background: '#fff', color: '#0d111d', boxShadow: '0 26px 80px rgba(0,0,0,.28)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <div style={{fontSize: 20, color: '#6c7380', fontWeight: 760}}>CHCESZ ZOBACZYĆ TO U SIEBIE?</div>
            <div style={{fontSize: 54, fontWeight: 960, letterSpacing: -2.4, marginTop: 5}}>NAPISZ: FLOW</div>
          </div>
          <div style={{width: 78, height: 78, borderRadius: 24, background: '#335cff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, fontWeight: 900}}>→</div>
        </div>
      </div>

      <div style={{position: 'absolute', left: 62, right: 62, bottom: 185, color: '#a9afbc', fontSize: 22, fontWeight: 720, lineHeight: 1.3, opacity: footer, textAlign: 'center'}}>
        Pokażemy Ci na Twoim przykładzie, co FlowPilot może przejąć<br/>i ile czasu możesz odzyskać.
      </div>
    </AbsoluteFill>
  );
};

export const FlowPilotExplainerMarketing: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <FlowPilotExplainer voiceover={false} captions={false} />
      <Sequence from={8}><Audio src={VOICEOVER} volume={1} /></Sequence>
      <BrollMontage frame={frame} />
      <Sequence from={CTA_START}><Audio src={staticFile('audio/bed.wav')} volume={0.035} /></Sequence>
      <Sequence from={CTA_START + 80} durationInFrames={18}><Audio src={staticFile('audio/success.wav')} volume={0.24} /></Sequence>
      <MarketingClose frame={frame} />
      <DynamicCaption frame={frame} />
    </AbsoluteFill>
  );
};
