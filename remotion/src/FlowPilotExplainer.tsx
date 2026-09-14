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
  'https://storage.googleapis.com/adm--audio-playback--7d--public/mcp-preview/a853a75c-2c30-4d89-b19e-808d106136ac.mp3';

const C = {
  dark: '#090b10',
  white: '#ffffff',
  ink: '#15171c',
  sub: '#727783',
  line: '#e6e8ed',
  bg: '#f3f4f7',
  panel: '#ffffff',
  soft: '#f6f7f9',
  blue: '#335cff',
  blueSoft: '#eef2ff',
  green: '#119b69',
  greenSoft: '#eaf8f2',
  violet: '#7a5cff',
};

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const fade = (f: number, a: number, b: number) => interpolate(f, [a, a + 8, b - 8, b], [0, 1, 1, 0], clamp);
const pop = (f: number, fps: number, delay = 0) => spring({frame: Math.max(0, f - delay), fps, config: {damping: 18, stiffness: 170, mass: 0.75}});

const Logo: React.FC<{light?: boolean}> = ({light = false}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
    <div style={{width: 36, height: 36, borderRadius: 12, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(51,92,255,.25)'}}>
      <div style={{width: 15, height: 15, borderRadius: 99, border: '4px solid #fff', borderTopColor: 'transparent'}} />
    </div>
    <div style={{fontSize: 29, fontWeight: 850, letterSpacing: -1.1, color: light ? '#fff' : C.ink}}>FlowPilot</div>
  </div>
);

const Caption: React.FC<{frame: number}> = ({frame}) => {
  const captions = [
    {from: 8, to: 122, text: 'Codziennie odpowiadasz klientom na te same pytania?'},
    {from: 137, to: 203, text: 'Wiadomość od klienta trafia do jednego panelu.'},
    {from: 218, to: 332, text: 'System odczytuje rozmowę i przygotowuje propozycję odpowiedzi.'},
    {from: 347, to: 443, text: 'Ty ją sprawdzasz, poprawiasz i zatwierdzasz.'},
    {from: 458, to: 527, text: 'Dopiero wtedy odpowiedź trafia do klienta.'},
    {from: 542, to: 713, text: 'Dla usług, sklepów internetowych, salonów, biur i sprzedaży.'},
    {from: 728, to: 888, text: 'Chcesz zobaczyć, jak działa? Napisz do nas.'},
  ];
  const item = captions.find((x) => frame >= x.from && frame < x.to);
  if (!item) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, bottom: 110, zIndex: 100, display: 'flex', justifyContent: 'center'}}>
      <div style={{padding: '13px 20px', borderRadius: 14, background: 'rgba(9,11,16,.94)', color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: -0.6, textAlign: 'center', boxShadow: '0 12px 34px rgba(0,0,0,.16)'}}>{item.text}</div>
    </div>
  );
};

const Hook: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const p1 = pop(frame, fps, 0);
  const p2 = pop(frame, fps, 18);
  const p3 = pop(frame, fps, 42);
  return (
    <AbsoluteFill style={{background: C.dark, color: '#fff', opacity: fade(frame, 0, 168)}}>
      <div style={{position: 'absolute', top: 72, left: 62}}><Logo light /></div>
      <div style={{position: 'absolute', left: 62, right: 62, top: 280, opacity: p1}}>
        <div style={{fontSize: 34, color: '#959aa6', fontWeight: 760}}>DLA KOGO JEST FLOWPILOT?</div>
        <div style={{fontSize: 100, lineHeight: .94, fontWeight: 940, letterSpacing: -6, marginTop: 24}}>JEŚLI CIĄGLE<br/>ODPISUJESZ<br/><span style={{color: '#7e9aff'}}>TO SAMO…</span></div>
      </div>
      <div style={{position: 'absolute', left: 62, right: 62, top: 830, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, opacity: p2}}>
        {['Facebook', 'Instagram', 'Formularze'].map((label, i) => (
          <div key={label} style={{padding: '22px 18px', borderRadius: 22, background: '#141821', border: '1px solid #242936', textAlign: 'center'}}>
            <div style={{width: 10, height: 10, borderRadius: 99, background: i === 0 ? '#36a7ff' : i === 1 ? '#d56cff' : '#53d89e', margin: '0 auto 14px'}} />
            <div style={{fontSize: 23, fontWeight: 820}}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 62, right: 62, top: 1110, padding: '28px 30px', borderRadius: 28, background: '#fff', color: C.ink, opacity: p3, transform: `translateY(${interpolate(p3, [0,1], [28,0])}px)`}}>
        <div style={{fontSize: 24, color: C.sub, fontWeight: 720}}>FlowPilot nie zastępuje Ciebie.</div>
        <div style={{fontSize: 38, lineHeight: 1.05, fontWeight: 900, letterSpacing: -1.8, marginTop: 8}}>Usuwa powtarzalne pisanie<br/>i zostawia Ci decyzję.</div>
      </div>
    </AbsoluteFill>
  );
};

const InboxDemo: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame - 150;
  const p = pop(local, fps, 0);
  const ai = pop(local, fps, 88);
  const approve = pop(local, fps, 215);
  const sent = local > 330;
  const draft = 'Jasne. Możemy uporządkować obsługę wiadomości i przygotowywać gotowe odpowiedzi. Najpierw pokażę Ci, jak działa to na Twoim przykładzie.';
  const typing = interpolate(local, [100, 205], [0, 1], clamp);
  const chars = Math.floor(draft.length * typing);
  return (
    <AbsoluteFill style={{background: C.bg, color: C.ink, opacity: fade(frame, 150, 558)}}>
      <div style={{position: 'absolute', top: 62, left: 58, right: 58, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <Logo />
        <div style={{fontSize: 20, color: C.sub, fontWeight: 700}}>Jak to działa?</div>
      </div>
      <div style={{position: 'absolute', left: 46, right: 46, top: 150, bottom: 270, borderRadius: 32, background: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 40px 100px rgba(28,34,48,.14)', overflow: 'hidden', opacity: p, transform: `translateY(${interpolate(p,[0,1],[28,0])}px)`}}>
        <div style={{height: 58, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 9, background: '#fbfbfc'}}>
          <div style={{width: 10, height: 10, borderRadius: 99, background: '#ff625a'}}/><div style={{width: 10, height: 10, borderRadius: 99, background: '#ffbe3d'}}/><div style={{width: 10, height: 10, borderRadius: 99, background: '#31c353'}}/>
          <div style={{marginLeft: 14, padding: '8px 14px', borderRadius: 10, background: '#f1f2f5', fontSize: 14, color: '#9a9fab'}}>FlowPilot / wiadomości</div>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '235px 1fr 300px', height: 'calc(100% - 58px)'}}>
          <div style={{borderRight: `1px solid ${C.line}`, padding: 18}}>
            <div style={{fontSize: 20, fontWeight: 850}}>Wiadomości</div>
            <div style={{fontSize: 14, color: C.sub, marginTop: 5}}>Wszystkie kanały</div>
            {[
              ['Michał K.', 'Facebook', '#6978ff'],
              ['Studio Forma', 'Instagram', '#c65be7'],
              ['Klaudia P.', 'Formularz', '#15a97d'],
              ['Anna M.', 'Facebook', '#e38a46'],
            ].map(([name, ch, color], idx) => (
              <div key={name} style={{marginTop: idx === 0 ? 22 : 7, padding: '13px 12px', borderRadius: 15, background: idx === 0 ? C.blueSoft : 'transparent', border: idx === 0 ? '1px solid #dce4ff' : '1px solid transparent'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 9}}><div style={{width: 34, height: 34, borderRadius: 99, background: color}}/><div><div style={{fontSize: 16, fontWeight: 800}}>{name}</div><div style={{fontSize: 13, color: C.sub, marginTop: 2}}>{ch}</div></div></div>
              </div>
            ))}
          </div>
          <div style={{padding: 24, position: 'relative'}}>
            <div style={{fontSize: 17, color: C.sub, fontWeight: 700}}>Rozmowa z Michałem</div>
            <div style={{marginTop: 26, display: 'flex'}}><div style={{maxWidth: 360, padding: '14px 17px', borderRadius: '18px 18px 18px 5px', background: '#f1f2f5', fontSize: 17, lineHeight: 1.35}}>Hej, ile kosztuje automatyzacja odpowiedzi?</div></div>
            <div style={{marginTop: 18, display: 'flex', justifyContent: 'flex-end'}}><div style={{maxWidth: 400, padding: '14px 17px', borderRadius: '18px 18px 5px 18px', background: C.blue, color: '#fff', fontSize: 17, lineHeight: 1.35, minHeight: 72}}>{draft.slice(0, chars)}{typing < 1 ? '▍' : ''}</div></div>
            <div style={{position: 'absolute', left: 24, right: 24, bottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: 14, border: `1px solid ${C.line}`, background: '#fff'}}>
              <div style={{fontSize: 14, color: C.sub}}>Propozycja odpowiedzi gotowa</div>
              <div style={{padding: '10px 16px', borderRadius: 10, background: sent ? C.green : C.blue, color: '#fff', fontSize: 14, fontWeight: 850, opacity: approve}}>{sent ? '✓ Wysłano' : 'Zatwierdź'}</div>
            </div>
          </div>
          <div style={{borderLeft: `1px solid ${C.line}`, padding: 20, background: '#fcfcfd', opacity: ai}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}><div style={{fontSize: 19, fontWeight: 850}}>Asystent FlowPilot</div><div style={{padding: '7px 10px', borderRadius: 999, background: C.greenSoft, color: C.green, fontSize: 12, fontWeight: 800}}>GOTOWE</div></div>
            <div style={{marginTop: 24, fontSize: 14, color: C.sub, fontWeight: 700}}>System sprawdził</div>
            {['przebieg rozmowy', 'ofertę firmy', 'ton komunikacji'].map((x) => <div key={x} style={{marginTop: 11, padding: '12px 13px', borderRadius: 12, background: C.soft, fontSize: 14, fontWeight: 750}}>✓ {x}</div>)}
            <div style={{marginTop: 26, padding: '15px 14px', borderRadius: 13, background: C.blueSoft, color: C.blue, fontSize: 14, lineHeight: 1.35, fontWeight: 750}}>System przygotowuje propozycję.<br/>Nie wysyła jej bez Ciebie.</div>
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', left: 58, right: 58, bottom: 175, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10}}>
        {['1. Wiadomość', '2. Kontekst', '3. Propozycja', '4. Zatwierdzenie'].map((x, i) => <div key={x} style={{padding: '15px 10px', borderRadius: 14, textAlign: 'center', background: i <= Math.min(3, Math.floor(local / 100)) ? C.blue : '#fff', color: i <= Math.min(3, Math.floor(local / 100)) ? '#fff' : C.sub, border: `1px solid ${i <= Math.min(3, Math.floor(local / 100)) ? C.blue : C.line}`, fontSize: 15, fontWeight: 820}}>{x}</div>)}
      </div>
    </AbsoluteFill>
  );
};

const Audience: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame - 545;
  const p1 = pop(local, fps, 0);
  const p2 = pop(local, fps, 20);
  const cards = [
    ['Usługi', 'dużo pytań o terminy i ofertę'],
    ['Sklepy internetowe', 'pytania przed zakupem i po zamówieniu'],
    ['Salony', 'rezerwacje, ceny, dostępność'],
    ['Biura', 'powtarzalne zapytania od klientów'],
    ['Sprzedaż', 'zapytanie trafia od razu do obsługi'],
    ['Zespoły', 'spójne odpowiedzi bez chaosu'],
  ];
  return (
    <AbsoluteFill style={{background: C.dark, color: '#fff', opacity: fade(frame, 545, 770)}}>
      <div style={{position: 'absolute', top: 72, left: 62}}><Logo light /></div>
      <div style={{position: 'absolute', left: 62, right: 62, top: 210, opacity: p1}}>
        <div style={{fontSize: 33, color: '#979ca8', fontWeight: 760}}>NAJWIĘCEJ ZYSKAJĄ FIRMY, KTÓRE…</div>
        <div style={{fontSize: 74, lineHeight: 1, fontWeight: 920, letterSpacing: -4.5, marginTop: 20}}>mają dużo rozmów<br/>i mało czasu.</div>
      </div>
      <div style={{position: 'absolute', left: 62, right: 62, top: 560, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, opacity: p2}}>
        {cards.map(([title, desc]) => <div key={title} style={{padding: '22px 22px', borderRadius: 22, background: '#141821', border: '1px solid #252a35'}}><div style={{fontSize: 27, fontWeight: 880}}>{title}</div><div style={{fontSize: 18, lineHeight: 1.25, color: '#9ca1ac', marginTop: 7}}>{desc}</div></div>)}
      </div>
      <div style={{position: 'absolute', left: 62, right: 62, bottom: 190, padding: '24px 28px', borderRadius: 22, background: '#fff', color: C.ink, opacity: p2}}><div style={{fontSize: 30, fontWeight: 880}}>Szybciej odpowiadasz.</div><div style={{fontSize: 22, color: C.sub, marginTop: 7}}>Ale decyzja o wysłaniu nadal należy do Ciebie.</div></div>
    </AbsoluteFill>
  );
};

const CTA: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame - 755;
  const p = pop(local, fps, 0);
  return (
    <AbsoluteFill style={{background: '#f3f4f7', color: C.ink, opacity: fade(frame, 755, 900)}}>
      <div style={{position: 'absolute', top: 78, left: 62}}><Logo /></div>
      <div style={{position: 'absolute', left: 62, right: 62, top: 350, opacity: p}}>
        <div style={{fontSize: 34, color: C.sub, fontWeight: 760}}>CHCESZ ZOBACZYĆ TO W SWOJEJ FIRMIE?</div>
        <div style={{fontSize: 104, lineHeight: .92, fontWeight: 940, letterSpacing: -6, marginTop: 24}}>NAPISZ<br/><span style={{color: C.blue}}>FLOW</span></div>
        <div style={{fontSize: 34, lineHeight: 1.2, color: C.sub, marginTop: 34, fontWeight: 700}}>Pokażemy Ci dokładnie, jak wygląda<br/>obsługa jednej rozmowy krok po kroku.</div>
        <div style={{marginTop: 62, padding: '26px 30px', borderRadius: 22, background: C.blue, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 24px 60px rgba(51,92,255,.25)'}}><div style={{fontSize: 32, fontWeight: 900}}>Wyślij wiadomość: FLOW</div><div style={{fontSize: 45}}>→</div></div>
      </div>
    </AbsoluteFill>
  );
};

type FlowPilotExplainerProps = {
  voiceover?: boolean;
  captions?: boolean;
};

export const FlowPilotExplainer: React.FC<FlowPilotExplainerProps> = ({voiceover = true, captions = true}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'}}>
      <Audio src={staticFile('audio/bed.wav')} volume={0.045} />
      {voiceover ? <Sequence from={8}><Audio src={VOICEOVER} volume={1} /></Sequence> : null}
      <Sequence from={174} durationInFrames={18}><Audio src={staticFile('audio/notif.wav')} volume={0.34} /></Sequence>
      <Sequence from={462} durationInFrames={12}><Audio src={staticFile('audio/click.wav')} volume={0.36} /></Sequence>
      <Sequence from={500} durationInFrames={20}><Audio src={staticFile('audio/success.wav')} volume={0.32} /></Sequence>
      <Hook frame={frame} />
      <InboxDemo frame={frame} />
      <Audience frame={frame} />
      <CTA frame={frame} />
      {captions ? <Caption frame={frame} /> : null}
    </AbsoluteFill>
  );
};