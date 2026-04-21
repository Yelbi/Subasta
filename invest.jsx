// =============================================
// SUBASTA v2 — Investment & Simulation Phases
// =============================================

function genPriceHistory(inv, month, gameSeed, points=10) {
  let price=100; const h=[price];
  for(let i=0;i<points;i++){
    const r=seededRand(gameSeed+inv.id.charCodeAt(0)*77+(month-points+i)*31+i*13);
    price=Math.max(5,price*(1+(r-0.5)*2*inv.volatility+inv.trend));
    h.push(price);
  }
  return h;
}
function getMonthReturn(inv, month, gameSeed) {
  const r=seededRand(gameSeed+inv.id.charCodeAt(0)*53+month*97+7);
  return inv.minRet+r*(inv.maxRet-inv.minRet);
}
window.getMonthReturn = getMonthReturn;

// ── SINGLE INVESTMENT CARD ────────────────────
function InvestCard({ inv, amount, onAmountChange, playerCash, totalAllocated, gameSeed, month, disabled }) {
  const history = genPriceHistory(inv, month, gameSeed, 10);
  const prevRet  = getMonthReturn(inv, month-1, gameSeed);
  const trendUp  = history[history.length-1] >= history[0];
  const pct      = playerCash>0 ? Math.round((amount||0)/playerCash*100) : 0;
  const available = playerCash - (totalAllocated - (amount||0));

  return (
    <Card style={{padding:'14px 16px',opacity:disabled?0.5:1,transition:'opacity 0.2s'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:6,background:`${inv.color}18`,
            border:`1px solid ${inv.color}55`,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Ico name={inv.id} size={18} color={inv.color}/>
          </div>
          <div>
            <div style={{color:GOLD_LIGHT,fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:600,marginBottom:3}}>
              {inv.name}
            </div>
            <Risk level={inv.risk}/>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <Sparkline prices={history} width={88} height={38}/>
          <div style={{fontSize:11,fontFamily:"'Jost',sans-serif",
            color:prevRet>=0?GREEN_CLR:RED,marginTop:2,display:'flex',alignItems:'center',gap:3,justifyContent:'flex-end'}}>
            <Ico name={prevRet>=0?'trending-up':'trending-up'} size={11} color={prevRet>=0?GREEN_CLR:RED}/>
            {Math.abs(prevRet*100).toFixed(1)}% mes anterior
          </div>
        </div>
      </div>

      <p style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:11,margin:'0 0 8px',lineHeight:1.5}}>
        {inv.desc}
      </p>

      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,
        fontFamily:"'Jost',sans-serif",color:'#666',marginBottom:8}}>
        <span>Rango: <span style={{color:'#999'}}>{(inv.minRet*100).toFixed(0)}% / {inv.maxRet>0?'+':''}{(inv.maxRet*100).toFixed(0)}%</span></span>
        {amount>0 && <span style={{color:GOLD_DIM}}>{pct}% de tu capital</span>}
      </div>

      {/* Input */}
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
        <span style={{color:GOLD_DIM,fontFamily:"'Playfair Display',serif",fontSize:15,lineHeight:1}}>$</span>
        <input type="text" value={amount>0?amount.toLocaleString('es-MX'):''} placeholder="0"
          onChange={e=>{
            const v=parseInt(e.target.value.replace(/\D/g,''))||0;
            onAmountChange(Math.min(v,Math.max(0,available)));
          }}
          disabled={disabled}
          style={{flex:1,background:'#180d00',border:`1px solid ${amount>0?GOLD_DIM:BORDER}`,
            borderRadius:4,padding:'7px 10px',color:GOLD_LIGHT,
            fontFamily:"'Jost',sans-serif",fontSize:14,outline:'none'}}/>
        {amount>0 && (
          <button onClick={()=>onAmountChange(0)} disabled={disabled}
            style={{background:'none',border:'none',cursor:'pointer',color:'#555',padding:'4px'}}>
            <Ico name="x" size={14} color="#555"/>
          </button>
        )}
      </div>

      {/* Quick % buttons */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5}}>
        {[25,50,75,100].map(p=>(
          <button key={p} onClick={()=>onAmountChange(Math.floor(available*p/100))}
            disabled={disabled||available<=0}
            style={{background:'#180d00',border:`1px solid ${BORDER}`,borderRadius:3,
              padding:'4px 0',color:'#666',fontFamily:"'Jost',sans-serif",fontSize:11,cursor:'pointer',
              transition:'border-color 0.15s'}}>
            {p}%
          </button>
        ))}
      </div>
    </Card>
  );
}

// ── INVESTMENT PHASE ─────────────────────────
function InvestmentPhase({ player, month, gameSeed, onConfirm, hasOracle, oracleData, isDone, waitingPlayers, allPlayers }) {
  const [allocs, setAllocs] = useState({});
  const total = Object.values(allocs).reduce((s,v)=>s+(v||0),0);
  const remaining = (player.cash||0) - total;
  const forcedInvest = (player.activeEffects||[]).some(e=>e.type==='forced_invest'&&(e.monthsLeft||0)>0);

  const canConfirm = !isDone && remaining>=0 && !(forcedInvest&&remaining>0);

  const handleConfirm = () => {
    if (!canConfirm) return;
    const investments = Object.entries(allocs).filter(([,v])=>v>0).map(([id,amount])=>({type:id,amount}));
    onConfirm(investments, (player.cash||0)-total);
  };

  if (isDone) {
    return (
      <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',gap:24,padding:24}}>
        <div style={{width:64,height:64,borderRadius:'50%',background:'rgba(0,120,50,0.15)',
          border:`2px solid ${GREEN_CLR}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Ico name="check" size={28} color={GREEN_CLR}/>
        </div>
        <GoldTitle size="md">Inversiones enviadas</GoldTitle>
        <WaitingFor players={allPlayers} doneIds={allPlayers.filter(p=>!waitingPlayers.includes(p.id)).map(p=>p.id)}/>
        <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:14,margin:0,textAlign:'center'}}>
          El mes avanzará cuando todos los jugadores hayan invertido.
        </p>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',background:BG,padding:'20px',boxSizing:'border-box'}}>
      <div style={{maxWidth:900,margin:'0 auto'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
          <GoldTitle size="md">Mes {month} — Inversiones</GoldTitle>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <Avatar name={player.name||'?'} colorIndex={player.colorIndex||0} size={32}/>
            <span style={{color:GOLD_LIGHT,fontFamily:"'Playfair Display',serif",fontSize:15}}>{player.name}</span>
          </div>
        </div>
        <GoldDivider/>

        {/* Balance strip */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,
          background:BG_CARD2,border:`1px solid ${BORDER}`,borderRadius:8,
          padding:'12px 18px',marginBottom:16}}>
          {[
            {label:'Efectivo',val:player.cash||0},
            {label:'Invertido',val:total},
            {label:'Reserva',val:remaining},
          ].map(({label,val})=>(
            <div key={label} style={{textAlign:'center'}}>
              <div style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:11,marginBottom:2}}>{label}</div>
              <MoneyDisplay amount={val} size="sm" style={{color:label==='Reserva'&&val<0?RED:GOLD}}/>
            </div>
          ))}
        </div>

        {/* Active effects */}
        {(player.activeEffects||[]).filter(e=>(e.monthsLeft||0)>0).length>0 && (
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
            {(player.activeEffects||[]).filter(e=>(e.monthsLeft||0)>0).map((ef,i)=>(
              <EffectTag key={i} label={`${ef.label||ef.type} (${ef.monthsLeft}m)`}
                type={ef.type.includes('multiplier')||ef.type.includes('immunity')||ef.type.includes('boost')?'good':'bad'}/>
            ))}
          </div>
        )}

        {forcedInvest && remaining>0 && (
          <div style={{background:'rgba(160,20,20,0.12)',border:`1px solid ${RED}40`,borderRadius:6,
            padding:'8px 14px',marginBottom:12,color:RED,fontFamily:"'Jost',sans-serif",fontSize:12,
            display:'flex',alignItems:'center',gap:8}}>
            <Ico name="alert-triangle" size={14} color={RED}/>
            La Mano Ávara: debes invertir todo tu efectivo.
          </div>
        )}

        {hasOracle && (
          <div style={{background:'rgba(218,165,32,0.06)',border:`1px solid ${GOLD_DIM}40`,
            borderRadius:6,padding:'10px 14px',marginBottom:12}}>
            <div style={{color:GOLD,fontFamily:"'Playfair Display',serif",fontSize:13,
              display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <Ico name="eye" size={14} color={GOLD}/> Oráculo del Mercado — Retornos de este mes:
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
              {GD.INVESTMENTS.map(inv=>{
                const ret=oracleData[inv.id]||0;
                return (
                  <div key={inv.id} style={{display:'flex',alignItems:'center',gap:5,
                    fontFamily:"'Jost',sans-serif",fontSize:12,color:ret>=0?GREEN_CLR:RED}}>
                    <Ico name={inv.id} size={12} color={ret>=0?GREEN_CLR:RED}/>
                    {inv.name.split(' ')[0]}: {ret>=0?'+':''}{(ret*100).toFixed(1)}%
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Investment grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:12,marginBottom:20}}>
          {GD.INVESTMENTS.map(inv=>(
            <InvestCard key={inv.id} inv={inv}
              amount={allocs[inv.id]||0}
              onAmountChange={v=>setAllocs(p=>({...p,[inv.id]:v}))}
              playerCash={player.cash||0} totalAllocated={total}
              gameSeed={gameSeed} month={month}
              disabled={remaining<=0&&!(allocs[inv.id]>0)}/>
          ))}
        </div>

        <div style={{display:'flex',justifyContent:'center',paddingBottom:32,flexDirection:'column',alignItems:'center',gap:8}}>
          {forcedInvest&&remaining>0 && (
            <p style={{color:RED,fontFamily:"'Jost',sans-serif",fontSize:13,margin:0}}>
              Aún te quedan {fmtFull(remaining)} sin invertir.
            </p>
          )}
          <GoldBtn size="xl" onClick={handleConfirm} disabled={!canConfirm}>
            Confirmar Inversiones
          </GoldBtn>
          {!forcedInvest&&remaining>0 && (
            <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:12,margin:0}}>
              {fmtFull(remaining)} quedarán como efectivo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SIMULATION SCREEN ─────────────────────────
function SimulationScreen({ players, month, gameSeed, onContinue, isHost }) {
  const [visible, setVisible] = useState(false);
  useEffect(()=>{ setTimeout(()=>setVisible(true),400); },[]);

  const results = players.map(player=>{
    let totalGain=0;
    const invs = (player.investments||[]).map(inv=>{
      const it = GD.INVESTMENTS.find(i=>i.id===inv.type);
      if(!it) return {...inv,gain:0,ret:0,it:null};
      let ret = getMonthReturn(it,month,gameSeed);
      let mult=1;
      (player.activeEffects||[]).filter(e=>(e.monthsLeft||0)>0).forEach(ef=>{
        if(ef.type==='investment_multiplier') mult*=ef.value;
        if(ef.type==='zero_returns') ret=0;
        if(ef.type==='business_zero'&&inv.type==='business') ret=0;
      });
      ret*=mult;
      const gain=Math.round(inv.amount*ret);
      totalGain+=gain;
      return {...inv,gain,ret,it};
    });
    const propIncome = (player.properties||[]).reduce((s,p)=>s+(p.monthlyRent||Math.round(p.value*0.025)),0);
    const boostEf = (player.activeEffects||[]).find(e=>e.type==='property_income_boost'&&(e.monthsLeft||0)>0);
    const boost = boostEf ? (player.properties||[]).length*(boostEf.value||0) : 0;
    const drain = (player.activeEffects||[]).filter(e=>e.type==='monthly_drain'&&(e.monthsLeft||0)>0).reduce((s,e)=>s+(e.value||0),0);
    const loanInt = (player.loans||[]).reduce((s,l)=>s+Math.round((l.remaining||0)*(l.rate||0)/12),0);
    const net = totalGain+(propIncome+boost)-drain-loanInt;
    return {player,invs,totalGain,propIncome:propIncome+boost,drain,loanInt,net};
  });

  return (
    <div style={{minHeight:'100vh',background:BG,padding:'24px 20px',boxSizing:'border-box'}}>
      <div style={{maxWidth:900,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <GoldTitle size="lg">Resultados del Mes {month}</GoldTitle>
          <GoldDivider/>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:28}}>
          {results.map(({player,invs,totalGain,propIncome,drain,loanInt,net},idx)=>(
            <Card key={player.id} glow={net>0} style={{
              opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(16px)',
              transition:`all 0.4s ease ${idx*0.12}s`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <Avatar name={player.name||'?'} colorIndex={player.colorIndex||0} size={36}/>
                  <GoldTitle size="sm">{player.name}</GoldTitle>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:11}}>Cambio neto</div>
                  <MoneyDisplay amount={net} size="md"/>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:8}}>
                {invs.map((inv,i)=>(inv.it&&
                  <div key={i} style={{background:'#0e0800',borderRadius:4,padding:'8px 10px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <Ico name={inv.type} size={12} color={inv.it.color}/>
                      <span style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:11}}>{inv.it.name}</span>
                    </div>
                    <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:11,marginBottom:2}}>{fmtFull(inv.amount)}</div>
                    <div style={{color:inv.gain>=0?GREEN_CLR:RED,fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700}}>
                      {inv.gain>=0?'+':''}{fmtFull(inv.gain)} <span style={{fontSize:10,opacity:0.8}}>({(inv.ret*100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
                {propIncome>0 && (
                  <div style={{background:'#0e0800',borderRadius:4,padding:'8px 10px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <Ico name="home" size={12} color={GOLD_DIM}/>
                      <span style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:11}}>Rentas</span>
                    </div>
                    <div style={{color:GREEN_CLR,fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700}}>+{fmtFull(propIncome)}</div>
                  </div>
                )}
                {loanInt>0 && (
                  <div style={{background:'#0e0800',borderRadius:4,padding:'8px 10px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <Ico name="dollar-sign" size={12} color={RED}/>
                      <span style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:11}}>Intereses</span>
                    </div>
                    <div style={{color:RED,fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700}}>-{fmtFull(loanInt)}</div>
                  </div>
                )}
                {drain>0 && (
                  <div style={{background:'#0e0800',borderRadius:4,padding:'8px 10px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <Ico name="alert-triangle" size={12} color={RED}/>
                      <span style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:11}}>Maldición</span>
                    </div>
                    <div style={{color:RED,fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700}}>-{fmtFull(drain)}</div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {isHost ? (
          <div style={{display:'flex',justifyContent:'center',paddingBottom:32}}>
            <GoldBtn size="xl" onClick={()=>onContinue(results)}>
              Continuar a la Subasta
              <span style={{marginLeft:8,display:'inline-flex',verticalAlign:'middle'}}>
                <Ico name="arrow-right" size={16} color="#080503"/>
              </span>
            </GoldBtn>
          </div>
        ) : (
          <div style={{textAlign:'center',paddingBottom:32}}>
            <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:14}}>
              Esperando al anfitrión para continuar...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { InvestmentPhase, SimulationScreen, genPriceHistory, getMonthReturn });
