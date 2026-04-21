window.GD = {

  ROULETTE: [
    { label: '$50K',  amount: 50000   },
    { label: '$100K', amount: 100000  },
    { label: '$100K', amount: 100000  },
    { label: '$100K', amount: 100000  },
    { label: '$100K', amount: 100000  },
    { label: '$200K', amount: 200000  },
    { label: '$200K', amount: 200000  },
    { label: '$200K', amount: 200000  },
    { label: '$350K', amount: 350000  },
    { label: '$350K', amount: 350000  },
    { label: '$500K', amount: 500000  },
    { label: '$750K', amount: 750000  },
    { label: '$1M',   amount: 1000000 },
  ],

  PLAYER_COLORS: [
    { bg:'oklch(68% 0.15 75deg)',  fg:'#080503' },
    { bg:'oklch(60% 0.18 260deg)', fg:'#fff'    },
    { bg:'oklch(60% 0.18 145deg)', fg:'#fff'    },
    { bg:'oklch(58% 0.18 15deg)',  fg:'#fff'    },
    { bg:'oklch(60% 0.18 300deg)', fg:'#fff'    },
    { bg:'oklch(60% 0.18 200deg)', fg:'#fff'    },
  ],

  INVESTMENTS: [
    { id:'stocks',     name:'Bolsa de Valores',   risk:4, minRet:-0.25, maxRet:0.40, volatility:0.18, trend:0.010, color:'oklch(62% 0.18 145deg)', desc:'Alta volatilidad. Grandes ganancias o pérdidas.' },
    { id:'realestate', name:'Bienes Raíces',       risk:2, minRet:-0.05, maxRet:0.20, volatility:0.07, trend:0.015, color:'oklch(65% 0.15 75deg)',  desc:'Estable y predecible. Crecimiento moderado.' },
    { id:'business',   name:'Negocios y Tiendas',  risk:3, minRet:-0.15, maxRet:0.35, volatility:0.14, trend:0.010, color:'oklch(62% 0.18 300deg)', desc:'Alto potencial. Vulnerable a eventos externos.' },
    { id:'bonds',      name:'Bonos del Estado',    risk:1, minRet:0.04,  maxRet:0.09, volatility:0.02, trend:0.005, color:'oklch(62% 0.18 260deg)', desc:'Bajo riesgo. Retorno casi garantizado.' },
    { id:'crypto',     name:'Criptomonedas',       risk:5, minRet:-0.65, maxRet:0.95, volatility:0.38, trend:0.005, color:'oklch(60% 0.18 15deg)',  desc:'Extremadamente volátil. Fortuna o ruina.' },
    { id:'commodities',name:'Materias Primas',     risk:2, minRet:-0.10, maxRet:0.28, volatility:0.11, trend:0.008, color:'oklch(55% 0.12 55deg)',  desc:'Oro, petróleo, recursos naturales.' },
  ],

  ARTIFACTS: [
    // ── BENDICIONES ──────────────────────────────────────────────────
    { id:'golden_hand',    name:'La Mano Dorada',          type:'blessing', rarity:'rara',
      flavor:'Una mano de oro macizo. Todo lo que toca se convierte en riqueza.',
      desc:'Tus inversiones rinden el doble este mes.',
      effect:'investment_multiplier', value:2.0, duration:1 },

    { id:'fortune_stone',  name:'Piedra de la Fortuna',    type:'blessing', rarity:'común',
      flavor:'Una piedra pulida que vibra suavemente con energía dorada.',
      desc:'Ganas $75,000 en efectivo de inmediato.',
      effect:'cash_bonus', value:75000 },

    { id:'lost_deed',      name:'La Escritura Perdida',    type:'blessing', rarity:'infrecuente',
      flavor:'Antiguo documento con sellos de oro. La propiedad ya es tuya.',
      desc:'Recibes una propiedad gratis valuada en $200,000.',
      effect:'free_property', value:200000 },

    { id:'market_oracle',  name:'Oráculo del Mercado',     type:'blessing', rarity:'rara',
      flavor:'Una bola de cristal que revela el futuro del mercado.',
      desc:'Ves los resultados del próximo mes antes de invertir.',
      effect:'oracle', duration:1 },

    { id:'prosperity',     name:'Amuleto de Prosperidad',  type:'blessing', rarity:'infrecuente',
      flavor:'Joya ancestral que irradia abundancia.',
      desc:'+50% a todos tus retornos de inversión por 2 meses.',
      effect:'investment_multiplier', value:1.5, duration:2 },

    { id:'jade_clover',    name:'Trébol de Jade',          type:'blessing', rarity:'infrecuente',
      flavor:'Cuatro hojas perfectas en jade. ¿Cuánto te sonreirá la suerte?',
      desc:'Ganas entre $20,000 y $250,000 al azar.',
      effect:'random_cash', minVal:20000, maxVal:250000 },

    { id:'sultans_crown',  name:'Corona del Sultán',       type:'blessing', rarity:'rara',
      flavor:'El sultán que la portaba poseía todo el reino.',
      desc:'+$15,000 por cada propiedad tuya, durante 3 meses.',
      effect:'property_income_boost', value:15000, duration:3 },

    { id:'scroll_thief',   name:'Pergamino del Ladrón',    type:'blessing', rarity:'infrecuente',
      flavor:'Instrucciones muy detalladas para el robo perfecto.',
      desc:'Robas $80,000 de efectivo a un jugador al azar.',
      effect:'steal_cash', value:80000 },

    { id:'golden_bell',    name:'La Campana de Oro',       type:'blessing', rarity:'rara',
      flavor:'Su tañido ahuyenta todo mal. Los demás te envidian en silencio.',
      desc:'Eres inmune a todas las maldiciones durante 2 meses.',
      effect:'curse_immunity', duration:2 },

    { id:'abundance',      name:'Cristal de la Abundancia',type:'blessing', rarity:'infrecuente',
      flavor:'Amplifica todo lo que tocas.',
      desc:'El valor de todas tus propiedades se duplica este mes.',
      effect:'property_double', duration:1 },

    // ── MALDICIONES ──────────────────────────────────────────────────
    { id:'evil_eye',       name:'El Ojo Maldito',          type:'curse', rarity:'común',
      flavor:'El ojo te observó. Tus inversiones comenzaron a marchitar.',
      desc:'Pierdes el 25% del valor de todas tus inversiones.',
      effect:'investment_loss', value:0.25 },

    { id:'ghost_fire',     name:'Fuego Fatuo',             type:'curse', rarity:'infrecuente',
      flavor:'Llamas azules que no queman madera, sino fortunas.',
      desc:'Una propiedad aleatoria se incendia. La pierdes para siempre.',
      effect:'destroy_property' },

    { id:'phantom_debt',   name:'Deuda Fantasma',          type:'curse', rarity:'infrecuente',
      flavor:'Una deuda que nadie recuerda contratar. El cobrador sí.',
      desc:'Adquieres una deuda de $150,000 al 20% de interés.',
      effect:'add_debt', value:150000, rate:0.20 },

    { id:'market_shadow',  name:'Sombra del Mercado',      type:'curse', rarity:'común',
      flavor:'Una sombra cae sobre tus finanzas. El mercado te ignora.',
      desc:'Ninguna de tus inversiones genera retorno este mes.',
      effect:'zero_returns', duration:1 },

    { id:'greed_hand',     name:'La Mano Ávara',           type:'curse', rarity:'infrecuente',
      flavor:'No puedes resistirte. La mano toma todo lo que puede.',
      desc:'Debes invertir todo tu efectivo el próximo mes.',
      effect:'forced_invest', duration:1 },

    { id:'cursed_contract',name:'El Contrato Maldito',     type:'curse', rarity:'común',
      flavor:'Lo firmaste sin leer. Siempre hay letra pequeña.',
      desc:'Pierdes el 30% de tu efectivo de inmediato.',
      effect:'cash_loss', value:0.30 },

    { id:'rat_plague',     name:'Plaga de Ratas',          type:'curse', rarity:'común',
      flavor:'Llegaron al almacén primero. Luego a la oficina.',
      desc:'Todos tus negocios generan cero este mes.',
      effect:'business_zero', duration:1 },

    { id:'pandoras_box',   name:'Caja de Pandora',         type:'curse', rarity:'infrecuente',
      flavor:'Estaba cerrada por una razón. Muy buena razón.',
      desc:'Pierdes $30,000 cada mes durante los próximos 3 meses.',
      effect:'monthly_drain', value:30000, duration:3 },

    { id:'moon_curse',     name:'Maldición de la Luna',    type:'curse', rarity:'rara',
      flavor:'La luna llena vio algo que no debía. Y ahora tú pagas.',
      desc:'Catástrofe: −40% efectivo, una propiedad perdida, o $250K en deuda.',
      effect:'random_catastrophe' },

    { id:'shadow_stolen',  name:'El Ladrón de Sombras',    type:'curse', rarity:'infrecuente',
      flavor:'Ni siquiera viste quién fue. Solo el silencio.',
      desc:'Un jugador al azar te roba $60,000 en efectivo.',
      effect:'stolen_cash', value:60000 },
  ],

  LENDER: {
    name: 'Don Aurelio',
    title: 'El Prestamista',
    rates: [
      { months:3,  rate:0.10, label:'Corto plazo — 3 meses'  },
      { months:6,  rate:0.15, label:'Mediano plazo — 6 meses' },
      { months:12, rate:0.25, label:'Largo plazo — 12 meses' },
    ],
    amounts: [50000, 100000, 200000, 500000],
    greetings: [
      '¿Así que necesitas un poco de ayuda? No hay problema... para mis amigos.',
      'Veo que el destino no ha sido amable contigo. Quizás yo sí pueda serlo.',
      'El dinero es como el agua. Siempre encuentro por dónde fluir.',
      'Siéntate. El dinero nunca es un problema... cuando yo soy tu solución.',
    ],
    warnings: [
      'Los intereses no esperan. Ni yo, amigo.',
      'Confío en ti. Sería una lástima que esa confianza se rompiera.',
      'Mis términos son flexibles. Pero mi paciencia, no tanto.',
    ],
    collection: [
      '¿Cómo van esos pagos? Pregunto por curiosidad.',
      'Tu propiedad luce muy interesante. Muy interesante.',
      'Los accidentes pasan, especialmente con deudas pendientes.',
    ],
  },

  PROPERTY_NAMES: [
    'Apartamento Centro Histórico','Villa Las Palmas','Local Comercial Sur',
    'Penthouse Torre Dorada','Casa Quinta Azul','Oficinas Plaza Mayor',
    'Bodega Industrial Norte','Residencia El Encanto','Suite Hotel Mirador',
    'Terreno Río Grande',
  ],
};
