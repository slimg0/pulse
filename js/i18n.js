// Translations. Device language is detected on first launch (French -> fr, else en)
// and can be changed in Settings. Add a language by adding a block below.
window.PI18n = (function () {
  const D = {
    en: {
      tag: 'tap to the beat of the ring', best: 'BEST', play: 'PLAY', shop: 'Shop', daily: 'Daily gift', menu: 'Menu',
      gameOver: 'Game over', newBest: 'NEW BEST!', bestN: 'Best {n}', awayFromBest: '{d} away from your best ({b})',
      continueRun: 'Continue run', watchVideo: 'watch a short video', doubleShards: 'Double shards', doubled: 'Doubled ✓',
      playAgain: 'Play again', goalAfford: '{name} — you can afford it now!', goalNeed: '{n} more shards to unlock {name}',
      tabSkins: 'Skins', tabBoosts: 'Boosts', tabStore: 'Store', equipped: 'Equipped', equip: 'Equip', starterPack: 'Starter Pack',
      shortOnShards: 'Short on shards? Grab a pack in the Store tab.', freeShards: 'Free shards', watchFor: 'Watch a short video for +{n}',
      watch: '▶ Watch', min: '{n} min', owned: 'OWNED', max: 'MAX', nShards: '{n} shards', testPurchases: 'Test mode: purchases are simulated and free.',
      settings: 'Settings', sound: 'Sound: {v}', vibration: 'Vibration: {v}', stats: 'Usage statistics: {v}', on: 'On', off: 'Off',
      language: 'Language: English', restore: 'Restore purchases', adPrivacy: 'Ad privacy options', policy: 'Privacy policy', done: 'Done',
      ad: 'Ad', adTest: 'Test mode: no real ad is shown.', wait: 'Please wait…', claim: 'Claim reward', close: 'Close ✕', skip: 'Skip (no reward)',
      adRewarded: 'Rewarded video (simulated)', adPopup: 'Pop-up ad (simulated)',
      tNextGift: 'Next gift in about {n}h', tGift: 'Day {d} gift: +{n} shards', tWatchContinue: 'Watch the full video to continue',
      tWatchBonus: 'Watch the full video for the bonus', tThanks: 'Thank you! 💛', tFailed: 'Purchase did not go through',
      tUnlocked: '{name} unlocked', tNeed: 'Need {n} more shards', tPoor: 'Not enough shards', tFreeSoon: 'Next free video soon',
      tFree: '+{n} shards', tRestored: 'Purchases restored', tNothing: 'Nothing to restore', tTamper: 'Save data was modified — progress reset',
      tRecovered: 'Purchase recovered: +{n} shards',
      tut1: 'Tap when the orb is inside the glow', tutStep: '{i} / {n}', tutEarly: 'Too early!', tutLate: 'Missed — wait for it to come back',
      tutDone: 'Nice! Hit the white center for combos',
      redHint: 'RED = don’t tap! Let the orb pass', dodged: 'DODGED', redFail: 'You tapped the red zone!', perfect: 'PERFECT', fever: 'FEVER ×{n}', nPerfect: '{n} perfect',
      consentTitle: 'Help improve Pulse?', consentBody: 'Share anonymous gameplay stats (no name, no contacts). You can change this anytime in Settings.',
      consentYes: 'Allow', consentNo: 'No thanks',
      'skin.cyan': 'Neon', 'skin.coral': 'Ember', 'skin.lime': 'Acid', 'skin.violet': 'Nebula', 'skin.gold': 'Midas',
      'skin.prism': 'Prism', 'skin.aurora': 'Aurora', 'skin.nova': 'Supernova', skinSuffix: '{name} skin',
      'up.boost': 'Shard Boost', 'up.boost.d': 'Earn more shards every run',
      'up.wide': 'Wide Target', 'up.wide.d': 'A bigger landing zone',
      'up.shield': 'Second Chance', 'up.shield.d': 'Start each run with shields',
      'p.starter_pack': 'Starter Pack', 'p.starter_pack.d': '3,000 shards + Supernova skin + a free shield level',
      'p.remove_ads': 'Remove Ads', 'p.remove_ads.d': 'No more pop-up ads. Optional reward videos stay.',
      'p.double_shards': 'Double Shards', 'p.double_shards.d': 'Earn 2× shards in every run, forever',
      'p.skin_prism': 'Prism Skin', 'p.skin_prism.d': 'Animated rainbow orb and trail',
      'p.skin_aurora': 'Aurora Skin', 'p.skin_aurora.d': 'Shimmering northern-lights orb',
      'p.shards_s': 'Pouch of Shards', 'p.shards_m': 'Chest of Shards', 'p.shards_l': 'Vault of Shards',
      bestValue: 'BEST VALUE'
    },
    fr: {
      tag: 'tape au rythme de l’anneau', best: 'RECORD', play: 'JOUER', shop: 'Boutique', daily: 'Cadeau', menu: 'Menu',
      gameOver: 'Partie terminée', newBest: 'NOUVEAU RECORD !', bestN: 'Record {n}', awayFromBest: 'À {d} de ton record ({b})',
      continueRun: 'Continuer la partie', watchVideo: 'regarde une courte vidéo', doubleShards: 'Doubler les cristaux', doubled: 'Doublé ✓',
      playAgain: 'Rejouer', goalAfford: '{name} : tu peux te l’offrir !', goalNeed: 'Encore {n} cristaux pour débloquer {name}',
      tabSkins: 'Skins', tabBoosts: 'Bonus', tabStore: 'Packs', equipped: 'Équipé', equip: 'Équiper', starterPack: 'Pack de départ',
      shortOnShards: 'Pas assez de cristaux ? Prends un pack dans l’onglet Packs.', freeShards: 'Cristaux gratuits', watchFor: 'Regarde une courte vidéo : +{n}',
      watch: '▶ Voir', min: '{n} min', owned: 'ACHETÉ', max: 'MAX', nShards: '{n} cristaux', testPurchases: 'Mode test : achats simulés et gratuits.',
      settings: 'Réglages', sound: 'Son : {v}', vibration: 'Vibrations : {v}', stats: 'Statistiques d’usage : {v}', on: 'Oui', off: 'Non',
      language: 'Langue : Français', restore: 'Restaurer les achats', adPrivacy: 'Confidentialité des pubs', policy: 'Politique de confidentialité', done: 'OK',
      ad: 'Pub', adTest: 'Mode test : aucune vraie pub n’est affichée.', wait: 'Patiente…', claim: 'Récupérer', close: 'Fermer ✕', skip: 'Passer (sans récompense)',
      adRewarded: 'Vidéo récompensée (simulée)', adPopup: 'Pub (simulée)',
      tNextGift: 'Prochain cadeau dans environ {n} h', tGift: 'Cadeau jour {d} : +{n} cristaux', tWatchContinue: 'Regarde la vidéo en entier pour continuer',
      tWatchBonus: 'Regarde la vidéo en entier pour le bonus', tThanks: 'Merci ! 💛', tFailed: 'L’achat n’a pas abouti',
      tUnlocked: '{name} débloqué', tNeed: 'Il manque {n} cristaux', tPoor: 'Pas assez de cristaux', tFreeSoon: 'Prochaine vidéo gratuite bientôt',
      tFree: '+{n} cristaux', tRestored: 'Achats restaurés', tNothing: 'Rien à restaurer', tTamper: 'Sauvegarde modifiée : progression réinitialisée',
      tRecovered: 'Achat récupéré : +{n} cristaux',
      tut1: 'Tape quand la bille est dans la zone lumineuse', tutStep: '{i} / {n}', tutEarly: 'Trop tôt !', tutLate: 'Raté : attends qu’elle repasse',
      tutDone: 'Bravo ! Vise le centre blanc pour enchaîner les combos',
      redHint: 'ROUGE = ne tape pas ! Laisse passer la bille', dodged: 'ÉVITÉ', redFail: 'Tu as tapé dans le rouge !', perfect: 'PARFAIT', fever: 'FIÈVRE ×{n}', nPerfect: '{n} parfaits',
      consentTitle: 'Aider à améliorer Pulse ?', consentBody: 'Partager des statistiques de jeu anonymes (ni nom, ni contacts). Modifiable à tout moment dans Réglages.',
      consentYes: 'Accepter', consentNo: 'Non merci',
      'skin.cyan': 'Néon', 'skin.coral': 'Braise', 'skin.lime': 'Acide', 'skin.violet': 'Nébuleuse', 'skin.gold': 'Midas',
      'skin.prism': 'Prisme', 'skin.aurora': 'Aurore', 'skin.nova': 'Supernova', skinSuffix: 'skin {name}',
      'up.boost': 'Boost de cristaux', 'up.boost.d': 'Gagne plus de cristaux à chaque partie',
      'up.wide': 'Cible large', 'up.wide.d': 'Une zone de frappe plus grande',
      'up.shield': 'Seconde chance', 'up.shield.d': 'Commence chaque partie avec des boucliers',
      'p.starter_pack': 'Pack de départ', 'p.starter_pack.d': '3 000 cristaux + skin Supernova + 1 niveau de bouclier',
      'p.remove_ads': 'Sans pubs', 'p.remove_ads.d': 'Plus de pubs imposées. Les vidéos bonus restent au choix.',
      'p.double_shards': 'Cristaux ×2', 'p.double_shards.d': 'Gagne 2× plus de cristaux, pour toujours',
      'p.skin_prism': 'Skin Prisme', 'p.skin_prism.d': 'Bille et traînée arc-en-ciel animées',
      'p.skin_aurora': 'Skin Aurore', 'p.skin_aurora.d': 'Bille aux reflets d’aurore boréale',
      'p.shards_s': 'Bourse de cristaux', 'p.shards_m': 'Coffre de cristaux', 'p.shards_l': 'Trésor de cristaux',
      bestValue: 'MEILLEURE OFFRE'
    }
  };
  const LANGS = Object.keys(D);
  let lang = 'en';

  function detect() {
    const saved = PState.get().lang;
    if (saved && D[saved]) return saved;
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    return nav.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  }
  function t(key, vars) {
    let s = (D[lang] && D[lang][key]) || D.en[key] || key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ''));
    return s;
  }
  const num = n => Number(n).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US');
  function apply() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  }
  function set(l) { if (D[l]) { lang = l; PState.get().lang = l; PState.save(); apply(); } }
  function next() { set(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]); }

  lang = detect();
  return { t, num, apply, set, next, get lang() { return lang; } };
})();
