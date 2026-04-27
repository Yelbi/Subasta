// =============================================
// SUBASTA v2 — Main App + Firebase Multiplayer
// =============================================
const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ── FIREBASE REST HELPERS ────────────────────
const fbGet = async (url, path) => {
  const r = await fetch(`${url}/${path}.json`);
  if (!r.ok) throw new Error(r.status);
  return r.json();
};
const fbSet = async (url, path, data) => {
  const r = await fetch(`${url}/${path}.json`, {
    method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)
  });
  if (!r.ok) throw new Error(r.status);
  return r.json();
};
const fbPatch = async (url, path, data) => {
  const r = await fetch(`${url}/${path}.json`, {
    method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)
  });
  if (!r.ok) throw new Error(r.status);
  return r.json();
};
const fbDel = async (url, path) => {
  await fetch(`${url}/${path}.json`, { method:'DELETE' });
};

const genCode = () => {
  const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join('');
};
const genId = () => Math.random().toString(36).slice(2,11);

function toArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return Object.values(v);
}

// ── ARTIFACT EFFECT APPLIER ──────────────────
function applyArtifactEffect(artifact, winnerId, players) {
  const mapped = players.map(p => {
    if (p.id !== winnerId) return p;
    const up = { ...p, artifacts: [...(p.artifacts||[]), artifact] };
    switch(artifact.effect) {
      case 'cash_bonus':
        up.cash = (up.cash||0) + artifact.value; break;
      case 'investment_multiplier':
        up.activeEffects = [...(up.activeEffects||[]),
          {type:'investment_multiplier',value:artifact.value,monthsLeft:artifact.duration||1,label:`${artifact.name} (×${artifact.value})`}]; break;
      case 'free_property': {
        const nm = GD.PROPERTY_NAMES[Math.floor(Math.random()*GD.PROPERTY_NAMES.length)];
        up.properties = [...(up.properties||[]),{id:`p${Date.now()}`,name:nm,value:artifact.value||200000,monthlyRent:Math.round((artifact.value||200000)*0.025)}]; break;
      }
      case 'oracle':
        up.activeEffects = [...(up.activeEffects||[]),{type:'oracle',monthsLeft:artifact.duration||1,label:'Oráculo del Mercado'}]; break;
      case 'random_cash': {
        const bonus=Math.round((artifact.minVal||20000)+Math.random()*((artifact.maxVal||250000)-(artifact.minVal||20000)));
        up.cash=(up.cash||0)+bonus; break;
      }
      case 'property_income_boost':
        up.activeEffects=[...(up.activeEffects||[]),{type:'property_income_boost',value:artifact.value||15000,monthsLeft:artifact.duration||3,label:`${artifact.name} (+${fmt(artifact.value||15000)}/prop.)`}]; break;
      case 'steal_cash':
        up._stealAmt = artifact.value||80000; break;
      case 'curse_immunity':
        up.activeEffects=[...(up.activeEffects||[]),{type:'curse_immunity',monthsLeft:artifact.duration||2,label:'Campana de Oro (inmune a maldiciones)'}]; break;
      case 'property_double':
        up.properties=(up.properties||[]).map(pr=>({...pr,value:pr.value*2})); break;
      case 'investment_loss':
        up.cash=Math.max(0,(up.cash||0)*(1-(artifact.value||0.25))); break;
      case 'destroy_property':
        if((up.properties||[]).length>0){const idx=Math.floor(Math.random()*(up.properties||[]).length);up.properties=(up.properties||[]).filter((_,i)=>i!==idx);} break;
      case 'add_debt':
        up.loans=[...(up.loans||[]),{id:`d${Date.now()}`,original:artifact.value||150000,remaining:artifact.value||150000,rate:artifact.rate||0.20,monthsLeft:artifact.duration||12,label:artifact.name}]; break;
      case 'zero_returns':
        up.activeEffects=[...(up.activeEffects||[]),{type:'zero_returns',monthsLeft:artifact.duration||1,label:'Sombra del Mercado (retornos=0)'}]; break;
      case 'forced_invest':
        up.activeEffects=[...(up.activeEffects||[]),{type:'forced_invest',monthsLeft:artifact.duration||1,label:'La Mano Ávara (invertir todo)'}]; break;
      case 'cash_loss':
        up.cash=Math.max(0,(up.cash||0)*(1-(artifact.value||0.30))); break;
      case 'business_zero':
        up.activeEffects=[...(up.activeEffects||[]),{type:'business_zero',monthsLeft:artifact.duration||1,label:'Plaga de Ratas (negocios=0)'}]; break;
      case 'monthly_drain':
        up.activeEffects=[...(up.activeEffects||[]),{type:'monthly_drain',value:artifact.value||30000,monthsLeft:artifact.duration||3,label:`Caja de Pandora (-${fmt(artifact.value||30000)}/mes)`}]; break;
      case 'random_catastrophe': {
        const roll=Math.floor(Math.random()*3);
        if(roll===0) up.cash=Math.max(0,(up.cash||0)*0.6);
        else if(roll===1&&(up.properties||[]).length>0) up.properties=(up.properties||[]).slice(0,-1);
        else up.loans=[...(up.loans||[]),{id:`d${Date.now()}`,original:250000,remaining:250000,rate:0.20,monthsLeft:12,label:'Maldición de la Luna'}];
        break;
      }
      case 'stolen_cash':
        up._stolenAmt = artifact.value||60000; break;
      case 'invert_losses':
        up.activeEffects=[...(up.activeEffects||[]),{type:'invert_losses',monthsLeft:artifact.duration||1,label:'Piedra Inversora (pérdidas→ganancias)'}]; break;
      case 'steal_all':
        up._stealAllPct=artifact.value||0.15; break;
      case 'market_freeze':
        up.activeEffects=[...(up.activeEffects||[]),{type:'market_freeze',monthsLeft:artifact.duration||1,label:'Peste del Mercado (todos 0%)'}]; break;
      default: break;
    }
    return up;
  });
  // ── resolve steal / stolen_cash from firstPass ─────────────────────────
  const stealWinner    = mapped.find(x => x._stealAmt    && x.id === winnerId);
  const stolenWinner   = mapped.find(x => x._stolenAmt   && x.id === winnerId);
  const stealAllWinner = mapped.find(x => x._stealAllPct && x.id === winnerId);
  const nonWinners     = mapped.filter(x => x.id !== winnerId);
  const stolenVictimId = (stolenWinner && nonWinners.length > 0)
    ? nonWinners[Math.floor(Math.random() * nonWinners.length)].id : null;

  let totalStolenAll = 0;
  const pass1 = mapped.map(p => {
    const { _stealAmt, _stolenAmt, _stealAllPct, ...clean } = p;
    let cash = clean.cash || 0;
    if (stealWinner    && p.id !== winnerId) cash = Math.max(0, cash - (stealWinner._stealAmt||0));
    if (stolenVictimId && p.id === stolenVictimId) cash = Math.max(0, cash - (stolenWinner._stolenAmt||0));
    if (stealAllWinner && p.id !== winnerId) {
      const amt = Math.floor(cash * (stealAllWinner._stealAllPct||0));
      totalStolenAll += amt;
      cash = Math.max(0, cash - amt);
    }
    return { ...clean, cash };
  });
  return pass1.map(p =>
    (stealAllWinner && p.id === winnerId && totalStolenAll > 0)
      ? { ...p, cash: (p.cash||0) + totalStolenAll } : p
  );
}

// ── CONFIG SCREEN ────────────────────────────
function ConfigScreen({ onSave }) {
  const [url, setUrl] = useState('');
  const [err, setErr] = useState('');
  const [testing, setTesting] = useState(false);

  const test = async () => {
    if (!url.trim()) return setErr('Ingresa la URL de tu base de datos.');
    const clean = url.trim().replace(/\/$/, '');
    setTesting(true); setErr('');
    try {
      await fbSet(clean, 'test_connection', { ok: true, t: Date.now() });
      await fbDel(clean, 'test_connection');
      onSave(clean);
    } catch(e) {
      setErr('No se pudo conectar. Verifica la URL y las reglas de seguridad de Firebase.');
    } finally { setTesting(false); }
  };

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:24,gap:0}}>
      <div style={{width:'100%',maxWidth:520}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <GoldTitle size="xl" style={{marginBottom:8}}>SUBASTA</GoldTitle>
          <GoldDivider/>
          <p style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:14,margin:'12px 0 0'}}>
            Configuración inicial
          </p>
        </div>
        <Card>
          <GoldTitle size="sm" style={{marginBottom:16}}>Conectar Firebase</GoldTitle>
          <p style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:13,margin:'0 0 20px',lineHeight:1.7}}>
            Subasta necesita una base de datos en tiempo real para el modo multijugador.
            Sigue estos pasos para configurarla gratis:
          </p>
          {[
            'Ve a console.firebase.google.com y crea un proyecto',
            'En "Compilación" → "Realtime Database" → "Crear base de datos"',
            'Elige modo de prueba (reglas abiertas) y crea la base',
            'Copia la URL (ej: https://mi-proyecto-rtdb.firebaseio.com)',
          ].map((step,i)=>(
            <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:10}}>
              <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(218,165,32,0.1)',
                border:`1px solid ${GOLD_DIM}`,display:'flex',alignItems:'center',justifyContent:'center',
                flexShrink:0,color:GOLD_DIM,fontFamily:"'Playfair Display',serif",fontSize:11,fontWeight:700}}>
                {i+1}
              </div>
              <p style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:12,margin:0,lineHeight:1.6}}>{step}</p>
            </div>
          ))}
          <GoldDivider/>
          <div style={{marginTop:16}}>
            <label style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:12,display:'block',marginBottom:6}}>
              URL de Realtime Database
            </label>
            <input value={url} onChange={e=>setUrl(e.target.value)}
              placeholder="https://mi-proyecto-rtdb.firebaseio.com"
              style={{width:'100%',background:'#180d00',border:`1px solid ${url?GOLD_DIM:BORDER}`,
                borderRadius:4,padding:'9px 12px',color:GOLD_LIGHT,
                fontFamily:"'Jost',sans-serif",fontSize:13,outline:'none',boxSizing:'border-box',marginBottom:10}}/>
            {err && <p style={{color:RED,fontFamily:"'Jost',sans-serif",fontSize:12,margin:'0 0 10px'}}>{err}</p>}
            <GoldBtn size="lg" onClick={test} disabled={testing||!url} style={{width:'100%'}}>
              {testing?'Probando conexión...':'Guardar y Conectar'}
            </GoldBtn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── LOBBY SCREEN ─────────────────────────────
function LobbyScreen({ fbUrl, onJoin }) {
  const [mode, setMode]   = useState(null); // 'create' | 'join'
  const [name, setName]   = useState(localStorage.getItem('subasta_name')||'');
  const [code, setCode]   = useState(window.location.hash.slice(1)||'');
  const [loading, setLoad] = useState(false);
  const [err, setErr]     = useState('');

  const create = async () => {
    if (!name.trim()) return setErr('Ingresa tu nombre.');
    setLoad(true); setErr('');
    try {
      const roomCode = genCode();
      const playerId = genId();
      const deck = [...GD.ARTIFACTS].sort(()=>Math.random()-0.5);
      const initialRoom = {
        meta:{ hostId:playerId, status:'lobby', createdAt:Date.now() },
        players:{ [playerId]:{ id:playerId, name:name.trim(), colorIndex:0, isHost:true,
          cash:0, investments:[], properties:[], loans:[], activeEffects:[], artifacts:[], history:[] } },
        game:{ phase:'lobby', month:1, gameSeed:Math.floor(Math.random()*99999),
          waitingFor:null, artifactDeck:deck, artifactDeckIdx:0,
          currentArtifactIdx:0, auctionPhase:'bidding' }
      };
      await fbSet(fbUrl, `rooms/${roomCode}`, initialRoom);
      localStorage.setItem('subasta_name', name.trim());
      localStorage.setItem('subasta_player', playerId);
      localStorage.setItem('subasta_room', roomCode);
      window.location.hash = roomCode;
      onJoin(roomCode, playerId, initialRoom);
    } catch(e) { setErr('Error al crear sala. Verifica tu conexión.'); }
    finally { setLoad(false); }
  };

  const join = async () => {
    if (!name.trim()) return setErr('Ingresa tu nombre.');
    if (code.length<4) return setErr('Ingresa el código de sala.');
    setLoad(true); setErr('');
    try {
      const room = await fbGet(fbUrl, `rooms/${code.toUpperCase()}`);
      if (!room) return setErr('Sala no encontrada.');
      if (room.meta?.status !== 'lobby') return setErr('Esta partida ya comenzó.');
      const playerId = genId();
      const idx = Object.keys(room.players||{}).length;
      if (idx >= 6) return setErr('La sala está llena (máx. 6 jugadores).');
      const playerData = { id:playerId, name:name.trim(), colorIndex:idx, isHost:false,
        cash:0, investments:[], properties:[], loans:[], activeEffects:[], artifacts:[], history:[] };
      await fbSet(fbUrl, `rooms/${code.toUpperCase()}/players/${playerId}`, playerData);
      const updatedRoom = { ...room, players:{ ...(room.players||{}), [playerId]:playerData } };
      localStorage.setItem('subasta_name', name.trim());
      localStorage.setItem('subasta_player', playerId);
      localStorage.setItem('subasta_room', code.toUpperCase());
      window.location.hash = code.toUpperCase();
      onJoin(code.toUpperCase(), playerId, updatedRoom);
    } catch(e) { setErr('Error al unirse. Verifica el código.'); }
    finally { setLoad(false); }
  };

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{width:'100%',maxWidth:420}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:12,
            letterSpacing:'0.3em',marginBottom:10}}>JUEGO DE</div>
          <GoldTitle size="xxl" style={{letterSpacing:'0.1em',lineHeight:1}}>SUBASTA</GoldTitle>
          <div style={{marginTop:10}}><GoldDivider/></div>
          <p style={{color:'#555',fontFamily:"'Jost',sans-serif",fontSize:13,margin:'10px 0 0',letterSpacing:'0.04em'}}>
            Fortuna · Inversiones · Artefactos
          </p>
        </div>

        <Card>
          {/* Name input */}
          <div style={{marginBottom:16}}>
            <label style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:11,
              display:'block',marginBottom:6,letterSpacing:'0.06em'}}>TU NOMBRE</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre del jugador"
              style={{width:'100%',background:'#180d00',border:`1px solid ${name?GOLD_DIM:BORDER}`,
                borderRadius:4,padding:'9px 12px',color:GOLD_LIGHT,
                fontFamily:"'Jost',sans-serif",fontSize:14,outline:'none',boxSizing:'border-box'}}/>
          </div>

          {!mode ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <GoldBtn size="lg" onClick={()=>setMode('create')} style={{width:'100%'}}>
                Crear Sala
              </GoldBtn>
              <GoldBtn variant="secondary" size="lg" onClick={()=>setMode('join')} style={{width:'100%'}}>
                Unirse a Sala
              </GoldBtn>
            </div>
          ) : mode==='create' ? (
            <div>
              <p style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:13,margin:'0 0 14px',lineHeight:1.6}}>
                Se creará una sala nueva. Comparte el código con tus amigos para que se unan.
              </p>
              <div style={{display:'flex',gap:8}}>
                <GoldBtn variant="ghost" size="md" onClick={()=>setMode(null)}>← Atrás</GoldBtn>
                <GoldBtn size="md" onClick={create} disabled={loading||!name} style={{flex:1}}>
                  {loading?'Creando...':'Crear Sala'}
                </GoldBtn>
              </div>
            </div>
          ) : (
            <div>
              <label style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:11,
                display:'block',marginBottom:6,letterSpacing:'0.06em'}}>CÓDIGO DE SALA</label>
              <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())}
                placeholder="ABC123" maxLength={6}
                style={{width:'100%',background:'#180d00',border:`1px solid ${code?GOLD_DIM:BORDER}`,
                  borderRadius:4,padding:'9px 12px',color:GOLD_LIGHT,
                  fontFamily:"'Playfair Display',serif",fontSize:22,outline:'none',
                  letterSpacing:'0.15em',boxSizing:'border-box',marginBottom:12,textAlign:'center'}}/>
              <div style={{display:'flex',gap:8}}>
                <GoldBtn variant="ghost" size="md" onClick={()=>setMode(null)}>← Atrás</GoldBtn>
                <GoldBtn size="md" onClick={join} disabled={loading||!name||!code} style={{flex:1}}>
                  {loading?'Uniéndose...':'Unirse'}
                </GoldBtn>
              </div>
            </div>
          )}
          {err && <p style={{color:RED,fontFamily:"'Jost',sans-serif",fontSize:12,margin:'10px 0 0'}}>{err}</p>}
        </Card>
      </div>
    </div>
  );
}

// ── WAITING ROOM ─────────────────────────────
function WaitingRoom({ room, myId, fbUrl, roomCode, onLeave }) {
  const players = Object.values(room.players||{});
  const isHost = room.meta?.hostId === myId;
  const [copied, setCopied] = useState(false);
  const link = window.location.href;

  const copyLink = () => {
    navigator.clipboard.writeText(link).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); });
  };

  const startGame = async () => {
    if (players.length < 2) return;
    const targets = {};
    players.forEach(p=>{ targets[p.id]=Math.floor(Math.random()*GD.ROULETTE.length); });
    const waiting = {};
    players.forEach(p=>{ waiting[p.id]=true; });
    const propDeck = [...GD.AUCTION_PROPERTIES].sort(()=>Math.random()-0.5);
    await fbPatch(fbUrl, `rooms/${roomCode}`, {
      'meta/status':'playing',
      'game/phase':'roulette',
      'game/rouletteTargets':targets,
      'game/waitingFor':waiting,
      'game/propertyDeck':propDeck,
      'game/propertyDeckIdx':0,
    });
  };

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:24,gap:20}}>
      <div style={{textAlign:'center'}}>
        <GoldTitle size="lg" style={{marginBottom:4}}>Sala de Espera</GoldTitle>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginTop:8}}>
          <div style={{background:BG_CARD2,border:`1px solid ${GOLD}`,borderRadius:6,
            padding:'6px 20px',fontFamily:"'Playfair Display',serif",fontSize:24,
            color:GOLD,letterSpacing:'0.2em'}}>{roomCode}</div>
          <button onClick={copyLink} style={{background:'none',border:`1px solid ${BORDER}`,
            borderRadius:4,padding:'6px 10px',cursor:'pointer',
            color:copied?GREEN_CLR:GOLD_DIM,display:'flex',alignItems:'center',gap:6,
            fontFamily:"'Jost',sans-serif",fontSize:12,transition:'color 0.2s'}}>
            <Ico name={copied?'check':'copy'} size={14} color={copied?GREEN_CLR:GOLD_DIM}/>
            {copied?'Copiado':'Copiar enlace'}
          </button>
        </div>
      </div>
      <GoldDivider/>
      <div style={{width:'100%',maxWidth:420,display:'flex',flexDirection:'column',gap:8}}>
        {players.map(p=>(
          <Card key={p.id} style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
            <Avatar name={p.name||'?'} colorIndex={p.colorIndex||0} size={38}/>
            <span style={{color:GOLD_LIGHT,fontFamily:"'Playfair Display',serif",fontSize:15,flex:1}}>{p.name}</span>
            {p.id===room.meta?.hostId && (
              <div style={{display:'flex',alignItems:'center',gap:5,color:GOLD_DIM,
                fontFamily:"'Jost',sans-serif",fontSize:11}}>
                <Ico name="crown" size={12} color={GOLD_DIM}/> Anfitrión
              </div>
            )}
          </Card>
        ))}
        {players.length<6 && (
          <div style={{border:`1px dashed ${BORDER}`,borderRadius:8,padding:'12px 16px',
            color:'#444',fontFamily:"'Jost',sans-serif",fontSize:13,textAlign:'center'}}>
            Esperando jugadores... ({players.length}/6)
          </div>
        )}
      </div>
      <div style={{display:'flex',gap:10,flexDirection:'column',alignItems:'center',width:'100%',maxWidth:420}}>
        {isHost ? (
          <>
            <GoldBtn size="xl" onClick={startGame} disabled={players.length<2} style={{width:'100%'}}>
              {players.length<2?'Esperando más jugadores...':'Iniciar Partida'}
            </GoldBtn>
            {players.length<2 && <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:12,margin:0}}>Se necesitan al menos 2 jugadores</p>}
          </>
        ) : (
          <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:14,margin:0,textAlign:'center'}}>
            Esperando que el anfitrión inicie la partida...
          </p>
        )}
        <GoldBtn variant="ghost" size="sm" onClick={onLeave}>Salir de la sala</GoldBtn>
      </div>
    </div>
  );
}

// ── ROULETTE PHASE ────────────────────────────
function RoulettePhaseScreen({ room, myId, fbUrl, roomCode }) {
  const players = Object.values(room.players||{});
  const me = room.players?.[myId];
  const target = room.game?.rouletteTargets?.[myId];
  const myResult = room.game?.rouletteResults?.[myId];
  const slot = GD.ROULETTE[target||0];
  const doneIds = Object.keys(room.game?.rouletteResults||{});

  const onSpinEnd = async () => {
    if (myResult!==undefined) return;
    const updates = {};
    updates[`players/${myId}/cash`] = slot.amount;
    updates[`players/${myId}/history`] = [{month:0, netWorth:slot.amount}];
    updates[`game/rouletteResults/${myId}`] = slot.amount;
    updates[`game/waitingFor/${myId}`] = null;
    await fbPatch(fbUrl, `rooms/${roomCode}`, updates);
  };

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:24,gap:20}}>
      <div style={{textAlign:'center'}}>
        <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:11,
          letterSpacing:'0.2em',marginBottom:6}}>RIQUEZA INICIAL</div>
        <GoldTitle size="lg">Gira la Ruleta</GoldTitle>
      </div>
      <RouletteWheel slots={GD.ROULETTE} targetIndex={target||0} onSpinEnd={onSpinEnd}/>
      {myResult!==undefined && (
        <div style={{textAlign:'center',animation:'fadeInUp 0.5s ease'}}>
          <div style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:13,marginBottom:4}}>Comenzarás con</div>
          <MoneyDisplay amount={myResult} size="xl"/>
        </div>
      )}
      <WaitingFor players={players} doneIds={doneIds} label="Aún sin girar"/>
    </div>
  );
}

// ── STANDINGS SCREEN ──────────────────────────
function StandingsScreen({ room, myId, fbUrl, roomCode, isHost }) {
  const players = Object.values(room.players||{}).sort((a,b)=>calcNetWorthArr(b)-calcNetWorthArr(a));
  const month = room.game?.month||1;
  const medals = ['I','II','III','IV','V','VI'];

  const nextMonth = async () => {
    const newMonth = month+1;
    const gameSeed = room.game?.gameSeed || 0;
    const waiting = {};
    Object.values(room.players||{}).forEach(p=>{ waiting[p.id]=true; });
    const evtIdx = Math.floor(seededRand(room.game?.gameSeed+newMonth*17)*GD.MARKET_EVENTS.length);
    const currentEvent = GD.MARKET_EVENTS[evtIdx];
    const shuffledNews = [...GD.MARKET_NEWS]
      .map((item,i)=>({item,sort:seededRand(gameSeed+newMonth*31+i*17)}))
      .sort((a,b)=>a.sort-b.sort).slice(0,3).map(x=>x.item);
    await fbPatch(fbUrl, `rooms/${roomCode}`, {
      'game/phase': newMonth>12?'final':'invest',
      'game/month': newMonth,
      'game/waitingFor': waiting,
      'game/investPlans': null,
      'game/insuranceBuyers': null,
      'game/currentEvent': currentEvent,
      'game/currentNews': shuffledNews,
    });
  };

  return (
    <div style={{minHeight:'100vh',background:BG,padding:'24px 20px',boxSizing:'border-box'}}>
      <div style={{maxWidth:640,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <GoldTitle size="lg">Fin del Mes {month}</GoldTitle>
          <GoldDivider/>
        </div>

        {/* Rankings */}
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
          {players.map((p,i)=>{
            const nw=calcNetWorthArr(p);
            return (
              <Card key={p.id} glow={i===0} style={{display:'flex',
                justifyContent:'space-between',alignItems:'center',padding:'12px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{color:GOLD_DIM,fontFamily:"'Playfair Display',serif",
                    fontSize:12,fontWeight:700,width:18}}>{medals[i]}</span>
                  <Avatar name={p.name||'?'} colorIndex={p.colorIndex||0} size={34}/>
                  <div>
                    <div style={{color:GOLD_LIGHT,fontFamily:"'Playfair Display',serif",
                      fontSize:14,fontWeight:600}}>{p.name}</div>
                    <div style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:11}}>
                      {fmtFull(p.cash||0)} efectivo · {toArr(p.properties).length} prop.
                      {p.bankrupt&&<span style={{color:RED,marginLeft:6}}>QUIEBRA</span>}
                    </div>
                  </div>
                </div>
                <MoneyDisplay amount={nw} size="md"/>
              </Card>
            );
          })}
        </div>

        {/* Net worth chart */}
        {players.some(p=>toArr(p.history).length>=2) && (
          <Card style={{marginBottom:20,padding:'16px 20px'}}>
            <GoldTitle size="sm" style={{marginBottom:14}}>Evolución del Patrimonio</GoldTitle>
            <NetWorthChart players={players} width={560} height={180}/>
          </Card>
        )}

        <div style={{display:'flex',justifyContent:'center'}}>
          {isHost ? (
            <GoldBtn size="xl" onClick={nextMonth}>
              {month>=12?'Ver resultados finales':'Mes '+(month+1)+' →'}
            </GoldBtn>
          ) : (
            <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:14}}>
              Esperando al anfitrión...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── FINAL SCREEN ──────────────────────────────
function FinalScreen({ room, fbUrl, roomCode, onLeave }) {
  const players = Object.values(room.players||{}).sort((a,b)=>calcNetWorthArr(b)-calcNetWorthArr(a));
  const winner = players[0];
  const medals = ['I','II','III','IV','V','VI'];

  const restart = async () => {
    const playerResets = {};
    Object.values(room.players||{}).forEach(p => {
      playerResets[`players/${p.id}`] = {
        ...p,
        cash:0, investments:[], properties:[], loans:[],
        activeEffects:[], artifacts:[], history:[], bankrupt:false,
      };
    });
    const deck = [...GD.ARTIFACTS].sort(()=>Math.random()-0.5);
    const propDeck = [...GD.AUCTION_PROPERTIES].sort(()=>Math.random()-0.5);
    await fbPatch(fbUrl, `rooms/${roomCode}`, {
      'meta/status':'lobby',
      'game/phase':'lobby',
      'game/month':1,
      'game/artifactDeck':deck,
      'game/artifactDeckIdx':0,
      'game/propertyDeck':propDeck,
      'game/propertyDeckIdx':0,
      'game/rouletteResults':null,
      'game/simResults':null,
      'game/auctionBids':null,
      'game/auctionWinner':null,
      'game/loanDecisions':null,
      'game/investPlans':null,
      'game/insuranceBuyers':null,
      ...playerResets,
    });
  };

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:24,gap:20}}>
      <div style={{textAlign:'center'}}>
        <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:12,letterSpacing:'0.3em',marginBottom:8}}>GANADOR</div>
        <Avatar name={winner.name||'?'} colorIndex={winner.colorIndex||0} size={72} style={{margin:'0 auto 12px'}}/>
        <GoldTitle size="xl" style={{marginBottom:4}}>{winner.name}</GoldTitle>
        <MoneyDisplay amount={calcNetWorthArr(winner)} size="xl"/>
        <div style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:13,marginTop:4}}>Patrimonio neto</div>
      </div>
      <GoldDivider/>
      <div style={{width:'100%',maxWidth:500,display:'flex',flexDirection:'column',gap:8}}>
        {players.map((p,i)=>{
          const nw=calcNetWorthArr(p);
          return (
            <Card key={p.id} glow={i===0}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:i===0?10:0}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{color:GOLD_DIM,fontFamily:"'Playfair Display',serif",
                    fontSize:12,fontWeight:700,width:20}}>{medals[i]}</span>
                  <Avatar name={p.name||'?'} colorIndex={p.colorIndex||0} size={32}/>
                  <GoldTitle size="sm" tag="span">{p.name}</GoldTitle>
                </div>
                <MoneyDisplay amount={nw} size={i===0?'lg':'md'}/>
              </div>
              {i===0 && (p.artifacts||[]).length>0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:5,marginTop:8}}>
                  {(p.artifacts||[]).map((a,j)=>(
                    <EffectTag key={j} label={a.name} type={a.type==='blessing'?'good':'bad'}/>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <div style={{display:'flex',gap:10}}>
        <GoldBtn variant="secondary" size="md" onClick={onLeave}>Salir</GoldBtn>
        <GoldBtn size="lg" onClick={restart}>Jugar de nuevo</GoldBtn>
      </div>
    </div>
  );
}

// ── GAME WRAPPER (must be outside App to preserve state between polls) ──
function GameWrapper({ game, players, myId, me, roomCode, leave, children }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [tab, setTab] = React.useState('menu');

  const myProps   = toArr(me?.properties);
  const myLoans   = Object.values(me?.loans||{});
  const myEffects = toArr(me?.activeEffects).filter(e=>(e.monthsLeft||0)>0);
  const myArts    = toArr(me?.artifacts);

  return (
    <div style={{minHeight:'100vh',background:BG,boxSizing:'border-box',
      display:'flex',flexDirection:'column',position:'relative'}}>
      {/* Top bar */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        background:BG_CARD2,borderBottom:`1px solid ${BORDER}`,
        padding:'5px 14px',flexShrink:0,gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <span style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",
            fontSize:11,letterSpacing:'0.1em'}}>MES {game?.month||1}/12</span>
          <div style={{width:72,height:3,background:'#1a1000',borderRadius:2}}>
            <div style={{width:`${Math.round(((game?.month||1)/12)*100)}%`,
              height:'100%',background:`linear-gradient(90deg,${GOLD_DIM},${GOLD})`,
              borderRadius:2}}/>
          </div>
        </div>
        <div style={{flex:1,overflow:'hidden'}}>
          <LeaderboardBar players={players} myId={myId}/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
          <SoundToggle/>
          <button onClick={()=>setMenuOpen(v=>!v)}
            style={{background:menuOpen?'rgba(218,165,32,0.12)':'none',
              border:`1px solid ${menuOpen?GOLD_DIM:BORDER}`,
              borderRadius:4,padding:'5px 10px',cursor:'pointer',
              color:menuOpen?GOLD:GOLD_DIM,display:'flex',alignItems:'center',gap:5,
              fontFamily:"'Jost',sans-serif",fontSize:11,transition:'all 0.15s'}}>
            <Ico name="layers" size={13}/> Menú
          </button>
        </div>
      </div>

      {/* Slide-out menu */}
      {menuOpen && (
        <div style={{position:'fixed',inset:0,zIndex:200,display:'flex',
          justifyContent:'flex-end'}} onClick={()=>setMenuOpen(false)}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.65)'}}/>
          <div onClick={e=>e.stopPropagation()}
            style={{position:'relative',width:320,height:'100%',
              background:BG_CARD2,borderLeft:`1px solid ${BORDER}`,
              display:'flex',flexDirection:'column',
              boxShadow:'-8px 0 32px rgba(0,0,0,0.7)',
              animation:'slideInRight 0.2s ease'}}>

            {/* Panel header */}
            <div style={{display:'flex',justifyContent:'space-between',
              alignItems:'center',padding:'14px 16px',
              borderBottom:`1px solid ${BORDER}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <Avatar name={me?.name||'?'} colorIndex={me?.colorIndex||0} size={32}/>
                <div>
                  <GoldTitle size="sm">{me?.name}</GoldTitle>
                  <div style={{marginTop:2}}>
                    <MoneyDisplay amount={calcNetWorthArr(me||{})} size="sm"/>
                  </div>
                </div>
              </div>
              <button onClick={()=>setMenuOpen(false)}
                style={{background:'none',border:'none',cursor:'pointer',padding:'4px'}}>
                <Ico name="x" size={18} color="#666"/>
              </button>
            </div>

            {/* Tabs */}
            <div style={{display:'flex',borderBottom:`1px solid ${BORDER}`}}>
              {[{id:'menu',label:'Menú'},{id:'portfolio',label:'Cartera'},{id:'rules',label:'Reglas'}].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)}
                  style={{flex:1,background:'none',border:'none',
                    borderBottom:`2px solid ${tab===t.id?GOLD:'transparent'}`,
                    padding:'10px 4px',cursor:'pointer',
                    color:tab===t.id?GOLD:'#666',
                    fontFamily:"'Jost',sans-serif",fontSize:12,transition:'all 0.15s'}}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{flex:1,overflowY:'auto',padding:'14px 16px'}}>
              {tab==='menu' && (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{background:'#0e0800',border:`1px solid ${BORDER}`,
                    borderRadius:6,padding:'10px 14px',marginBottom:4}}>
                    <div style={{color:'#777',fontFamily:"'Jost',sans-serif",
                      fontSize:10,letterSpacing:'0.1em',marginBottom:4}}>CÓDIGO DE SALA</div>
                    <div style={{fontFamily:"'Playfair Display',serif",
                      fontSize:22,color:GOLD,letterSpacing:'0.2em'}}>{roomCode}</div>
                  </div>
                  {game?.currentEvent && (
                    <div style={{marginBottom:4}}>
                      <div style={{color:'#777',fontFamily:"'Jost',sans-serif",
                        fontSize:10,letterSpacing:'0.1em',marginBottom:6}}>EVENTO ACTUAL</div>
                      <EventBanner event={game.currentEvent}/>
                    </div>
                  )}
                  <div style={{background:'#0e0800',border:`1px solid ${BORDER}`,
                    borderRadius:6,padding:'10px 14px'}}>
                    <div style={{color:'#777',fontFamily:"'Jost',sans-serif",
                      fontSize:10,letterSpacing:'0.1em',marginBottom:8}}>FASE ACTUAL</div>
                    {[{id:'roulette',label:'Ruleta'},{id:'invest',label:'Inversiones'},
                      {id:'simulate',label:'Resultados'},{id:'auction',label:'Subasta'},
                      {id:'loans',label:'Préstamos'},{id:'standings',label:'Clasificación'}].map(p=>(
                      <div key={p.id} style={{display:'flex',alignItems:'center',
                        gap:8,marginBottom:4}}>
                        <div style={{width:7,height:7,borderRadius:'50%',flexShrink:0,
                          background:game?.phase===p.id?GOLD:BORDER}}/>
                        <span style={{color:game?.phase===p.id?GOLD:'#555',
                          fontFamily:"'Jost',sans-serif",fontSize:12}}>{p.label}</span>
                      </div>
                    ))}
                  </div>
                  <GoldDivider/>
                  <GoldBtn variant="ghost" size="md" onClick={()=>setMenuOpen(false)}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:8}}>
                    <Ico name="x" size={14}/> Cerrar menú
                  </GoldBtn>
                  <GoldBtn variant="danger" size="md"
                    onClick={()=>{if(window.confirm('¿Abandonar la partida?')) leave();}}
                    style={{width:'100%',display:'flex',alignItems:'center',gap:8}}>
                    <Ico name="log-out" size={14} color="#fff"/> Abandonar partida
                  </GoldBtn>
                </div>
              )}

              {tab==='portfolio' && (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{background:'#0e0800',border:`1px solid ${BORDER}`,
                    borderRadius:6,padding:'10px 14px'}}>
                    <div style={{color:'#777',fontFamily:"'Jost',sans-serif",
                      fontSize:10,letterSpacing:'0.1em',marginBottom:4}}>EFECTIVO</div>
                    <MoneyDisplay amount={me?.cash||0} size="lg"/>
                  </div>
                  <div>
                    <div style={{color:'#777',fontFamily:"'Jost',sans-serif",
                      fontSize:10,letterSpacing:'0.1em',marginBottom:8}}>
                      PROPIEDADES ({myProps.length})
                    </div>
                    {myProps.length===0
                      ? <p style={{color:'#555',fontFamily:"'Jost',sans-serif",fontSize:12}}>Sin propiedades</p>
                      : myProps.map((p,i)=>(
                        <div key={i} style={{background:'#0e0800',
                          border:`1px solid oklch(40% 0.12 145deg)`,
                          borderRadius:5,padding:'8px 11px',marginBottom:6}}>
                          <div style={{color:GREEN_CLR,fontFamily:"'Playfair Display',serif",
                            fontSize:12,fontWeight:600,marginBottom:3}}>{p.name}</div>
                          <div style={{display:'flex',justifyContent:'space-between'}}>
                            <span style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:11}}>
                              {fmtFull(p.value)}
                            </span>
                            <span style={{color:GREEN_CLR,fontFamily:"'Jost',sans-serif",fontSize:11}}>
                              +{fmtFull(p.monthlyRent)}/mes
                            </span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                  <div>
                    <div style={{color:'#777',fontFamily:"'Jost',sans-serif",
                      fontSize:10,letterSpacing:'0.1em',marginBottom:8}}>
                      DEUDAS ({myLoans.length})
                    </div>
                    {myLoans.length===0
                      ? <p style={{color:'#555',fontFamily:"'Jost',sans-serif",fontSize:12}}>Sin deudas</p>
                      : myLoans.map((l,i)=>(
                        <div key={i} style={{background:'#0e0800',
                          border:`1px solid ${RED}44`,borderRadius:5,
                          padding:'8px 11px',marginBottom:6}}>
                          <div style={{color:'#cc8888',fontFamily:"'Jost',sans-serif",
                            fontSize:11,marginBottom:3}}>{l.label||'Préstamo'}</div>
                          <div style={{display:'flex',justifyContent:'space-between'}}>
                            <MoneyDisplay amount={-(l.remaining||0)} size="sm"/>
                            <span style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:11}}>
                              {(l.rate*100).toFixed(0)}% · {l.monthsLeft}m restantes
                            </span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                  {myEffects.length>0 && (
                    <div>
                      <div style={{color:'#777',fontFamily:"'Jost',sans-serif",
                        fontSize:10,letterSpacing:'0.1em',marginBottom:8}}>EFECTOS ACTIVOS</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                        {myEffects.map((ef,i)=>(
                          <EffectTag key={i}
                            label={`${ef.label||ef.type} (${ef.monthsLeft}m)`}
                            type={ef.type.includes('multiplier')||ef.type.includes('immunity')||ef.type.includes('boost')?'good':'bad'}/>
                        ))}
                      </div>
                    </div>
                  )}
                  {myArts.length>0 && (
                    <div>
                      <div style={{color:'#777',fontFamily:"'Jost',sans-serif",
                        fontSize:10,letterSpacing:'0.1em',marginBottom:8}}>ARTEFACTOS</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                        {myArts.map((a,i)=>(
                          <EffectTag key={i} label={a.name}
                            type={a.type==='blessing'?'good':a.type==='property'?'neutral':'bad'}/>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab==='rules' && (
                <div style={{color:'#999',fontFamily:"'Jost',sans-serif",
                  fontSize:12,lineHeight:1.9,display:'flex',flexDirection:'column',gap:12}}>
                  {[
                    {t:'Objetivo',b:'Acumular el mayor patrimonio neto al final de los 12 meses. Patrimonio = efectivo + propiedades − deudas.'},
                    {t:'Ruleta inicial',b:'Cada jugador gira la ruleta para obtener su capital inicial (entre $50K y $1M).'},
                    {t:'Inversiones',b:'Decide cómo invertir tu efectivo en 6 sectores. El seguro (3%) limita pérdidas al 10%.'},
                    {t:'Eventos del mes',b:'Cada mes un evento modifica los retornos. Las noticias dan pistas — algunas son falsas.'},
                    {t:'Subasta',b:'Se subastan 5 objetos (artefactos + propiedades). Pujas secretas. Solo el ganador descubre qué ganó.'},
                    {t:'Artefactos',b:'Bendiciones dan ventajas. Maldiciones causan daño. La Campana de Oro protege de maldiciones.'},
                    {t:'Propiedades',b:'Dan renta mensual automática. Se obtienen en subasta o por artefactos.'},
                    {t:'Préstamos',b:'Don Aurelio ofrece préstamos tras la subasta. Los intereses se cobran mensualmente.'},
                    {t:'Quiebra',b:'Si tu efectivo llega a $0 con deudas, no puedes invertir. Don Aurelio ofrece rescate al 30%.'},
                  ].map(({t,b})=>(
                    <div key={t}>
                      <div style={{color:GOLD_DIM,fontFamily:"'Playfair Display',serif",
                        fontSize:13,fontWeight:600,marginBottom:3}}>{t}</div>
                      <div>{b}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{flex:1}}>{children}</div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────
function App() {
  const [fbUrl,  setFbUrl]  = useState(localStorage.getItem('subasta_fb')||'');
  const [roomCode, setRoom] = useState(localStorage.getItem('subasta_room')||window.location.hash.slice(1)||'');
  const [myId,   setMyId]   = useState(localStorage.getItem('subasta_player')||'');
  const [roomState, setRS]  = useState(null);
  const [status, setStatus] = useState('idle');
  const advancingRef = useRef(false);

  // Derived state — computed unconditionally (hooks must not be conditional)
  const room = roomState;
  const game = room?.game;
  const me   = room?.players?.[myId];
  const players = useMemo(()=>Object.values(room?.players||{}),[room]);
  const isHost = room?.meta?.hostId===myId;
  const hasOracle = useMemo(()=>toArr(me?.activeEffects).some(e=>e.type==='oracle'&&(e.monthsLeft||0)>0),[me]);
  const oracleData = useMemo(()=>{
    if(!hasOracle||!game) return {};
    const eventMods = (game.currentEvent?.modifiers) || {};
    return Object.fromEntries(GD.INVESTMENTS.map(inv=>[
      inv.id,
      getMonthReturn(inv, game.month, game.gameSeed) + (eventMods[inv.id] || 0)
    ]));
  },[hasOracle,game]);

  // Save firebase URL
  const saveFb = (url) => { localStorage.setItem('subasta_fb',url); setFbUrl(url); };

  // Poll room state
  useEffect(()=>{
    if(!roomCode||!fbUrl) return;
    let active=true;
    const poll=async()=>{
      try {
        const d=await fbGet(fbUrl,`rooms/${roomCode}`);
        if(active){ setRS(d); setStatus(d?'ok':'notfound'); }
      } catch(e){ if(active) setStatus('error'); }
    };
    poll();
    const iv=setInterval(poll,2500);
    return()=>{ active=false; clearInterval(iv); };
  },[roomCode,fbUrl]);

  // Host advances phases
  useEffect(()=>{
    if(!room||!isHost||!game||game.phase==='lobby'||game.phase==='final'||game.phase==='standings'||game.phase==='simulate') return;
    const waiting = game.waitingFor||{};
    const stillWaiting = players.filter(p=>waiting[p.id]===true);
    // Ascending auction: use ascBid state instead of waitingFor
    const isAscBidding = game.phase==='auction' && game.auctionPhase!=='reveal';
    if (isAscBidding) {
      const ab=game.ascBid||{}; const passedObj=ab.passed||{};
      const allPassed=players.every(p=>passedObj[p.id]);
      const leaderWins=ab.leaderId&&!passedObj[ab.leaderId]&&
        players.filter(p=>p.id!==ab.leaderId).every(p=>passedObj[p.id]);
      if((!allPassed&&!leaderWins)||advancingRef.current) return;
    } else {
      if(stillWaiting.length>0||advancingRef.current) return;
    }

    const advance=async()=>{
      if(advancingRef.current) return;
      advancingRef.current=true;
      try {
        if(game.phase==='roulette') {
          const w={}; players.forEach(p=>{ w[p.id]=true; });
          // Pick random market event and 3 news items for this month
          const evtIdx = Math.floor(seededRand(game.gameSeed+game.month*17)*GD.MARKET_EVENTS.length);
          const currentEvent = GD.MARKET_EVENTS[evtIdx];
          // Pick 3 random news items (mix accurate/inaccurate)
          const shuffledNews = [...GD.MARKET_NEWS]
            .map((item,i)=>({item,sort:seededRand(game.gameSeed+game.month*31+i*17)}))
            .sort((a,b)=>a.sort-b.sort).slice(0,3).map(x=>x.item);
          await fbPatch(fbUrl,`rooms/${roomCode}`,{
            'game/phase':'invest','game/waitingFor':w,'game/investPlans':null,
            'game/insuranceBuyers':null,'game/currentEvent':currentEvent,
            'game/currentNews':shuffledNews,
          });
        }
        else if(game.phase==='invest') {
          // ── Run simulation ──────────────────────────────────────────
          // NOTE: p.cash is already (original - invested) because submitInvestment
          // deducted it. We return principal + gain/loss: cash += amount*(1+ret)
          const plans=game.investPlans||{};
          const updatedPlayers={};
          const simResults={};  // stored so SimulationScreen can display them

          players.forEach(p=>{
            const invs=toArr(plans[p.id]||[]);
            const isInsured=(game.insuranceBuyers||{})[p.id]===true;
            const isBankrupt=(p.cash||0)<=0&&toArr(p.loans).length>0;
            let cash=p.cash||0;
            const invResults=[];
            const eventMods=(game.currentEvent?.modifiers)||{};

            invs.forEach(inv=>{
              const it=GD.INVESTMENTS.find(i=>i.id===inv.type);
              if(!it) return;
              let ret=getMonthReturn(it,game.month,game.gameSeed);
              // Apply event modifier
              ret+=(eventMods[inv.type]||0);
              let mult=1;
              toArr(p.activeEffects).filter(e=>(e.monthsLeft||0)>0).forEach(ef=>{
                if(ef.type==='investment_multiplier') mult*=ef.value;
                if(ef.type==='zero_returns') ret=0;
                if(ef.type==='business_zero'&&inv.type==='business') ret=0;
                if(ef.type==='invert_losses'&&ret<0) ret=Math.abs(ret);
              });
              // market_freeze: any player holding this effect zeros ALL players' returns
              if(players.some(px=>toArr(px.activeEffects).some(ef=>ef.type==='market_freeze'&&(ef.monthsLeft||0)>0))) ret=0;
              ret*=mult;
              // Insurance: cap losses at -10%
              let capped=false;
              if(isInsured&&ret<-0.10){ ret=-0.10; capped=true; }
              const returned=Math.round((inv.amount||0)*(1+ret));
              const gain=returned-(inv.amount||0);
              cash+=returned;
              invResults.push({type:inv.type,amount:inv.amount,returned,gain,ret,capped,name:it.name,color:it.color});
            });

            // property income
            let propIncome=0;
            toArr(p.properties).forEach(pr=>{ propIncome+=(pr.monthlyRent||Math.round((pr.value||0)*0.025)); });
            const boost=toArr(p.activeEffects).find(e=>e.type==='property_income_boost'&&(e.monthsLeft||0)>0);
            if(boost) propIncome+=toArr(p.properties).length*(boost.value||0);
            cash+=propIncome;

            // monthly drain (maldición)
            let drain=0;
            toArr(p.activeEffects).filter(e=>e.type==='monthly_drain'&&(e.monthsLeft||0)>0).forEach(e=>{ drain+=(e.value||0); });
            cash-=drain;

            // loan interest — calculate on ORIGINAL remaining before updating
            let loanInterest=0;
            const newLoans=toArr(p.loans).map(l=>{
              const interest=Math.round((l.remaining||0)*(l.rate||0)/12);
              loanInterest+=interest;
              cash-=interest;
              // Reduce remaining (partial principal reduction)
              const principalPay=Math.max(0,Math.round((l.original||l.remaining||0)/(l.monthsLeft||12)));
              const newRemaining=Math.max(0,(l.remaining||0)-principalPay);
              return {...l,remaining:newRemaining,monthsLeft:Math.max(0,(l.monthsLeft||0)-1)};
            }).filter(l=>(l.remaining||0)>0&&(l.monthsLeft||0)>0);

            // tick down active effects
            const newEffects=toArr(p.activeEffects)
              .map(e=>({...e,monthsLeft:(e.monthsLeft||0)-1}))
              .filter(e=>e.monthsLeft>0);

            const oldCash=(p.cash||0)+(invs.reduce((s,i)=>s+(i.amount||0),0));
            const newCash=Math.max(0,cash);
            // Bankruptcy flag: cash=0 AND has loans
            const nowBankrupt=newCash<=0&&newLoans.length>0;
            // Update history for net worth chart
            const nw=newCash+toArr(p.properties).reduce((s,pr)=>s+(pr.value||0),0)-newLoans.reduce((s,l)=>s+(l.remaining||0),0);
            const newHistory=[...toArr(p.history),{month:game.month,netWorth:nw}];

            simResults[p.id]={invResults,propIncome,drain,loanInterest,
              oldCash,newCash,netChange:newCash-oldCash,insured:isInsured};
            updatedPlayers[p.id]={...p,cash:newCash,investments:[],
              loans:newLoans,activeEffects:newEffects,
              bankrupt:nowBankrupt,history:newHistory};
          });

          // Draw 5 items for auction: mix 3 artifacts + 2 properties
          const deck=toArr(game.artifactDeck);
          const propDeck=toArr(game.propertyDeck||[]);
          const idx=game.artifactDeckIdx||0;
          const pidx=game.propertyDeckIdx||0;
          const arts=deck.slice(idx,idx+3);
          const props=propDeck.slice(pidx,pidx+2);
          // Shuffle the 5 items together
          const auctionItems=[...arts,...props].sort(()=>Math.random()-0.5);
          const nextIdx=(idx+3)%deck.length;
          const nextPidx=(pidx+2)%Math.max(propDeck.length,1);
          const w={}; players.forEach(p=>{ w[p.id]=true; });
          const updates={
            'game/phase':'simulate',
            'game/simResults':simResults,
            'game/auctionArtifacts':auctionItems,
            'game/artifactDeckIdx':nextIdx,
            'game/propertyDeckIdx':nextPidx,
            'game/currentArtifactIdx':0,
            'game/auctionPhase':'bidding',
            'game/auctionBids':null,
            'game/auctionWinner':null,
            'game/waitingFor':w,
          };
          players.forEach(p=>{ updates[`players/${p.id}`]=updatedPlayers[p.id]; });
          await fbPatch(fbUrl,`rooms/${roomCode}`,updates);
        }
        else if(game.phase==='auction') {
          const arts=toArr(game.auctionArtifacts);
          const artIdx=game.currentArtifactIdx||0;
          const art=arts[artIdx];
          if(game.auctionPhase==='reveal') {
            // reveal is advanced manually via nextArtifact() button
            return;
          }
          // Ascending auction ended — compute winner from ascBid
          const ab=game.ascBid||{};
          const winId=ab.leaderId||null;
          const winAmt=winId?(ab.current||0):0;
          const winner={playerId:winId,amount:winAmt};
          let updPlayers=[...players];
          if(winId&&winAmt>0) {
            if(art.type==='property') {
              updPlayers=updPlayers.map(p=>p.id===winId?{
                ...p,cash:Math.max(0,(p.cash||0)-winAmt),
                properties:[...toArr(p.properties),{id:art.id,name:art.name,value:art.value,monthlyRent:art.monthlyRent}],
              }:p);
            } else {
              const immune=(room.players[winId]?.activeEffects||[]).some(e=>e.type==='curse_immunity'&&(e.monthsLeft||0)>0);
              if(!(art.type==='curse'&&immune)) updPlayers=applyArtifactEffect(art,winId,updPlayers);
              updPlayers=updPlayers.map(p=>p.id===winId?{...p,cash:Math.max(0,(p.cash||0)-winAmt)}:p);
            }
          }
          const playerUpdates={};
          updPlayers.forEach(p=>{ playerUpdates[`players/${p.id}`]=p; });
          const w={}; players.forEach(p=>{ w[p.id]=true; });
          await fbPatch(fbUrl,`rooms/${roomCode}`,{
            ...playerUpdates,
            'game/auctionPhase':'reveal','game/auctionWinner':winner,
            'game/waitingFor':w,'game/ascBid':null,
          });
        }
        else if(game.phase==='loans') {
          await fbPatch(fbUrl,`rooms/${roomCode}`,{'game/phase':'standings','game/waitingFor':null});
        }
      } finally { advancingRef.current=false; }
    };
    advance();
  },[room,isHost,game,players,fbUrl,roomCode]);

  // ── ACTIONS ──────────────────────────────
  const submitInvestment = async (investments, newCash, insured=false) => {
    const updates={};
    updates[`players/${myId}/cash`]=newCash;
    updates[`players/${myId}/investments`]=investments;
    updates[`game/investPlans/${myId}`]=investments;
    if (insured) updates[`game/insuranceBuyers/${myId}`]=true;
    updates[`game/waitingFor/${myId}`]=null;
    await fbPatch(fbUrl,`rooms/${roomCode}`,updates);
  };

  const sendChat = async (text) => {
    const msgId = `m${Date.now()}`;
    await fbSet(fbUrl, `rooms/${roomCode}/chat/${msgId}`, {
      pid:myId, name:(me?.name||'?'), text, ts:Date.now()
    });
  };

  const placeBid = async (amount) => {
    await fbPatch(fbUrl,`rooms/${roomCode}`,{
      'game/ascBid/current':amount,
      'game/ascBid/leaderId':myId,
    });
    window.SFX?.coin?.();
  };
  const passBid = async () => {
    await fbPatch(fbUrl,`rooms/${roomCode}`,{
      [`game/ascBid/passed/${myId}`]:true,
    });
    window.SFX?.click?.();
  };

  const submitLoan = async (loan) => {
    const updates={};
    if(loan) {
      // Write loans as a complete array (not nested object) so Firebase
      // returns it as a numeric-keyed array, which safeArr/calcNetWorth handles correctly
      const currentLoans = toArr(me?.loans || []);
      updates[`players/${myId}/cash`]=(me.cash||0)+loan.original;
      updates[`players/${myId}/loans`]=[...currentLoans, loan];
    }
    updates[`game/loanDecisions/${myId}`]=true;
    updates[`game/waitingFor/${myId}`]=null;
    await fbPatch(fbUrl,`rooms/${roomCode}`,updates);
  };

  const simulateContinue = async () => {
    await fbPatch(fbUrl,`rooms/${roomCode}`,{
      'game/phase':'auction','game/waitingFor':null,
      'game/auctionPhase':'bidding','game/auctionWinner':null,
      'game/auctionBids':null,'game/currentArtifactIdx':0,
      'game/ascBid':{current:0,leaderId:null,passed:{},minRaise:5000},
    });
  };

  const nextArtifact = async () => {
    const arts=toArr(game.auctionArtifacts), artIdx=game.currentArtifactIdx||0;
    if(artIdx<arts.length-1) {
      await fbPatch(fbUrl,`rooms/${roomCode}`,{
        'game/currentArtifactIdx':artIdx+1,'game/auctionPhase':'bidding',
        'game/waitingFor':null,'game/auctionWinner':null,
        'game/ascBid':{current:0,leaderId:null,passed:{},minRaise:5000},
      });
    } else {
      const w={}; players.forEach(p=>{ w[p.id]=true; });
      await fbPatch(fbUrl,`rooms/${roomCode}`,{'game/phase':'loans','game/waitingFor':w,'game/loanDecisions':null});
    }
  };

  const leave = () => {
    localStorage.removeItem('subasta_room');
    localStorage.removeItem('subasta_player');
    window.location.hash='';
    setRoom(''); setMyId(''); setRS(null); setStatus('idle');
  };

  const chatMessages = useMemo(()=>
    Object.values(room?.chat||{}).sort((a,b)=>(a.ts||0)-(b.ts||0)).slice(-30)
  ,[room]);

  // ── RENDER ────────────────────────────────
  if (!fbUrl) return <ConfigScreen onSave={saveFb}/>;
  if (!roomCode||!myId) return <LobbyScreen fbUrl={fbUrl} onJoin={(code,pid,initialRoom)=>{ setRoom(code); setMyId(pid); if(initialRoom){setRS(initialRoom);setStatus('ok');} }}/>;
  if (status==='idle'||status==='error'||!room) {
    return (
      <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
        <GoldTitle size="md">Conectando...</GoldTitle>
        {status==='error' && <><p style={{color:RED,fontFamily:"'Jost',sans-serif",fontSize:14}}>Error de conexión</p><GoldBtn onClick={leave}>Volver al inicio</GoldBtn></>}
      </div>
    );
  }
  if (!me) {
    return <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <GoldTitle size="md">Jugador no encontrado</GoldTitle>
      <GoldBtn onClick={leave}>Volver al inicio</GoldBtn>
    </div>;
  }

  const phase      = game?.phase||'lobby';
  const waiting    = game?.waitingFor||{};
  const myDone     = waiting[myId]!==true;
  const waitingArr = players.filter(p=>waiting[p.id]===true).map(p=>p.id);
  const arts       = toArr(game?.auctionArtifacts);
  const artIdx     = game?.currentArtifactIdx||0;


  if(phase==='lobby') return <WaitingRoom room={room} myId={myId} fbUrl={fbUrl} roomCode={roomCode} onLeave={leave}/>;
  if(phase==='roulette') return <RoulettePhaseScreen room={room} myId={myId} fbUrl={fbUrl} roomCode={roomCode}/>;

  if(phase==='invest') return (
    <GameWrapper game={game} players={players} myId={myId} me={me} roomCode={roomCode} leave={leave}>
      <InvestmentPhase player={me} month={game.month||1} gameSeed={game.gameSeed||0}
        onConfirm={submitInvestment} hasOracle={hasOracle} oracleData={oracleData}
        isDone={myDone} waitingPlayers={waitingArr} allPlayers={players}
        event={game.currentEvent} news={toArr(game.currentNews)}/>
    </GameWrapper>
  );

  if(phase==='simulate') return (
    <GameWrapper game={game} players={players} myId={myId} me={me} roomCode={roomCode} leave={leave}>
      <SimulationScreen players={players} month={game.month||1}
        simResults={game.simResults||{}} onContinue={simulateContinue} isHost={isHost}
        event={game.currentEvent} news={toArr(game.currentNews)}/>
    </GameWrapper>
  );

  if(phase==='auction') return (
    <GameWrapper game={game} players={players} myId={myId} me={me} roomCode={roomCode} leave={leave}>
      <AuctionPhase me={me} players={players} artifacts={arts}
        artIdx={artIdx} ascBid={game.ascBid||{}} onPlaceBid={placeBid} onPassBid={passBid}
        phase={game.auctionPhase||'bidding'} winner={game.auctionWinner}
        onNextArtifact={nextArtifact} isHost={isHost} month={game.month||1}
        chatMessages={chatMessages} onChatSend={sendChat}/>
    </GameWrapper>
  );

  if(phase==='loans') return (
    <GameWrapper game={game} players={players} myId={myId} me={me} roomCode={roomCode} leave={leave}>
      <LoansPhase me={me} onComplete={submitLoan}
        isDone={myDone} waitingPlayers={waitingArr} allPlayers={players}/>
    </GameWrapper>
  );

  if(phase==='standings') return <StandingsScreen room={room} myId={myId}
    fbUrl={fbUrl} roomCode={roomCode} isHost={isHost}/>;

  if(phase==='final') return <FinalScreen room={room} fbUrl={fbUrl} roomCode={roomCode} onLeave={leave}/>;

  return <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
    <GoldTitle>Cargando...</GoldTitle>
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
