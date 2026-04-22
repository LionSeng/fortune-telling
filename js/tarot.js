/* ============================================
   塔罗牌 - 逻辑模块
   ============================================ */

let tarotData = null;
let selectedSpread = 'single';
let drawnCards = [];
let tarotQuestion = '';

// 牌阵定义
const SPREADS = {
  single: { name: '单牌占卜', count: 1, positions: ['启示'] },
  three: { name: '时间之流', count: 3, positions: ['过去', '现在', '未来'] },
  cross: { name: '十字牌阵', count: 5, positions: ['当前处境', '面临的挑战', '潜意识', '建议', '可能的结果'] }
};

// 加载数据
async function loadTarotData() {
  if (tarotData) return tarotData;
  const res = await fetch('data/tarot-78.json');
  if (!res.ok) throw new Error(`加载塔罗数据失败: ${res.status}`);
  tarotData = await res.json();
  return tarotData;
}

// 获取所有牌（78张）
function getAllCards() {
  const cards = [];
  // 大阿卡纳
  tarotData.majorArcana.forEach(c => {
    cards.push({ ...c, arcana: 'major', suitName: '大阿卡纳' });
  });
  // 小阿卡纳
  Object.values(tarotData.minorArcana).forEach(suitCards => {
    suitCards.forEach(c => {
      cards.push({ ...c, arcana: 'minor', suitName: c.suit });
    });
  });
  return cards;
}

// 选择牌阵
function selectTarotSpread(spread) {
  selectedSpread = spread;
  document.querySelectorAll('.spread-option').forEach(el => {
    el.classList.remove('selected');
  });
  document.querySelector(`[data-spread="${spread}"]`).classList.add('selected');
  
  setTimeout(() => {
    showTarotStep('question');
  }, 300);
}

// 切换步骤
function showTarotStep(step) {
  ['spread', 'question', 'animation', 'result'].forEach(s => {
    const el = document.getElementById('tarot-step-' + s);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('tarot-step-' + step);
  if (target) target.style.display = 'block';
}

function tarotPrevStep() {
  showTarotStep('spread');
}

// 开始抽牌
async function startTarotDivination() {
  tarotQuestion = document.getElementById('tarot-question').value.trim();
  if (!tarotQuestion) {
    showToast('请输入你想问的问题', 'error');
    return;
  }
  
  await loadTarotData();
  
  const allCards = getAllCards();
  const spread = SPREADS[selectedSpread];
  
  // 随机抽牌（不重复）
  drawnCards = [];
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  for (let i = 0; i < spread.count; i++) {
    const card = shuffled[i];
    card.isReversed = Math.random() < 0.35; // 35% 逆位
    card.position = spread.positions[i];
    drawnCards.push(card);
  }
  
  // 开始动画
  showTarotStep('animation');
  startTarotAnimation();
}

// 推演动画
function startTarotAnimation() {
  const animText = document.getElementById('tarot-animation-text');
  const stageEl = document.getElementById('tarot-stage');
  
  // 等待浏览器完成布局重排后再初始化 canvas
  requestAnimationFrame(() => {
    AnimationEngine.initStars('stage-canvas-tarot');
    
    // 安全兜底：如果 canvas 尺寸为 0，手动设置
    if (AnimationEngine.starCanvas.width === 0 || AnimationEngine.starCanvas.height === 0) {
      AnimationEngine.starCanvas.width = stageEl.clientWidth || 600;
      AnimationEngine.starCanvas.height = stageEl.clientHeight || 400;
    }
    
    const phases = [
      { text: '星辰流转...', duration: 800 },
      { text: '命运之牌汇聚...', duration: 1000 },
      { text: '揭示你的命运...', duration: 800 },
    ];
    
    let phaseIdx = 0;
    animText.textContent = phases[0].text;
    
    AnimationEngine.startStarAnimation(drawnCards.length, {
      onPhaseChange(phase) {
        phaseIdx++;
        if (phases[phaseIdx]) {
          animText.textContent = phases[phaseIdx].text;
        }
      },
      onComplete() {
        AnimationEngine.stopStars();
        showTarotResult();
      }
    });
  });
}

// 显示结果
function showTarotResult() {
  showTarotStep('result');
  
  const spread = SPREADS[selectedSpread];
  
  document.getElementById('result-tarot-spread-name').textContent = spread.name;
  document.getElementById('result-tarot-title').textContent = `"${tarotQuestion}"`;
  
  // 渲染牌阵
  const spreadDisplay = document.getElementById('tarot-spread-display');
  spreadDisplay.innerHTML = '';
  
  drawnCards.forEach((card, idx) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'tarot-card-display';
    if (card.isReversed) cardEl.classList.add('reversed');
    
    const orientation = card.isReversed ? '逆位' : '正位';
    
    cardEl.innerHTML = `
      <div class="tarot-card-inner">
        <div class="tarot-card-back">✦</div>
        <div class="tarot-card-front">
          <div class="tarot-card-symbol">${card.symbol}</div>
          <div class="tarot-card-name">${card.name}</div>
          <div style="font-size:0.65rem;color:${card.isReversed ? 'var(--accent-east)' : 'var(--accent-gold)'};">${orientation}</div>
          <div class="tarot-card-keywords">${card.isReversed ? card.reversed.split('、').slice(0, 3).join(' · ') : card.upright.split('、').slice(0, 3).join(' · ')}</div>
        </div>
      </div>
      <div class="tarot-position-label">${card.position}</div>
    `;
    
    spreadDisplay.appendChild(cardEl);
    
    // 延迟翻转动画
    setTimeout(() => {
      cardEl.classList.add('flipped');
    }, 500 + idx * 400);
  });
  
  // 解读文本
  const body = document.getElementById('result-tarot-body');
  let bodyHTML = '';
  
  drawnCards.forEach((card, idx) => {
    const orientation = card.isReversed ? '逆位' : '正位';
    const reading = card.isReversed ? card.reading_reversed : card.reading_upright;
    const keywords = card.isReversed ? card.reversed : card.upright;
    
    bodyHTML += `
      <div style="margin-bottom:1.5rem;">
        <p style="font-weight:600;font-size:1rem;margin-bottom:0.3rem;">
          ${card.symbol} ${card.position} — ${card.name}（${orientation}）
        </p>
        <p style="font-size:0.8rem;color:${card.isReversed ? 'var(--accent-east)' : 'var(--accent-gold)'};margin-bottom:0.5rem;">
          关键词：${keywords}
        </p>
        <p>${reading}</p>
      </div>
      ${idx < drawnCards.length - 1 ? '<div style="width:40px;height:1px;background:var(--border-color);margin:1rem auto;"></div>' : ''}
    `;
  });
  
  body.innerHTML = bodyHTML;
  
  // 隐藏之前的 AI 解读
  document.getElementById('tarot-ai-reading').style.display = 'none';
  document.getElementById('tarot-ai-body').textContent = '';
}

// 重置
function resetTarot() {
  selectedSpread = 'single';
  drawnCards = [];
  tarotQuestion = '';
  
  document.getElementById('tarot-question').value = '';
  document.querySelectorAll('.spread-option').forEach(el => {
    el.classList.remove('selected');
  });
  document.querySelector('[data-spread="single"]').classList.add('selected');
  
  AnimationEngine.stopStars();
  showTarotStep('spread');
}
