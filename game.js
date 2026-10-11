// ==========================================
// Number Safari - 1st Grade Math Adventure!
// ==========================================

// Global Game State
const state = {
  mode: 'home',          // 'home', 'abacus', 'baseTen', 'numberNames', 'ordinal', 'backward10', 'beforeAfter', 'countMoney', 'coins', 'compare', 'alligator', 'bonds', 'learn', 'train', 'balloons'
  activeCategory: 'all',
  difficulty: 'easy',     // 'easy', 'medium', 'hard'
  orderType: 'asc',       // 'asc', 'desc', 'mix'
  currentRule: 'asc',     // active rule for current ordering round
  soundEnabled: true,
  voiceEnabled: true,
  stars: parseInt(localStorage.getItem('ns_stars') || '0', 10),
  streak: parseInt(localStorage.getItem('ns_streak') || '0', 10),
  toys: JSON.parse(localStorage.getItem('ns_toys') || '[]'),

  // Ordering mode state
  currentNumbers: [],
  targetOrder: [],
  stepIndex: 0,
  isLocked: false,

  // Module state
  abacusData: null,
  ordinalData: null,
  seqData: null,
  baData: null,
  namesData: null,
  baseTenData: null,
  countMoneyData: null,
  currentToy: null,
  coinsPaid: [],
  compareData: null,
  alligatorData: null,
  bondsData: null
};

// Master List of 14 Math Games for Home Dashboard
const GAMES_LIST = [
  {
    id: 'abacus',
    title: 'Abacus Beads',
    icon: '🧮',
    cat: 'place-value',
    catName: 'Place Value',
    desc: 'Slide tens and ones beads on rods to make target numbers up to 100!'
  },
  {
    id: 'baseTen',
    title: 'Tens & Ones Blocks',
    icon: '🧱',
    cat: 'place-value',
    catName: 'Place Value',
    desc: 'Count 10-rod towers and 1-unit cubes to figure out the secret number!'
  },
  {
    id: 'numberNames',
    title: 'Write Number Names',
    icon: '🔤',
    cat: 'place-value',
    catName: 'Spelling',
    desc: 'Tap letter blocks in order to spell number words: One, Five, Ten, Twenty!'
  },
  {
    id: 'ordinal',
    title: 'Color Ordinal Numbers',
    icon: '🎨',
    cat: 'ordinal',
    catName: 'Ordinal Positions',
    desc: 'Pick your color and paint the 3rd cart, 7th bike, or 1st car in the lineup!'
  },
  {
    id: 'backward10',
    title: 'Backward in 10s',
    icon: '⏪',
    cat: 'counting',
    catName: 'Skip Counting',
    desc: 'Rocket countdown! Blast backwards in tens: 100, 90, 80, 70 down to zero!'
  },
  {
    id: 'beforeAfter',
    title: 'Before, Between & After',
    icon: '🎯',
    cat: 'counting',
    catName: 'Number Sense',
    desc: 'Look at neighboring numbers and fill in the missing stepping stone!'
  },
  {
    id: 'learn',
    title: 'Ascending & Descending Ladder',
    icon: '🪜',
    cat: 'counting',
    catName: 'Order Concept',
    desc: 'Watch the safari explorer climb UP (Small to Big) and slide DOWN (Big to Small)!'
  },
  {
    id: 'train',
    title: 'Train Express Order',
    icon: '🚂',
    cat: 'counting',
    catName: 'Sequencing',
    desc: 'Load number cargo crates onto train wagons in ascending or descending order!'
  },
  {
    id: 'balloons',
    title: 'Balloon Pop Arcade',
    icon: '🎈',
    cat: 'counting',
    catName: 'Fun Arcade',
    desc: 'Pop floating colorful balloons from lowest to highest or highest to lowest!'
  },
  {
    id: 'countMoney',
    title: 'Count Pakistani Money',
    icon: '💵',
    cat: 'money',
    catName: 'PKR Currency',
    desc: 'Count Pakistani Rupees! Tap Rs 1, Rs 2, Rs 5 coins & Rs 10, Rs 20 currency notes!'
  },
  {
    id: 'coins',
    title: 'PKR Toy Shop',
    icon: '🪙',
    cat: 'money',
    catName: 'Toy Shopping',
    desc: 'Pay with authentic Pakistani rupee coins to buy toys and fill your backpack!'
  },
  {
    id: 'compare',
    title: 'How Many Less / More?',
    icon: '⚖️',
    cat: 'compare',
    catName: 'Comparison',
    desc: 'Compare two plates of fruit and count exactly how many more or less there are!'
  },
  {
    id: 'alligator',
    title: 'Hungry Alligator',
    icon: '🐊',
    cat: 'compare',
    catName: 'Greater / Less Than',
    desc: 'The greedy crocodile always chomps the bigger meal! Pick >, <, or =.'
  },
  {
    id: 'bonds',
    title: 'Ten Frame Bonds',
    icon: '🧩',
    cat: 'compare',
    catName: 'Number Bonds',
    desc: 'Fill the ten frame grid with dots to find the magic partner that makes 10!'
  }
];

// ==========================================
// Sound Synthesis Engine (Web Audio API)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPop() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(850, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  playChime(stepNumber = 1) {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25];
    const freq = notes[Math.min(stepNumber - 1, notes.length - 1)] || 392;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playCoinClink() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [2200, 3100].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + (i * 200), now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    });
  }

  playChomp() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playBoing() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playFanfare() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    arpeggio.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = this.ctx.currentTime + (idx * 0.08);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 0.4);
    });
  }

  playTrainWhistle() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [466.16, 587.33].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.setValueAtTime(0.12, now + 0.25);
      gain.gain.linearRampToValueAtTime(0, now + 0.35);

      gain.gain.linearRampToValueAtTime(0.15, now + 0.42);
      gain.gain.setValueAtTime(0.15, now + 0.7);
      gain.gain.linearRampToValueAtTime(0, now + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.9);
    });
  }
}

const sfx = new SoundFX();

// ==========================================
// Web Speech API Voice Narrator
// ==========================================
function speak(text, rate = 1.0) {
  if (!state.voiceEnabled || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1.25; // cheerful high pitch for kids
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech synthesis error:", e);
  }
}

// ==========================================
// Confetti Cannon Particles
// ==========================================
class ConfettiCannon {
  constructor() {
    this.canvas = document.getElementById('confettiCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animating = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(count = 70) {
    const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FBBF24'];
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2.5;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 9;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 7 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        life: 1.0,
        decay: 0.012 + Math.random() * 0.01
      });
    }

    if (!this.animating) {
      this.animating = true;
      this.loop();
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22;
      p.rotation += p.vRot;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.loop());
    } else {
      this.animating = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

const confetti = new ConfettiCannon();

// ==========================================
// Helpers & State Persistence
// ==========================================
function updateStatsUI() {
  document.getElementById('starCount').textContent = state.stars;
  document.getElementById('streakCount').textContent = state.streak;
  document.getElementById('toyCount').textContent = state.toys.length;
  document.getElementById('backpackCount').textContent = state.toys.length;

  const homeStarEl = document.getElementById('homeStarTotal');
  if (homeStarEl) homeStarEl.textContent = `${state.stars} Stars`;

  localStorage.setItem('ns_stars', state.stars);
  localStorage.setItem('ns_streak', state.streak);
  localStorage.setItem('ns_toys', JSON.stringify(state.toys));

  renderBackpackShelf();
}

function renderBackpackShelf() {
  const shelf = document.getElementById('backpackShelf');
  if (!shelf) return;
  shelf.innerHTML = '';

  if (state.toys.length === 0) {
    shelf.innerHTML = '<span class="no-toys-hint">Buy toys to fill your backpack!</span>';
    return;
  }

  state.toys.forEach(toy => {
    const item = document.createElement('span');
    item.className = 'shelf-toy-item';
    item.textContent = toy.icon;
    item.title = toy.name;
    shelf.appendChild(item);
  });
}

function updateMissionBanner() {
  const banner = document.getElementById('missionBanner');
  const icon = document.getElementById('missionIcon');
  const title = document.getElementById('missionTitle');
  const desc = document.getElementById('missionDesc');
  const orderGroup = document.getElementById('orderGroup');
  const toolbar = document.querySelector('.game-toolbar');

  if (state.mode === 'home') {
    if (toolbar) toolbar.style.display = 'none';
    orderGroup.style.display = 'none';
    banner.className = 'mission-banner';
    banner.style.background = 'linear-gradient(135deg, #4F46E5, #7C3AED)';
    icon.textContent = '🌟';
    title.innerHTML = 'Welcome to Number Safari! 🚀';
    desc.innerHTML = 'Choose any math game card below to start playing!';
    return;
  }

  if (toolbar) toolbar.style.display = 'flex';

  // Ordering modes show the Asc/Desc toolbar selector
  if (['learn', 'train', 'balloons'].includes(state.mode)) {
    orderGroup.style.display = 'flex';
    if (state.currentRule === 'asc') {
      banner.className = 'mission-banner';
      icon.textContent = '🚀';
      title.innerHTML = 'Ascending Order: Going UP! 🧗‍♂️';
      desc.innerHTML = 'Arrange from <strong>SMALLEST</strong> to <strong>BIGGEST</strong> (Low ➔ High)';
    } else {
      banner.className = 'mission-banner descending';
      icon.textContent = '🛝';
      title.innerHTML = 'Descending Order: Going DOWN! 🪂';
      desc.innerHTML = 'Arrange from <strong>BIGGEST</strong> to <strong>SMALLEST</strong> (High ➔ Low)';
    }
  } else if (state.mode === 'abacus') {
    orderGroup.style.display = 'none';
    banner.className = 'mission-banner';
    banner.style.background = 'linear-gradient(135deg, #78350F, #B45309)';
    icon.textContent = '🧮';
    title.innerHTML = 'Abacus Beads: Tens and Ones! 🧮';
    desc.innerHTML = 'Add red beads on Tens and blue beads on Ones to match the target!';
  } else if (state.mode === 'baseTen') {
    orderGroup.style.display = 'none';
    banner.className = 'mission-banner';
    banner.style.background = 'linear-gradient(135deg, #EA580C, #C2410C)';
    icon.textContent = '🧱';
    title.innerHTML = 'Tens & Ones Blocks (Base-10)! 🧱';
    desc.innerHTML = 'Count the tall 10-rods and unit 1-cubes to find the total!';
  } else if (state.mode === 'numberNames') {
    orderGroup.style.display = 'none';
    banner.className = 'mission-banner';
    banner.style.background = 'linear-gradient(135deg, #0284C7, #0369A1)';
    icon.textContent = '🔤';
    title.innerHTML = 'Write Number Names (Spellings)! 🔤';
    desc.innerHTML = 'Tap the letter blocks in order to spell the word for the number!';
  } else if (state.mode === 'ordinal') {
    orderGroup.style.display = 'none';
    banner.className = 'mission-banner';
    banner.style.background = 'linear-gradient(135deg, #F59E0B, #D97706)';
    icon.textContent = '🎨';
    title.innerHTML = 'Color the Ordinal Numbers (1st, 2nd, 3rd...) 🥇';
    desc.innerHTML = 'Follow the instruction to paint the correct position!';
  } else if (state.mode === 'backward10') {
    orderGroup.style.display = 'none';
    banner.className = 'mission-banner';
    banner.style.background = 'linear-gradient(135deg, #10B981, #047857)';
    icon.textContent = '⏪';
    title.innerHTML = 'Backward Counting in 10s & Sequences! 🚀';
    desc.innerHTML = 'Rocket countdown: count backwards in tens to complete the sequence!';
  } else if (state.mode === 'beforeAfter') {
    orderGroup.style.display = 'none';
    banner.className = 'mission-banner';
    banner.style.background = 'linear-gradient(135deg, #8B5CF6, #7C3AED)';
    icon.textContent = '🎯';
    title.innerHTML = 'What Comes Before, Between & After? 🎯';
    desc.innerHTML = 'Use number sense to find the missing neighbor number!';
  } else if (state.mode === 'countMoney') {
    orderGroup.style.display = 'none';
    banner.className = 'mission-banner';
    banner.style.background = 'linear-gradient(135deg, #059669, #065F46)';
    icon.textContent = '💵';
    title.innerHTML = 'Count the Money (Pakistani Rupees ₨)! 💰';
    desc.innerHTML = 'Tap coins & notes to tally up the total amount on the table!';
  } else if (state.mode === 'coins') {
    orderGroup.style.display = 'none';
    banner.className = 'mission-banner';
    banner.style.background = 'linear-gradient(135deg, #F59E0B, #D97706)';
    icon.textContent = '🪙';
    title.innerHTML = 'PKR Toy Shop: Rupees & Coins! 🧸';
    desc.innerHTML = 'Count Pakistani Rupees (Rs 1, Rs 2, Rs 5, Rs 10, Rs 20) to buy toys!';
  } else if (state.mode === 'compare') {
    orderGroup.style.display = 'none';
    banner.className = 'mission-banner';
    banner.style.background = 'linear-gradient(135deg, #6366F1, #4338CA)';
    icon.textContent = '⚖️';
    title.innerHTML = 'How Many More / How Many Less? 🍎';
    desc.innerHTML = 'Compare the two groups and find the difference!';
  } else if (state.mode === 'alligator') {
    orderGroup.style.display = 'none';
    banner.className = 'mission-banner';
    banner.style.background = 'linear-gradient(135deg, #10B981, #047857)';
    icon.textContent = '🐊';
    title.innerHTML = 'Hungry Alligator: Greater & Less Than! 🐊';
    desc.innerHTML = 'The alligator always chomps the <strong>BIGGER</strong> number! Use &gt;, &lt;, or =';
  } else if (state.mode === 'bonds') {
    orderGroup.style.display = 'none';
    banner.className = 'mission-banner';
    banner.style.background = 'linear-gradient(135deg, #EC4899, #BE185D)';
    icon.textContent = '🧩';
    title.innerHTML = 'Ten Frame Bonds: Make 10! 🎯';
    desc.innerHTML = 'Find how many dots are missing to complete the Ten Frame!';
  }
}

// ==========================================
// Home Dashboard Cards & Mode Switching
// ==========================================
function renderHomeCards() {
  const grid = document.getElementById('homeGamesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = GAMES_LIST.filter(g => {
    return state.activeCategory === 'all' || g.cat === state.activeCategory;
  });

  filtered.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.mode = game.id;
    card.innerHTML = `
      <div class="game-card-header">
        <span class="game-card-icon">${game.icon}</span>
        <span class="game-card-tag cat-${game.cat}">${game.catName}</span>
      </div>
      <div class="game-card-body">
        <h3>${game.title}</h3>
        <p>${game.desc}</p>
      </div>
      <div class="game-card-footer">
        <button class="game-card-btn" tabindex="-1">
          <span>Play Now</span>
          <span>➔</span>
        </button>
      </div>
    `;

    card.addEventListener('click', () => {
      sfx.playFanfare();
      speak(`Starting ${game.title}! Let's have fun!`);
      switchToMode(game.id);
    });

    grid.appendChild(card);
  });
}

function switchToMode(modeId) {
  state.mode = modeId;
  document.querySelectorAll('.nav-btn').forEach(b => {
    const isActive = b.dataset.mode === modeId;
    b.classList.toggle('active', isActive);
    if (isActive) {
      b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });
  document.querySelectorAll('.game-view').forEach(v => v.classList.remove('active'));

  const viewId = `mode${modeId.charAt(0).toUpperCase() + modeId.slice(1)}`;
  const view = document.getElementById(viewId);
  if (view) view.classList.add('active');

  startNewRound();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// Master Round Controller
// ==========================================
function startNewRound() {
  state.isLocked = false;
  state.stepIndex = 0;

  if (state.orderType === 'mix') {
    state.currentRule = Math.random() > 0.5 ? 'asc' : 'desc';
  } else {
    state.currentRule = state.orderType;
  }

  updateMissionBanner();

  if (state.mode === 'home') {
    renderHomeCards();
    return;
  }

  if (state.mode === 'abacus') setupAbacusRound();
  else if (state.mode === 'ordinal') setupOrdinalRound();
  else if (state.mode === 'backward10') setupBackward10Round();
  else if (state.mode === 'beforeAfter') setupBeforeAfterRound();
  else if (state.mode === 'numberNames') setupNumberNamesRound();
  else if (state.mode === 'baseTen') setupBaseTenRound();
  else if (state.mode === 'countMoney') setupCountMoneyRound();
  else if (state.mode === 'learn') renderLearnMode();
  else if (state.mode === 'train') renderTrainMode();
  else if (state.mode === 'balloons') renderBalloonsMode();
  else if (state.mode === 'coins') setupCoinsRound();
  else if (state.mode === 'compare') setupCompareRound();
  else if (state.mode === 'alligator') setupAlligatorRound();
  else if (state.mode === 'bonds') setupBondsRound();
}

// ==========================================
// 1. ABACUS BEADS
// ==========================================
function setupAbacusRound() {
  let min = 11, max = 49;
  if (state.difficulty === 'medium') { min = 20; max = 79; }
  else if (state.difficulty === 'hard') { min = 20; max = 99; }

  const target = Math.floor(Math.random() * (max - min + 1)) + min;
  const targetTens = Math.floor(target / 10);
  const targetOnes = target % 10;

  state.abacusData = {
    target,
    targetTens,
    targetOnes,
    tens: 0,
    ones: 0
  };

  document.getElementById('abacusTargetNum').textContent = target;
  document.getElementById('abacusTargetSub').textContent = `${targetTens} Tens and ${targetOnes} Ones`;

  updateAbacusDisplay();
  speak(`Show ${target} on the abacus! Put ${targetTens} beads on Tens, and ${targetOnes} beads on Ones!`);
}

function updateAbacusDisplay() {
  const stackTens = document.getElementById('stackTens');
  const stackOnes = document.getElementById('stackOnes');
  const countTensTag = document.getElementById('countTensTag');
  const countOnesTag = document.getElementById('countOnesTag');
  const totalTag = document.getElementById('abacusLiveTotal');

  stackTens.innerHTML = '';
  stackOnes.innerHTML = '';

  for (let i = 0; i < state.abacusData.tens; i++) {
    const bead = document.createElement('div');
    bead.className = 'abacus-bead bead-tens';
    bead.title = 'Ten bead (10)';
    stackTens.appendChild(bead);
  }

  for (let i = 0; i < state.abacusData.ones; i++) {
    const bead = document.createElement('div');
    bead.className = 'abacus-bead bead-ones';
    bead.title = 'One bead (1)';
    stackOnes.appendChild(bead);
  }

  countTensTag.textContent = `${state.abacusData.tens} Tens (${state.abacusData.tens * 10})`;
  countOnesTag.textContent = `${state.abacusData.ones} Ones (${state.abacusData.ones})`;

  const currentTotal = (state.abacusData.tens * 10) + state.abacusData.ones;
  totalTag.textContent = `Current Total on Abacus: ${currentTotal}`;
}

function addAbacusBead(rod) {
  if (rod === 'tens' && state.abacusData.tens < 9) {
    sfx.playPop();
    state.abacusData.tens++;
    updateAbacusDisplay();
    speak(`${state.abacusData.tens * 10}`);
  } else if (rod === 'ones' && state.abacusData.ones < 9) {
    sfx.playPop();
    state.abacusData.ones++;
    updateAbacusDisplay();
    speak(`${state.abacusData.ones}`);
  }
}

function removeAbacusBead(rod) {
  if (rod === 'tens' && state.abacusData.tens > 0) {
    sfx.playBoing();
    state.abacusData.tens--;
    updateAbacusDisplay();
  } else if (rod === 'ones' && state.abacusData.ones > 0) {
    sfx.playBoing();
    state.abacusData.ones--;
    updateAbacusDisplay();
  }
}

function checkAbacusAnswer() {
  const { target, targetTens, targetOnes, tens, ones } = state.abacusData;
  const currentTotal = (tens * 10) + ones;

  if (tens === targetTens && ones === targetOnes) {
    sfx.playFanfare();
    confetti.burst(80);
    state.stars += 3;
    state.streak += 1;
    updateStatsUI();

    speak(`Brilliant! ${tens} tens and ${ones} ones make ${target}!`);
    setTimeout(() => {
      openCelebrationModal(`You built <strong>${target}</strong> perfectly on the Abacus! (${tens} Tens + ${ones} Ones) ⭐⭐⭐`);
    }, 900);
  } else {
    sfx.playBoing();
    speak(`You have ${currentTotal}. We need ${target}! Put ${targetTens} beads on Tens and ${targetOnes} on Ones!`);
  }
}

// ==========================================
// 2. COLOR ORDINAL NUMBERS (1st, 2nd, 3rd...)
// ==========================================
const ORDINAL_LABELS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
const ORDINAL_WORDS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
const ORDINAL_VEHICLES = [
  { icon: '🚲', name: 'Bicycle' },
  { icon: '🚗', name: 'Car' },
  { icon: '🛒', name: 'Cart' },
  { icon: '🚀', name: 'Rocket' },
  { icon: '🐶', name: 'Puppy' },
  { icon: '🍦', name: 'Ice Cream' },
  { icon: '🎈', name: 'Balloon' }
];
const ORDINAL_COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' }
];

function setupOrdinalRound() {
  const item = ORDINAL_VEHICLES[Math.floor(Math.random() * ORDINAL_VEHICLES.length)];
  const maxItems = state.difficulty === 'easy' ? 7 : 10;
  const targetIndex = Math.floor(Math.random() * maxItems); // 0-based
  const color = ORDINAL_COLORS[Math.floor(Math.random() * ORDINAL_COLORS.length)];

  state.ordinalData = {
    item,
    totalItems: maxItems,
    targetIndex, // e.g. 6 (which is 7th)
    targetLabel: ORDINAL_LABELS[targetIndex],
    targetWord: ORDINAL_WORDS[targetIndex],
    color,
    currentColor: color.hex
  };

  const promptText = `Color the ${ORDINAL_LABELS[targetIndex]} ${item.name} ${item.icon} with ${color.name} paint!`;
  document.getElementById('ordinalPrompt').innerHTML = `Color the <strong>${ORDINAL_LABELS[targetIndex]} ${item.name} ${item.icon}</strong> with <strong>${color.name}</strong>!`;

  // Select matching paint swatch
  document.querySelectorAll('.paint-swatch').forEach(swatch => {
    swatch.classList.toggle('active', swatch.dataset.color === color.hex);
  });

  // Render track of items
  const track = document.getElementById('ordinalTrack');
  track.innerHTML = '';

  for (let i = 0; i < maxItems; i++) {
    const card = document.createElement('div');
    card.className = 'ordinal-item-card';
    card.dataset.index = i;
    card.innerHTML = `
      <span class="ordinal-item-icon">${item.icon}</span>
      <span class="ordinal-badge">${ORDINAL_LABELS[i]}</span>
    `;

    card.addEventListener('click', () => handleOrdinalClick(i, card));
    track.appendChild(card);
  }

  speak(`Color the ${ORDINAL_WORDS[targetIndex]} ${item.name} with ${color.name} paint! Count: first, second, third...`);
}

function handleOrdinalClick(clickedIndex, cardEl) {
  const { targetIndex, item, color, targetLabel } = state.ordinalData;

  // Paint the card
  cardEl.classList.add('painted');
  cardEl.style.borderColor = state.ordinalData.currentColor;
  cardEl.style.background = `${state.ordinalData.currentColor}22`;

  if (clickedIndex === targetIndex) {
    sfx.playFanfare();
    confetti.burst(75);
    state.stars += 3;
    state.streak += 1;
    updateStatsUI();

    speak(`Hooray! That is the ${targetLabel} ${item.name}! Perfect!`);
    setTimeout(() => {
      openCelebrationModal(`You found and painted the <strong>${targetLabel} ${item.name}</strong> with ${color.name} paint! 🎨✨`);
    }, 1000);
  } else {
    sfx.playBoing();
    const clickedLabel = ORDINAL_LABELS[clickedIndex];
    speak(`That is the ${clickedLabel} ${item.name}! Count along to find the ${targetLabel} one!`);
  }
}

// ==========================================
// 3. BACKWARD IN 10s & COMPLETE SEQUENCE
// ==========================================
function setupBackward10Round() {
  const stage = document.getElementById('seqTrackStage');
  const choices = document.getElementById('seqChoices');
  stage.innerHTML = '';
  choices.innerHTML = '';

  const isBackwardTen = Math.random() < 0.65; // 65% backward in 10s as requested
  let sequence = [];
  let title = '';
  let desc = '';

  if (isBackwardTen) {
    title = 'Backward Counting in 10s: Rocket Countdown! 🚀';
    desc = '100, 90, 80, 70... What comes next in the countdown?';

    // e.g. start at 100, 90, 80, 70
    const starts = [100, 90, 80, 70];
    const start = starts[Math.floor(Math.random() * starts.length)];
    sequence = [start, start - 10, start - 20, start - 30, start - 40];
  } else {
    title = 'Complete the Sequence Pattern! 🧩';
    // Skip counting by 5s or 2s
    const step = Math.random() > 0.5 ? 5 : 2;
    const start = step === 5 ? (Math.floor(Math.random() * 5) + 1) * 5 : (Math.floor(Math.random() * 5) + 1) * 2;
    desc = `Skip counting by ${step}s! Find the missing number!`;
    sequence = [start, start + step, start + (step * 2), start + (step * 3), start + (step * 4)];
  }

  document.getElementById('seqQuestionTitle').textContent = title;
  document.getElementById('seqQuestionDesc').textContent = desc;

  // Pick a missing index (1, 2, or 3)
  const missingIdx = Math.floor(Math.random() * 3) + 1;
  const missingVal = sequence[missingIdx];

  state.seqData = { sequence, missingIdx, missingVal };

  // Render stones with arrows
  sequence.forEach((val, idx) => {
    if (idx > 0) {
      const arrow = document.createElement('span');
      arrow.className = 'seq-arrow';
      arrow.textContent = '➔';
      stage.appendChild(arrow);
    }

    const stone = document.createElement('div');
    if (idx === missingIdx) {
      stone.className = 'seq-stone missing';
      stone.id = 'missingStoneSlot';
      stone.textContent = '?';
    } else {
      stone.className = 'seq-stone';
      stone.textContent = val;
    }
    stage.appendChild(stone);
  });

  // Choices
  const answerSet = new Set([missingVal]);
  while (answerSet.size < 4) {
    const offset = (Math.floor(Math.random() * 5) - 2) * (isBackwardTen ? 10 : 2);
    const candidate = missingVal + offset;
    if (candidate > 0 && candidate !== missingVal) answerSet.add(candidate);
  }

  const shuffled = Array.from(answerSet).sort(() => Math.random() - 0.5);

  shuffled.forEach(ans => {
    const btn = document.createElement('button');
    btn.className = 'choice-chip';
    btn.textContent = ans;

    btn.addEventListener('click', () => {
      if (ans === missingVal) {
        sfx.playFanfare();
        confetti.burst(65);
        state.stars += 3;
        state.streak += 1;
        updateStatsUI();

        const slot = document.getElementById('missingStoneSlot');
        if (slot) {
          slot.className = 'seq-stone filled';
          slot.textContent = missingVal;
        }

        speak(`Correct! ${missingVal} completes the sequence!`);
        setTimeout(() => {
          openCelebrationModal(`Awesome sequence solving! The missing number was <strong>${missingVal}</strong>! 🚀⭐`);
        }, 1000);
      } else {
        sfx.playBoing();
        btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 450);
        speak(`Look at the pattern! Count along step by step!`);
      }
    });

    choices.appendChild(btn);
  });

  speak(desc);
}

// ==========================================
// 4. NUMBER BEFORE, BETWEEN, AFTER
// ==========================================
function setupBeforeAfterRound() {
  const choicesContainer = document.getElementById('baChoices');
  const seqContainer = document.getElementById('baVisualSequence');
  const nlContainer = document.getElementById('baNumberLine');

  choicesContainer.innerHTML = '';
  seqContainer.innerHTML = '';
  nlContainer.innerHTML = '';

  let max = 30;
  if (state.difficulty === 'medium') max = 60;
  else if (state.difficulty === 'hard') max = 99;

  const types = ['before', 'after', 'between'];
  const type = types[Math.floor(Math.random() * types.length)];

  let target = Math.floor(Math.random() * (max - 10)) + 5;
  let answer = target;
  let title = '';

  if (type === 'before') {
    answer = target - 1;
    title = `What number comes BEFORE ${target}?`;
    seqContainer.innerHTML = `
      <div class="ba-slot target">?</div>
      <div class="ba-slot">${target}</div>
    `;
    speak(`What number comes before ${target}?`);
  } else if (type === 'after') {
    answer = target + 1;
    title = `What number comes AFTER ${target}?`;
    seqContainer.innerHTML = `
      <div class="ba-slot">${target}</div>
      <div class="ba-slot target">?</div>
    `;
    speak(`What number comes after ${target}?`);
  } else {
    // between
    answer = target;
    title = `What number comes BETWEEN ${target - 1} and ${target + 1}?`;
    seqContainer.innerHTML = `
      <div class="ba-slot">${target - 1}</div>
      <div class="ba-slot target">?</div>
      <div class="ba-slot">${target + 1}</div>
    `;
    speak(`What number comes between ${target - 1} and ${target + 1}?`);
  }

  document.getElementById('baQuestionTitle').textContent = title;

  // Mini Number line snippet
  const startNl = Math.max(1, target - 3);
  for (let n = startNl; n <= startNl + 6; n++) {
    const chip = document.createElement('span');
    chip.className = `nl-chip ${n === target ? 'highlight' : ''}`;
    chip.textContent = n;
    nlContainer.appendChild(chip);
  }

  // Choices
  const answerSet = new Set([answer]);
  while (answerSet.size < 4) {
    const diff = Math.floor(Math.random() * 5) - 2;
    const cand = Math.max(1, answer + diff);
    answerSet.add(cand);
  }

  const shuffled = Array.from(answerSet).sort(() => Math.random() - 0.5);

  shuffled.forEach(ans => {
    const btn = document.createElement('button');
    btn.className = 'choice-chip';
    btn.textContent = ans;

    btn.addEventListener('click', () => {
      if (ans === answer) {
        sfx.playFanfare();
        confetti.burst(65);
        state.stars += 3;
        state.streak += 1;
        updateStatsUI();

        const slot = seqContainer.querySelector('.ba-slot.target');
        if (slot) {
          slot.className = 'ba-slot';
          slot.style.background = '#D1FAE5';
          slot.style.color = '#065F46';
          slot.textContent = answer;
        }

        speak(`Correct! ${answer} is the right number!`);
        setTimeout(() => {
          openCelebrationModal(`Great number sense! The answer is <strong>${answer}</strong>! 🎯⭐`);
        }, 1000);
      } else {
        sfx.playBoing();
        btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 450);
        speak(`Check the number line below for a hint!`);
      }
    });

    choicesContainer.appendChild(btn);
  });
}

// ==========================================
// 5. WRITE NUMBER NAMES
// ==========================================
const NUMBER_WORDS_MAP = {
  1: 'ONE', 2: 'TWO', 3: 'THREE', 4: 'FOUR', 5: 'FIVE',
  6: 'SIX', 7: 'SEVEN', 8: 'EIGHT', 9: 'NINE', 10: 'TEN',
  11: 'ELEVEN', 12: 'TWELVE', 13: 'THIRTEEN', 14: 'FOURTEEN', 15: 'FIFTEEN',
  16: 'SIXTEEN', 17: 'SEVENTEEN', 18: 'EIGHTEEN', 19: 'NINETEEN', 20: 'TWENTY',
  30: 'THIRTY', 40: 'FORTY', 50: 'FIFTY', 100: 'HUNDRED'
};

function setupNumberNamesRound() {
  const keys = Object.keys(NUMBER_WORDS_MAP).map(Number);
  const filtered = state.difficulty === 'easy' ? keys.filter(k => k <= 15) : keys;
  const num = filtered[Math.floor(Math.random() * filtered.length)];
  const word = NUMBER_WORDS_MAP[num];

  state.namesData = {
    num,
    word,
    typedLetters: []
  };

  document.getElementById('namesTargetNum').textContent = num;

  renderWordSlots();
  renderLetterBlocks();

  speak(`Write the number name for ${num}! Tap the letters to spell it!`);
}

function renderWordSlots() {
  const tray = document.getElementById('wordSlotsTray');
  tray.innerHTML = '';
  const { word, typedLetters } = state.namesData;

  for (let i = 0; i < word.length; i++) {
    const slot = document.createElement('div');
    slot.className = 'word-slot';
    if (i < typedLetters.length) {
      slot.classList.add('filled');
      slot.textContent = typedLetters[i];
    } else {
      slot.textContent = '_';
    }
    tray.appendChild(slot);
  }
}

function renderLetterBlocks() {
  const tray = document.getElementById('letterBlocksTray');
  tray.innerHTML = '';
  const { word } = state.namesData;

  const letters = word.split('').sort(() => Math.random() - 0.5);

  letters.forEach((char, idx) => {
    const chip = document.createElement('button');
    chip.className = 'letter-chip';
    chip.dataset.char = char;
    chip.dataset.idx = idx;
    chip.textContent = char;

    chip.addEventListener('click', () => {
      handleLetterClick(char, chip);
    });

    tray.appendChild(chip);
  });
}

function handleLetterClick(char, chipEl) {
  const { word, typedLetters } = state.namesData;
  const expectedChar = word[typedLetters.length];

  if (char === expectedChar) {
    sfx.playPop();
    typedLetters.push(char);
    chipEl.classList.add('used');
    renderWordSlots();

    speak(char);

    if (typedLetters.length === word.length) {
      sfx.playFanfare();
      confetti.burst(75);
      state.stars += 3;
      state.streak += 1;
      updateStatsUI();

      speak(`Super job! ${word}! You spelled it!`);
      setTimeout(() => {
        openCelebrationModal(`You spelled <strong>${word}</strong> for number <strong>${state.namesData.num}</strong>! 🔤⭐`);
      }, 1000);
    }
  } else {
    sfx.playBoing();
    chipEl.classList.add('shake');
    setTimeout(() => chipEl.classList.remove('shake'), 450);
    speak(`Look for letter ${expectedChar}!`);
  }
}

// ==========================================
// 6. TENS AND ONES (BASE-10 BLOCKS)
// ==========================================
function setupBaseTenRound() {
  let tens = Math.floor(Math.random() * 5) + 1;
  let ones = Math.floor(Math.random() * 8) + 1;

  if (state.difficulty === 'hard') {
    tens = Math.floor(Math.random() * 8) + 1;
  }

  const total = (tens * 10) + ones;
  state.baseTenData = { tens, ones, total };

  document.getElementById('baseTenTens').textContent = `${tens} Tens (${tens * 10})`;
  document.getElementById('baseTenOnes').textContent = `${ones} Ones (${ones})`;
  document.getElementById('baseTenTotal').textContent = '?';

  // Render Tens Rods
  const matTens = document.getElementById('matTensBlocks');
  matTens.innerHTML = '';
  for (let i = 0; i < tens; i++) {
    const rod = document.createElement('div');
    rod.className = 'ten-rod-graphic';
    rod.title = 'Ten Rod = 10';
    for (let s = 0; s < 9; s++) {
      const seg = document.createElement('div');
      seg.className = 'rod-segment';
      rod.appendChild(seg);
    }
    matTens.appendChild(rod);
  }

  // Render Ones Cubes
  const matOnes = document.getElementById('matOnesBlocks');
  matOnes.innerHTML = '';
  for (let i = 0; i < ones; i++) {
    const cube = document.createElement('div');
    cube.className = 'one-cube-graphic';
    cube.title = 'One Cube = 1';
    matOnes.appendChild(cube);
  }

  // Choices
  const choicesContainer = document.getElementById('baseTenChoices');
  choicesContainer.innerHTML = '';

  const answerSet = new Set([total]);
  while (answerSet.size < 4) {
    const offset = (Math.floor(Math.random() * 5) - 2) * 5;
    const cand = total + offset;
    if (cand > 0 && cand !== total) answerSet.add(cand);
  }

  const shuffled = Array.from(answerSet).sort(() => Math.random() - 0.5);

  shuffled.forEach(ans => {
    const btn = document.createElement('button');
    btn.className = 'choice-chip';
    btn.textContent = ans;

    btn.addEventListener('click', () => {
      if (ans === total) {
        sfx.playFanfare();
        confetti.burst(70);
        state.stars += 3;
        state.streak += 1;
        updateStatsUI();

        document.getElementById('baseTenTotal').textContent = total;
        speak(`Awesome! ${tens} tens and ${ones} ones equals ${total}!`);

        setTimeout(() => {
          openCelebrationModal(`You counted the Base-10 blocks! <strong>${tens} Tens + ${ones} Ones = ${total}</strong>! 🧱⭐`);
        }, 1000);
      } else {
        sfx.playBoing();
        btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 450);
        speak(`Count the tens rods: each rod is ten! Then count the single ones cubes!`);
      }
    });

    choicesContainer.appendChild(btn);
  });

  speak(`Count the blocks! We have ${tens} tens rods and ${ones} single cubes. What is the total?`);
}

// ==========================================
// 7. COUNT THE MONEY (PKR ₨)
// ==========================================
function setupCountMoneyRound() {
  const surface = document.getElementById('moneyTableSurface');
  const choices = document.getElementById('moneyChoices');
  surface.innerHTML = '';
  choices.innerHTML = '';

  state.countMoneyData = {
    tappedTotal: 0,
    items: []
  };

  document.getElementById('moneyTappedTotal').textContent = 'Rs 0';

  // Generate realistic combination of PKR coins and notes
  const pool = [
    { val: 20, name: 'Rs 20', class: 'coin-rs20' },
    { val: 10, name: 'Rs 10', class: 'coin-rs10' },
    { val: 5, name: 'Rs 5', class: 'coin-rs5' },
    { val: 2, name: 'Rs 2', class: 'coin-rs2' },
    { val: 1, name: 'Rs 1', class: 'coin-rs1' }
  ];

  let itemCount = 4;
  if (state.difficulty === 'medium') itemCount = 5;
  else if (state.difficulty === 'hard') itemCount = 6;

  let total = 0;
  for (let i = 0; i < itemCount; i++) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    state.countMoneyData.items.push(pick);
    total += pick.val;

    const btn = document.createElement('button');
    btn.className = `coin-btn ${pick.class} table-currency-item`;
    btn.innerHTML = `<span class="coin-val">${pick.name}</span>`;

    btn.addEventListener('click', () => {
      sfx.playCoinClink();
      btn.classList.toggle('tapped');
      state.countMoneyData.tappedTotal += pick.val;
      document.getElementById('moneyTappedTotal').textContent = `Rs ${state.countMoneyData.tappedTotal}`;
      speak(`${pick.val} Rupees!`);
    });

    surface.appendChild(btn);
  }

  state.countMoneyData.total = total;

  // Choices
  const answerSet = new Set([total]);
  while (answerSet.size < 4) {
    const diff = (Math.floor(Math.random() * 5) - 2) * 5;
    const cand = total + diff;
    if (cand > 0 && cand !== total) answerSet.add(cand);
  }

  const shuffled = Array.from(answerSet).sort(() => Math.random() - 0.5);

  shuffled.forEach(ans => {
    const btn = document.createElement('button');
    btn.className = 'choice-chip';
    btn.style.width = 'auto';
    btn.style.padding = '0.5rem 1.2rem';
    btn.textContent = `Rs ${ans}`;

    btn.addEventListener('click', () => {
      if (ans === total) {
        sfx.playFanfare();
        confetti.burst(75);
        state.stars += 3;
        state.streak += 1;
        updateStatsUI();

        speak(`Cha-ching! The total money is ${total} Rupees!`);
        setTimeout(() => {
          openCelebrationModal(`You counted the money accurately! Total is <strong>Rs ${total}</strong>! 💵✨`);
        }, 1000);
      } else {
        sfx.playBoing();
        btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 450);
        speak(`Tap each coin or note to count it into your total!`);
      }
    });

    choices.appendChild(btn);
  });

  speak(`Count the money on the table! How many Pakistani Rupees are there?`);
}

// ==========================================
// 8. COIN TOY SHOP (PKR)
// ==========================================
const TOY_CATALOG = [
  { name: 'Teddy Bear', icon: '🧸' },
  { name: 'Race Car', icon: '🚗' },
  { name: 'Rocket Ship', icon: '🚀' },
  { name: 'Unicorn', icon: '🦄' },
  { name: 'Robot Pal', icon: '🤖' },
  { name: 'Dino T-Rex', icon: '🦖' },
  { name: 'Helicopter', icon: '🚁' },
  { name: 'Skateboard', icon: '🛹' },
  { name: 'Soccer Ball', icon: '⚽' },
  { name: 'Game Controller', icon: '🎮' },
  { name: 'Paint Palette', icon: '🎨' },
  { name: 'Royal Crown', icon: '👑' },
  { name: 'Ice Cream', icon: '🍦' },
  { name: 'Puppy Dog', icon: '🐶' }
];

function setupCoinsRound() {
  state.coinsPaid = [];
  const toy = TOY_CATALOG[Math.floor(Math.random() * TOY_CATALOG.length)];

  let price = 10;
  if (state.difficulty === 'easy') {
    const options = [3, 4, 5, 6, 7, 8, 10, 12, 14, 15];
    price = options[Math.floor(Math.random() * options.length)];
  } else if (state.difficulty === 'medium') {
    const options = [14, 16, 18, 20, 22, 25, 27, 30, 35];
    price = options[Math.floor(Math.random() * options.length)];
  } else {
    const options = [30, 32, 35, 40, 45, 50, 55, 60, 65];
    price = options[Math.floor(Math.random() * options.length)];
  }

  state.currentToy = { ...toy, price };

  document.getElementById('shopToyIcon').textContent = toy.icon;
  document.getElementById('shopToyName').textContent = toy.name;
  document.getElementById('shopToyPrice').textContent = `Rs ${price}`;
  document.getElementById('regTarget').textContent = `Rs ${price}`;

  updateRegisterDisplay();

  const speechText = `The ${toy.name} costs ${price} Rupees! Tap coins to pay exact change!`;
  document.getElementById('shopkeeperSpeech').textContent = `"${speechText}"`;
  speak(speechText);
}

function updateRegisterDisplay() {
  const totalPaid = state.coinsPaid.reduce((a, b) => a + b, 0);
  const target = state.currentToy ? state.currentToy.price : 0;
  const statusEl = document.getElementById('regStatus');
  const tray = document.getElementById('paidCoinsTray');

  document.getElementById('regPaid').textContent = `Rs ${totalPaid}`;

  tray.innerHTML = '';
  if (state.coinsPaid.length === 0) {
    tray.innerHTML = '<span class="empty-tray-hint">Click PKR coins below to add!</span>';
  } else {
    state.coinsPaid.forEach(coinVal => {
      const chip = document.createElement('div');
      chip.className = 'tray-coin-chip';
      if (coinVal === 1) chip.style.background = '#D97706';
      else if (coinVal === 2) chip.style.background = '#CA8A04';
      else if (coinVal === 5) chip.style.background = '#64748B';
      else if (coinVal === 10) chip.style.background = '#F59E0B';
      else chip.style.background = '#059669';
      chip.textContent = `Rs ${coinVal}`;
      tray.appendChild(chip);
    });
  }

  if (totalPaid === target) {
    statusEl.className = 'calc-status exact';
    statusEl.textContent = '🌟 Exact Amount! Ready to buy!';
  } else if (totalPaid < target) {
    statusEl.className = 'calc-status';
    statusEl.textContent = `Need Rs ${target - totalPaid} more`;
  } else {
    statusEl.className = 'calc-status over';
    statusEl.textContent = `Too much! Over by Rs ${totalPaid - target}`;
  }
}

function addCoin(coinVal) {
  sfx.playCoinClink();
  state.coinsPaid.push(coinVal);
  updateRegisterDisplay();

  const total = state.coinsPaid.reduce((a, b) => a + b, 0);
  const target = state.currentToy.price;

  if (total === target) {
    speak(`${total} Rupees! That is exact! Click Buy Toy!`);
  } else if (total < target) {
    speak(`${total} Rupees. Need ${target - total} more!`);
  } else {
    speak(`${total} Rupees. That is too much! Try reset coins!`);
  }
}

function checkCoinsPurchase() {
  const totalPaid = state.coinsPaid.reduce((a, b) => a + b, 0);
  const target = state.currentToy.price;

  if (totalPaid === target) {
    sfx.playFanfare();
    confetti.burst(80);

    state.stars += 3;
    state.streak += 1;
    state.toys.push({ name: state.currentToy.name, icon: state.currentToy.icon });
    updateStatsUI();

    speak(`Cha-ching! You bought the ${state.currentToy.name} for ${target} Rupees!`);

    setTimeout(() => {
      openCelebrationModal(`You paid exact change (Rs ${target}) and added <strong>${state.currentToy.icon} ${state.currentToy.name}</strong> to your backpack!`);
    }, 800);
  } else if (totalPaid < target) {
    sfx.playBoing();
    speak(`You have ${totalPaid} Rupees, but need ${target} Rupees! Add ${target - totalPaid} Rupees more!`);
  } else {
    sfx.playBoing();
    speak(`You have ${totalPaid} Rupees. That is too much! Tap Reset to try again!`);
  }
}

// ==========================================
// 9. HOW MANY MORE / HOW MANY LESS?
// ==========================================
const COMPARE_ITEMS = [
  { itemA: '🍎', nameA: 'Apples', itemB: '🍌', nameB: 'Bananas' },
  { itemA: '🐸', nameA: 'Frogs', itemB: '🦆', nameB: 'Ducks' },
  { itemA: '🚗', nameA: 'Cars', itemB: '🚌', nameB: 'Buses' },
  { itemA: '⭐', nameA: 'Stars', itemB: '🌙', nameB: 'Moons' },
  { itemA: '🍪', nameA: 'Cookies', itemB: '🧁', nameB: 'Cupcakes' },
  { itemA: '🍓', nameA: 'Berries', itemB: '🍊', nameB: 'Oranges' }
];

function setupCompareRound() {
  const pair = COMPARE_ITEMS[Math.floor(Math.random() * COMPARE_ITEMS.length)];

  let maxA = 8;
  if (state.difficulty === 'medium') maxA = 12;
  else if (state.difficulty === 'hard') maxA = 16;

  const countA = Math.floor(Math.random() * (maxA - 4)) + 5;
  const diff = Math.floor(Math.random() * 4) + 1;
  const countB = countA - diff;

  const isLessQuestion = Math.random() > 0.5;
  const questionType = isLessQuestion ? 'less' : 'more';

  state.compareData = { pair, countA, countB, diff, questionType };

  const qText = document.getElementById('compareQuestionText');
  const expEl = document.getElementById('compareExplanation');
  expEl.style.display = 'none';

  if (isLessQuestion) {
    qText.innerHTML = `How many <strong>LESS</strong> ${pair.nameB} than ${pair.nameA}?`;
    speak(`How many less ${pair.nameB} are there than ${pair.nameA}? Count the difference!`);
  } else {
    qText.innerHTML = `How many <strong>MORE</strong> ${pair.nameA} than ${pair.nameB}?`;
    speak(`How many more ${pair.nameA} are there than ${pair.nameB}? Count the extra items!`);
  }

  const stage = document.getElementById('compareVisualStage');
  stage.innerHTML = '';

  // Row A
  const rowA = document.createElement('div');
  rowA.className = 'compare-group-row';
  rowA.innerHTML = `
    <div class="group-label-pill pill-a">${pair.nameA} (${countA})</div>
    <div class="group-items-track" id="trackA"></div>
  `;
  stage.appendChild(rowA);

  const trackA = rowA.querySelector('#trackA');
  for (let i = 1; i <= countA; i++) {
    const cell = document.createElement('div');
    const isExtra = i > countB;
    cell.className = `compare-item-cell ${isExtra ? 'extra' : 'paired'}`;
    cell.innerHTML = `<span>${pair.itemA}</span><span class="cell-index">${i}</span>`;
    trackA.appendChild(cell);
  }

  // Row B
  const rowB = document.createElement('div');
  rowB.className = 'compare-group-row';
  rowB.innerHTML = `
    <div class="group-label-pill pill-b">${pair.nameB} (${countB})</div>
    <div class="group-items-track" id="trackB"></div>
  `;
  stage.appendChild(rowB);

  const trackB = rowB.querySelector('#trackB');
  for (let i = 1; i <= countB; i++) {
    const cell = document.createElement('div');
    cell.className = 'compare-item-cell paired';
    cell.innerHTML = `<span>${pair.itemB}</span><span class="cell-index">${i}</span>`;
    trackB.appendChild(cell);
  }

  // Choices
  const choicesContainer = document.getElementById('compareChoices');
  choicesContainer.innerHTML = '';

  const answers = new Set([diff]);
  while (answers.size < 4) {
    const d = Math.max(1, diff + Math.floor(Math.random() * 5) - 2);
    answers.add(d);
  }

  const shuffled = Array.from(answers).sort(() => Math.random() - 0.5);

  shuffled.forEach(ans => {
    const btn = document.createElement('button');
    btn.className = 'choice-chip';
    btn.textContent = ans;

    btn.addEventListener('click', () => {
      if (ans === diff) {
        sfx.playFanfare();
        confetti.burst(60);
        state.stars += 3;
        state.streak += 1;
        updateStatsUI();

        expEl.style.display = 'block';
        if (isLessQuestion) {
          expEl.innerHTML = `🎉 Correct! ${countA} - ${countB} = <strong>${diff}</strong>! There are ${diff} less ${pair.nameB}!`;
          speak(`Awesome! ${countA} minus ${countB} is ${diff}! There are ${diff} less!`);
        } else {
          expEl.innerHTML = `🎉 Correct! ${countA} - ${countB} = <strong>${diff}</strong>! There are ${diff} more ${pair.nameA}!`;
          speak(`Awesome! ${countA} minus ${countB} is ${diff}! There are ${diff} more!`);
        }

        setTimeout(() => {
          openCelebrationModal(`You solved the difference puzzle! <strong>${countA} - ${countB} = ${diff}</strong>`);
        }, 1200);
      } else {
        sfx.playBoing();
        btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 450);
        speak(`Not quite! Pair them up and count the leftover extra boxes!`);
      }
    });

    choicesContainer.appendChild(btn);
  });
}

// ==========================================
// 10. HUNGRY ALLIGATOR (< , > , =)
// ==========================================
function setupAlligatorRound() {
  let max = 15;
  if (state.difficulty === 'medium') max = 40;
  else if (state.difficulty === 'hard') max = 99;

  let a = Math.floor(Math.random() * max) + 1;
  let b = Math.floor(Math.random() * max) + 1;

  if (Math.random() < 0.25) b = a;

  let correctSign = '=';
  if (a > b) correctSign = '>';
  else if (a < b) correctSign = '<';

  state.alligatorData = { a, b, correctSign };

  document.getElementById('alliLeftNum').textContent = a;
  document.getElementById('alliRightNum').textContent = b;
  document.getElementById('alliSign').textContent = '?';

  const sprite = document.getElementById('alliSprite');
  sprite.style.transform = 'scale(1) rotate(0deg)';

  speak(`Which number is bigger? ${a} or ${b}? Choose which way the hungry alligator chomps!`);
}

function handleAlligatorChoice(chosenSign) {
  const { a, b, correctSign } = state.alligatorData;
  const sprite = document.getElementById('alliSprite');
  const signDisplay = document.getElementById('alliSign');

  if (chosenSign === correctSign) {
    sfx.playChomp();
    sfx.playFanfare();
    confetti.burst(65);

    state.stars += 3;
    state.streak += 1;
    updateStatsUI();

    signDisplay.textContent = correctSign;

    if (correctSign === '>') {
      sprite.style.transform = 'scale(1.2) rotate(-15deg)';
      speak(`Chomp chomp! ${a} is greater than ${b}!`);
    } else if (correctSign === '<') {
      sprite.style.transform = 'scale(1.2) rotate(15deg) scaleX(-1)';
      speak(`Chomp chomp! ${b} is greater than ${a}!`);
    } else {
      sprite.style.transform = 'scale(1.2)';
      speak(`Both numbers are equal! ${a} equals ${b}!`);
    }

    setTimeout(() => {
      openCelebrationModal(`Great chomping! <strong>${a} ${correctSign} ${b}</strong>!`);
    }, 1100);
  } else {
    sfx.playBoing();
    if (correctSign === '>') {
      speak(`Oops! ${a} is bigger than ${b}, so the alligator wants to eat ${a}!`);
    } else if (correctSign === '<') {
      speak(`Oops! ${b} is bigger than ${a}, so the alligator wants to eat ${b}!`);
    } else {
      speak(`Both numbers are equal! ${a} and ${b} are the same!`);
    }
  }
}

// ==========================================
// 11. TEN FRAME BONDS
// ==========================================
function setupBondsRound() {
  const total = 10;
  const a = Math.floor(Math.random() * 9) + 1;
  const missing = total - a;

  state.bondsData = { a, missing, total };

  document.getElementById('eqA').textContent = a;
  document.getElementById('eqMissing').textContent = '?';
  document.getElementById('eqTotal').textContent = total;

  const board = document.getElementById('tenFrameBoard');
  board.innerHTML = '';

  for (let i = 1; i <= total; i++) {
    const cell = document.createElement('div');
    cell.className = 'ten-frame-cell';
    if (i <= a) {
      cell.innerHTML = '<div class="frame-dot"></div>';
    } else {
      cell.innerHTML = '<div class="frame-empty-dot"></div>';
    }
    board.appendChild(cell);
  }

  const choicesContainer = document.getElementById('bondsChoices');
  choicesContainer.innerHTML = '';

  const answers = new Set([missing]);
  while (answers.size < 4) {
    const r = Math.floor(Math.random() * 9) + 1;
    answers.add(r);
  }

  const shuffled = Array.from(answers).sort(() => Math.random() - 0.5);

  shuffled.forEach(ans => {
    const btn = document.createElement('button');
    btn.className = 'choice-chip';
    btn.textContent = ans;

    btn.addEventListener('click', () => {
      if (ans === missing) {
        sfx.playFanfare();
        confetti.burst(65);

        state.stars += 3;
        state.streak += 1;
        updateStatsUI();

        document.getElementById('eqMissing').textContent = missing;

        const emptyCells = board.querySelectorAll('.frame-empty-dot');
        emptyCells.forEach(dot => {
          dot.className = 'frame-dot';
          dot.style.background = 'radial-gradient(circle at 35% 35%, #FDE047, #EAB308 70%, #CA8A04 100%)';
        });

        speak(`Fantastic! ${a} plus ${missing} equals 10!`);

        setTimeout(() => {
          openCelebrationModal(`You completed the Ten Frame! <strong>${a} + ${missing} = 10</strong>! ⭐⭐⭐`);
        }, 1100);
      } else {
        sfx.playBoing();
        btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 450);
        speak(`Count the empty spaces in the Ten Frame!`);
      }
    });

    choicesContainer.appendChild(btn);
  });

  speak(`We have ${a} dots. How many more dots do we need to make 10?`);
}

// ==========================================
// 12. STEP LADDER (LEARN)
// ==========================================
function renderLearnMode() {
  const container = document.getElementById('learnTowers');
  container.innerHTML = '';
  const runner = document.getElementById('mascotRunner');
  runner.style.left = '20px';
  runner.style.bottom = '40px';

  let count = 4, max = 10;
  if (state.difficulty === 'medium') { count = 5; max = 30; }
  else if (state.difficulty === 'hard') { count = 6; max = 100; }

  state.currentNumbers = Array.from(new Set(Array.from({ length: count }, () => Math.floor(Math.random() * max) + 1)));
  while (state.currentNumbers.length < count) {
    state.currentNumbers.push(Math.floor(Math.random() * max) + 1);
  }

  const maxVal = Math.max(...state.currentNumbers, 10);

  state.currentNumbers.forEach((num, index) => {
    const col = document.createElement('div');
    col.className = 'tower-col';
    col.dataset.value = num;

    const heightPct = Math.max(16, (num / maxVal) * 90);

    col.innerHTML = `
      <div class="tower-num-bubble">${num}</div>
      <div class="tower-bar" style="height: ${heightPct}%;">
        <div class="tower-dots">
          ${Array(Math.min(num, 5)).fill('<span class="dot-indicator"></span>').join('')}
        </div>
      </div>
    `;

    col.addEventListener('click', () => {
      sfx.playChime(index + 1);
      speak(`${num}`);
      moveRunnerToCol(col);
    });

    container.appendChild(col);
  });
}

function moveRunnerToCol(colElement) {
  const runner = document.getElementById('mascotRunner');
  const stageRect = document.querySelector('.tower-stage').getBoundingClientRect();
  const colRect = colElement.getBoundingClientRect();
  const bar = colElement.querySelector('.tower-bar');

  const x = colRect.left - stageRect.left + (colRect.width / 2) - 20;
  const barHeight = bar.getBoundingClientRect().height;
  const y = barHeight + 30;

  runner.style.left = `${x}px`;
  runner.style.bottom = `${y}px`;
}

function runLadderClimb(isAscending = true) {
  const container = document.getElementById('learnTowers');
  const sorted = isAscending 
    ? Array.from({ length: 8 }, (_, i) => i + 1)
    : Array.from({ length: 8 }, (_, i) => 8 - i);

  state.currentNumbers = sorted;
  renderLearnMode();

  const cols = container.querySelectorAll('.tower-col');
  let step = 0;

  speak(isAscending ? "Climbing up! Ascending order: smallest to largest!" : "Sliding down! Descending order: largest to smallest!");

  const interval = setInterval(() => {
    if (step >= cols.length) {
      clearInterval(interval);
      sfx.playFanfare();
      confetti.burst(40);
      return;
    }

    cols.forEach(c => c.classList.remove('active-step'));
    const col = cols[step];
    col.classList.add('active-step');
    moveRunnerToCol(col);

    sfx.playChime(step + 1);
    step++;
  }, 450);
}

// ==========================================
// 13. TRAIN STATION (ORDERING)
// ==========================================
function renderTrainMode() {
  const carriagesContainer = document.getElementById('carriagesContainer');
  const cratesDock = document.getElementById('cratesDock');
  const hint = document.getElementById('cargoHint');

  carriagesContainer.innerHTML = '';
  cratesDock.innerHTML = '';

  let count = 4, max = 10;
  if (state.difficulty === 'medium') { count = 5; max = 30; }
  else if (state.difficulty === 'hard') { count = 6; max = 100; }

  const set = new Set();
  while (set.size < count) set.add(Math.floor(Math.random() * max) + 1);
  state.currentNumbers = Array.from(set);

  if (state.currentRule === 'asc') {
    state.targetOrder = [...state.currentNumbers].sort((a, b) => a - b);
    hint.textContent = 'Goal: Smallest first!';
    speak("Load the train in ascending order! Smallest number first!");
  } else {
    state.targetOrder = [...state.currentNumbers].sort((a, b) => b - a);
    hint.textContent = 'Goal: Biggest first!';
    speak("Load the train in descending order! Biggest number first!");
  }

  const track = document.getElementById('trainEngineTrack');
  track.style.transform = 'translateX(0)';

  state.targetOrder.forEach((_, idx) => {
    const slot = document.createElement('div');
    slot.className = `train-carriage-slot ${idx === 0 ? 'current-target' : ''}`;
    slot.dataset.slotIndex = idx;
    slot.innerHTML = `
      <span class="slot-index">#${idx + 1}</span>
      <div class="filled-wheels">
        <span class="wheel"></span>
        <span class="wheel"></span>
      </div>
    `;
    carriagesContainer.appendChild(slot);
  });

  const shuffled = [...state.currentNumbers].sort(() => Math.random() - 0.5);

  shuffled.forEach(num => {
    const card = document.createElement('div');
    card.className = 'number-card';
    card.dataset.val = num;

    const pipsCount = Math.min(num, 8);
    const pipsHtml = Array(pipsCount).fill('<div class="meter-pip"></div>').join('');

    card.innerHTML = `
      <span class="card-val">${num}</span>
      <div class="card-meter">${pipsHtml}</div>
    `;

    card.addEventListener('click', () => handleTrainCrateSelect(num, card));
    cratesDock.appendChild(card);
  });
}

function handleTrainCrateSelect(num, cardElement) {
  if (state.isLocked) return;
  const expectedNum = state.targetOrder[state.stepIndex];

  if (num === expectedNum) {
    sfx.playChime(state.stepIndex + 1);
    sfx.playPop();

    const slots = document.querySelectorAll('.train-carriage-slot');
    const currentSlot = slots[state.stepIndex];
    if (currentSlot) {
      currentSlot.classList.remove('current-target');
      currentSlot.classList.add('filled');
      currentSlot.innerHTML = `
        <span class="filled-number">${num}</span>
        <div class="filled-wheels">
          <span class="wheel"></span>
          <span class="wheel"></span>
        </div>
      `;
    }

    cardElement.style.opacity = '0';
    cardElement.style.pointerEvents = 'none';
    cardElement.style.transform = 'scale(0.2)';

    state.stepIndex++;

    if (state.stepIndex < state.targetOrder.length) {
      const nextSlot = slots[state.stepIndex];
      if (nextSlot) nextSlot.classList.add('current-target');
      speak(`${num}! Good job! Next?`);
    } else {
      state.isLocked = true;
      state.stars += 3;
      state.streak += 1;
      updateStatsUI();

      sfx.playTrainWhistle();
      const track = document.getElementById('trainEngineTrack');
      setTimeout(() => { track.style.transform = 'translateX(120%)'; }, 400);

      confetti.burst(90);
      const ruleName = state.currentRule === 'asc' ? 'Ascending' : 'Descending';
      speak(`Superstar! Train loaded in ${ruleName} order!`);
      setTimeout(() => {
        openCelebrationModal(`You loaded all wagons in ${ruleName} order! 🚂🎉`);
      }, 1000);
    }
  } else {
    sfx.playBoing();
    cardElement.classList.add('shake');
    setTimeout(() => cardElement.classList.remove('shake'), 450);
    speak(state.currentRule === 'asc' ? `Look for the smallest: ${expectedNum}!` : `Look for the largest: ${expectedNum}!`);
  }
}

// ==========================================
// 14. BALLOON POP (ORDERING)
// ==========================================
function renderBalloonsMode() {
  const sky = document.getElementById('balloonSky');
  const basket = document.getElementById('basketSlots');

  sky.innerHTML = '';
  basket.innerHTML = '';

  let count = 4, max = 10;
  if (state.difficulty === 'medium') { count = 5; max = 30; }
  else if (state.difficulty === 'hard') { count = 6; max = 100; }

  const set = new Set();
  while (set.size < count) set.add(Math.floor(Math.random() * max) + 1);
  state.currentNumbers = Array.from(set);

  if (state.currentRule === 'asc') {
    state.targetOrder = [...state.currentNumbers].sort((a, b) => a - b);
    speak("Pop balloons from smallest to largest!");
  } else {
    state.targetOrder = [...state.currentNumbers].sort((a, b) => b - a);
    speak("Pop balloons from largest to smallest!");
  }

  const colors = [
    'linear-gradient(135deg, #EF4444, #DC2626)',
    'linear-gradient(135deg, #3B82F6, #2563EB)',
    'linear-gradient(135deg, #10B981, #059669)',
    'linear-gradient(135deg, #F59E0B, #D97706)',
    'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    'linear-gradient(135deg, #EC4899, #DB2777)'
  ];

  state.targetOrder.forEach((_, idx) => {
    const slot = document.createElement('div');
    slot.className = 'basket-slot';
    slot.textContent = '?';
    basket.appendChild(slot);
  });

  const shuffled = [...state.currentNumbers].sort(() => Math.random() - 0.5);

  shuffled.forEach((num, idx) => {
    const balloon = document.createElement('div');
    balloon.className = 'balloon-item';
    balloon.dataset.val = num;
    balloon.style.background = colors[idx % colors.length];
    balloon.style.animationDelay = `${(idx * 0.4).toFixed(1)}s`;
    balloon.innerHTML = `<span class="balloon-num">${num}</span>`;

    balloon.addEventListener('click', () => {
      if (state.isLocked) return;
      const expectedNum = state.targetOrder[state.stepIndex];

      if (num === expectedNum) {
        sfx.playPop();
        sfx.playChime(state.stepIndex + 1);

        balloon.style.transform = 'scale(1.5)';
        balloon.style.opacity = '0';
        balloon.style.pointerEvents = 'none';

        const slots = document.querySelectorAll('.basket-slot');
        const slot = slots[state.stepIndex];
        if (slot) {
          slot.classList.add('filled');
          slot.textContent = num;
        }

        state.stepIndex++;

        if (state.stepIndex >= state.targetOrder.length) {
          state.isLocked = true;
          state.stars += 3;
          state.streak += 1;
          updateStatsUI();
          sfx.playFanfare();
          confetti.burst(85);
          speak("All balloons popped in order! Spectacular!");
          setTimeout(() => {
            openCelebrationModal(`You popped all balloons in order! 🎈🎉⭐⭐⭐`);
          }, 900);
        } else {
          speak(`${num}! Pop!`);
        }
      } else {
        sfx.playBoing();
        balloon.classList.add('shake');
        setTimeout(() => balloon.classList.remove('shake'), 450);
        speak(`Oops! Look for ${expectedNum}!`);
      }
    });

    sky.appendChild(balloon);
  });
}

// ==========================================
// Celebration Modal
// ==========================================
function openCelebrationModal(message) {
  const modal = document.getElementById('celebrationModal');
  const msgEl = document.getElementById('modalMessage');
  const titleEl = document.getElementById('modalTitle');

  titleEl.textContent = "Superstar! 🌟";
  msgEl.innerHTML = message;
  modal.classList.add('open');
}

function closeModal() {
  const modal = document.getElementById('celebrationModal');
  modal.classList.remove('open');
}

// ==========================================
// Event Listeners & Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  updateStatsUI();

  // Category Filter Chips
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      sfx.playPop();
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeCategory = chip.dataset.category;

      const navButtons = document.querySelectorAll('.nav-btn');
      let firstVisible = null;

      navButtons.forEach(btn => {
        const cat = btn.dataset.cat;
        if (btn.dataset.mode === 'home' || state.activeCategory === 'all' || cat === state.activeCategory) {
          btn.style.display = 'inline-flex';
          if (!firstVisible && btn.dataset.mode !== 'home') firstVisible = btn;
        } else {
          btn.style.display = 'none';
        }
      });

      renderHomeCards();

      // If active mode button is hidden by category filter and not on home, switch to first visible button
      const activeBtn = document.querySelector('.nav-btn.active');
      if (state.mode !== 'home' && activeBtn && activeBtn.style.display === 'none' && firstVisible) {
        firstVisible.click();
      }
    });
  });

  // Mode Navigation Tabs
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.playPop();
      switchToMode(btn.dataset.mode);
    });
  });

  // Logo / Mascot click to return Home
  const brandEl = document.querySelector('.brand');
  if (brandEl) {
    brandEl.style.cursor = 'pointer';
    brandEl.title = 'Back to Home';
    brandEl.addEventListener('click', () => {
      sfx.playPop();
      switchToMode('home');
    });
  }

  // Difficulty Selector
  document.querySelectorAll('#diffControl .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.playPop();
      document.querySelectorAll('#diffControl .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.difficulty = btn.dataset.diff;
      startNewRound();
    });
  });

  // Order Type Selector
  document.querySelectorAll('#orderControl .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.playPop();
      document.querySelectorAll('#orderControl .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.orderType = btn.dataset.order;
      startNewRound();
    });
  });

  // Next Challenge Button
  document.getElementById('btnNewRound').addEventListener('click', () => {
    sfx.playPop();
    startNewRound();
  });

  // Mission Read Aloud Button
  document.getElementById('btnSpeakRule').addEventListener('click', () => {
    sfx.playPop();
    const title = document.getElementById('missionTitle').innerText;
    const desc = document.getElementById('missionDesc').innerText;
    speak(`${title}. ${desc}`);
  });

  // Sound & Voice Controls
  const btnSound = document.getElementById('btnSound');
  btnSound.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    btnSound.classList.toggle('active', state.soundEnabled);
    btnSound.classList.toggle('muted', !state.soundEnabled);
    if (state.soundEnabled) sfx.playPop();
  });

  const btnVoice = document.getElementById('btnVoice');
  btnVoice.addEventListener('click', () => {
    state.voiceEnabled = !state.voiceEnabled;
    btnVoice.classList.toggle('active', state.voiceEnabled);
    btnVoice.classList.toggle('muted', !state.voiceEnabled);
    if (state.voiceEnabled) speak("Voice is on!");
  });

  // Abacus Controls
  document.getElementById('btnAddTen').addEventListener('click', () => addAbacusBead('tens'));
  document.getElementById('btnSubTen').addEventListener('click', () => removeAbacusBead('tens'));
  document.getElementById('btnAddOne').addEventListener('click', () => addAbacusBead('ones'));
  document.getElementById('btnSubOne').addEventListener('click', () => removeAbacusBead('ones'));
  document.getElementById('btnClearAbacus').addEventListener('click', () => {
    sfx.playBoing();
    state.abacusData.tens = 0;
    state.abacusData.ones = 0;
    updateAbacusDisplay();
  });
  document.getElementById('btnCheckAbacus').addEventListener('click', () => checkAbacusAnswer());

  // Ordinal Palette Swatches
  document.querySelectorAll('.paint-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      sfx.playPop();
      document.querySelectorAll('.paint-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      if (state.ordinalData) {
        state.ordinalData.currentColor = swatch.dataset.color;
      }
    });
  });

  // Number Names Actions
  document.getElementById('btnClearLetters').addEventListener('click', () => {
    sfx.playBoing();
    if (state.namesData) {
      state.namesData.typedLetters = [];
      renderWordSlots();
      document.querySelectorAll('.letter-chip').forEach(c => c.classList.remove('used'));
    }
  });

  document.getElementById('btnHearWord').addEventListener('click', () => {
    sfx.playPop();
    if (state.namesData) {
      speak(`${state.namesData.word}. Spelled: ${state.namesData.word.split('').join(' ')}`);
    }
  });

  // Count Money Reset
  document.getElementById('btnResetMoneyCount').addEventListener('click', () => {
    sfx.playBoing();
    if (state.countMoneyData) {
      state.countMoneyData.tappedTotal = 0;
      document.getElementById('moneyTappedTotal').textContent = 'Rs 0';
      document.querySelectorAll('.table-currency-item').forEach(i => i.classList.remove('tapped'));
    }
  });

  // Coin Toy Shop Actions
  document.querySelectorAll('.coin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.coin, 10);
      if (val && state.mode === 'coins') addCoin(val);
    });
  });

  document.getElementById('btnClearCoins').addEventListener('click', () => {
    sfx.playBoing();
    state.coinsPaid = [];
    updateRegisterDisplay();
    speak("Coins cleared! Start fresh!");
  });

  document.getElementById('btnCheckCoins').addEventListener('click', () => checkCoinsPurchase());

  // Alligator Buttons
  document.querySelectorAll('.alli-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAlligatorChoice(btn.dataset.sign));
  });

  // Learn Mode Demo Buttons
  document.getElementById('btnDemoAsc').addEventListener('click', () => runLadderClimb(true));
  document.getElementById('btnDemoDesc').addEventListener('click', () => runLadderClimb(false));
  document.getElementById('btnDemoRandom').addEventListener('click', () => {
    sfx.playPop();
    startNewRound();
  });

  // Modal Actions
  document.getElementById('btnNextRound').addEventListener('click', () => {
    sfx.playPop();
    closeModal();
    startNewRound();
  });

  document.getElementById('btnSwitchMode').addEventListener('click', () => {
    sfx.playPop();
    closeModal();
    switchToMode('home');
  });

  // Initial Start
  startNewRound();
});
