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
  'https://storage.googleapis.com/adm--audio-playback--7d--public/mcp-preview/b408bc00-2b85-46a7-af23-1fd4d3d51919.mp3';

const C = {
  ink: '#101114',
  text: '#17181c',
  sub: '#6f7480',
  line: '#e7e9ee',
  soft: '#f5f6f8',
  white: '#ffffff',
  blue: '#335cff',
  blueSoft: '#eef2ff',
  green: '#119b69',
  greenSoft: '#eaf8f2',
  red: '#dc4052',
  redSoft: '#fff0f2',
  dark: '#090b10',
};

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const appear = (frame: number, fps: number, delay = 0, damping = 18) =>
  spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {damping, stiffness: 180, mass: 0.72},
  });

const sceneOpacity = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, start + 8, end - 8, end], [0, 1, 1, 0], clamp);

const Logo: React.FC<{light?: boolean}> = ({light = false}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 11,
        background: C.blue,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(51,92,255,.28)',
      }}
    >
      <div style={{width: 14, height: 14, borderRadius: 99, border: '4px solid white', borderTopColor: 'transparent'}} />
    </div>
    <div style={{fontSize: 28, fontWeight: 850, letterSpacing: -1, color: light ? C.white : C.ink}}>FlowPilot</div>
  </div>
);

const PageShell: React.FC<React.PropsWithChildren<{dark?: boolean}>> = ({dark = false, children}) => (
  <AbsoluteFill
    style={{
      background: dark ? C.dark : '#f3f4f7',
      color: dark ? C.white : C.text,
      fontFamily: 'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      overflow: 'hidden',
    }}
  >
    {children}
  </AbsoluteFill>
);

const StatusPill: React.FC<{children: React.ReactNode; kind?: 'green' | 'blue' | 'red'}> = ({children, kind = 'blue'}) => {
  const map = {
    blue: {bg: C.blueSoft, fg: C.blue},
    green: {bg: C.greenSoft, fg: C.green},
    red: {bg: C.redSoft, fg: C.red},
  };
  const s = map[kind];
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 999, background: s.bg, color: s.fg, fontSize: 20, fontWeight: 760}}>
      {children}
    </div>
  );
};

const HookScene: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame;
  const p1 = appear(local, fps, 0);
  const p2 = appear(local, fps, 15);
  const p3 = appear(local, fps, 38);
  const card = appear(local, fps, 8);
  const timer = Math.max(0, Math.floor((frame - 28) / 15));

  return (
    <PageShell dark>
      <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 0, 135)}}>
        <div style={{position: 'absolute', left: 62, right: 62, top: 70, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: p1}}>
          <Logo light />
          <div style={{fontSize: 19, color: '#9196a3', fontWeight: 700}}>AI inbox • sprzedaż • obsługa</div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: 210,
            left: 62,
            right: 62,
            padding: '30px 34px',
            borderRadius: 30,
            background: '#141821',
            border: '1px solid #252a35',
            boxShadow: '0 34px 90px rgba(0,0,0,.35)',
            opacity: card,
            transform: `translateY(${interpolate(card, [0, 1], [-24, 0])}px)`,
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
            <div style={{width: 58, height: 58, borderRadius: 99, background: 'linear-gradient(135deg,#6d7cff,#a47cff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 850}}>MK</div>
            <div style={{flex: 1}}>
              <div style={{fontSize: 26, fontWeight: 800}}>Michał K. • Messenger</div>
              <div style={{fontSize: 24, color: '#b9bdc7', marginTop: 5}}>„Hej, ile kosztuje automatyzacja odpowiedzi?”</div>
            </div>
            <div style={{width: 14, height: 14, borderRadius: 99, background: '#ff5668', boxShadow: '0 0 0 7px rgba(255,86,104,.12)'}} />
          </div>
        </div>

        <div style={{position: 'absolute', left: 62, right: 62, top: 560, opacity: p2, transform: `translateY(${interpolate(p2, [0, 1], [38, 0])}px)`}}>
          <div style={{fontSize: 34, color: '#9297a5', fontWeight: 720, letterSpacing: -1}}>KLIENT PISZE TERAZ.</div>
          <div style={{fontSize: 104, lineHeight: .94, fontWeight: 930, letterSpacing: -6, marginTop: 18}}>
            TY ODPISZESZ
            <br />
            ZA GODZINĘ?
          </div>
        </div>

        <div style={{position: 'absolute', left: 62, right: 62, top: 960, display: 'flex', alignItems: 'center', gap: 24, opacity: p3}}>
          <div style={{padding: '18px 24px', borderRadius: 20, background: 'rgba(220,64,82,.10)', border: '1px solid rgba(220,64,82,.28)', color: '#ff7d8c', fontSize: 44, fontWeight: 900, letterSpacing: -2}}>
            00:00:{String(timer).padStart(2, '0')}
          </div>
          <div style={{fontSize: 31, lineHeight: 1.12, color: '#c6cad2', fontWeight: 700}}>Każda minuta to szansa,
            <br />że kupi gdzie indziej.</div>
        </div>

        <div style={{position: 'absolute', left: 62, right: 62, bottom: 195, height: 1, background: '#252936'}} />
        <div style={{position: 'absolute', left: 62, right: 62, bottom: 118, display: 'flex', justifyContent: 'space-between', color: '#777d89', fontSize: 19, fontWeight: 650}}>
          <span>FlowPilot • intelligent customer inbox</span>
          <span>01 / 04</span>
        </div>
      </div>
    </PageShell>
  );
};

const IconSquare: React.FC<{label: string; active?: boolean}> = ({label, active}) => (
  <div style={{width: 44, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? '#20253a' : 'transparent', color: active ? '#fff' : '#8e94a1', fontSize: 18, fontWeight: 820}}>{label}</div>
);

const Avatar: React.FC<{label: string; bg: string}> = ({label, bg}) => (
  <div style={{width: 42, height: 42, borderRadius: 99, background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 850, flex: '0 0 auto'}}>{label}</div>
);

const ConversationRow: React.FC<{name: string; text: string; active?: boolean; time: string; avatar: string; bg: string}> = ({name, text, active, time, avatar, bg}) => (
  <div style={{padding: '17px 16px', borderRadius: 16, background: active ? '#f2f5ff' : 'transparent', border: active ? '1px solid #dce4ff' : '1px solid transparent', display: 'flex', gap: 11, alignItems: 'flex-start'}}>
    <Avatar label={avatar} bg={bg} />
    <div style={{minWidth: 0, flex: 1}}>
      <div style={{display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center'}}>
        <div style={{fontSize: 18, fontWeight: 800, whiteSpace: 'nowrap'}}>{name}</div>
        <div style={{fontSize: 13, color: C.sub}}>{time}</div>
      </div>
      <div style={{fontSize: 15, lineHeight: 1.28, color: C.sub, marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{text}</div>
    </div>
  </div>
);

const Message: React.FC<{children: React.ReactNode; mine?: boolean}> = ({children, mine = false}) => (
  <div style={{display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginTop: 16}}>
    <div style={{maxWidth: 420, padding: '15px 18px', borderRadius: mine ? '18px 18px 5px 18px' : '18px 18px 18px 5px', background: mine ? C.blue : '#f1f2f5', color: mine ? '#fff' : C.text, fontSize: 17, lineHeight: 1.35, fontWeight: 590}}>
      {children}
    </div>
  </div>
);

const AppWindow: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame - 115;
  const win = appear(local, fps, 0);
  const draft = appear(local, fps, 38);
  const draftText = 'Jasne. Najpierw sprawdzimy, ile wiadomości obsługujesz i zbudujemy prosty przepływ dla Messengera. Mogę pokazać Ci demo na Twoim przykładzie.';
  const typing = interpolate(local, [40, 105], [0, 1], clamp);
  const chars = Math.floor(draftText.length * typing);
  const approved = local > 150;
  const sendPulse = appear(local, fps, 150);
  const cursorP = interpolate(local, [108, 145], [0, 1], clamp);
  const cursorX = interpolate(cursorP, [0, 1], [810, 874]);
  const cursorY = interpolate(cursorP, [0, 1], [590, 655]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 48,
        right: 48,
        top: 100,
        bottom: 315,
        borderRadius: 32,
        background: C.white,
        border: '1px solid #dfe2e8',
        boxShadow: '0 44px 110px rgba(23,28,40,.16)',
        overflow: 'hidden',
        opacity: win,
        transform: `translateY(${interpolate(win, [0, 1], [30, 0])}px) scale(${interpolate(win, [0, 1], [.975, 1])})`,
      }}
    >
      <div style={{height: 58, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10, background: '#fbfbfc'}}>
        <div style={{width: 10, height: 10, borderRadius: 99, background: '#ff625a'}} />
        <div style={{width: 10, height: 10, borderRadius: 99, background: '#ffbe3d'}} />
        <div style={{width: 10, height: 10, borderRadius: 99, background: '#31c353'}} />
        <div style={{marginLeft: 16, height: 32, width: 470, borderRadius: 10, background: '#f1f2f5', display: 'flex', alignItems: 'center', padding: '0 13px', color: '#9a9fab', fontSize: 14}}>app.flowpilot.ai / inbox</div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '72px 270px 1fr 285px', height: 'calc(100% - 58px)'}}>
        <div style={{background: '#11141d', padding: '18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
          <div style={{width: 42, height: 42, borderRadius: 13, background: C.blue, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><div style={{width: 14, height: 14, borderRadius: 99, border: '4px solid white', borderTopColor: 'transparent'}} /></div>
          <IconSquare label="IN" active />
          <IconSquare label="AI" />
          <IconSquare label="CL" />
          <IconSquare label="⚙" />
          <div style={{flex: 1}} />
          <Avatar label="DS" bg="#353a48" />
        </div>

        <div style={{borderRight: `1px solid ${C.line}`, padding: 18, overflow: 'hidden'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontSize: 20, fontWeight: 850}}>Inbox</div>
            <StatusPill>12 nowych</StatusPill>
          </div>
          <div style={{height: 36, borderRadius: 11, background: C.soft, marginTop: 18, padding: '0 12px', color: '#a1a5ae', display: 'flex', alignItems: 'center', fontSize: 14}}>Szukaj rozmów</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 5, marginTop: 13}}>
            <ConversationRow name="Michał K." text="Hej, ile kosztuje automatyzacja…" active time="teraz" avatar="MK" bg="linear-gradient(135deg,#6978ff,#ad7bff)" />
            <ConversationRow name="Studio Forma" text="Możemy umówić demo?" time="3m" avatar="SF" bg="#0aa87f" />
            <ConversationRow name="Klaudia P." text="Czy działa też na Instagramie?" time="8m" avatar="KP" bg="#f0774d" />
            <ConversationRow name="Auto-Lux" text="Wyślij proszę ofertę" time="12m" avatar="AL" bg="#3856c9" />
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', minWidth: 0}}>
          <div style={{height: 78, borderBottom: `1px solid ${C.line}`, padding: '0 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <Avatar label="MK" bg="linear-gradient(135deg,#6978ff,#ad7bff)" />
              <div>
                <div style={{fontSize: 18, fontWeight: 850}}>Michał K.</div>
                <div style={{fontSize: 13, color: C.sub, marginTop: 2}}>Messenger • aktywny teraz</div>
              </div>
            </div>
            <StatusPill kind="green">● lead aktywny</StatusPill>
          </div>
          <div style={{padding: '24px 25px', flex: 1, background: '#fff'}}>
            <div style={{fontSize: 13, color: '#a0a4ad', fontWeight: 700, textAlign: 'center'}}>DZISIAJ • 08:01</div>
            <Message>Hej, ile kosztuje automatyzacja odpowiedzi na Messengerze?</Message>
            <Message>Chodzi mi o to, żeby nie tracić klientów, kiedy nie jestem przy telefonie.</Message>
          </div>
          <div style={{padding: 18, borderTop: `1px solid ${C.line}`, background: '#fbfbfc'}}>
            <div style={{border: `1px solid ${approved ? '#a9dfc7' : '#d9dce3'}`, borderRadius: 16, background: approved ? '#fbfffd' : '#fff', padding: '14px 15px'}}>
              <div style={{fontSize: 16, lineHeight: 1.4, color: '#4b4f58', minHeight: 48}}>{approved ? draftText : 'Napisz wiadomość…'}</div>
              <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center'}}>
                <div style={{display: 'flex', gap: 8, color: '#9398a3', fontSize: 16}}><span>＋</span><span>☺</span><span>↗</span></div>
                <div style={{padding: '9px 14px', borderRadius: 10, background: approved ? C.green : '#e9ebef', color: approved ? '#fff' : '#a2a6ae', fontSize: 14, fontWeight: 800}}>{approved ? 'Wysłano ✓' : 'Wyślij'}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{borderLeft: `1px solid ${C.line}`, background: '#fbfbfc', padding: 18}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontSize: 17, fontWeight: 850}}>FlowPilot AI</div>
            <div style={{width: 8, height: 8, borderRadius: 99, background: '#25b878'}} />
          </div>
          <div style={{fontSize: 13, color: C.sub, marginTop: 4}}>Sugestia odpowiedzi</div>

          <div style={{marginTop: 18, padding: 16, borderRadius: 17, background: '#fff', border: `1px solid ${C.line}`, boxShadow: '0 10px 30px rgba(40,45,60,.05)', opacity: draft, transform: `translateY(${interpolate(draft, [0, 1], [16, 0])}px)`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.green, fontWeight: 800}}><span style={{width: 7, height: 7, borderRadius: 99, background: C.green}} /> GOTOWY DRAFT</div>
            <div style={{fontSize: 15, lineHeight: 1.45, color: '#373b43', marginTop: 11, minHeight: 122}}>{draftText.slice(0, chars)}{typing < 1 ? '▍' : ''}</div>
            <div style={{display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 14}}>
              <StatusPill>kontekst</StatusPill>
              <StatusPill>ton marki</StatusPill>
            </div>
          </div>

          <div style={{marginTop: 14, padding: 15, borderRadius: 16, border: `1px solid ${C.line}`, background: '#fff', opacity: draft}}>
            <div style={{fontSize: 12, color: C.sub, fontWeight: 750}}>DLACZEGO TA ODPOWIEDŹ?</div>
            <div style={{fontSize: 13, lineHeight: 1.42, color: '#5e626c', marginTop: 9}}>Klient pyta o cenę, ale najpierw warto ustalić zakres i zaprosić go do krótkiego demo.</div>
          </div>

          <div style={{display: 'flex', gap: 8, marginTop: 14, opacity: draft}}>
            <div style={{flex: 1, padding: '11px 10px', borderRadius: 11, border: `1px solid ${C.line}`, background: '#fff', textAlign: 'center', fontSize: 13, fontWeight: 780, color: '#5e626c'}}>Edytuj</div>
            <div style={{flex: 1.45, padding: '11px 10px', borderRadius: 11, background: approved ? C.green : C.blue, color: '#fff', textAlign: 'center', fontSize: 13, fontWeight: 820, boxShadow: approved ? '0 10px 24px rgba(17,155,105,.2)' : '0 10px 24px rgba(51,92,255,.22)', transform: `scale(${1 + 0.025 * sendPulse})`}}>{approved ? 'Zatwierdzono ✓' : 'Zatwierdź'}</div>
          </div>
        </div>
      </div>

      {local >= 105 && local < 165 ? (
        <div style={{position: 'absolute', left: cursorX, top: cursorY, width: 24, height: 31, zIndex: 40, transform: `rotate(-12deg) scale(${local > 144 && local < 152 ? .82 : 1})`, filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.24))'}}>
          <div style={{width: 0, height: 0, borderLeft: '11px solid transparent', borderRight: '11px solid transparent', borderBottom: '28px solid #111', transform: 'rotate(-35deg)'}} />
        </div>
      ) : null}
    </div>
  );
};

const ProductScene: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame - 115;
  const label = appear(local, fps, 5);

  return (
    <PageShell>
      <div style={{position: 'absolute', inset: 0, opacity: sceneOpacity(frame, 110, 430)}}>
        <div style={{position: 'absolute', left: 54, right: 54, top: 39, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: label}}>
          <div style={{fontSize: 22, color: C.sub, fontWeight: 720}}>PRAWDZIWY PRZEPŁYW. ZERO AUTOPILOTA BEZ KONTROLI.</div>
          <StatusPill kind="green">● AI gotowe</StatusPill>
        </div>
        <AppWindow frame={frame} />
        <div style={{position: 'absolute', left: 54, right: 54, bottom: 112, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <div style={{fontSize: 26, fontWeight: 850}}>AI układa odpowiedź. Ty decydujesz, co wychodzi do klienta.</div>
            <div style={{fontSize: 20, color: C.sub, marginTop: 7}}>Kontekst rozmowy + zasady Twojej firmy + ręczna akceptacja.</div>
          </div>
          <div style={{fontSize: 18, color: '#a2a6af', fontWeight: 650}}>02 / 04</div>
        </div>
      </div>
    </PageShell>
  );
};

const ResultScene: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame - 410;
  const p1 = appear(local, fps, 0);
  const p2 = appear(local, fps, 15);
  const p3 = appear(local, fps, 30);
  const p4 = appear(local, fps, 46);

  const cards = [
    {kicker: 'CZAS ODPOWIEDZI', old: '58 min', next: '2 min', note: 'draft czeka, zanim otworzysz inbox'},
    {kicker: 'KONTEKST', old: 'szukasz', next: 'gotowy', note: 'AI widzi rozmowę i zasady marki'},
    {kicker: 'WYSYŁKA', old: 'automat', next: 'po akceptacji', note: 'ostatnie słowo zawsze należy do Ciebie'},
  ];

  return (
    <PageShell dark>
      <div style={{position: 'absolute', inset: 0, padding: '92px 60px 120px', opacity: sceneOpacity(frame, 405, 555)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: p1}}><Logo light /><span style={{fontSize: 18, color: '#797f8d', fontWeight: 650}}>03 / 04</span></div>
        <div style={{marginTop: 92, opacity: p2}}>
          <div style={{fontSize: 27, color: '#858b98', fontWeight: 760}}>NIE CHODZI O „WIĘCEJ AI”.</div>
          <div style={{fontSize: 86, lineHeight: .96, fontWeight: 920, letterSpacing: -5, marginTop: 15}}>CHODZI O TO,
            <br />ŻEBY NIE TRACIĆ
            <br /><span style={{color: '#6f8cff'}}>GORĄCEGO LEADA.</span></div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 14, marginTop: 68}}>
          {cards.map((card, i) => {
            const p = i === 0 ? p2 : i === 1 ? p3 : p4;
            return (
              <div key={card.kicker} style={{display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, padding: '24px 25px', borderRadius: 22, background: '#12151d', border: '1px solid #242934', opacity: p, transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px)`}}>
                <div>
                  <div style={{fontSize: 14, color: '#777e8c', fontWeight: 850, letterSpacing: .7}}>{card.kicker}</div>
                  <div style={{display: 'flex', alignItems: 'baseline', gap: 13, marginTop: 8}}><span style={{fontSize: 29, color: '#707784', textDecoration: 'line-through'}}>{card.old}</span><span style={{fontSize: 40, fontWeight: 900, color: '#fff'}}>{card.next}</span></div>
                </div>
                <div style={{fontSize: 20, lineHeight: 1.35, color: '#b8bdc7', display: 'flex', alignItems: 'center'}}>{card.note}</div>
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
};

const CtaScene: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const local = frame - 535;
  const p1 = appear(local, fps, 0);
  const p2 = appear(local, fps, 12);
  const p3 = appear(local, fps, 26);
  const glow = 0.5 + 0.5 * Math.sin(local / 10);

  return (
    <PageShell>
      <div style={{position: 'absolute', inset: 0, padding: '92px 62px 115px', opacity: sceneOpacity(frame, 530, 660)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: p1}}><Logo /><span style={{fontSize: 18, color: '#a0a4ad', fontWeight: 650}}>04 / 04</span></div>
        <div style={{marginTop: 160, opacity: p2}}>
          <div style={{fontSize: 31, color: C.sub, fontWeight: 760}}>ZOBACZ TO NA SWOICH WIADOMOŚCIACH.</div>
          <div style={{fontSize: 104, lineHeight: .93, fontWeight: 930, letterSpacing: -6, marginTop: 20}}>NAPISZ
            <br /><span style={{color: C.blue}}>FLOW.</span></div>
          <div style={{fontSize: 32, lineHeight: 1.28, color: '#4d515a', fontWeight: 650, marginTop: 35, maxWidth: 820}}>Pokażemy Ci, jak FlowPilot może obsługiwać Messenger i Instagram w Twojej firmie — zanim kupisz.</div>
        </div>

        <div style={{marginTop: 70, display: 'flex', gap: 14, opacity: p3}}>
          <div style={{flex: 1, height: 92, borderRadius: 21, background: '#fff', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 24px', fontSize: 27, color: '#8b909a', boxShadow: '0 18px 55px rgba(30,35,50,.08)'}}>Napisz wiadomość…</div>
          <div style={{width: 180, height: 92, borderRadius: 21, background: C.blue, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 27, fontWeight: 850, boxShadow: `0 18px ${45 + glow * 20}px rgba(51,92,255,.28)`}}>FLOW →</div>
        </div>

        <div style={{position: 'absolute', left: 62, right: 62, bottom: 112, display: 'flex', alignItems: 'center', gap: 12, color: '#7d828c', fontSize: 19, fontWeight: 650, opacity: p3}}>
          <span style={{width: 8, height: 8, borderRadius: 99, background: C.green}} /> Demo • bez zobowiązań • konkretny proces dla Twojej firmy
        </div>
      </div>
    </PageShell>
  );
};

const Caption: React.FC<{frame: number}> = ({frame}) => {
  const items = [
    {from: 10, to: 74, text: 'Klient napisał właśnie teraz.'},
    {from: 74, to: 142, text: 'Ty odpiszesz za godzinę?'},
    {from: 142, to: 235, text: 'W tym czasie może już kupić u konkurencji.'},
    {from: 235, to: 332, text: 'FlowPilot czyta wiadomość i przygotowuje odpowiedź.'},
    {from: 332, to: 409, text: 'Ty sprawdzasz. Zatwierdzasz. Gotowe.'},
    {from: 409, to: 515, text: 'Szybciej odpowiadasz. Mniej leadów przepada.'},
    {from: 515, to: 645, text: 'Chcesz zobaczyć demo? Napisz: FLOW.'},
  ];
  const current = items.find((x) => frame >= x.from && frame < x.to);
  if (!current) return null;
  const local = frame - current.from;
  const p = interpolate(local, [0, 6], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, bottom: 210, display: 'flex', justifyContent: 'center', zIndex: 80, pointerEvents: 'none', opacity: p, transform: `translateY(${interpolate(p, [0, 1], [12, 0])}px)`}}>
      <div style={{padding: '13px 19px', borderRadius: 14, background: 'rgba(8,10,14,.88)', color: '#fff', fontSize: 30, lineHeight: 1.16, fontWeight: 800, textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.16)'}}>{current.text}</div>
    </div>
  );
};

export const FlowPilotAdFinal: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Audio src={staticFile('audio/bed.wav')} volume={0.055} />
      <Sequence from={8}>
        <Audio src={VOICEOVER} volume={1} />
      </Sequence>
      <Sequence from={10} durationInFrames={22}><Audio src={staticFile('audio/notif.wav')} volume={0.52} /></Sequence>
      <Sequence from={265} durationInFrames={12}><Audio src={staticFile('audio/click.wav')} volume={0.34} /></Sequence>
      <Sequence from={292} durationInFrames={20}><Audio src={staticFile('audio/success.wav')} volume={0.34} /></Sequence>

      {frame < 135 ? <HookScene frame={frame} /> : null}
      {frame >= 110 && frame < 430 ? <ProductScene frame={frame} /> : null}
      {frame >= 405 && frame < 555 ? <ResultScene frame={frame} /> : null}
      {frame >= 530 ? <CtaScene frame={frame} /> : null}
      <Caption frame={frame} />
    </AbsoluteFill>
  );
};
