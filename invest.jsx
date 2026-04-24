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
  const history  = genPriceHistory(inv, month, gameSeed, 10);
  const prevRet  = getMonthReturn(inv, month-1, gameSeed);
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
            <div style={{color:GOLD_LIGHT,fontFamily:"'Playfair Display',serif",
              fontSize:13,fontWeight:600,marginBottom:3}}>{inv.name}</div>
            <Risk level={inv.risk}/>
          </div>
        </div>
        <div style={{textAlign:'right'}}>
          <Sparkline prices={history} width={88} height={38}/>
          <div style={{fontSize:11,fontFamily:"'Jost',sans-serif",
            color:prevRet>=0?GREEN_CLR:RED,marginTop:2,
            display:'flex',alignItems:'center',gap:3,justifyContent:'flex-end'}}>
            <Ico name="trending-up" size={11} color={prevRet>=0?GREEN_CLR:RED}/>
            {Math.abs(prevRet*100).toFixed(1)}% mes anterior
          </div>
        </div>
      </div>

      <p style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:11,
        margin:'0 0 8px',lineHeight:1.5}}>{inv.desc}</p>

      <div style={{display:'flex',justifyContent:'space-between',fontSize:11,
        fontFamily:"'Jost',sans-serif",color:'#666',marginBottom:8}}>
        <span>Rango: <span style={{color:'#999'}}>
          {(inv.minRet*100).toFixed(0)}% / {inv.maxRet>0?'+':''}{(inv.maxRet*100).toFixed(0)}%
        </span></span>
        {amount>0 && <span style={{color:GOLD_DIM}}>{pct}% de tu capital</span>}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
        <span style={{color:GOLD_DIM,fontFamily:"'Playfair Display',serif",fontSize:15}}>$</span>
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
            style={{background:'none',border:'none',cursor:'pointer',padding:'4px'}}>
            <Ico name="x" size={14} color="#555"/>
          </button>
        )}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5}}>
        {[25,50,75,100].map(p=>(
          <button key={p} onClick={()=>onAmountChange(Math.floor(available*p/100))}
            disabled={disabled||available<=0}
            style={{background:'#180d00',border:`1px solid ${BORDER}`,borderRadius:3,
              padding:'4px 0',color:'#666',fontFamily:"'Jost',sans-serif",
              fontSize:11,cursor:'pointer'}}>
            {p}%
          </button>
        ))}
      </div>
    </Card>
  );
}

// ── MARKET NEWS PANEL ─────────────────────────
function MarketNewsPanel({ news }) {
  if (!news || news.length === 0) return null;
  return (
    <div style={{background:'rgba(218,165,32,0.04)',border:`1px solid ${BORDER}`,
      borderRadius:8,padding:'12px 16px',marginBottom:14}}>
      <div style={{color:GOLD_DIM,fontFamily:"'Jost',sans-serif",fontSize:11,
        letterSpacing:'0.12em',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
        <Ico name="eye" size={12} color={GOLD_DIM}/>
        NOTICIAS DEL MERCADO
        <span style={{color:'#555',fontSize:10,marginLeft:4}}>— algunas son falsas</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:7}}>
        {news.map((item,i)=>(
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8,
            background:'#0e0800',borderRadius:5,padding:'8px 12px'}}>
            <div style={{width:5,height:5,borderRadius:'50%',
              background:GOLD_DIM,flexShrink:0,marginTop:5}}/>
            <p style={{color:'#aaa',fontFamily:"'Jost',sans-serif",fontSize:12,
              margin:0,lineHeight:1.6,fontStyle:'italic'}}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── INSURANCE PANEL ───────────────────────────
function InsurancePanel({ insured, onToggle, totalInvested }) {
  const cost = Math.round(totalInvested * 0.03);
  return (
    <div style={{
      background: insured ? 'rgba(0,120,50,0.1)' : 'rgba(218,165,32,0.04)',
      border:`1px solid ${insured ? GREEN_CLR+'55' : BORDER}`,
      borderRadius:8,padding:'12px 16px',marginBottom:14,
      transition:'all 0.2s'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,borderRadius:6,
            background:insured?'rgba(0,120,50,0.2)':'rgba(218,165,32,0.08)',
            border:`1px solid ${insured?GREEN_CLR:BORDER}`,
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Ico name="shield" size={16} color={insured?GREEN_CLR:GOLD_DIM}/>
          </div>
          <div>
            <div style={{color:insured?GREEN_CLR:GOLD_LIGHT,fontFamily:"'Playfair Display',serif",
              fontSize:14,fontWeight:600}}>Seguro de Inversión</div>
            <div style={{color:'#777',fontFamily:"'Jost',sans-serif",fontSize:11,marginTop:1}}>
              Limita pérdidas al 10% · Costo: 3% del monto invertido
            </div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          {totalInvested>0 && (
            <span style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:12}}>
              Costo: <span style={{color:RED}}>{fmtFull(cost)}</span>
            </span>
          )}
          <button onClick={onToggle}
            style={{
              background: insured?'rgba(0,120,50,0.2)':'#180d00',
              border:`1px solid ${insured?GREEN_CLR:BORDER}`,
              borderRadius:20,padding:'5px 14px',cursor:'pointer',
              color:insured?GREEN_CLR:GOLD_DIM,
              fontFamily:"'Jost',sans-serif",fontSize:12,
              display:'flex',alignItems:'center',gap:5,transition:'all 0.15s'}}>
            {insured
              ? <><Ico name="check" size={12} color={GREEN_CLR}/> Asegurado</>
              : 'Contratar'}
          </button>
        </div>
      </div>
      {insured && totalInvested>0 && (
        <div style={{color:GREEN_CLR,fontFamily:"'Jost',sans-serif",fontSize:11,
          marginTop:8,paddingTop:8,borderTop:`1px solid ${GREEN_CLR}22`}}>
          Ninguna inversión perderá más del 10% este mes. Costo deducido al confirmar.
        </div>
      )}
    </div>
  );
}

// ── BANKRUPTCY SCREEN ─────────────────────────
function BankruptScreen({ player, onComplete, waitingPlayers, allPlayers }) {
  const debt = Object.values(player.loans||{}).reduce((s,l)=>s+(l.remaining||0),0);
  return (
    <div style={{padding:'24px 20px',maxWidth:500,margin:'0 auto',
      display:'flex',flexDirection:'column',alignItems:'center',gap:20}}>
      <div style={{width:64,height:64,borderRadius:'50%',
        background:'rgba(180,20,20,0.15)',border:`2px solid ${RED}`,
        display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Ico name="alert-triangle" size={28} color={RED}/>
      </div>
      <div style={{textAlign:'center'}}>
        <GoldTitle size="md" style={{color:RED,marginBottom:6}}>En Quiebra</GoldTitle>
        <p style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:14,
          margin:0,lineHeight:1.7}}>
          No puedes invertir este mes. Pasa directamente a la subasta —
          un artefacto podría cambiar tu suerte. Don Aurelio tiene una oferta especial para ti.
        </p>
      </div>
      <div style={{background:'rgba(180,20,20,0.08)',border:`1px solid ${RED}30`,
        borderRadius:8,padding:'12px 16px',width:'100%'}}>
        {[{label:'Efectivo',val:player.cash||0},{label:'Deudas',val:-debt}].map(({label,val})=>(
          <div key={label} style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:13}}>{label}</span>
            <MoneyDisplay amount={val} size="sm"/>
          </div>
        ))}
      </div>
      <GoldBtn size="lg" onClick={onComplete} style={{width:'100%'}}>
        Entendido — Pasar a la Subasta
      </GoldBtn>
      <WaitingFor players={allPlayers}
        doneIds={allPlayers.filter(p=>!waitingPlayers.includes(p.id)).map(p=>p.id)}/>
    </div>
  );
}

// ── INVESTMENT PHASE ──────────────────────────
function InvestmentPhase({ player, month, gameSeed, onConfirm, hasOracle, oracleData,
  isDone, waitingPlayers, allPlayers, event, news }) {
  const [allocs,  setAllocs]  = useState({});
  const [insured, setInsured] = useState(false);
  const total     = Object.values(allocs).reduce((s,v)=>s+(v||0),0);
  const insureCost = insured ? Math.round(total*0.03) : 0;
  const remaining  = (player.cash||0) - total - insureCost;
  const isBankrupt = (player.cash||0) <= 0 && Object.values(player.loans||{}).reduce((s,l)=>s+(l.remaining||0),0) > 0;
  const forcedInvest = (player.activeEffects||[]).some(e=>e.type==='forced_invest'&&(e.monthsLeft||0)>0);
  const canConfirm = !isDone && remaining>=0 && !(forcedInvest&&remaining>0);

  const handleConfirm = () => {
    if (!canConfirm) return;
    window.SFX?.click?.();
    const investments = Object.entries(allocs).filter(([,v])=>v>0).map(([id,amount])=>({type:id,amount}));
    onConfirm(investments, (player.cash||0)-total-insureCost, insured);
  };

  // Bankrupt — skip invest
  if (isBankrupt) return <BankruptScreen player={player}
    onComplete={()=>onConfirm([],player.cash||0,false)}
    waitingPlayers={waitingPlayers} allPlayers={allPlayers}/>;

  if (isDone) {
    return (
      <div style={{display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',gap:20,padding:40}}>
        <div style={{width:56,height:56,borderRadius:'50%',
          background:'rgba(0,120,50,0.15)',border:`2px solid ${GREEN_CLR}`,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          <Ico name="check" size={24} color={GREEN_CLR}/>
        </div>
        <GoldTitle size="md">Inversiones enviadas</GoldTitle>
        <WaitingFor players={allPlayers}
          doneIds={allPlayers.filter(p=>!waitingPlayers.includes(p.id)).map(p=>p.id)}/>
        <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:13,
          margin:0,textAlign:'center'}}>
          El mes avanzará cuando todos hayan invertido.
        </p>
      </div>
    );
  }

  return (
    <div style={{padding:'16px 20px',boxSizing:'border-box'}}>
      <div style={{maxWidth:920,margin:'0 auto'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',
          alignItems:'center',marginBottom:4}}>
          <GoldTitle size="md">Mes {month} — Inversiones</GoldTitle>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <Avatar name={player.name||'?'} colorIndex={player.colorIndex||0} size={30}/>
            <span style={{color:GOLD_LIGHT,fontFamily:"'Playfair Display',serif",
              fontSize:14}}>{player.name}</span>
          </div>
        </div>
        <GoldDivider/>

        {/* Balance strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,
          background:BG_CARD2,border:`1px solid ${BORDER}`,borderRadius:8,
          padding:'10px 16px',marginBottom:14}}>
          {[
            {label:'Efectivo total',val:player.cash||0},
            {label:'Invertido',val:total},
            {label:'Seguro',val:-insureCost},
            {label:'Reserva',val:remaining},
          ].map(({label,val})=>(
            <div key={label} style={{textAlign:'center'}}>
              <div style={{color:'#777',fontFamily:"'Jost',sans-serif",
                fontSize:10,marginBottom:2}}>{label}</div>
              <MoneyDisplay amount={val} size="sm"
                style={{color:label==='Reserva'&&val<0?RED:undefined}}/>
            </div>
          ))}
        </div>

        {/* Event banner */}
        {event && <EventBanner event={event}/>}

        {/* Market news */}
        {news && news.length>0 && <MarketNewsPanel news={news}/>}

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
          <div style={{background:'rgba(160,20,20,0.12)',border:`1px solid ${RED}40`,
            borderRadius:6,padding:'8px 14px',marginBottom:12,color:RED,
            fontFamily:"'Jost',sans-serif",fontSize:12,
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
              <Ico name="eye" size={14} color={GOLD}/> Oráculo del Mercado:
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
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(268px,1fr))',
          gap:12,marginBottom:14}}>
          {GD.INVESTMENTS.map(inv=>(
            <InvestCard key={inv.id} inv={inv}
              amount={allocs[inv.id]||0}
              onAmountChange={v=>setAllocs(p=>({...p,[inv.id]:v}))}
              playerCash={player.cash||0} totalAllocated={total}
              gameSeed={gameSeed} month={month}
              disabled={remaining<=0&&!(allocs[inv.id]>0)}/>
          ))}
        </div>

        {/* Insurance */}
        <InsurancePanel insured={insured} onToggle={()=>setInsured(v=>!v)} totalInvested={total}/>

        <div style={{display:'flex',justifyContent:'center',paddingBottom:28,
          flexDirection:'column',alignItems:'center',gap:8}}>
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
function SimulationScreen({ players, month, simResults, onContinue, isHost }) {
  const [visible, setVisible] = useState(false);
  useEffect(()=>{ setTimeout(()=>setVisible(true),350); },[]);
  const sorted = [...players].sort((a,b)=>(simResults?.[b.id]?.netChange||0)-(simResults?.[a.id]?.netChange||0));

  return (
    <div style={{padding:'20px',maxWidth:960,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:18}}>
        <GoldTitle size="lg">Resultados del Mes {month}</GoldTitle>
        <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:13,margin:'6px 0 0'}}>
          El mercado habló. Revisa tus ganancias antes de ir a la subasta.
        </p>
        <GoldDivider/>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:24}}>
        {sorted.map((player,idx)=>{
          const r=simResults?.[player.id]||{};
          const {invResults=[],propIncome=0,drain=0,loanInterest=0,netChange=0,oldCash=0,newCash=0,insured}=r;
          const hasData=invResults.length>0||propIncome>0||drain>0||loanInterest>0;

          return (
            <Card key={player.id} glow={netChange>0} style={{
              opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(14px)',
              transition:`all 0.4s ease ${idx*0.1}s`}}>
              <div style={{display:'flex',justifyContent:'space-between',
                alignItems:'center',marginBottom:hasData?12:0}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <Avatar name={player.name||'?'} colorIndex={player.colorIndex||0} size={38}/>
                  <div>
                    <GoldTitle size="sm" tag="span">{player.name}</GoldTitle>
                    <div style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:11,marginTop:2}}>
                      {fmtFull(oldCash)} → {fmtFull(newCash)}
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  {insured && <EffectTag label="Asegurado" type="good"/>}
                  <div style={{textAlign:'right'}}>
                    <div style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:11}}>Cambio neto</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,
                      color:netChange>=0?GREEN_CLR:RED}}>
                      {netChange>=0?'+':''}{fmtFull(netChange)}
                    </div>
                  </div>
                </div>
              </div>

              {hasData && (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(148px,1fr))',gap:8}}>
                  {invResults.map((inv,i)=>{
                    const it=GD.INVESTMENTS.find(x=>x.id===inv.type);
                    return (
                      <div key={i} style={{background:'#0e0800',borderRadius:5,padding:'8px 10px',
                        borderLeft:`2px solid ${inv.gain>=0?GREEN_CLR:RED}55`}}>
                        <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:4}}>
                          <Ico name={inv.type} size={11} color={it?.color||GOLD_DIM}/>
                          <span style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:10}}>
                            {it?.name||inv.type}
                          </span>
                        </div>
                        <div style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:10,marginBottom:2}}>
                          {fmtFull(inv.amount)} → {fmtFull(inv.returned)}
                        </div>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,
                          color:inv.gain>=0?GREEN_CLR:RED}}>
                          {inv.gain>=0?'+':''}{fmtFull(inv.gain)}
                          <span style={{fontSize:9,opacity:0.75,marginLeft:3}}>
                            ({inv.ret>=0?'+':''}{(inv.ret*100).toFixed(1)}%)
                          </span>
                        </div>
                        {inv.capped && (
                          <div style={{color:GREEN_CLR,fontFamily:"'Jost',sans-serif",
                            fontSize:9,marginTop:3}}>Seguro aplicado</div>
                        )}
                      </div>
                    );
                  })}
                  {propIncome>0 && (
                    <div style={{background:'#0e0800',borderRadius:5,padding:'8px 10px',
                      borderLeft:`2px solid ${GREEN_CLR}55`}}>
                      <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:4}}>
                        <Ico name="home" size={11} color={GOLD_DIM}/>
                        <span style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:10}}>Rentas</span>
                      </div>
                      <div style={{color:GREEN_CLR,fontFamily:"'Playfair Display',serif",
                        fontSize:13,fontWeight:700}}>+{fmtFull(propIncome)}</div>
                    </div>
                  )}
                  {loanInterest>0 && (
                    <div style={{background:'#0e0800',borderRadius:5,padding:'8px 10px',
                      borderLeft:`2px solid ${RED}55`}}>
                      <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:4}}>
                        <Ico name="dollar-sign" size={11} color={RED}/>
                        <span style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:10}}>Intereses</span>
                      </div>
                      <div style={{color:RED,fontFamily:"'Playfair Display',serif",
                        fontSize:13,fontWeight:700}}>-{fmtFull(loanInterest)}</div>
                    </div>
                  )}
                  {drain>0 && (
                    <div style={{background:'#0e0800',borderRadius:5,padding:'8px 10px',
                      borderLeft:`2px solid ${RED}55`}}>
                      <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:4}}>
                        <Ico name="alert-triangle" size={11} color={RED}/>
                        <span style={{color:'#888',fontFamily:"'Jost',sans-serif",fontSize:10}}>Maldición</span>
                      </div>
                      <div style={{color:RED,fontFamily:"'Playfair Display',serif",
                        fontSize:13,fontWeight:700}}>-{fmtFull(drain)}</div>
                    </div>
                  )}
                </div>
              )}
              {!hasData && (
                <p style={{color:'#555',fontFamily:"'Jost',sans-serif",fontSize:13,margin:0}}>
                  No realizó inversiones este mes.
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {isHost ? (
        <div style={{display:'flex',justifyContent:'center',paddingBottom:28}}>
          <GoldBtn size="xl" onClick={onContinue}>
            Ir a la Subasta
            <span style={{marginLeft:8,display:'inline-flex',verticalAlign:'middle'}}>
              <Ico name="arrow-right" size={16} color="#080503"/>
            </span>
          </GoldBtn>
        </div>
      ) : (
        <div style={{textAlign:'center',paddingBottom:28}}>
          <p style={{color:'#666',fontFamily:"'Jost',sans-serif",fontSize:14,margin:0}}>
            Esperando al anfitrión para continuar a la subasta...
          </p>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  InvestmentPhase, SimulationScreen, BankruptScreen,
  genPriceHistory, getMonthReturn,
});
