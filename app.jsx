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
  return players.map(p => {
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
        up.loans=[...(up.loans||[]),{id:`d${Date.now()}`,original:artifact.value||150000,remaining:artifact.value||150000,rate:artifact.rate||0.20,monthsLeft:12,label:artifact.name}]; break;
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
      default: break;
    }
    return up;
  }).map(p => {
    const thief = players.find(x=>x._stealAmt&&x.id===winnerId&&x.id!==p.id);
    if (thief) return {...p, cash:Math.max(0,(p.cash||0)-(thief._stealAmt||0))};
    // stolen_cash: random victim
    const stolenBy = players.find(x=>x._stolenAmt&&x.id===winnerId&&x.id!==p.id);
    if (stolenBy&&p.id!==winnerId) {
      const victims = players.filter(x=>x.id!==winnerId);
      if (victims[0]?.id===p.id) return {...p,cash:Math.max(0,(p.cash||0)-(stolenBy._stolenAmt||0))};
    }
    const { _stealAmt, _stolenAmt, ...clean } = p;
    return clean;
  });
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
    await fbPatch(fbUrl, `rooms/${roomCode}`, {
      'meta/status':'playing',
      'game/phase':'roulette',
      'game/rouletteTargets':targets,
      'game/waitingFor':waiting,
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
    const waiting = {};
    Object.values(room.players||{}).forEach(p=>{ waiting[p.id]=true; });
    await fbPatch(fbUrl, `rooms/${roomCode}`, {
      'game/phase': newMonth>12?'final':'invest',
      'game/month': newMonth,
      'game/waitingFor': waiting,
      'game/investPlans': null,
    });
  };

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:24,gap:20}}>
      <GoldTitle size="lg">Fin del Mes {month}</GoldTitle>
      <GoldDivider/>
      <div style={{width:'100%',maxWidth:500,display:'flex',flexDirection:'column',gap:9}}>
        {players.map((p,i)=>{
          const nw=calcNetWorthArr(p);
          return (
            <Card key={p.id} glow={i===0} style={{display:'flex',justifyContent:'space-between',
              alignItems:'center',padding:'12px 18px'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{color:GOLD_DIM,fontFamily:"'Playfair Display',serif",
                  fontSize:13,fontWeight:700,width:20,textAlign:'center'}}>{medals[i]}</span>
                <Avatar name={p.name||'?'} colorIndex={p.colorIndex||0} size={34}/>
                <div>
                  <div style={{color:GOLD_LIGHT,fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:600}}>{p.name}</div>
                  <div style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:11}}>
                    {fmtFull(p.cash||0)} efectivo · {(p.properties||[]).length} prop.
                  </div>
                </div>
              </div>
              <MoneyDisplay amount={nw} size="md"/>
            </Card>
          );
        })}
      </div>
      {isHost ? (
        <GoldBtn size="xl" onClick={nextMonth}>
          {month>=12?'Ver resultados finales':'Mes '+(month+1)+' →'}
        </GoldBtn>
      ) : (
        <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:14}}>Esperando al anfitrión...</p>
      )}
    </div>
  );
}

// ── FINAL SCREEN ──────────────────────────────
function FinalScreen({ room, fbUrl, roomCode, onLeave }) {
  const players = Object.values(room.players||{}).sort((a,b)=>calcNetWorthArr(b)-calcNetWorthArr(a));
  const winner = players[0];
  const medals = ['I','II','III','IV','V','VI'];

  const restart = async () => {
    await fbPatch(fbUrl, `rooms/${roomCode}`, { 'meta/status':'lobby', 'game/phase':'lobby', 'game/month':1 });
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
    return Object.fromEntries(GD.INVESTMENTS.map(inv=>[inv.id,getMonthReturn(inv,game.month,game.gameSeed)]));
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
    if(stillWaiting.length>0||advancingRef.current) return;

    const advance=async()=>{
      if(advancingRef.current) return;
      advancingRef.current=true;
      try {
        if(game.phase==='roulette') {
          const w={}; players.forEach(p=>{ w[p.id]=true; });
          await fbPatch(fbUrl,`rooms/${roomCode}`,{'game/phase':'invest','game/waitingFor':w,'game/investPlans':null});
        }
        else if(game.phase==='invest') {
          // Run simulation
          const plans=game.investPlans||{};
          const updatedPlayers={};
          players.forEach(p=>{
            const invs=toArr(plans[p.id]||[]);
            let cash=p.cash||0;
            invs.forEach(inv=>{
              const it=GD.INVESTMENTS.find(i=>i.id===inv.type);
              if(!it) return;
              let ret=getMonthReturn(it,game.month,game.gameSeed);
              let mult=1;
              toArr(p.activeEffects).filter(e=>(e.monthsLeft||0)>0).forEach(ef=>{
                if(ef.type==='investment_multiplier') mult*=ef.value;
                if(ef.type==='zero_returns') ret=0;
                if(ef.type==='business_zero'&&inv.type==='business') ret=0;
              });
              ret*=mult;
              cash+=Math.round((inv.amount||0)*ret);
            });
            // property income
            toArr(p.properties).forEach(pr=>{ cash+=(pr.monthlyRent||Math.round((pr.value||0)*0.025)); });
            const boost=toArr(p.activeEffects).find(e=>e.type==='property_income_boost'&&(e.monthsLeft||0)>0);
            if(boost) cash+=toArr(p.properties).length*(boost.value||0);
            // drain
            toArr(p.activeEffects).filter(e=>e.type==='monthly_drain'&&(e.monthsLeft||0)>0).forEach(e=>{ cash-=(e.value||0); });
            // loan interest
            const newLoans=toArr(p.loans).map(l=>({...l,remaining:(l.remaining||0)+Math.round((l.remaining||0)*(l.rate||0)/12)}));
            newLoans.forEach(l=>{ cash-=Math.round((l.remaining||0)*(l.rate||0)/12); });
            // tick effects
            const newEffects=toArr(p.activeEffects).map(e=>({...e,monthsLeft:(e.monthsLeft||0)-1})).filter(e=>e.monthsLeft>0);
            updatedPlayers[p.id]={...p,cash:Math.max(0,cash),investments:[],loans:newLoans,activeEffects:newEffects};
          });
          // Draw 5 artifacts
          const deck=toArr(game.artifactDeck);
          const idx=game.artifactDeckIdx||0;
          const arts=deck.slice(idx,idx+5);
          const nextIdx=(idx+5)%deck.length;
          const w={}; players.forEach(p=>{ w[p.id]=true; });
          const updates={'game/phase':'simulate','game/simulationPlayers':updatedPlayers,
            'game/auctionArtifacts':arts,'game/artifactDeckIdx':nextIdx,
            'game/currentArtifactIdx':0,'game/auctionPhase':'bidding','game/auctionBids':null,'game/auctionWinner':null};
          players.forEach(p=>{ updates[`players/${p.id}`]=updatedPlayers[p.id]; });
          await fbPatch(fbUrl,`rooms/${roomCode}`,updates);
        }
        else if(game.phase==='auction') {
          const arts=toArr(game.auctionArtifacts);
          const artIdx=game.currentArtifactIdx||0;
          const art=arts[artIdx];
          const bids=game.auctionBids||{};
          const artBids=bids[art?.id]||{};
          // Already revealed — move to next or loans
          if(game.auctionPhase==='reveal') {
            if(artIdx<arts.length-1) {
              const w={}; players.forEach(p=>{ w[p.id]=true; });
              await fbPatch(fbUrl,`rooms/${roomCode}`,{'game/currentArtifactIdx':artIdx+1,'game/auctionPhase':'bidding','game/waitingFor':w,'game/auctionWinner':null});
            } else {
              const w={}; players.forEach(p=>{ w[p.id]=true; });
              await fbPatch(fbUrl,`rooms/${roomCode}`,{'game/phase':'loans','game/waitingFor':w,'game/loanDecisions':null});
            }
          } else {
            // All bids in — compute winner
            let winId=null,winAmt=-1;
            Object.entries(artBids).forEach(([pid,amt])=>{ if(amt>winAmt){winAmt=amt;winId=pid;} });
            const winner={playerId:winId,amount:winAmt};
            // Apply artifact
            let updPlayers=[...players];
            if(winId&&winAmt>0) {
              const immune=(room.players[winId]?.activeEffects||[]).some(e=>e.type==='curse_immunity'&&(e.monthsLeft||0)>0);
              if(!(art.type==='curse'&&immune)) {
                updPlayers=applyArtifactEffect(art,winId,updPlayers);
              }
              updPlayers=updPlayers.map(p=>p.id===winId?{...p,cash:Math.max(0,(p.cash||0)-winAmt)}:p);
            }
            const playerUpdates={};
            updPlayers.forEach(p=>{ playerUpdates[`players/${p.id}`]=p; });
            await fbPatch(fbUrl,`rooms/${roomCode}`,{...playerUpdates,'game/auctionPhase':'reveal','game/auctionWinner':winner,'game/waitingFor':null});
          }
        }
        else if(game.phase==='loans') {
          await fbPatch(fbUrl,`rooms/${roomCode}`,{'game/phase':'standings','game/waitingFor':null});
        }
      } finally { advancingRef.current=false; }
    };
    advance();
  },[room,isHost,game,players,fbUrl,roomCode]);

  // ── ACTIONS ──────────────────────────────
  const submitInvestment = async (investments, newCash) => {
    const updates={};
    updates[`players/${myId}/cash`]=newCash;
    updates[`players/${myId}/investments`]=investments;
    updates[`game/investPlans/${myId}`]=investments;
    updates[`game/waitingFor/${myId}`]=null;
    await fbPatch(fbUrl,`rooms/${roomCode}`,updates);
  };

  const submitBid = async (artId, amount) => {
    const updates={};
    updates[`game/auctionBids/${artId}/${myId}`]=amount;
    updates[`game/waitingFor/${myId}`]=null;
    await fbPatch(fbUrl,`rooms/${roomCode}`,updates);
  };

  const submitLoan = async (loan) => {
    const updates={};
    if(loan) {
      updates[`players/${myId}/cash`]=(me.cash||0)+loan.original;
      updates[`players/${myId}/loans/${loan.id}`]=loan;
    }
    updates[`game/loanDecisions/${myId}`]=true;
    updates[`game/waitingFor/${myId}`]=null;
    await fbPatch(fbUrl,`rooms/${roomCode}`,updates);
  };

  const simulateContinue = async () => {
    const w={}; players.forEach(p=>{ w[p.id]=true; });
    await fbPatch(fbUrl,`rooms/${roomCode}`,{'game/phase':'auction','game/waitingFor':w});
  };

  const nextArtifact = async () => {
    const arts=toArr(game.auctionArtifacts), artIdx=game.currentArtifactIdx||0;
    if(artIdx<arts.length-1) {
      const w={}; players.forEach(p=>{ w[p.id]=true; });
      await fbPatch(fbUrl,`rooms/${roomCode}`,{'game/currentArtifactIdx':artIdx+1,'game/auctionPhase':'bidding','game/waitingFor':w,'game/auctionWinner':null});
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

  const phase = game?.phase||'lobby';
  const waiting = game?.waitingFor||{};
  const myDone = waiting[myId]!==true;
  const waitingArr = players.filter(p=>waiting[p.id]===true).map(p=>p.id);
  const arts = toArr(game?.auctionArtifacts);
  const artIdx = game?.currentArtifactIdx||0;

  if(phase==='lobby') return <WaitingRoom room={room} myId={myId} fbUrl={fbUrl} roomCode={roomCode} onLeave={leave}/>;
  if(phase==='roulette') return <RoulettePhaseScreen room={room} myId={myId} fbUrl={fbUrl} roomCode={roomCode}/>;

  if(phase==='invest') return <InvestmentPhase player={me} month={game.month||1} gameSeed={game.gameSeed||0}
    onConfirm={submitInvestment} hasOracle={hasOracle} oracleData={oracleData}
    isDone={myDone} waitingPlayers={waitingArr} allPlayers={players}/>;

  if(phase==='simulate') return <SimulationScreen players={players} month={game.month||1}
    gameSeed={game.gameSeed||0} onContinue={simulateContinue} isHost={isHost}/>;

  if(phase==='auction') return <AuctionPhase me={me} players={players} artifacts={arts}
    artIdx={artIdx} bids={game.auctionBids||{}} onBid={submitBid}
    phase={game.auctionPhase||'bidding'} winner={game.auctionWinner}
    onNextArtifact={nextArtifact} isHost={isHost} month={game.month||1}/>;

  if(phase==='loans') return <LoansPhase me={me} onComplete={submitLoan}
    isDone={myDone} waitingPlayers={waitingArr} allPlayers={players}/>;

  if(phase==='standings') return <StandingsScreen room={room} myId={myId}
    fbUrl={fbUrl} roomCode={roomCode} isHost={isHost}/>;

  if(phase==='final') return <FinalScreen room={room} fbUrl={fbUrl} roomCode={roomCode} onLeave={leave}/>;

  return <div style={{minHeight:'100vh',background:BG,display:'flex',alignItems:'center',justifyContent:'center'}}>
    <GoldTitle>Cargando...</GoldTitle>
  </div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
