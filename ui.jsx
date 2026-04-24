// =============================================
// SUBASTA v2 — Shared UI Components (no emojis)
// =============================================
const { useState, useEffect, useRef, useCallback } = React;

// ── THEME ────────────────────────────────────
const GOLD        = 'oklch(72% 0.14 75deg)';
const GOLD_LIGHT  = 'oklch(86% 0.12 75deg)';
const GOLD_DIM    = 'oklch(52% 0.10 75deg)';
const RED         = 'oklch(55% 0.20 25deg)';
const GREEN_CLR   = 'oklch(62% 0.18 145deg)';
const BG          = '#080503';
const BG_CARD     = '#110a03';
const BG_CARD2    = '#1c1207';
const BORDER      = '#2a1800';
const BORDER2     = '#3a2400';

const fmt     = (n) => { const a=Math.abs(n); return a>=1e6?`$${(n/1e6).toFixed(2)}M`:a>=1000?`$${(n/1000).toFixed(0)}K`:`$${n}`; };
const fmtFull = (n) => (n<0?'-':'')+'$'+Math.abs(Math.round(n)).toLocaleString('es-MX');
const seededRand = (s) => { const x=Math.sin(s*9301+49297)*233280; return x-Math.floor(x); };

// ── SVG ICONS ────────────────────────────────
const Ico = ({ name, size=18, color='currentColor', strokeWidth=1.8 }) => {
  const paths = {
    'trending-up':    <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
    'home':           <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    'store':          <><path d="M2 7h20v14H2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/><path d="M2 7l2-4h16l2 4"/></>,
    'file-text':      <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    'zap':            <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    'layers':         <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    'lock':           <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    'check':          <><polyline points="20 6 9 17 4 12"/></>,
    'x':              <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    'chevron-right':  <><polyline points="9 18 15 12 9 6"/></>,
    'arrow-right':    <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    'users':          <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    'crown':          <><path d="M2 20h20M5 20V8l7-5 7 5v12"/><path d="M9 20v-6h6v6"/></>,
    'shield':         <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    'alert-triangle': <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    'clock':          <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    'dollar-sign':    <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    'refresh':        <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>,
    'package':        <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    'eye':            <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    'help-circle':    <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    'star':           <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    'copy':           <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
    'log-out':        <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  };
  const invIconMap = { stocks:'trending-up', realestate:'home', business:'store', bonds:'file-text', crypto:'zap', commodities:'layers' };
  const resolved = invIconMap[name] || name;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{display:'inline-block',verticalAlign:'middle',flexShrink:0}}>
      {paths[resolved] || null}
    </svg>
  );
};

// ── AVATAR (initials) ────────────────────────
const FALLBACK_COLORS = [{bg:'#2a1800',fg:'#DAA520'},{bg:'#001a3a',fg:'#60a0ff'},{bg:'#001a0a',fg:'#40c070'},{bg:'#2a0000',fg:'#ff6060'},{bg:'#1a0028',fg:'#c080ff'},{bg:'#001a1a',fg:'#40c0c0'}];
function Avatar({ name, colorIndex=0, size=40 }) {
  const safeName = (name && typeof name === 'string' && name.trim()) ? name.trim() : '?';
  const colors = (GD && GD.PLAYER_COLORS) ? GD.PLAYER_COLORS : FALLBACK_COLORS;
  const c = colors[(colorIndex||0) % colors.length] || {bg:'#2a1800',fg:'#DAA520'};
  const initials = safeName.slice(0,2).toUpperCase();
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:c.bg, display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'Playfair Display',serif",
      fontSize:Math.round(size*0.36), fontWeight:700, color:c.fg,
      letterSpacing:'-0.02em', boxShadow:`0 2px 8px rgba(0,0,0,0.5)`,
    }}>{initials}</div>
  );
}

// ── GOLD BUTTON ──────────────────────────────
function GoldBtn({ children, onClick, disabled, variant='primary', size='md', style={} }) {
  const [hover, setHover] = useState(false);
  const V = {
    primary:   { background: hover?'linear-gradient(135deg,#e6c200,#ffe44d,#e6a800)':'linear-gradient(135deg,#B8860B,#DAA520,#B8860B)', color:'#080503', border:'none' },
    secondary: { background:'transparent', border:`1px solid ${GOLD_DIM}`, color:GOLD_DIM },
    danger:    { background: hover?'linear-gradient(135deg,#a00,#e82,#a00)':'linear-gradient(135deg,#700,#b01,#700)', color:'#fff', border:'none' },
    ghost:     { background:'transparent', border:`1px solid ${BORDER}`, color:'#666' },
    subtle:    { background:BG_CARD2, border:`1px solid ${BORDER}`, color:GOLD_DIM },
  };
  const SZ = { sm:'6px 14px', md:'10px 22px', lg:'14px 32px', xl:'16px 44px' };
  const FS = { sm:12, md:14, lg:16, xl:17 };
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ ...V[variant], padding:SZ[size], borderRadius:4,
        fontFamily:"'Playfair Display',serif", fontSize:FS[size], fontWeight:600,
        cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.4:1,
        letterSpacing:'0.04em', transition:'all 0.15s', ...style }}>
      {children}
    </button>
  );
}

// ── CARD ─────────────────────────────────────
function Card({ children, style={}, glow=false, onClick, hover=false }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={()=>hover&&setH(true)} onMouseLeave={()=>hover&&setH(false)}
      style={{
        background:BG_CARD, border:`1px solid ${(glow||h)?GOLD:BORDER}`, borderRadius:8,
        padding:20, transition:'border-color 0.2s, box-shadow 0.2s',
        boxShadow:(glow||h)?`0 0 24px rgba(218,165,32,0.2)`:'0 4px 20px rgba(0,0,0,0.6)',
        cursor:onClick?'pointer':'default', ...style
      }}>{children}</div>
  );
}

// ── TITLES ───────────────────────────────────
function GoldTitle({ children, size='md', style={}, tag='h2' }) {
  const FS = { xs:13, sm:17, md:24, lg:32, xl:48, xxl:64 };
  const Tag = tag;
  return (
    <Tag style={{ fontFamily:"'Playfair Display',serif", color:GOLD,
      fontSize:FS[size]||24, margin:0, letterSpacing:'0.05em',
      textShadow:`0 0 30px rgba(218,165,32,0.3)`, ...style }}>
      {children}
    </Tag>
  );
}

// ── MONEY DISPLAY ────────────────────────────
function MoneyDisplay({ amount, size='md', style={} }) {
  const FS = { sm:13, md:19, lg:27, xl:40 };
  return (
    <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
      color:amount>=0?GOLD:RED, fontSize:FS[size]||19, ...style }}>
      {fmtFull(amount)}
    </span>
  );
}

// ── DIVIDER ──────────────────────────────────
function GoldDivider() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 0' }}>
      <div style={{ flex:1, height:'1px', background:`linear-gradient(90deg,transparent,${GOLD_DIM})` }}/>
      <div style={{ width:6, height:6, transform:'rotate(45deg)', background:GOLD_DIM }}/>
      <div style={{ flex:1, height:'1px', background:`linear-gradient(90deg,${GOLD_DIM},transparent)` }}/>
    </div>
  );
}

// ── RISK DIAMONDS ────────────────────────────
function Risk({ level, max=5 }) {
  return (
    <div style={{ display:'flex', gap:4, alignItems:'center' }}>
      {Array.from({length:max}).map((_,i)=>(
        <div key={i} style={{ width:7, height:7, transform:'rotate(45deg)',
          background: i<level ? GOLD : 'transparent',
          border:`1px solid ${i<level?GOLD:BORDER2}`,
          transition:'background 0.2s' }}/>
      ))}
    </div>
  );
}

// ── SPARKLINE ────────────────────────────────
function Sparkline({ prices, width=180, height=52 }) {
  if (!prices||prices.length<2) return null;
  const min=Math.min(...prices), max=Math.max(...prices), range=max-min||1;
  const pts = prices.map((p,i)=>[
    (i/(prices.length-1))*width,
    height-((p-min)/range)*(height-8)-4
  ]);
  const isUp = prices[prices.length-1]>=prices[0];
  const lc = isUp ? GREEN_CLR : RED;
  const ptsStr = pts.map(([x,y])=>`${x},${y}`).join(' ');
  const area = `M${pts[0].join(',')} ${pts.slice(1).map(([x,y])=>`L${x},${y}`).join(' ')} L${width},${height} L0,${height} Z`;
  const uid = `sp${Math.abs(Math.round(prices[0]*7+prices.length*13))}`;
  return (
    <svg width={width} height={height} style={{display:'block',overflow:'visible'}}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lc} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={lc} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${uid})`}/>
      <polyline points={ptsStr} fill="none" stroke={lc} strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={lc}/>
    </svg>
  );
}

// ── ROULETTE WHEEL ───────────────────────────
function RouletteWheel({ slots, targetIndex, onSpinEnd }) {
  const [totalRot, setTotalRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const rotRef = useRef(0);

  const spin = useCallback(() => {
    if (spinning||done) return;
    setSpinning(true);
    const n = slots.length, slotAngle = 360/n;
    const targetDeg = ((360-(targetIndex+0.5)*slotAngle)%360+360)%360;
    const currentMod = ((rotRef.current%360)+360)%360;
    const diff = ((targetDeg-currentMod)+360)%360;
    const newRot = rotRef.current + diff + 7*360;
    rotRef.current = newRot;
    setTotalRot(newRot);
    setTimeout(()=>{ setSpinning(false); setDone(true); onSpinEnd?.(); }, 5000);
  },[spinning,done,slots,targetIndex,onSpinEnd]);

  const n = slots.length, slotAngle = 360/n;
  const golds = ['oklch(58% 0.14 75deg)','oklch(63% 0.15 73deg)','oklch(54% 0.12 77deg)',
                 'oklch(60% 0.14 74deg)','oklch(66% 0.15 72deg)'];
  const darks = ['#1e1000','#150a00','#1a0d00','#120800','#1c0f00'];
  const gradParts = slots.map((_,i)=>{
    const s=i*slotAngle, e=(i+1)*slotAngle, mid=(s+e)/2;
    return `${golds[i%golds.length]} ${s}deg ${mid}deg, ${darks[i%darks.length]} ${mid}deg ${e}deg`;
  }).join(', ');

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
      {/* pointer */}
      <div style={{width:0,height:0,borderLeft:'9px solid transparent',borderRight:'9px solid transparent',
        borderTop:`18px solid ${GOLD}`,filter:`drop-shadow(0 0 6px ${GOLD})`}}/>
      <div style={{position:'relative',width:300,height:300}}>
        <div style={{position:'absolute',inset:-5,borderRadius:'50%',
          border:`5px solid ${GOLD}`,boxShadow:`0 0 28px rgba(218,165,32,0.45),inset 0 0 12px rgba(218,165,32,0.08)`}}/>
        <div style={{
          width:'100%',height:'100%',borderRadius:'50%',
          background:`conic-gradient(${gradParts})`,
          transform:`rotate(${totalRot}deg)`,
          transition:spinning?'transform 5s cubic-bezier(0.1,0.85,0.18,1)':'none',
          cursor:(!spinning&&!done)?'pointer':'default',
        }} onClick={spin}>
          {slots.map((slot,i)=>{
            const angle=i*slotAngle+slotAngle/2;
            const rad=(angle-90)*Math.PI/180, r=108;
            const x=150+r*Math.cos(rad), y=150+r*Math.sin(rad);
            return (
              <div key={i} style={{
                position:'absolute',left:x,top:y,
                transform:`translate(-50%,-50%) rotate(${angle}deg)`,
                color:GOLD_LIGHT,fontFamily:"'Playfair Display',serif",
                fontSize:10,fontWeight:700,whiteSpace:'nowrap',
                textShadow:'0 1px 4px rgba(0,0,0,0.9)',pointerEvents:'none',
              }}>{slot.label}</div>
            );
          })}
        </div>
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
          width:48,height:48,borderRadius:'50%',background:'radial-gradient(circle,#2a1800,#0a0500)',
          border:`2px solid ${GOLD}`,display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:`0 0 14px rgba(218,165,32,0.35)`,zIndex:5,pointerEvents:'none'}}>
          <div style={{width:10,height:10,transform:'rotate(45deg)',background:GOLD}}/>
        </div>
      </div>
      <div style={{height:44,display:'flex',alignItems:'center',justifyContent:'center'}}>
        {!spinning&&!done && <GoldBtn onClick={spin} size="lg">Girar la Ruleta</GoldBtn>}
        {spinning && <p style={{color:GOLD,fontFamily:"'Playfair Display',serif",fontSize:14,
          margin:0,letterSpacing:'0.12em'}}>Girando...</p>}
        {done && (
          <div style={{display:'flex',alignItems:'center',gap:8,color:GOLD_DIM,
            fontFamily:"'Jost',sans-serif",fontSize:13}}>
            <Ico name="check" size={16} color={GREEN_CLR}/> Resultado registrado
          </div>
        )}
      </div>
    </div>
  );
}

// ── WAITING INDICATOR ────────────────────────
function WaitingFor({ players, doneIds=[], label='Esperando a' }) {
  const waiting = players.filter(p=>!doneIds.includes(p.id));
  if (waiting.length===0) return null;
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',
      background:BG_CARD2,border:`1px solid ${BORDER}`,borderRadius:6,padding:'10px 16px'}}>
      <Ico name="clock" size={15} color={GOLD_DIM}/>
      <span style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:13}}>{label}:</span>
      {waiting.map(p=>(
        <div key={p.id} style={{display:'flex',alignItems:'center',gap:6}}>
          <Avatar name={p.name} colorIndex={p.colorIndex||0} size={24}/>
          <span style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:13}}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

// ── TAG (effect badge) ────────────────────────
function EffectTag({ label, type='good' }) {
  const colors = { good:{bg:'rgba(0,120,50,0.18)',border:GREEN_CLR,color:GREEN_CLR},
                   bad:{bg:'rgba(160,20,20,0.18)',border:RED,color:RED},
                   neutral:{bg:'rgba(180,140,0,0.1)',border:GOLD_DIM,color:GOLD_DIM} };
  const c = colors[type]||colors.neutral;
  return (
    <span style={{...c,borderRadius:20,padding:'3px 10px',fontFamily:"'Jost',sans-serif",
      fontSize:11,border:`1px solid ${c.border}`,whiteSpace:'nowrap'}}>{label}</span>
  );
}

// ── NET WORTH UTIL ────────────────────────────
function calcNetWorth(p) {
  const inv  = Object.values(p.investments||{}).reduce((s,i)=>s+(i.amount||0),0);
  const prop = Object.values(p.properties||{}).reduce((s,pr)=>s+(pr.value||0),0);
  const debt = Object.values(p.loans||{}).reduce((s,l)=>s+(l.remaining||0),0);
  return (p.cash||0)+inv+prop-debt;
}

function calcNetWorthArr(p) {
  const inv  = (p.investments||[]).reduce((s,i)=>s+(i.amount||0),0);
  const prop = (p.properties||[]).reduce((s,pr)=>s+(pr.value||0),0);
  const debt = (p.loans||[]).reduce((s,l)=>s+(l.remaining||0),0);
  return (p.cash||0)+inv+prop-debt;
}

// ── SOUND BUTTON ─────────────────────────────
function SoundToggle() {
  const [muted, setMuted] = useState(window.SFX?.isMuted?.() || false);
  return (
    <button onClick={()=>{ const m=window.SFX?.toggleMute?.(); setMuted(m); }}
      style={{background:'none',border:`1px solid ${BORDER}`,borderRadius:4,
        padding:'5px 8px',cursor:'pointer',color:muted?'#444':GOLD_DIM,
        display:'flex',alignItems:'center',gap:5,fontFamily:"'Jost',sans-serif",fontSize:11,
        transition:'color 0.2s'}}>
      {muted
        ? <><Ico name="x" size={12}/> Sonido</>
        : <><Ico name="star" size={12}/> Sonido</>}
    </button>
  );
}

// ── LEADERBOARD BAR ───────────────────────────
function LeaderboardBar({ players, myId }) {
  const sorted = [...players].sort((a,b)=>calcNetWorthArr(b)-calcNetWorthArr(a));
  return (
    <div style={{background:BG_CARD2,borderBottom:`1px solid ${BORDER}`,
      padding:'6px 16px',display:'flex',alignItems:'center',gap:4,
      overflowX:'auto',flexShrink:0}}>
      <span style={{color:'#555',fontFamily:"'Jost',sans-serif",fontSize:10,
        letterSpacing:'0.1em',marginRight:6,whiteSpace:'nowrap'}}>RANKING</span>
      {sorted.map((p,i)=>{
        const isMe = p.id===myId;
        const nw = calcNetWorthArr(p);
        const isBankrupt = p.bankrupt;
        return (
          <div key={p.id} style={{display:'flex',alignItems:'center',gap:5,
            background: isMe?'rgba(218,165,32,0.08)':'transparent',
            border:`1px solid ${isMe?GOLD_DIM:BORDER}`,borderRadius:20,
            padding:'3px 10px',flexShrink:0,
            opacity: isBankrupt?0.5:1}}>
            <span style={{color:'#555',fontFamily:"'Jost',sans-serif",fontSize:9,fontWeight:700}}>{i+1}</span>
            <Avatar name={p.name||'?'} colorIndex={p.colorIndex||0} size={18}/>
            <span style={{color:isMe?GOLD_LIGHT:'#888',fontFamily:"'Jost',sans-serif",
              fontSize:11,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {p.name}
            </span>
            <span style={{color:isMe?GOLD:GOLD_DIM,fontFamily:"'Playfair Display',serif",
              fontSize:11,fontWeight:700}}>{fmt(nw)}</span>
            {isBankrupt && <span style={{color:RED,fontSize:9,fontFamily:"'Jost',sans-serif"}}>QUIEBRA</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── MULTI-LINE NET WORTH CHART ────────────────
function NetWorthChart({ players, width=560, height=180 }) {
  const allHistory = players.map(p=>(p.history||[]).map(h=>h.netWorth||0));
  const maxMonth = Math.max(...players.map(p=>(p.history||[]).length), 1);
  if (maxMonth < 2) return (
    <div style={{color:'#555',fontFamily:"'Jost',sans-serif",fontSize:12,
      textAlign:'center',padding:20}}>
      La gráfica aparecerá desde el mes 2.
    </div>
  );
  const allVals = allHistory.flat().filter(v=>v!=null);
  const minV = Math.min(0,...allVals), maxV = Math.max(1,...allVals);
  const range = maxV-minV||1;
  const PAD = 40;
  const W = width-PAD, H = height-PAD*0.5;

  const toX = (i) => PAD + (i/(maxMonth-1))*(W-PAD);
  const toY = (v) => H*0.9 - ((v-minV)/range)*(H*0.8);

  const colors = GD.PLAYER_COLORS.map(c=>c.bg);

  return (
    <svg width={width} height={height} style={{display:'block',overflow:'visible'}}>
      {/* Grid lines */}
      {[0,0.25,0.5,0.75,1].map((t,i)=>{
        const y = H*0.9 - t*(H*0.8);
        const val = minV + t*range;
        return (
          <g key={i}>
            <line x1={PAD} y1={y} x2={W} y2={y}
              stroke={BORDER} strokeWidth="1" strokeDasharray="4,4"/>
            <text x={PAD-4} y={y+4} textAnchor="end"
              fill="#555" fontSize="9" fontFamily="Jost,sans-serif">
              {fmt(val)}
            </text>
          </g>
        );
      })}
      {/* Lines per player */}
      {players.map((p,pi)=>{
        const hist = p.history||[];
        if(hist.length<2) return null;
        const pts = hist.map((h,i)=>[toX(i),toY(h.netWorth||0)]);
        const d = `M${pts[0].join(',')} ${pts.slice(1).map(([x,y])=>`L${x},${y}`).join(' ')}`;
        return (
          <g key={p.id}>
            <path d={d} fill="none" stroke={colors[pi%colors.length]}
              strokeWidth="2" strokeLinejoin="round"/>
            <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]}
              r="4" fill={colors[pi%colors.length]}/>
          </g>
        );
      })}
      {/* Legend */}
      {players.map((p,pi)=>(
        <g key={p.id} transform={`translate(${PAD + pi*90},${height-10})`}>
          <rect width="12" height="3" y="-1" rx="1"
            fill={colors[pi%colors.length]}/>
          <text x="16" y="3" fill="#888" fontSize="9" fontFamily="Jost,sans-serif">
            {(p.name||'?').slice(0,10)}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── EVENT BANNER ──────────────────────────────
function EventBanner({ event }) {
  if (!event) return null;
  const severityColors = {
    good:    { bg:'rgba(0,120,50,0.15)',  border:GREEN_CLR,  color:GREEN_CLR  },
    bad:     { bg:'rgba(180,20,20,0.15)', border:RED,        color:RED        },
    mixed:   { bg:'rgba(218,165,32,0.10)',border:GOLD_DIM,   color:GOLD       },
    neutral: { bg:'rgba(80,80,80,0.1)',   border:BORDER2,    color:'#888'     },
  };
  const sc = severityColors[event.severity]||severityColors.neutral;
  const mods = Object.entries(event.modifiers||{});

  return (
    <div style={{...sc,border:`1px solid ${sc.border}`,borderRadius:8,
      padding:'12px 16px',marginBottom:14}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
        <Ico name={event.icon||'alert-triangle'} size={16} color={sc.color}/>
        <span style={{color:sc.color,fontFamily:"'Playfair Display',serif",
          fontSize:15,fontWeight:600}}>{event.name}</span>
        <span style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:10,
          letterSpacing:'0.1em',marginLeft:'auto',textTransform:'uppercase'}}>
          Evento del mes
        </span>
      </div>
      <p style={{color:'#999',fontFamily:"'Jost',sans-serif",fontSize:12,
        margin:'0 0 8px',lineHeight:1.5}}>{event.desc}</p>
      {mods.length>0 && (
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {mods.map(([inv,mod])=>{
            const it=GD.INVESTMENTS.find(i=>i.id===inv);
            return (
              <div key={inv} style={{display:'flex',alignItems:'center',gap:5,
                background:'rgba(0,0,0,0.2)',borderRadius:4,padding:'3px 8px'}}>
                <Ico name={inv} size={11} color={mod>=0?GREEN_CLR:RED}/>
                <span style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:11}}>
                  {it?.name.split(' ')[0]}
                </span>
                <span style={{color:mod>=0?GREEN_CLR:RED,fontFamily:"'Jost',sans-serif",
                  fontSize:11,fontWeight:600}}>
                  {mod>=0?'+':''}{(mod*100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  GOLD,GOLD_LIGHT,GOLD_DIM,RED,GREEN_CLR,BG,BG_CARD,BG_CARD2,BORDER,BORDER2,
  fmt,fmtFull,seededRand,calcNetWorth,calcNetWorthArr,
  Ico,Avatar,GoldBtn,Card,GoldTitle,MoneyDisplay,GoldDivider,
  Sparkline,RouletteWheel,Risk,WaitingFor,EffectTag,
  SoundToggle,LeaderboardBar,NetWorthChart,EventBanner,
});
