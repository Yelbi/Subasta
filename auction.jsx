// =============================================
// SUBASTA v2 — Auction & Loans Phases (Multiplayer)
// =============================================

// ── MYSTERY ARTIFACT CARD ────────────────────
function MysteryCard({ index, totalBidders, bidsIn }) {
  return (
    <div style={{width:190,minHeight:270,borderRadius:12,
      background:'linear-gradient(160deg,#1a0f00,#0d0700)',
      border:`1px solid ${GOLD_DIM}`,padding:20,boxSizing:'border-box',
      display:'flex',flexDirection:'column',alignItems:'center',gap:14,
      boxShadow:`0 8px 32px rgba(0,0,0,0.7),0 0 20px rgba(218,165,32,0.08)`,
      position:'relative'}}>
      <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:10,
        letterSpacing:'0.15em',alignSelf:'flex-start'}}>ARTEFACTO #{index+1}</div>
      {/* Mystery face */}
      <div style={{width:80,height:80,borderRadius:'50%',
        background:'radial-gradient(circle,#2a1500,#0a0500)',
        border:`1px solid ${BORDER2}`,display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:`0 0 20px rgba(0,0,0,0.5)`}}>
        <Ico name="help-circle" size={36} color={BORDER2}/>
      </div>
      <div style={{textAlign:'center'}}>
        <div style={{color:GOLD_DIM,fontFamily:"'Playfair Display',serif",fontSize:14,
          marginBottom:4,letterSpacing:'0.04em'}}>Artefacto Misterioso</div>
        <div style={{color:'#3a2800',fontFamily:"'Jost',sans-serif",fontSize:11}}>
          Bendición o Maldición
        </div>
      </div>
      <div style={{marginTop:'auto',background:'rgba(218,165,32,0.06)',
        border:`1px solid ${BORDER}`,borderRadius:4,padding:'4px 10px',
        color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:11,width:'100%',textAlign:'center'}}>
        {bidsIn}/{totalBidders} pujas recibidas
      </div>
    </div>
  );
}

// ── REVEALED ARTIFACT CARD ───────────────────
function ArtifactCard({ artifact, isWinner }) {
  const [vis, setVis] = useState(false);
  useEffect(()=>{ setTimeout(()=>setVis(true),80); },[]);
  const blessed = artifact.type==='blessing';
  const bc = blessed ? GREEN_CLR : RED;
  const glow = blessed ? 'rgba(0,180,80,0.2)' : 'rgba(200,20,20,0.2)';
  const rarityColor = {común:'#888',infrecuente:GOLD_DIM,rara:GOLD_LIGHT};

  return (
    <div style={{width:210,borderRadius:12,
      background:`linear-gradient(160deg,${blessed?'#001a0a':'#1a0000'},#080503)`,
      border:`1.5px solid ${bc}`,padding:20,boxSizing:'border-box',
      display:'flex',flexDirection:'column',alignItems:'center',gap:10,
      boxShadow:`0 8px 40px rgba(0,0,0,0.9),0 0 40px ${glow}`,
      opacity:vis?1:0,transform:vis?'scale(1) translateY(0)':'scale(0.88) translateY(24px)',
      transition:'all 0.55s cubic-bezier(0.2,0.8,0.3,1)'}}>
      <div style={{display:'flex',justifyContent:'space-between',width:'100%',alignItems:'center'}}>
        <span style={{color:rarityColor[artifact.rarity]||'#888',fontFamily:"'Jost',sans-serif",
          fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase'}}>{artifact.rarity}</span>
        <div style={{display:'flex',alignItems:'center',gap:4,
          color:bc,fontFamily:"'Jost',sans-serif",fontSize:10}}>
          <div style={{width:6,height:6,transform:'rotate(45deg)',background:bc}}/>
          {blessed?'Bendición':'Maldición'}
        </div>
      </div>
      <div style={{width:76,height:76,borderRadius:'50%',
        background:`radial-gradient(circle,${blessed?'#003a15':'#3a0000'},#0a0500)`,
        border:`1.5px solid ${bc}`,display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:`0 0 28px ${glow}`}}>
        <div style={{width:28,height:28,transform:'rotate(45deg)',
          background:blessed?`${GREEN_CLR}30`:`${RED}30`,
          border:`1.5px solid ${bc}`}}/>
      </div>
      <div style={{fontFamily:"'Playfair Display',serif",color:bc,fontSize:15,
        fontWeight:600,textAlign:'center',letterSpacing:'0.03em'}}>{artifact.name}</div>
      <p style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:11,
        textAlign:'center',fontStyle:'italic',margin:0,lineHeight:1.5}}>
        "{artifact.flavor}"
      </p>
      <div style={{width:'100%',height:1,background:`linear-gradient(90deg,transparent,${bc}44,transparent)`}}/>
      <p style={{color:bc,fontFamily:"'Jost',sans-serif",fontSize:12,
        textAlign:'center',margin:0,fontWeight:600,lineHeight:1.5}}>{artifact.desc}</p>
      {isWinner && (
        <div style={{marginTop:4,background:`${bc}18`,border:`1px solid ${bc}`,
          borderRadius:4,padding:'5px 12px',color:bc,fontFamily:"'Jost',sans-serif",
          fontSize:12,display:'flex',alignItems:'center',gap:6}}>
          <Ico name="check" size={12} color={bc}/> ¡Es tuyo!
        </div>
      )}
    </div>
  );
}

// ── AUCTION PHASE (Multiplayer) ───────────────
function AuctionPhase({ me, players, artifacts, artIdx, bids, onBid, phase, winner, onNextArtifact, isHost, month }) {
  const [bidInput, setBidInput] = useState('');
  const art = artifacts[artIdx];
  if (!art) return null;

  const myBid = bids?.[art.id]?.[me.id];
  const hasBid = myBid !== undefined && myBid !== null;
  const bidsDone = players.filter(p=>bids?.[art.id]?.[p.id]!==undefined&&bids?.[art.id]?.[p.id]!==null);

  const submitBid = () => {
    const amount = parseInt(bidInput.replace(/\D/g,''))||0;
    const safe = Math.min(amount, me.cash||0);
    onBid(art.id, safe);
    setBidInput('');
  };

  // ── REVEAL STATE ──────────────────────────
  if (phase==='reveal') {
    const winPlayer = winner?.playerId ? players.find(p=>p.id===winner.playerId) : null;
    const artBids = bids?.[art.id]||{};

    return (
      <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',padding:24,gap:24}}>
        <GoldTitle size="lg" style={{textAlign:'center'}}>Artefacto Revelado</GoldTitle>
        <GoldDivider/>
        <div style={{display:'flex',flexWrap:'wrap',gap:28,justifyContent:'center',alignItems:'flex-start',width:'100%',maxWidth:800}}>
          <ArtifactCard artifact={art} isWinner={winner?.playerId===me.id}/>
          <div style={{display:'flex',flexDirection:'column',gap:12,flex:1,minWidth:280,maxWidth:360}}>
            <Card>
              <GoldTitle size="sm" style={{marginBottom:12}}>Pujas</GoldTitle>
              {players.map(p=>{
                const bid=(artBids[p.id]!=null)?artBids[p.id]:null;
                const isWin=winner?.playerId===p.id&&winner?.amount>0;
                return (
                  <div key={p.id} style={{display:'flex',justifyContent:'space-between',
                    alignItems:'center',padding:'7px 10px',borderRadius:4,marginBottom:5,
                    background:isWin?'rgba(218,165,32,0.1)':'#0e0800',
                    border:`1px solid ${isWin?GOLD:BORDER}`}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <Avatar name={p.name||'?'} colorIndex={p.colorIndex||0} size={26}/>
                      <span style={{color:GOLD_LIGHT,fontFamily:"'Jost',sans-serif",fontSize:13}}>{p.name}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <MoneyDisplay amount={bid!=null?bid:0} size="sm"/>
                      {isWin && <Ico name="crown" size={14} color={GOLD}/>}
                    </div>
                  </div>
                );
              })}
            </Card>
            {winPlayer ? (
              <div style={{background:'rgba(218,165,32,0.06)',border:`1px solid ${GOLD}40`,
                borderRadius:8,padding:'14px 16px',textAlign:'center'}}>
                <Avatar name={winPlayer.name||'?'} colorIndex={winPlayer.colorIndex||0} size={44} style={{margin:'0 auto 8px'}}/>
                <GoldTitle size="sm" style={{marginBottom:2}}>{winPlayer.name}</GoldTitle>
                <p style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:13,margin:'2px 0 8px'}}>
                  ganó con {fmtFull(winner.amount)}
                </p>
                <p style={{color:art.type==='blessing'?GREEN_CLR:RED,
                  fontFamily:"'Jost',sans-serif",fontSize:12,margin:0,fontWeight:600}}>
                  {art.desc}
                </p>
              </div>
            ) : (
              <div style={{background:'rgba(80,80,80,0.08)',border:`1px solid ${BORDER}`,
                borderRadius:8,padding:'14px',textAlign:'center'}}>
                <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:13,margin:0}}>
                  Nadie pujó. El artefacto se desvanece.
                </p>
              </div>
            )}
            {isHost && (
              <GoldBtn size="lg" onClick={onNextArtifact}>
                {artIdx<artifacts.length-1?`Siguiente artefacto (${artIdx+2}/${artifacts.length})`:'Terminar subasta'}
                <span style={{marginLeft:8,display:'inline-flex',verticalAlign:'middle'}}>
                  <Ico name="arrow-right" size={14} color="#080503"/>
                </span>
              </GoldBtn>
            )}
            {!isHost && <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:13,textAlign:'center',margin:0}}>
              Esperando al anfitrión...
            </p>}
          </div>
        </div>
      </div>
    );
  }

  // ── BIDDING STATE ─────────────────────────
  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:24,gap:20}}>
      <div style={{textAlign:'center'}}>
        <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:'0.2em',marginBottom:4}}>
          MES {month} — SUBASTA
        </div>
        <GoldTitle size="md">Artefacto {artIdx+1} de {artifacts.length}</GoldTitle>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:24,justifyContent:'center',alignItems:'flex-start',width:'100%',maxWidth:680}}>
        <MysteryCard index={artIdx} totalBidders={players.length} bidsIn={bidsDone.length}/>
        <Card style={{flex:1,minWidth:260,maxWidth:320}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
            <Avatar name={me.name||'?'} colorIndex={me.colorIndex||0} size={36}/>
            <div>
              <div style={{color:GOLD_LIGHT,fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:600}}>{me.name}</div>
              <MoneyDisplay amount={me.cash||0} size="sm"/>
            </div>
          </div>
          <GoldDivider/>
          {hasBid ? (
            <div style={{margin:'16px 0',textAlign:'center'}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:'rgba(0,120,50,0.12)',
                border:`1px solid ${GREEN_CLR}`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px'}}>
                <Ico name="check" size={22} color={GREEN_CLR}/>
              </div>
              <p style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:13,margin:0}}>
                Tu puja: <strong style={{color:GOLD}}>{fmtFull(myBid)}</strong>
              </p>
              <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:12,margin:'6px 0 0'}}>
                Esperando a los demás...
              </p>
              <WaitingFor players={players} doneIds={bidsDone.map(p=>p.id)} label="Sin pujar"/>
            </div>
          ) : (
            <div style={{margin:'14px 0'}}>
              <p style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:12,margin:'0 0 12px',lineHeight:1.5}}>
                Puede ser una <strong style={{color:GREEN_CLR}}>bendición</strong> o una <strong style={{color:RED}}>maldición</strong>. Solo el ganador lo descubrirá.
              </p>
              <label style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:11,display:'block',marginBottom:6}}>
                Tu puja (máx. {fmtFull(me.cash||0)})
              </label>
              <div style={{display:'flex',gap:6,marginBottom:8}}>
                <span style={{color:GOLD_DIM,fontFamily:"'Playfair Display',serif",fontSize:18,lineHeight:'40px'}}>$</span>
                <input type="text" value={bidInput}
                  onChange={e=>setBidInput(e.target.value.replace(/\D/g,''))}
                  onKeyDown={e=>{ if(e.key==='Enter') submitBid(); }}
                  placeholder="0" autoFocus
                  style={{flex:1,background:'#180d00',border:`1px solid ${GOLD_DIM}`,
                    borderRadius:4,padding:'8px 10px',color:GOLD_LIGHT,
                    fontFamily:"'Playfair Display',serif",fontSize:19,outline:'none'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5,marginBottom:12}}>
                {[10,25,50,100].map(p=>(
                  <button key={p} onClick={()=>setBidInput(String(Math.floor((me.cash||0)*p/100)))}
                    style={{background:'#180d00',border:`1px solid ${BORDER}`,borderRadius:3,
                      padding:'5px 0',color:'#777',fontFamily:"'Jost',sans-serif",fontSize:11,cursor:'pointer'}}>
                    {p}%
                  </button>
                ))}
              </div>
              <GoldBtn size="lg" onClick={submitBid} style={{width:'100%'}}>
                {bidInput&&parseInt(bidInput)>0?`Pujar ${fmtFull(parseInt(bidInput))}`:'Pasar (sin pujar)'}
              </GoldBtn>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── LOANS PHASE (Multiplayer) ─────────────────
function LoansPhase({ me, onComplete, isDone, waitingPlayers, allPlayers }) {
  const lender = GD.LENDER;
  const [selAmt, setSelAmt] = useState(null);
  const [selRate, setSelRate] = useState(null);
  const [greeting] = useState(lender.greetings[Math.floor(Math.random()*lender.greetings.length)]);
  const [warning]  = useState(lender.warnings[Math.floor(Math.random()*lender.warnings.length)]);
  const hasLoans = Object.keys(me.loans||{}).length > 0;
  const collection = lender.collection[Math.floor(Math.random()*lender.collection.length)];

  if (isDone) {
    return (
      <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',gap:20,padding:24}}>
        <div style={{width:56,height:56,borderRadius:'50%',background:'rgba(0,100,40,0.12)',
          border:`1px solid ${GREEN_CLR}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Ico name="check" size={24} color={GREEN_CLR}/>
        </div>
        <GoldTitle size="md">Listo</GoldTitle>
        <WaitingFor players={allPlayers} doneIds={allPlayers.filter(p=>!waitingPlayers.includes(p.id)).map(p=>p.id)}/>
        <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:14,margin:0}}>
          Esperando a los demás jugadores...
        </p>
      </div>
    );
  }

  const takeLoan = () => {
    if (!selAmt||!selRate) return;
    onComplete({ id:`loan_${Date.now()}`, original:selAmt, remaining:selAmt,
      rate:selRate.rate, monthsLeft:selRate.months, label:`Préstamo — ${fmtFull(selAmt)}` });
  };

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:24,gap:0}}>
      {/* Don Aurelio */}
      <div style={{width:'100%',maxWidth:520,
        background:'linear-gradient(160deg,#150900,#0a0500)',
        border:`1px solid ${BORDER}`,borderRadius:12,padding:24,marginBottom:16,
        boxShadow:'0 8px 40px rgba(0,0,0,0.7)'}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:16}}>
          {/* Character icon */}
          <div style={{width:64,height:64,borderRadius:8,flexShrink:0,
            background:'radial-gradient(circle,#2a1000,#0a0500)',
            border:`1px solid ${GOLD_DIM}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Ico name="crown" size={30} color={GOLD_DIM}/>
          </div>
          <div style={{flex:1}}>
            <GoldTitle size="md" style={{marginBottom:2}}>{lender.name}</GoldTitle>
            <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:12,
              letterSpacing:'0.06em',marginBottom:10}}>{lender.title}</div>
            <div style={{background:'#1a0d00',border:`1px solid ${BORDER}`,borderRadius:8,
              borderTopLeftRadius:0,padding:'10px 14px',color:'#bbb',
              fontFamily:"'Jost',sans-serif",fontSize:13,lineHeight:1.6,fontStyle:'italic'}}>
              "{hasLoans?collection:greeting}"
            </div>
          </div>
        </div>
        <div style={{background:'rgba(218,165,32,0.05)',border:`1px solid ${BORDER}`,
          borderRadius:5,padding:'8px 12px',color:'#666',fontFamily:"'Jost',sans-serif",
          fontSize:11,lineHeight:1.5,display:'flex',alignItems:'flex-start',gap:6}}>
          <Ico name="alert-triangle" size={12} color='#666' style={{marginTop:1,flexShrink:0}}/>
          {warning}
        </div>
      </div>

      {/* Player card */}
      <div style={{width:'100%',maxWidth:520}}>
        <Card>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <Avatar name={me.name||'?'} colorIndex={me.colorIndex||0} size={34}/>
              <GoldTitle size="sm">{me.name}</GoldTitle>
            </div>
            <MoneyDisplay amount={me.cash||0} size="md"/>
          </div>

          {hasLoans && (
            <div style={{marginBottom:12}}>
              <div style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:11,marginBottom:6}}>Deudas actuales:</div>
              {Object.values(me.loans||{}).map((l,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',
                  background:'#0e0800',borderRadius:4,padding:'5px 10px',marginBottom:4,
                  color:RED,fontFamily:"'Jost',sans-serif",fontSize:12}}>
                  <span style={{color:'#888'}}>{l.label||'Préstamo'}</span>
                  <span>{fmtFull(l.remaining)} · {(l.rate*100).toFixed(0)}% anual</span>
                </div>
              ))}
            </div>
          )}

          <div style={{marginBottom:12}}>
            <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:11,
              letterSpacing:'0.08em',marginBottom:8}}>MONTO DEL PRÉSTAMO</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7,marginBottom:12}}>
              {lender.amounts.map(amt=>(
                <button key={amt} onClick={()=>setSelAmt(selAmt===amt?null:amt)}
                  style={{background:selAmt===amt?'rgba(218,165,32,0.12)':'#0e0800',
                    border:`1px solid ${selAmt===amt?GOLD:BORDER}`,borderRadius:4,
                    padding:'9px',cursor:'pointer',color:selAmt===amt?GOLD_LIGHT:'#888',
                    fontFamily:"'Playfair Display',serif",fontSize:14,transition:'all 0.15s'}}>
                  {fmtFull(amt)}
                </button>
              ))}
            </div>
            <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:11,
              letterSpacing:'0.08em',marginBottom:8}}>PLAZO E INTERÉS</div>
            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:14}}>
              {lender.rates.map(r=>(
                <button key={r.months} onClick={()=>setSelRate(selRate?.months===r.months?null:r)}
                  style={{background:selRate?.months===r.months?'rgba(218,165,32,0.1)':'#0e0800',
                    border:`1px solid ${selRate?.months===r.months?GOLD:BORDER}`,
                    borderRadius:4,padding:'9px 12px',cursor:'pointer',
                    display:'flex',justifyContent:'space-between',alignItems:'center',transition:'all 0.15s'}}>
                  <span style={{color:selRate?.months===r.months?GOLD_LIGHT:'#888',
                    fontFamily:"'Jost',sans-serif",fontSize:13}}>{r.label}</span>
                  <span style={{color:RED,fontFamily:"'Jost',sans-serif",fontSize:12,fontWeight:600}}>
                    {(r.rate*100).toFixed(0)}% anual
                  </span>
                </button>
              ))}
            </div>
            {selAmt&&selRate && (
              <div style={{background:'rgba(160,0,0,0.08)',border:`1px solid ${RED}30`,
                borderRadius:5,padding:'8px 12px',marginBottom:12,color:'#cc8888',
                fontFamily:"'Jost',sans-serif",fontSize:11,lineHeight:1.6}}>
                Recibirás {fmtFull(selAmt)} ahora. Pagarás ~{fmtFull(Math.round(selAmt*(1+selRate.rate)))} en total.
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <GoldBtn variant="secondary" size="md" onClick={()=>onComplete(null)} style={{flex:1}}>
                No gracias
              </GoldBtn>
              <GoldBtn size="md" onClick={takeLoan} disabled={!selAmt||!selRate} style={{flex:2}}>
                Aceptar Préstamo
              </GoldBtn>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { AuctionPhase, LoansPhase, ArtifactCard });
