// ==========================================
// Number Safari - 1st Grade Math Adventure!
// ==========================================

// Global Game State
const state = {
  mode: 'learn',         // 'learn', 'train', 'balloons', 'coins', 'compare', 'alligator', 'bonds'
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

  // Mode 4: Coins
  currentToy: null,
  coinsPaid: [],

  // Mode 5: Compare
  compareData: null,

  // Mode 6: Alligator
  alligatorData: null,

  // Mode 7: Bonds
  bondsData: null
};

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

  if (state.mode === 'learn') renderLearnMode();
  else if (state.mode === 'train') renderTrainMode();
  else if (state.mode === 'balloons') renderBalloonsMode();
  else if (state.mode === 'coins') setupCoinsRound();
  else if (state.mode === 'compare') setupCompareRound();
  else if (state.mode === 'alligator') setupAlligatorRound();
  else if (state.mode === 'bonds') setupBondsRound();
}

// ==========================================
// Ordering Helpers
// ==========================================
function getRandomNumbers(count, maxVal) {
  const set = new Set();
  while (set.size < count) {
    const num = Math.floor(Math.random() * maxVal) + 1;
    set.add(num);
  }
  return Array.from(set);
}

function getOrderingConfig() {
  let count = 4;
  let max = 10;
  if (state.difficulty === 'medium') { count = 5; max = 30; }
  else if (state.difficulty === 'hard') { count = 6; max = 100; }
  return { count, max };
}

// ==========================================
// MODE 1: Step Ladder (Learn)
// ==========================================
function renderLearnMode() {
  const container = document.getElementById('learnTowers');
  container.innerHTML = '';
  const runner = document.getElementById('mascotRunner');
  runner.style.left = '20px';
  runner.style.bottom = '40px';

  const cfg = getOrderingConfig();
  state.currentNumbers = getRandomNumbers(cfg.count, cfg.max);

  if (state.currentRule === 'asc') {
    state.targetOrder = [...state.currentNumbers].sort((a, b) => a - b);
  } else {
    state.targetOrder = [...state.currentNumbers].sort((a, b) => b - a);
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
// MODE 2: Train Station (Ordering)
// ==========================================
function renderTrainMode() {
  const carriagesContainer = document.getElementById('carriagesContainer');
  const cratesDock = document.getElementById('cratesDock');
  const hint = document.getElementById('cargoHint');

  carriagesContainer.innerHTML = '';
  cratesDock.innerHTML = '';

  const cfg = getOrderingConfig();
  state.currentNumbers = getRandomNumbers(cfg.count, cfg.max);

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
      triggerOrderingWin('train');
    }
  } else {
    sfx.playBoing();
    cardElement.classList.add('shake');
    setTimeout(() => cardElement.classList.remove('shake'), 450);
    speak(state.currentRule === 'asc' ? `Look for the smallest: ${expectedNum}!` : `Look for the largest: ${expectedNum}!`);
  }
}

// ==========================================
// MODE 3: Balloon Pop (Ordering)
// ==========================================
function renderBalloonsMode() {
  const sky = document.getElementById('balloonSky');
  const basket = document.getElementById('basketSlots');

  sky.innerHTML = '';
  basket.innerHTML = '';

  const cfg = getOrderingConfig();
  state.currentNumbers = getRandomNumbers(cfg.count, cfg.max);

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
          triggerOrderingWin('balloons');
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

function triggerOrderingWin(modeName) {
  state.isLocked = true;
  state.stars += 3;
  state.streak += 1;
  updateStatsUI();

  if (modeName === 'train') {
    sfx.playTrainWhistle();
    const track = document.getElementById('trainEngineTrack');
    setTimeout(() => { track.style.transform = 'translateX(120%)'; }, 400);
  } else {
    sfx.playFanfare();
  }

  confetti.burst(90);
  const ruleName = state.currentRule === 'asc' ? 'Ascending' : 'Descending';
  speak(`Superstar! You ordered all numbers in ${ruleName} order!`);

  setTimeout(() => {
    openCelebrationModal(`You mastered ${ruleName} order! ⭐⭐⭐`);
  }, 1000);
}

// ==========================================
// MODE 4: Coin Toy Shop (Money Math)
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

  // Price determination in PKR based on difficulty
  let price = 10;
  if (state.difficulty === 'easy') {
    // Rs 3 to Rs 15 (solvable with Rs 1, Rs 2, Rs 5, Rs 10)
    const options = [3, 4, 5, 6, 7, 8, 10, 12, 14, 15];
    price = options[Math.floor(Math.random() * options.length)];
  } else if (state.difficulty === 'medium') {
    // Rs 14 to Rs 35 (solvable with Rs 1, Rs 2, Rs 5, Rs 10, Rs 20)
    const options = [14, 16, 18, 20, 22, 25, 27, 30, 35];
    price = options[Math.floor(Math.random() * options.length)];
  } else {
    // Rs 30 to Rs 65
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

  // Render tray coins
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

  // Status check
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
    // Purchased!
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
// MODE 5: How Many More / Less? (Comparison)
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

  const countA = Math.floor(Math.random() * (maxA - 4)) + 5; // e.g. 7
  const diff = Math.floor(Math.random() * 4) + 1;            // e.g. 3
  const countB = countA - diff;                             // e.g. 4

  // Choose question type: "less" or "more"
  const isLessQuestion = Math.random() > 0.5;
  const questionType = isLessQuestion ? 'less' : 'more';

  state.compareData = {
    pair,
    countA,
    countB,
    diff,
    questionType
  };

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

  // Render visual rows
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
    cell.innerHTML = `
      <span>${pair.itemA}</span>
      <span class="cell-index">${i}</span>
    `;
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
    cell.innerHTML = `
      <span>${pair.itemB}</span>
      <span class="cell-index">${i}</span>
    `;
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
// MODE 6: Hungry Alligator (< , > , =)
// ==========================================
function setupAlligatorRound() {
  let max = 15;
  if (state.difficulty === 'medium') max = 40;
  else if (state.difficulty === 'hard') max = 99;

  let a = Math.floor(Math.random() * max) + 1;
  let b = Math.floor(Math.random() * max) + 1;

  // 25% chance of equal numbers
  if (Math.random() < 0.25) {
    b = a;
  }

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
// MODE 7: Ten Frame Bonds (Making 10)
// ==========================================
function setupBondsRound() {
  const total = 10;
  const a = Math.floor(Math.random() * 9) + 1; // 1 to 9
  const missing = total - a;

  state.bondsData = { a, missing, total };

  document.getElementById('eqA').textContent = a;
  document.getElementById('eqMissing').textContent = '?';
  document.getElementById('eqTotal').textContent = total;

  // Render 10 cells
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

  // Answer Choices
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

        // Fill empty dots with gold stars!
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

  // Mode Navigation Tabs
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.playPop();
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.game-view').forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      state.mode = btn.dataset.mode;

      const viewId = `mode${state.mode.charAt(0).toUpperCase() + state.mode.slice(1)}`;
      const view = document.getElementById(viewId);
      if (view) view.classList.add('active');

      startNewRound();
    });
  });

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

  // Learn Mode Demo Buttons
  document.getElementById('btnDemoAsc').addEventListener('click', () => runLadderClimb(true));
  document.getElementById('btnDemoDesc').addEventListener('click', () => runLadderClimb(false));
  document.getElementById('btnDemoRandom').addEventListener('click', () => {
    sfx.playPop();
    startNewRound();
  });

  // Coins Mode Actions
  document.querySelectorAll('.coin-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.coin, 10);
      addCoin(val);
    });
  });

  document.getElementById('btnClearCoins').addEventListener('click', () => {
    sfx.playBoing();
    state.coinsPaid = [];
    updateRegisterDisplay();
    speak("Coins cleared! Start fresh!");
  });

  document.getElementById('btnCheckCoins').addEventListener('click', () => {
    checkCoinsPurchase();
  });

  // Alligator Buttons
  document.querySelectorAll('.alli-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleAlligatorChoice(btn.dataset.sign);
    });
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
    const modes = ['learn', 'train', 'balloons', 'coins', 'compare', 'alligator', 'bonds'];
    const nextIdx = (modes.indexOf(state.mode) + 1) % modes.length;
    const nextMode = modes[nextIdx];

    const targetNav = document.querySelector(`.nav-btn[data-mode="${nextMode}"]`);
    if (targetNav) targetNav.click();
  });

  // Initial Start
  startNewRound();
});
