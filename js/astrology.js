/* ============================================
   占星术 - 逻辑 + UI 模块
   ============================================ */

let astrologyData = null;
let selectedBirthInfo = { month: null, day: null };
let astrologyResult = null;

// 加载数据
async function loadAstrologyData() {
  if (astrologyData) return astrologyData;
  const res = await fetch('data/astrology-data.json');
  if (!res.ok) throw new Error('加载占星数据失败');
  astrologyData = await res.json();
  return astrologyData;
}

// 根据公历日期判断星座
function getZodiacSign(month, day) {
  // 用每月的起始日期来确定星座，按顺序检查
  // 格式: [月, 日, 星座index]
  // 星座顺序: 0白羊 1金牛 2双子 3巨蟹 4狮子 5处女 6天秤 7天蝎 8射手 9摩羯 10水瓶 11双鱼
  const boundaries = [
    [1,  20, 10], // 1/20起 → 水瓶座
    [2,  19, 11], // 2/19起 → 双鱼座
    [3,  21,  0], // 3/21起 → 白羊座
    [4,  20,  1], // 4/20起 → 金牛座
    [5,  21,  2], // 5/21起 → 双子座
    [6,  21,  3], // 6/21起 → 巨蟹座
    [7,  23,  4], // 7/23起 → 狮子座
    [8,  23,  5], // 8/23起 → 处女座
    [9,  23,  6], // 9/23起 → 天秤座
    [10, 23,  7], // 10/23起 → 天蝎座
    [11, 22,  8], // 11/22起 → 射手座
    [12, 22,  9], // 12/22起 → 摩羯座
  ];

  // 1/1 - 1/19 是摩羯座
  if (month === 1 && day < 20) return 9;

  // 从后往前找，找到第一个 month >= b[0] 的
  for (let i = boundaries.length - 1; i >= 0; i--) {
    const [bm, bd, idx] = boundaries[i];
    if (month > bm || (month === bm && day >= bd)) {
      return idx;
    }
  }

  return 9; // fallback
}

// 选择月份
function selectAstroMonth(m) {
  selectedBirthInfo.month = m;
  // 切换月份时清空已选日期，避免保留无效日期（如2月没有31日）
  selectedBirthInfo.day = null;
  document.querySelectorAll('.astro-month-item').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById('astro-month-' + m);
  if (el) el.classList.add('selected');
}

// 选择日期
function selectAstroDay(d) {
  selectedBirthInfo.day = d;
  document.querySelectorAll('.astro-day-item').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById('astro-day-' + d);
  if (el) el.classList.add('selected');
}

// 初始化日期选择器
function initAstroDatePicker() {
  const monthGrid = document.getElementById('astro-month-grid');
  const dayGrid = document.getElementById('astro-day-grid');
  if (!monthGrid || !dayGrid) return;

  monthGrid.innerHTML = '';
  for (let m = 1; m <= 12; m++) {
    const item = document.createElement('div');
    item.className = 'selection-item astro-month-item';
    item.id = 'astro-month-' + m;
    item.style.aspectRatio = 'auto';
    item.style.padding = '0.5rem';
    item.textContent = m + '月';
    item.onclick = () => {
      selectAstroMonth(m);
      updateDayGrid();
    };
    monthGrid.appendChild(item);
  }

  updateDayGrid();
}

// 更新日期网格（根据月份动态天数）
function updateDayGrid() {
  const dayGrid = document.getElementById('astro-day-grid');
  if (!dayGrid) return;

  const m = selectedBirthInfo.month || 1;
  const daysInMonth = new Date(2024, m, 0).getDate(); // 2024是闰年

  dayGrid.innerHTML = '';
  for (let d = 1; d <= daysInMonth; d++) {
    const item = document.createElement('div');
    item.className = 'selection-item astro-day-item';
    item.id = 'astro-day-' + d;
    item.style.aspectRatio = 'auto';
    item.style.padding = '0.4rem';
    item.style.fontSize = '0.85rem';
    item.textContent = d;
    item.onclick = () => selectAstroDay(d);
    dayGrid.appendChild(item);
  }
}

// 开始占星
async function startAstrologyDivination() {
  if (!selectedBirthInfo.month || !selectedBirthInfo.day) {
    showToast('请选择出生月日', 'error');
    return;
  }

  try {
    await loadAstrologyData();
    showAstroStep('animation');
    startAstroAnimation();
  } catch (err) {
    console.error('占星失败:', err);
    showToast('占星失败，请重试', 'error');
    showAstroStep('input');
  }
}

// 推演动画
function startAstroAnimation() {
  const animText = document.getElementById('astro-animation-text');
  const stageEl = document.getElementById('astro-stage');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      AnimationEngine.initInk('stage-canvas-astro');

      if (AnimationEngine.inkCanvas.width < 100 || AnimationEngine.inkCanvas.height < 100) {
        AnimationEngine.inkCanvas.width = Math.max(stageEl.clientWidth, 600);
        AnimationEngine.inkCanvas.height = Math.max(stageEl.clientHeight, 400);
      }

      const phases = [
        { text: '仰望星空...', duration: 800 },
        { text: '星辰排列中...', duration: 1000 },
        { text: '黄道十二宫显现...', duration: 1200 },
      ];

      let phaseIdx = 0;
      animText.textContent = phases[0].text;

      AnimationEngine.startInkAnimation({
        onPhaseChange(phase) {
          phaseIdx++;
          if (phases[phaseIdx]) {
            animText.textContent = phases[phaseIdx].text;
          }
        },
        onComplete() {
          AnimationEngine.stopInk();
          showAstrologyResult();
        }
      });
    });
  });
}

// 显示结果
function showAstrologyResult() {
  const signIdx = getZodiacSign(selectedBirthInfo.month, selectedBirthInfo.day);
  const sign = astrologyData.signs[signIdx];
  astrologyResult = sign;

  showAstroStep('result');

  // 基本信息
  document.getElementById('result-astro-symbol').textContent = sign.symbol;
  document.getElementById('result-astro-name').textContent = `${sign.name} · ${sign.english}`;
  document.getElementById('result-astro-element').textContent = `${sign.element}象 · ${sign.modality}宫 · ${sign.ruler}守护`;

  // 特质标签
  const traitsEl = document.getElementById('result-astro-traits');
  traitsEl.innerHTML = sign.traits.map(t => `<span class="astro-trait-tag">${t}</span>`).join('');

  // 星座轮盘
  renderZodiacWheel(signIdx);

  // 详细解读
  const body = document.getElementById('result-astro-body');
  body.innerHTML = `
    <div class="astro-detail-section">
      <h4>✨ ${sign.name}总览</h4>
      <p>${sign.description}</p>
    </div>
    <div class="astro-detail-grid">
      <div class="astro-detail-card">
        <div class="astro-detail-label">💪 优势</div>
        <p>${sign.strengths}</p>
      </div>
      <div class="astro-detail-card">
        <div class="astro-detail-label">⚠️ 挑战</div>
        <p>${sign.weaknesses}</p>
      </div>
    </div>
    <div class="astro-detail-grid">
      <div class="astro-detail-card">
        <div class="astro-detail-label">💕 爱情</div>
        <p>${sign.love}</p>
      </div>
      <div class="astro-detail-card">
        <div class="astro-detail-label">💼 事业</div>
        <p>${sign.career}</p>
      </div>
    </div>
    <div class="astro-compat-section">
      <h4>💜 最佳拍档</h4>
      <div class="astro-compat-list">
        ${sign.compatibility.map(name => {
          const compat = astrologyData.signs.find(s => s.name === name);
          return compat ? `<span class="astro-compat-item">${compat.symbol} ${name}</span>` : '';
        }).join('')}
      </div>
    </div>
    <div class="astro-keywords-section">
      <p class="astro-keywords">关键词：${sign.keywords}</p>
    </div>
  `;

  // 宫位参考折叠区
  renderAstroHouses(sign);

  // 隐藏之前的 AI 解读
  document.getElementById('astro-ai-reading').style.display = 'none';
  document.getElementById('astro-ai-body').textContent = '';
}

// 渲染星座轮盘
function renderZodiacWheel(activeIdx) {
  const wheel = document.getElementById('astro-zodiac-wheel');
  if (!wheel) return;
  wheel.innerHTML = '';

  astrologyData.signs.forEach((sign, idx) => {
    const sector = document.createElement('div');
    sector.className = 'zodiac-sector' + (idx === activeIdx ? ' active' : '');

    // 根据元素决定颜色
    const elementColors = {
      '火': 'var(--accent-east)',
      '土': 'var(--accent-gold)',
      '风': 'var(--accent-west)',
      '水': '#06b6d4'
    };
    const color = elementColors[sign.element] || 'var(--text-muted)';

    sector.style.setProperty('--sector-color', color);
    sector.innerHTML = `
      <span class="zodiac-sector-symbol">${sign.symbol}</span>
      <span class="zodiac-sector-name">${sign.name}</span>
    `;

    if (idx === activeIdx) {
      sector.onclick = () => {
        // 点击当前星座不做事
      };
    }

    wheel.appendChild(sector);
  });
}

// 切换占星步骤
function showAstroStep(step) {
  const steps = ['input', 'animation', 'result'];
  steps.forEach(s => {
    const el = document.getElementById('astro-step-' + s);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('astro-step-' + step);
  if (target) target.style.display = 'block';
}

// 重置
// 渲染宫位参考（折叠区块）
function renderAstroHouses(sign) {
  const container = document.getElementById('astro-houses-display');
  if (!container || !astrologyData || !astrologyData.houses) return;

  // 为当前星座的元素分配宫位增强描述
  const elementHouses = {
    '火': [1, 5, 9],   // 火象：自我宫、创造宫、探索宫
    '土': [2, 6, 10],  // 土象：财富宫、健康宫、事业宫
    '风': [3, 7, 11],  // 风象：沟通宫、伴侣宫、社群宫
    '水': [4, 8, 12]   // 水象：家庭宫、转化宫、灵性宫
  };

  const highlightedHouses = elementHouses[sign.element] || [];

  const housesHTML = astrologyData.houses.map((h, i) => {
    const isHighlighted = highlightedHouses.includes(i + 1);
    return `
      <div class="astro-house-item ${isHighlighted ? 'highlighted' : ''}">
        <div class="astro-house-header">
          <span class="astro-house-num">${h.name}</span>
          <span class="astro-house-keyword">${h.keyword}</span>
          ${isHighlighted ? '<span class="astro-house-badge">★</span>' : ''}
        </div>
        <div class="astro-house-area">${h.area}</div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="astro-houses-section">
      <div class="astro-houses-toggle" onclick="toggleAstroHouses()">
        <h4>🏛️ 十二宫位参考</h4>
        <span class="astro-houses-arrow" id="astro-houses-arrow">▸</span>
      </div>
      <div class="astro-houses-grid" id="astro-houses-grid" style="display:none;">
        ${housesHTML}
        <div class="astro-houses-legend">
          <span>★ ${sign.name} (${sign.element}象) 的天然守护宫位</span>
        </div>
      </div>
    </div>
  `;
}

// 切换宫位展开/折叠
function toggleAstroHouses() {
  const grid = document.getElementById('astro-houses-grid');
  const arrow = document.getElementById('astro-houses-arrow');
  if (!grid) return;
  const isOpen = grid.style.display !== 'none';
  grid.style.display = isOpen ? 'none' : 'grid';
  if (arrow) arrow.textContent = isOpen ? '▸' : '▾';
}

function resetAstrology() {
  selectedBirthInfo = { month: null, day: null };
  astrologyResult = null;

  document.querySelectorAll('.astro-month-item, .astro-day-item').forEach(el => {
    el.classList.remove('selected');
  });

  AnimationEngine.stopInk();
  showAstroStep('input');
}
