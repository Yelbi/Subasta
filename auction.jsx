// =============================================
// SUBASTA v2 — Auction & Loans Phases (v3)
// =============================================

// ── PROPERTY AUCTION CARD ─────────────────────
function PropertyMysteryCard({ index, totalBidders, bidsIn }) {
  return (
    <div style={{width:190,minHeight:270,borderRadius:12,
      background:'linear-gradient(160deg,#001a0a,#0a0500)',
      border:`1px solid oklch(55% 0.15 145deg)`,padding:20,
      boxSizing:'border-box',display:'flex',flexDirection:'column',
      alignItems:'center',gap:14,
      boxShadow:`0 8px 32px rgba(0,0,0,0.7),0 0 20px rgba(0,160,60,0.08)`,
      position:'relative'}}>
      <div style={{color:'oklch(55% 0.15 145deg)',fontFamily:"'Jost',sans-serif",
        fontSize:10,letterSpacing:'0.15em',alignSelf:'flex-start'}}>PROPIEDAD #{index+1}</div>
      <div style={{width:80,height:80,borderRadius:8,
        background:'radial-gradient(circle,#002a15,#0a0500)',
        border:`1px solid oklch(40% 0.12 145deg)`,
        display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:`0 0 20px rgba(0,0,0,0.5)`}}>
        <Ico name="home" size={36} color="oklch(40% 0.12 145deg)"/>
      </div>
      <div style={{textAlign:'center'}}>
        <div style={{color:'oklch(55% 0.15 145deg)',fontFamily:"'Playfair Display',serif",
          fontSize:14,marginBottom:4}}>Propiedad Misteriosa</div>
        <div style={{color:'#2a3a30',fontFamily:"'Jost',sans-serif",fontSize:11}}>
          Renta mensual garantizada
        </div>
      </div>
      <div style={{marginTop:'auto',background:'rgba(0,160,60,0.06)',
        border:`1px solid oklch(30% 0.12 145deg)`,borderRadius:4,
        padding:'4px 10px',color:'oklch(55% 0.15 145deg)',
        fontFamily:"'Jost',sans-serif",fontSize:11,width:'100%',textAlign:'center'}}>
        {bidsIn} / {totalBidders} han pasado
      </div>
    </div>
  );
}

// ── MYSTERY ARTIFACT CARD ─────────────────────
function MysteryCard({ index, totalBidders, bidsIn }) {
  return (
    <div style={{width:190,minHeight:270,borderRadius:12,
      background:'linear-gradient(160deg,#1a0f00,#0d0700)',
      border:`1px solid ${GOLD_DIM}`,padding:20,boxSizing:'border-box',
      display:'flex',flexDirection:'column',alignItems:'center',gap:14,
      boxShadow:`0 8px 32px rgba(0,0,0,0.7),0 0 20px rgba(218,165,32,0.06)`,
      position:'relative'}}>
      <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",
        fontSize:10,letterSpacing:'0.15em',alignSelf:'flex-start'}}>ARTEFACTO #{index+1}</div>
      <div style={{width:80,height:80,borderRadius:'50%',
        background:'radial-gradient(circle,#2a1500,#0a0500)',
        border:`1px solid ${BORDER2}`,display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:`0 0 20px rgba(0,0,0,0.5)`}}>
        <Ico name="help-circle" size={36} color={BORDER2}/>
      </div>
      <div style={{textAlign:'center'}}>
        <div style={{color:GOLD_DIM,fontFamily:"'Playfair Display',serif",
          fontSize:14,marginBottom:4,letterSpacing:'0.04em'}}>Artefacto Misterioso</div>
        <div style={{color:'#3a2800',fontFamily:"'Jost',sans-serif",fontSize:11}}>
          Bendición o Maldición
        </div>
      </div>
      <div style={{marginTop:'auto',background:'rgba(218,165,32,0.06)',
        border:`1px solid ${BORDER}`,borderRadius:4,padding:'4px 10px',
        color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:11,
        width:'100%',textAlign:'center'}}>
        {bidsIn} / {totalBidders} han pasado
      </div>
    </div>
  );
}

// ── FLIP CARD REVEAL ──────────────────────────
function FlipRevealCard({ item, isWinner }) {
  const [flipped, setFlipped] = useState(false);
  useEffect(()=>{
    setTimeout(()=>{
      setFlipped(true);
      if (item.type==='property') window.SFX?.coin?.();
      else if (item.type==='blessing') window.SFX?.blessing?.();
      else window.SFX?.curse?.();
    }, 300);
  },[item]);

  const isProperty = item.type==='property';
  const isBlessing = item.type==='blessing';
  const bc = isProperty ? GREEN_CLR : isBlessing ? GREEN_CLR : RED;
  const glow = isProperty ? 'rgba(0,180,80,0.2)' : isBlessing ? 'rgba(0,180,80,0.2)' : 'rgba(200,20,20,0.2)';
  const rarityColor = {común:'#888',infrecuente:GOLD_DIM,rara:GOLD_LIGHT};

  return (
    <div style={{perspective:'800px',width:210,height:320}}>
      <div style={{
        width:'100%',height:'100%',position:'relative',
        transformStyle:'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition:'transform 0.7s cubic-bezier(0.4,0.2,0.2,1)',
      }}>
        {/* Front — mystery */}
        <div style={{position:'absolute',width:'100%',height:'100%',backfaceVisibility:'hidden',
          borderRadius:12,background:'linear-gradient(160deg,#1a0f00,#0d0700)',
          border:`1px solid ${GOLD_DIM}`,display:'flex',alignItems:'center',
          justifyContent:'center'}}>
          <Ico name="help-circle" size={48} color={BORDER2}/>
        </div>
        {/* Back — revealed */}
        <div style={{position:'absolute',width:'100%',height:'100%',backfaceVisibility:'hidden',
          transform:'rotateY(180deg)',borderRadius:12,
          background:`linear-gradient(160deg,${isProperty?'#001a0a':isBlessing?'#001a0a':'#1a0000'},#080503)`,
          border:`1.5px solid ${bc}`,padding:18,boxSizing:'border-box',
          display:'flex',flexDirection:'column',alignItems:'center',gap:9,
          boxShadow:`0 8px 40px rgba(0,0,0,0.9),0 0 40px ${glow}`}}>

          <div style={{display:'flex',justifyContent:'space-between',width:'100%',alignItems:'center'}}>
            <span style={{color:rarityColor[item.rarity||'común']||'#888',
              fontFamily:"'Jost',sans-serif",fontSize:10,
              letterSpacing:'0.1em',textTransform:'uppercase'}}>{item.rarity||''}</span>
            <div style={{display:'flex',alignItems:'center',gap:4,
              color:bc,fontFamily:"'Jost',sans-serif",fontSize:10}}>
              <div style={{width:6,height:6,transform:'rotate(45deg)',background:bc}}/>
              {isProperty?'Propiedad':isBlessing?'Bendición':'Maldición'}
            </div>
          </div>

          <div style={{width:64,height:64,borderRadius: isProperty?10:'50%',
            background:`radial-gradient(circle,${isProperty?'#003a20':isBlessing?'#003a20':'#3a0000'},#0a0500)`,
            border:`1.5px solid ${bc}`,display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:`0 0 28px ${glow}`}}>
            <Ico name={isProperty?'home':isBlessing?'star':'alert-triangle'} size={28} color={bc}/>
          </div>

          <div style={{fontFamily:"'Playfair Display',serif",color:bc,fontSize:14,
            fontWeight:600,textAlign:'center'}}>{item.name}</div>

          {item.flavor && (
            <p style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:10,
              textAlign:'center',fontStyle:'italic',margin:0,lineHeight:1.5}}>
              "{item.flavor}"
            </p>
          )}

          <div style={{width:'100%',height:1,
            background:`linear-gradient(90deg,transparent,${bc}44,transparent)`}}/>

          {isProperty ? (
            <div style={{textAlign:'center'}}>
              <div style={{color:bc,fontFamily:"'Playfair Display',serif",
                fontSize:16,fontWeight:700}}>{fmtFull(item.value)}</div>
              <div style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:11,marginTop:2}}>
                Renta: +{fmtFull(item.monthlyRent)}/mes
              </div>
            </div>
          ) : (
            <p style={{color:bc,fontFamily:"'Jost',sans-serif",fontSize:11,
              textAlign:'center',margin:0,fontWeight:600,lineHeight:1.5}}>
              {item.desc}
            </p>
          )}

          {isWinner && (
            <div style={{marginTop:'auto',background:`${bc}18`,border:`1px solid ${bc}`,
              borderRadius:4,padding:'4px 12px',color:bc,fontFamily:"'Jost',sans-serif",
              fontSize:11,display:'flex',alignItems:'center',gap:5}}>
              <Ico name="check" size={11} color={bc}/> ¡Es tuyo!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CHAT PANEL ────────────────────────────────
function ChatPanel({ messages, myId, myName, onSend }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const endRef = useRef(null);

  useEffect(()=>{
    if (open) {
      setSeenCount(messages.length);
      if (endRef.current) endRef.current.scrollTop = endRef.current.scrollHeight;
    }
  },[messages, open]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
    window.SFX?.click?.();
  };

  const unread = Math.max(0, messages.length - seenCount);

  return (
    <div style={{position:'fixed',bottom:20,right:20,zIndex:100}}>
      {open && (
        <div style={{
          width:280,height:360,marginBottom:8,
          background:BG_CARD2,border:`1px solid ${BORDER}`,
          borderRadius:10,display:'flex',flexDirection:'column',
          boxShadow:'0 8px 32px rgba(0,0,0,0.8)',
          animation:'fadeInUp 0.2s ease'}}>
          {/* Header */}
          <div style={{padding:'10px 14px',borderBottom:`1px solid ${BORDER}`,
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{color:GOLD_DIM,fontFamily:"'Playfair Display',serif",fontSize:13}}>
              Chat de Subasta
            </span>
            <button onClick={()=>setOpen(false)} style={{background:'none',border:'none',
              cursor:'pointer',color:'#666',padding:'2px'}}>
              <Ico name="x" size={14} color="#666"/>
            </button>
          </div>
          {/* Messages */}
          <div ref={endRef} style={{flex:1,overflowY:'auto',padding:'10px 12px',
            display:'flex',flexDirection:'column',gap:6}}>
            {messages.length===0 && (
              <p style={{color:'#444',fontFamily:"'Jost',sans-serif",fontSize:12,
                textAlign:'center',margin:'auto 0'}}>
                Sin mensajes. ¡Blufea, negocia, amenaza!
              </p>
            )}
            {messages.map((m,i)=>(
              <div key={i} style={{
                alignSelf:m.pid===myId?'flex-end':'flex-start',
                maxWidth:'85%',
              }}>
                {m.pid!==myId && (
                  <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",
                    fontSize:9,marginBottom:2}}>{m.name}</div>
                )}
                <div style={{
                  background:m.pid===myId?'rgba(218,165,32,0.12)':'#180d00',
                  border:`1px solid ${m.pid===myId?GOLD_DIM:BORDER}`,
                  borderRadius:8,padding:'6px 10px',
                  color:m.pid===myId?GOLD_LIGHT:'#bbb',
                  fontFamily:"'Jost',sans-serif",fontSize:12,lineHeight:1.4,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          {/* Input */}
          <div style={{padding:'8px 10px',borderTop:`1px solid ${BORDER}`,
            display:'flex',gap:6}}>
            <input value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') send(); }}
              placeholder="Escribe algo..."
              maxLength={80}
              style={{flex:1,background:'#180d00',border:`1px solid ${BORDER}`,
                borderRadius:4,padding:'6px 10px',color:GOLD_LIGHT,
                fontFamily:"'Jost',sans-serif",fontSize:12,outline:'none'}}/>
            <GoldBtn size="sm" onClick={send} disabled={!text.trim()}>
              <Ico name="arrow-right" size={13} color="#080503"/>
            </GoldBtn>
          </div>
        </div>
      )}
      <button onClick={()=>setOpen(v=>!v)}
        style={{
          width:46,height:46,borderRadius:'50%',
          background:open?BG_CARD2:'linear-gradient(135deg,#B8860B,#DAA520)',
          border:`2px solid ${open?BORDER:GOLD}`,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 4px 16px rgba(0,0,0,0.6)',
          position:'relative',
        }}>
        <Ico name="users" size={20} color={open?GOLD_DIM:'#080503'}/>
        {unread>0&&!open && (
          <div style={{position:'absolute',top:-2,right:-2,
            width:16,height:16,borderRadius:'50%',
            background:RED,display:'flex',alignItems:'center',justifyContent:'center',
            color:'#fff',fontSize:9,fontWeight:700,fontFamily:"'Jost',sans-serif"}}>
            {Math.min(unread,9)}
          </div>
        )}
      </button>
    </div>
  );
}

// ── AUCTION PHASE — Subasta Ascendente ──────────────
function AuctionPhase({ me, players, artifacts, artIdx, ascBid,
  onPlaceBid, onPassBid, phase, winner, onNextArtifact, isHost, month,
  chatMessages, onChatSend }) {
  const [bidInput, setBidInput] = useState('');
  const art = artifacts[artIdx];
  if (!art) return null;

  const isProperty = art.type === 'property';
  const current    = ascBid?.current    || 0;
  const leaderId   = ascBid?.leaderId   || null;
  const passed     = ascBid?.passed     || {};
  const minRaise   = Math.max(5000, Math.round(current * 0.05));
  const iAmLeader  = leaderId === me.id;
  const iHavePassed = !!passed[me.id];
  const passedCount = Object.keys(passed).length;
  const stillIn    = players.filter(p => !passed[p.id]);
  const leaderPlayer = leaderId ? players.find(p => p.id === leaderId) : null;

  const canBid = !iAmLeader && !iHavePassed;
  const minBid = current > 0 ? current + minRaise : 1;

  const submitBid = () => {
    const amount = parseInt(bidInput.replace(/\D/g,'')) || 0;
    if (amount < minBid) return;
    const safe = Math.min(amount, me.cash || 0);
    onPlaceBid(safe);
    setBidInput('');
  };

  // ── REVEAL ────────────────────────────────────────
  if (phase === 'reveal') {
    const winPlayer = winner?.playerId ? players.find(p => p.id === winner.playerId) : null;
    return (
      <div style={{padding:'20px',display:'flex',flexDirection:'column',
        alignItems:'center',gap:20,maxWidth:860,margin:'0 auto'}}>
        <GoldTitle size="lg" style={{textAlign:'center'}}>
          {isProperty ? 'Propiedad Revelada' : 'Artefacto Revelado'}
        </GoldTitle>
        <GoldDivider/>
        <div style={{display:'flex',flexWrap:'wrap',gap:24,
          justifyContent:'center',alignItems:'flex-start',width:'100%'}}>
          <FlipRevealCard item={art} isWinner={winner?.playerId === me.id}/>
          <div style={{display:'flex',flexDirection:'column',gap:10,
            flex:1,minWidth:260,maxWidth:340}}>
            <Card>
              <GoldTitle size="sm" style={{marginBottom:10}}>Resultado</GoldTitle>
              {players.map(p => {
                const isWin = winner?.playerId === p.id && (winner?.amount || 0) > 0;
                return (
                  <div key={p.id} style={{display:'flex',justifyContent:'space-between',
                    alignItems:'center',padding:'6px 10px',borderRadius:4,marginBottom:4,
                    background:isWin ? 'rgba(218,165,32,0.1)' : '#0e0800',
                    border:`1px solid ${isWin ? GOLD : BORDER}`}}>
                    <div style={{display:'flex',alignItems:'center',gap:7}}>
                      <Avatar name={p.name||'?'} colorIndex={p.colorIndex||0} size={26}/>
                      <span style={{color:GOLD_LIGHT,fontFamily:"'Jost',sans-serif",fontSize:13}}>
                        {p.name}
                      </span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:7}}>
                      {isWin
                        ? <><MoneyDisplay amount={winner.amount} size="sm"/>
                            <Ico name="crown" size={13} color={GOLD}/></>
                        : <span style={{color:'#555',fontFamily:"'Jost',sans-serif",fontSize:12}}>Pasó</span>
                      }
                    </div>
                  </div>
                );
              })}
            </Card>

            {winPlayer ? (
              <div style={{background:'rgba(218,165,32,0.06)',
                border:`1px solid ${GOLD}40`,borderRadius:8,
                padding:'14px 16px',textAlign:'center'}}>
                <Avatar name={winPlayer.name||'?'} colorIndex={winPlayer.colorIndex||0}
                  size={44} style={{margin:'0 auto 8px'}}/>
                <GoldTitle size="sm" style={{marginBottom:2}}>{winPlayer.name}</GoldTitle>
                <p style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:12,margin:'2px 0 8px'}}>
                  ganó con {fmtFull(winner.amount)}
                </p>
                {isProperty ? (
                  <div style={{color:GREEN_CLR,fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:600}}>
                    Renta mensual: +{fmtFull(art.monthlyRent)}
                  </div>
                ) : (
                  <p style={{color:art.type==='blessing'?GREEN_CLR:RED,
                    fontFamily:"'Jost',sans-serif",fontSize:12,margin:0,fontWeight:600}}>
                    {art.desc}
                  </p>
                )}
              </div>
            ) : (
              <div style={{background:'rgba(80,80,80,0.08)',border:`1px solid ${BORDER}`,
                borderRadius:8,padding:'14px',textAlign:'center'}}>
                <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:13,margin:0}}>
                  Nadie pujó. El objeto se desvanece en la oscuridad.
                </p>
              </div>
            )}

            {isHost ? (
              <GoldBtn size="lg" onClick={onNextArtifact} style={{width:'100%'}}>
                {artIdx < artifacts.length - 1
                  ? `Siguiente (${artIdx+2}/${artifacts.length})`
                  : 'Terminar subasta'}
                <span style={{marginLeft:8,display:'inline-flex',verticalAlign:'middle'}}>
                  <Ico name="arrow-right" size={14} color="#080503"/>
                </span>
              </GoldBtn>
            ) : (
              <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:13,textAlign:'center',margin:0}}>
                Esperando al anfitrión...
              </p>
            )}
          </div>
        </div>
        <ChatPanel messages={chatMessages||[]} myId={me.id} myName={me.name} onSend={onChatSend}/>
      </div>
    );
  }

  // ── BIDDING ASCENDENTE ────────────────────────────
  return (
    <div style={{padding:'20px',display:'flex',flexDirection:'column',
      alignItems:'center',gap:16,maxWidth:800,margin:'0 auto'}}>

      {/* Header */}
      <div style={{textAlign:'center'}}>
        <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",
          fontSize:11,letterSpacing:'0.2em',marginBottom:4}}>
          {isProperty ? 'PROPIEDAD' : 'ARTEFACTO'} {artIdx+1} / {artifacts.length}
        </div>
        <GoldTitle size="md">Subasta Abierta</GoldTitle>
        <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:12,margin:'4px 0 0'}}>
          Puja o pasa — el último en quedar gana el objeto
        </p>
      </div>

      <div style={{display:'flex',flexWrap:'wrap',gap:20,
        justifyContent:'center',alignItems:'flex-start',width:'100%'}}>

        {/* Left: mystery card + current bid */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
          {isProperty
            ? <PropertyMysteryCard index={artIdx} totalBidders={players.length} bidsIn={passedCount}/>
            : <MysteryCard index={artIdx} totalBidders={players.length} bidsIn={passedCount}/>
          }
          {/* Current bid display */}
          <div style={{background:'rgba(218,165,32,0.06)',border:`1px solid ${GOLD}33`,
            borderRadius:10,padding:'12px 28px',textAlign:'center',width:'100%'}}>
            <div style={{color:'#777',fontFamily:"'Jost',sans-serif",
              fontSize:10,letterSpacing:'0.12em',marginBottom:4}}>PUJA ACTUAL</div>
            {current > 0 ? (
              <>
                <MoneyDisplay amount={current} size="lg"/>
                {leaderPlayer && (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',
                    gap:6,marginTop:6,color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:12}}>
                    <Avatar name={leaderPlayer.name} colorIndex={leaderPlayer.colorIndex||0} size={20}/>
                    {leaderPlayer.name} lidera
                  </div>
                )}
              </>
            ) : (
              <div style={{color:'#555',fontFamily:"'Playfair Display',serif",
                fontSize:18,letterSpacing:'0.05em'}}>Sin pujas</div>
            )}
          </div>

          {/* Player status chips */}
          <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',maxWidth:210}}>
            {players.map(p => {
              const isLdr = p.id === leaderId;
              const hasPassed = !!passed[p.id];
              const color = isLdr ? GOLD : hasPassed ? '#444' : GREEN_CLR;
              const label = isLdr ? 'Líder' : hasPassed ? 'Pasó' : 'En juego';
              return (
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:5,
                  background:isLdr?'rgba(218,165,32,0.1)':hasPassed?'rgba(0,0,0,0.3)':'rgba(0,120,50,0.08)',
                  border:`1px solid ${color}44`,borderRadius:20,padding:'3px 8px',
                  opacity:hasPassed?0.55:1}}>
                  <Avatar name={p.name} colorIndex={p.colorIndex||0} size={18}/>
                  <span style={{color,fontFamily:"'Jost',sans-serif",fontSize:10}}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: my action panel */}
        <Card style={{flex:1,minWidth:260,maxWidth:320}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <Avatar name={me.name||'?'} colorIndex={me.colorIndex||0} size={34}/>
            <div>
              <div style={{color:GOLD_LIGHT,fontFamily:"'Playfair Display',serif",
                fontSize:14,fontWeight:600}}>{me.name}</div>
              <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2}}>
                <span style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:11}}>Efectivo:</span>
                <MoneyDisplay amount={me.cash||0} size="sm"/>
              </div>
            </div>
          </div>
          <GoldDivider/>

          {/* State: I'm the leader */}
          {iAmLeader && (
            <div style={{margin:'16px 0',textAlign:'center'}}>
              <div style={{width:48,height:48,borderRadius:'50%',
                background:'rgba(218,165,32,0.12)',border:`1px solid ${GOLD}`,
                display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px'}}>
                <Ico name="crown" size={22} color={GOLD}/>
              </div>
              <p style={{color:GOLD,fontFamily:"'Playfair Display',serif",fontSize:15,margin:0}}>
                Eres el líder
              </p>
              <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:12,margin:'6px 0 0'}}>
                Puja actual: {fmtFull(current)}. Esperando a que los demás suban o pasen.
              </p>
              {stillIn.filter(p=>p.id!==me.id).length===0 && (
                <p style={{color:GREEN_CLR,fontFamily:"'Jost',sans-serif",fontSize:12,margin:'10px 0 0',fontWeight:600}}>
                  ¡Ganaste! Procesando...
                </p>
              )}
            </div>
          )}

          {/* State: I passed */}
          {iHavePassed && !iAmLeader && (
            <div style={{margin:'16px 0',textAlign:'center'}}>
              <div style={{width:48,height:48,borderRadius:'50%',
                background:'rgba(80,80,80,0.12)',border:`1px solid #444`,
                display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px'}}>
                <Ico name="x" size={22} color="#555"/>
              </div>
              <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:13,margin:0}}>
                Has pasado en este objeto
              </p>
              <p style={{color:'#555',fontFamily:"'Jost',sans-serif",fontSize:11,margin:'6px 0 0'}}>
                Esperando a que termine la subasta...
              </p>
            </div>
          )}

          {/* State: I can bid */}
          {canBid && (
            <div style={{margin:'10px 0'}}>
              <p style={{color:'#888',fontFamily:"'Jost',sans-serif",
                fontSize:11,margin:'0 0 10px',lineHeight:1.5}}>
                {isProperty
                  ? 'Propiedad con renta mensual garantizada. Solo el ganador conoce el valor exacto.'
                  : 'Bendición o maldición: solo el ganador descubrirá qué contiene.'}
              </p>

              {/* Quick bid chips */}
              <div style={{marginBottom:8}}>
                <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",
                  fontSize:10,letterSpacing:'0.08em',marginBottom:6}}>
                  {current>0 ? `SUPERAR ${fmtFull(current)} — MÍN. SUBIDA ${fmtFull(minRaise)}` : 'ABRIR SUBASTA'}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginBottom:8}}>
                  {(current > 0
                    ? [minRaise, minRaise*2, minRaise*4, minRaise*8]
                    : [5000, 10000, 25000, 50000]
                  ).map((amt, i) => {
                    const total = current > 0 ? current + amt : amt;
                    const affordable = total <= (me.cash||0);
                    return (
                      <button key={i}
                        onClick={() => setBidInput(String(total))}
                        disabled={!affordable}
                        style={{background: bidInput===String(total)?'rgba(218,165,32,0.14)':'#180d00',
                          border:`1px solid ${bidInput===String(total)?GOLD_DIM:BORDER}`,
                          borderRadius:4,padding:'6px 4px',cursor:affordable?'pointer':'not-allowed',
                          color:affordable?(bidInput===String(total)?GOLD:'#888'):'#333',
                          fontFamily:"'Jost',sans-serif",fontSize:11,transition:'all 0.12s',
                          textAlign:'center'}}>
                        {current>0 ? `+${fmtFull(amt)}` : fmtFull(amt)}
                        <div style={{color:'#555',fontSize:9,marginTop:1}}>{fmtFull(total)}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom input */}
                <div style={{display:'flex',gap:5,marginBottom:10}}>
                  <span style={{color:GOLD_DIM,fontFamily:"'Playfair Display',serif",
                    fontSize:16,lineHeight:'38px',flexShrink:0}}>$</span>
                  <input type="text" value={bidInput}
                    onChange={e => setBidInput(e.target.value.replace(/\D/g,''))}
                    onKeyDown={e => { if(e.key==='Enter') submitBid(); }}
                    placeholder={current>0 ? `Mín. ${fmtFull(minBid)}` : 'Monto'}
                    style={{flex:1,background:'#180d00',border:`1px solid ${bidInput?GOLD_DIM:BORDER}`,
                      borderRadius:4,padding:'7px 10px',color:GOLD_LIGHT,
                      fontFamily:"'Playfair Display',serif",fontSize:16,outline:'none'}}/>
                </div>

                {/* Bid warning */}
                {bidInput && parseInt(bidInput) < minBid && (
                  <p style={{color:RED,fontFamily:"'Jost',sans-serif",fontSize:11,margin:'0 0 8px'}}>
                    Mínimo: {fmtFull(minBid)}
                  </p>
                )}
              </div>

              <div style={{display:'flex',gap:8}}>
                <GoldBtn variant="secondary" size="md" onClick={onPassBid} style={{flex:1}}>
                  Pasar
                </GoldBtn>
                <GoldBtn size="md" onClick={submitBid}
                  disabled={!bidInput || parseInt(bidInput) < minBid || parseInt(bidInput) > (me.cash||0)}
                  style={{flex:2}}>
                  {bidInput && parseInt(bidInput) >= minBid
                    ? `Pujar ${fmtFull(parseInt(bidInput))}`
                    : 'Pujar'}
                </GoldBtn>
              </div>
              {bidInput && parseInt(bidInput) > (me.cash||0) && (
                <p style={{color:RED,fontFamily:"'Jost',sans-serif",fontSize:11,margin:'6px 0 0',textAlign:'center'}}>
                  No tienes suficiente efectivo
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
      <ChatPanel messages={chatMessages||[]} myId={me.id} myName={me.name} onSend={onChatSend}/>
    </div>
  );
}

// ── LOANS PHASE (context-aware Don Aurelio) ────
function LoansPhase({ me, onComplete, isDone, waitingPlayers, allPlayers }) {
  const lender = GD.LENDER;
  const [selAmt,  setSelAmt]  = useState(null);
  const [selRate, setSelRate] = useState(null);

  const hasLoans   = Object.keys(me.loans||{}).length > 0;
  const nw         = calcNetWorthArr(me);
  const isBankrupt = (me.cash||0) <= 0;
  const isRich     = nw > 800000;
  const isStruggle = nw < 100000;

  // Context-aware greeting
  const stateKey = isBankrupt?'bankrupt':hasLoans?'hasLoans':isRich?'rich':isStruggle?'struggling':'normal';
  const lines = lender.greetByState[stateKey] || lender.greetByState.normal;
  const [greeting] = useState(lines[Math.floor(Math.random()*lines.length)]);
  const [warning]  = useState(lender.warnings[Math.floor(Math.random()*lender.warnings.length)]);
  const collection = lender.collection[Math.floor(Math.random()*lender.collection.length)];

  if (isDone) {
    return (
      <div style={{display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',gap:20,padding:40}}>
        <div style={{width:52,height:52,borderRadius:'50%',
          background:'rgba(0,100,40,0.12)',border:`1px solid ${GREEN_CLR}`,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Ico name="check" size={22} color={GREEN_CLR}/>
        </div>
        <GoldTitle size="md">Listo</GoldTitle>
        <WaitingFor players={allPlayers}
          doneIds={allPlayers.filter(p=>!waitingPlayers.includes(p.id)).map(p=>p.id)}/>
      </div>
    );
  }

  // Bankrupt rescue offer
  const rescueRate = { months:6, rate:0.30, label:'Rescate — 6 meses' };
  const rescueAmt  = 100000;

  const takeLoan = () => {
    const amt  = isBankrupt ? rescueAmt : selAmt;
    const rate = isBankrupt ? rescueRate : selRate;
    if (!amt || !rate) return;
    onComplete({
      id:`loan_${Date.now()}`, original:amt, remaining:amt,
      rate:rate.rate, monthsLeft:rate.months,
      label:`Préstamo Don Aurelio — ${fmtFull(amt)}`
    });
  };

  return (
    <div style={{display:'flex',flexDirection:'column',
      alignItems:'center',padding:'20px',gap:0,maxWidth:540,margin:'0 auto'}}>
      {/* Don Aurelio */}
      <div style={{width:'100%',
        background:'linear-gradient(160deg,#150900,#0a0500)',
        border:`1px solid ${BORDER}`,borderRadius:12,
        padding:22,marginBottom:14,
        boxShadow:'0 8px 40px rgba(0,0,0,0.7)'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:14,marginBottom:14}}>
          <div style={{width:60,height:60,borderRadius:8,flexShrink:0,
            background:'radial-gradient(circle,#2a1000,#0a0500)',
            border:`1px solid ${GOLD_DIM}`,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Ico name="crown" size={28} color={GOLD_DIM}/>
          </div>
          <div style={{flex:1}}>
            <GoldTitle size="md" style={{marginBottom:1}}>{lender.name}</GoldTitle>
            <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",
              fontSize:11,letterSpacing:'0.06em',marginBottom:10}}>{lender.title}</div>
            <div style={{background:'#1a0d00',border:`1px solid ${BORDER}`,
              borderRadius:8,borderTopLeftRadius:0,padding:'10px 13px',
              color:'#bbb',fontFamily:"'Jost',sans-serif",
              fontSize:13,lineHeight:1.6,fontStyle:'italic'}}>
              "{hasLoans?collection:greeting}"
            </div>
          </div>
        </div>
        <div style={{background:'rgba(218,165,32,0.04)',border:`1px solid ${BORDER}`,
          borderRadius:5,padding:'7px 12px',color:'#666',
          fontFamily:"'Jost',sans-serif",fontSize:11,lineHeight:1.5,
          display:'flex',alignItems:'flex-start',gap:6}}>
          <Ico name="alert-triangle" size={11} color='#555' style={{marginTop:1}}/>
          {warning}
        </div>
      </div>

      {/* Bankrupt rescue */}
      {isBankrupt ? (
        <Card style={{width:'100%'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <Avatar name={me.name||'?'} colorIndex={me.colorIndex||0} size={32}/>
            <GoldTitle size="sm">{me.name}</GoldTitle>
          </div>
          <div style={{background:'rgba(180,20,20,0.1)',border:`1px solid ${RED}30`,
            borderRadius:6,padding:'10px 14px',marginBottom:14,color:'#cc8888',
            fontFamily:"'Jost',sans-serif",fontSize:12,lineHeight:1.6}}>
            Oferta de rescate: {fmtFull(rescueAmt)} al {(rescueRate.rate*100).toFixed(0)}% anual
            por {rescueRate.months} meses.
          </div>
          <div style={{display:'flex',gap:8}}>
            <GoldBtn variant="secondary" size="md" onClick={()=>onComplete(null)} style={{flex:1}}>
              Rechazar
            </GoldBtn>
            <GoldBtn size="md" onClick={takeLoan} style={{flex:2}}>
              Aceptar Rescate
            </GoldBtn>
          </div>
        </Card>
      ) : (
        <Card style={{width:'100%'}}>
          <div style={{display:'flex',justifyContent:'space-between',
            alignItems:'center',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <Avatar name={me.name||'?'} colorIndex={me.colorIndex||0} size={32}/>
              <GoldTitle size="sm">{me.name}</GoldTitle>
            </div>
            <MoneyDisplay amount={me.cash||0} size="md"/>
          </div>

          {hasLoans && (
            <div style={{marginBottom:10}}>
              {Object.values(me.loans||{}).map((l,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',
                  background:'#0e0800',borderRadius:4,padding:'5px 10px',
                  marginBottom:3,color:RED,fontFamily:"'Jost',sans-serif",fontSize:12}}>
                  <span style={{color:'#888'}}>{l.label||'Préstamo'}</span>
                  <span>{fmtFull(l.remaining)} · {(l.rate*100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}

          <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",
            fontSize:10,letterSpacing:'0.08em',marginBottom:7}}>MONTO</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12}}>
            {lender.amounts.map(amt=>(
              <button key={amt} onClick={()=>setSelAmt(selAmt===amt?null:amt)}
                style={{background:selAmt===amt?'rgba(218,165,32,0.12)':'#0e0800',
                  border:`1px solid ${selAmt===amt?GOLD:BORDER}`,borderRadius:4,
                  padding:'8px',cursor:'pointer',
                  color:selAmt===amt?GOLD_LIGHT:'#888',
                  fontFamily:"'Playfair Display',serif",fontSize:14,transition:'all 0.15s'}}>
                {fmtFull(amt)}
              </button>
            ))}
          </div>

          <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",
            fontSize:10,letterSpacing:'0.08em',marginBottom:7}}>PLAZO</div>
          <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:12}}>
            {lender.rates.map(r=>(
              <button key={r.months} onClick={()=>setSelRate(selRate?.months===r.months?null:r)}
                style={{background:selRate?.months===r.months?'rgba(218,165,32,0.1)':'#0e0800',
                  border:`1px solid ${selRate?.months===r.months?GOLD:BORDER}`,
                  borderRadius:4,padding:'8px 12px',cursor:'pointer',
                  display:'flex',justifyContent:'space-between',transition:'all 0.15s'}}>
                <span style={{color:selRate?.months===r.months?GOLD_LIGHT:'#888',
                  fontFamily:"'Jost',sans-serif",fontSize:13}}>{r.label}</span>
                <span style={{color:RED,fontFamily:"'Jost',sans-serif",
                  fontSize:12,fontWeight:600}}>
                  {(r.rate*100).toFixed(0)}% anual
                </span>
              </button>
            ))}
          </div>

          {selAmt&&selRate && (
            <div style={{background:'rgba(160,0,0,0.08)',border:`1px solid ${RED}25`,
              borderRadius:5,padding:'7px 12px',marginBottom:10,color:'#cc8888',
              fontFamily:"'Jost',sans-serif",fontSize:11,lineHeight:1.6}}>
              Recibirás {fmtFull(selAmt)} ahora.
              Pagarás ~{fmtFull(Math.round(selAmt*(1+selRate.rate)))} en total.
            </div>
          )}

          <div style={{display:'flex',gap:8}}>
            <GoldBtn variant="secondary" size="md" onClick={()=>onComplete(null)} style={{flex:1}}>
              No gracias
            </GoldBtn>
            <GoldBtn size="md" onClick={takeLoan}
              disabled={!selAmt||!selRate} style={{flex:2}}>
              Aceptar Préstamo
            </GoldBtn>
          </div>
        </Card>
      )}
    </div>
  );
}

Object.assign(window, { AuctionPhase, LoansPhase, FlipRevealCard, ChatPanel });
