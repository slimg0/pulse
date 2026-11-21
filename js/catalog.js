// Everything for sale or unlockable lives here.
window.PULSE_CATALOG = {
  skins: [
    { id: 'cyan',   name: 'Neon',      hue: 190, price: 0 },
    { id: 'coral',  name: 'Ember',     hue: 12,  price: 500 },
    { id: 'lime',   name: 'Acid',      hue: 88,  price: 900 },
    { id: 'violet', name: 'Nebula',    hue: 270, price: 1600 },
    { id: 'gold',   name: 'Midas',     hue: 45,  price: 3200 },
    { id: 'prism',  name: 'Prism',     hue: 0,   anim: 'rainbow', iap: 'skin_prism' },
    { id: 'aurora', name: 'Aurora',    hue: 165, anim: 'aurora',  iap: 'skin_aurora' },
    { id: 'nova',   name: 'Supernova', hue: 330, anim: 'rainbow', iap: 'starter_pack' }
  ],

  // Shard sinks = "progress faster". Costs ramp so a pack feels like a shortcut.
  upgrades: [
    { id: 'boost',  name: 'Shard Boost',   desc: 'Earn more shards every run', max: 10,
      cost: l => Math.round(120 * Math.pow(1.65, l)), fmt: l => '+' + l * 10 + '%' },
    { id: 'wide',   name: 'Wide Target',   desc: 'A bigger landing zone',      max: 8,
      cost: l => Math.round(200 * Math.pow(1.7, l)),  fmt: l => '+' + l * 4 + '%' },
    { id: 'shield', name: 'Second Chance', desc: 'Start each run with shields', max: 3,
      cost: l => Math.round(500 * Math.pow(2.4, l)),  fmt: l => String(l) }
  ],

  // Product IDs must match what you create in App Store Connect / Play Console
  // AND in RevenueCat. type: 'non' = bought once, 'cons' = can be bought repeatedly.
  products: [
    { id: 'starter_pack',  type: 'non',  title: 'Starter Pack',  price: '$1.99', badge: 'BEST VALUE',
      desc: '3,000 shards + Supernova skin + a free shield level' },
    { id: 'remove_ads',    type: 'non',  title: 'Remove Ads',    price: '$2.99',
      desc: 'No more pop-up ads. Optional reward videos stay.' },
    { id: 'double_shards', type: 'non',  title: 'Double Shards', price: '$3.99',
      desc: 'Earn 2× shards in every run, forever' },
    { id: 'skin_prism',    type: 'non',  title: 'Prism Skin',    price: '$1.99',
      desc: 'Animated rainbow orb and trail' },
    { id: 'skin_aurora',   type: 'non',  title: 'Aurora Skin',   price: '$1.99',
      desc: 'Shimmering northern-lights orb' },
    { id: 'shards_s', type: 'cons', title: 'Pouch of Shards',  price: '$0.99', shards: 1500 },
    { id: 'shards_m', type: 'cons', title: 'Chest of Shards',  price: '$4.99', shards: 9000,  badge: '+20%' },
    { id: 'shards_l', type: 'cons', title: 'Vault of Shards',  price: '$9.99', shards: 22000, badge: '+45%' }
  ],

  dailyRewards: [50, 75, 100, 150, 200, 300, 600]
};
