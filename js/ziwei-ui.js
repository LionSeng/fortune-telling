/* ============================================
   紫微斗数 — UI 逻辑模块
   ============================================ */

let ziweiData = null;
let ziweiChart = null;
let selectedGender = null;
let selectedShiChen = null;
let ziweiQuestion = '';

// 时辰数据
const SHICHEN_LIST = [
  { name: '子时', range: '23:00-01:00', idx: 0 },
  { name: '丑时', range: '01:00-03:00', idx: 1 },
  { name: '寅时', range: '03:00-05:00', idx: 2 },
  { name: '卯时', range: '05:00-07:00', idx: 3 },
  { name: '辰时', range: '07:00-09:00', idx: 4 },
  { name: '巳时', range: '09:00-11:00', idx: 5 },
  { name: '午时', range: '11:00-13:00', idx: 6 },
  { name: '未时', range: '13:00-15:00', idx: 7 },
  { name: '申时', range: '15:00-17:00', idx: 8 },
  { name: '酉时', range: '17:00-19:00', idx: 9 },
  { name: '戌时', range: '19:00-21:00', idx: 10 },
  { name: '亥时', range: '21:00-23:00', idx: 11 }
];

// 加载星曜数据
async function loadZiweiData() {
  if (ziweiData) return ziweiData;
  const res = await fetch('data/ziwei-data.json');
  if (!res.ok) throw new Error('加载紫微斗数数据失败');
  ziweiData = await res.json();
  return ziweiData;
}

// 初始化时辰选择器
function initShiChenSelector() {
  const container = document.getElementById('shichen-selector');
  if (!container) return;

  SHICHEN_LIST.forEach((sc, idx) => {
    const item = document.createElement('div');
    item.className = 'selection-item shichen-item';
    item.style.cssText = 'aspect-ratio:auto;padding:0.5rem 0.75rem;font-size:0.8rem;';
    item.innerHTML = `${sc.name}<span style="font-size:0.6rem;color:var(--text-muted);display:block;">${sc.range}</span>`;
    item.onclick = () => {
      document.querySelectorAll('.shichen-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      selectedShiChen = sc.idx;
    };
    container.appendChild(item);
  });
}

// 选择性别
function selectGender(gender) {
  selectedGender = gender;
  document.querySelectorAll('.gender-item').forEach(el => el.classList.remove('selected'));
  document.getElementById('gender-' + gender).classList.add('selected');
}

// 切换步骤
function showZiweiStep(step) {
  ['input', 'animation', 'result'].forEach(s => {
    const el = document.getElementById('ziwei-step-' + s);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('ziwei-step-' + step);
  if (target) target.style.display = 'block';
}

// 开始排盘
async function startZiweiDivination() {
  const year = parseInt(document.getElementById('zw-year').value);
  const month = parseInt(document.getElementById('zw-month').value);
  const day = parseInt(document.getElementById('zw-day').value);

  if (!year || !month || !day) {
    showToast('请输入完整的出生日期', 'error');
    return;
  }
  if (selectedShiChen === null || selectedShiChen === undefined) {
    showToast('请选择出生时辰', 'error');
    return;
  }
  if (!selectedGender) {
    showToast('请选择性别', 'error');
    return;
  }

  try {
    await loadZiweiData();

    // 排盘
    ziweiChart = ZiweiEngine.calculateChart(year, month, day, selectedShiChen);
    ziweiChart.gender = selectedGender;

    // 开始推演动画
    showZiweiStep('animation');
    startZiweiAnimation();
  } catch (err) {
    console.error('排盘失败:', err);
    showToast('排盘失败：' + err.message, 'error');
  }
}

// 推演动画
function startZiweiAnimation() {
  const animText = document.getElementById('ziwei-animation-text');
  const stageEl = document.getElementById('ziwei-stage');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      AnimationEngine.initStars('stage-canvas-ziwei');

      if (AnimationEngine.starCanvas.width === 0 || AnimationEngine.starCanvas.height === 0) {
        AnimationEngine.starCanvas.width = stageEl.clientWidth || 600;
        AnimationEngine.starCanvas.height = stageEl.clientHeight || 400;
      }

      const phases = [
        { text: '星辰运转...', duration: 800 },
        { text: '推演命盘...', duration: 1200 },
        { text: '十二宫格局已成...', duration: 1000 },
      ];

      let phaseIdx = 0;
      animText.textContent = phases[0].text;

      AnimationEngine.startStarAnimation(1, {
        onPhaseChange(phase) {
          phaseIdx++;
          if (phases[phaseIdx]) {
            animText.textContent = phases[phaseIdx].text;
          }
        },
        onComplete() {
          AnimationEngine.stopStars();
          showZiweiChartResult();
        }
      });
    });
  });
}

// 显示命盘结果
function showZiweiChartResult() {
  showZiweiStep('result');

  const chart = ziweiChart;

  // 四柱信息
  const sizhuEl = document.getElementById('sizhu-display');
  sizhuEl.innerHTML = `
    <div class="sizhu-item">
      <div class="sizhu-label">年柱</div>
      <div class="sizhu-ganzhi">${chart.siZhu.year.gan}${chart.siZhu.year.zhi}</div>
    </div>
    <div class="sizhu-item">
      <div class="sizhu-label">月柱</div>
      <div class="sizhu-ganzhi">${chart.siZhu.month.gan}${chart.siZhu.month.zhi}</div>
    </div>
    <div class="sizhu-item">
      <div class="sizhu-label">日柱</div>
      <div class="sizhu-ganzhi">${chart.siZhu.day.gan}${chart.siZhu.day.zhi}</div>
    </div>
    <div class="sizhu-item">
      <div class="sizhu-label">时柱</div>
      <div class="sizhu-ganzhi">${chart.siZhu.hour.gan}${chart.siZhu.hour.zhi}</div>
    </div>
  `;

  // 中央信息
  const centerEl = document.getElementById('ziwei-chart-center');
  centerEl.innerHTML = `
    <div class="chart-center-info">
      <div class="chart-center-name">${chart.mingGongGan}${chart.mingGongZhi}</div>
      <div class="chart-center-ju">${chart.wuxingJu.naYin}</div>
      <div class="chart-center-detail">${chart.gender === 'male' ? '男' : '女'}命 · ${chart.wuxingJu.wuxing}${chart.wuxingJu.juNum}局</div>
    </div>
  `;

  // 十二宫命盘
  renderZiweiChart(chart);

  // 命宫解读
  const mingPalace = chart.palaces.find(p => p.isMingGong);
  const resultEl = document.getElementById('ziwei-result');
  let resultHTML = '<h3 style="font-family:var(--font-display);margin-bottom:1rem;">命盘概览</h3>';

  if (mingPalace && mingPalace.stars.length > 0) {
    // 找到命宫的主星
    const majorStar = mingPalace.stars.find(s => ziweiData.majorStars[s]);
    if (majorStar) {
      const starInfo = ziweiData.majorStars[majorStar];
      resultHTML += `
        <div class="ming-palace-reading">
          <div class="ming-star-header">
            <span class="ming-star-symbol" style="color:${starInfo.color};">${starInfo.symbol}</span>
            <span class="ming-star-name">${starInfo.name}坐命</span>
            <span class="ming-star-element">${starInfo.element} · ${starInfo.category}</span>
          </div>
          <p style="color:var(--text-secondary);margin:0.5rem 0;">${starInfo.description}</p>
          <p><strong>性格特质：</strong>${starInfo.traits.join(' · ')}</p>
          <p><strong>优势：</strong>${starInfo.strengths}</p>
          <p><strong>需注意：</strong>${starInfo.weaknesses}</p>
        </div>
      `;
    }

    // 如果命宫有多颗主星
    const otherMajorStars = mingPalace.stars.filter(s => ziweiData.majorStars[s] && s !== majorStar);
    if (otherMajorStars.length > 0) {
      resultHTML += '<div style="margin-top:1rem;"><strong>同宫主星：</strong>';
      otherMajorStars.forEach(s => {
        const info = ziweiData.majorStars[s];
        resultHTML += `<span style="color:${info.color};margin-left:0.5rem;">${info.symbol} ${info.name}</span>`;
      });
      resultHTML += '</div>';
    }
  }

  // 各宫主星一览
  resultHTML += '<div style="margin-top:1.5rem;"><h4 style="font-family:var(--font-display);margin-bottom:0.75rem;">各宫主星分布</h4><div class="palace-stars-list">';
  chart.palaces.forEach(palace => {
    const majorStarsInPalace = palace.stars.filter(s => ziweiData.majorStars[s]);
    if (majorStarsInPalace.length > 0) {
      resultHTML += `<div class="palace-star-item">`;
      resultHTML += `<span class="palace-star-name">${palace.name}</span>`;
      majorStarsInPalace.forEach(s => {
        const info = ziweiData.majorStars[s];
        resultHTML += `<span style="color:${info.color};font-size:0.85rem;">${info.symbol} ${info.name}</span>`;
      });
      resultHTML += '</div>';
    }
  });
  resultHTML += '</div></div>';

  resultEl.innerHTML = resultHTML;

  // 隐藏之前的 AI 解读
  document.getElementById('ziwei-ai-reading').style.display = 'none';
  document.getElementById('ziwei-ai-body').textContent = '';

  // 滚动到顶部
  window.scrollTo(0, 0);
}

// 渲染命盘十二宫格
function renderZiweiChart(chart) {
  const container = document.getElementById('ziwei-chart');
  container.innerHTML = '';

  // 命盘布局：4行3列
  // 第1行: 父母 兄弟 命宫(空) 空的布局实际是：
  // 巳(0) 午(1) 未(2) 申(3)
  // 辰(11)          酉(4)
  // 卯(10)          戌(5)
  // 寅(9) 丑(8) 子(7) 亥(6)
  //
  // 但标准命盘是4行x4列（含中央），宫位按逆时针排列
  // 从寅宫开始（左下角），逆时针：寅→卯→辰→巳→午→未→申→酉→戌→亥→子→丑

  // 宫位在网格中的位置（row, col）0-indexed
  const palaceGridPos = [
    [3, 0], // 寅=0 → 行3列0
    [3, 1], // 卯=1 → 行3列1
    [2, 0], // 辰=2 → 行2列0
    [1, 0], // 巳=3 → 行1列0
    [0, 0], // 午=4 → 行0列0
    [0, 1], // 未=5 → 行0列1
    [0, 2], // 申=6 → 行0列2
    [0, 3], // 酉=7 → 行0列3
    [1, 3], // 戌=8 → 行1列3
    [2, 3], // 亥=9 → 行2列3
    [3, 3], // 子=10 → 行3列3
    [3, 2], // 丑=11 → 行3列2
  ];

  // 4x4 网格，中央 2x2 留空
  // 实际布局：
  //   col: 0   1   2   3
  // row0: [午] [未] [申] [酉]
  // row1: [巳] [  中央  ] [戌]
  // row2: [辰] [  中央  ] [亥]
  // row3: [寅] [卯] [丑] [子]

  const gridContainer = document.createElement('div');
  gridContainer.className = 'ziwei-grid';

  // 创建4x4网格
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const cell = document.createElement('div');
      cell.className = 'ziwei-grid-cell';

      // 中央区域（row1-2, col1-2）
      if ((row === 1 || row === 2) && (col === 1 || col === 2)) {
        cell.className += ' ziwei-grid-center';
        continue;
      }

      // 找到这个位置对应的宫位
      const palaceIdx = palaceGridPos.findIndex(([r, c]) => r === row && c === col);
      if (palaceIdx === -1) {
        cell.className += ' ziwei-grid-empty';
        continue;
      }

      const palace = chart.palaces[palaceIdx];
      if (!palace) {
        cell.className += ' ziwei-grid-empty';
        continue;
      }

      cell.className += ' ziwei-palace-cell';
      if (palace.isMingGong) cell.classList.add('ziwei-ming-gong');
      if (palace.isShenGong) cell.classList.add('ziwei-shen-gong');

      const palaceData = ziweiData.palaces[palace.key];

      cell.innerHTML = `
        <div class="palace-cell-header">
          <span class="palace-cell-name" style="color:${palaceData ? palaceData.color : 'var(--text-muted)'};">${palace.name}</span>
          ${palace.isMingGong ? '<span class="palace-badge ming-badge">命</span>' : ''}
          ${palace.isShenGong ? '<span class="palace-badge shen-badge">身</span>' : ''}
        </div>
        <div class="palace-cell-stars">
          ${palace.stars.map(starKey => {
            let starInfo = ziweiData.majorStars[starKey] || ziweiData.minorStars[starKey];
            if (!starInfo) return '';
            const isMajor = ziweiData.majorStars[starKey];
            return `<div class="palace-star ${isMajor ? 'palace-major-star' : 'palace-minor-star'}" 
                         style="color:${starInfo.color};" 
                         data-star="${starKey}"
                         onclick="showStarDetail('${starKey}', '${palace.key}')">
              <span class="star-symbol">${starInfo.symbol}</span>
              <span class="star-name">${starInfo.name}</span>
            </div>`;
          }).join('')}
        </div>
      `;

      // 点击宫格显示详细解读
      cell.onclick = (e) => {
        if (e.target.closest('.palace-star')) return; // 如果点击的是星曜则由星曜处理
        showPalaceDetail(palace);
      };

      gridContainer.appendChild(cell);
    }
  }

  container.appendChild(gridContainer);
}

// 显示星曜详情弹窗
function showStarDetail(starKey, palaceKey) {
  const starInfo = ziweiData.majorStars[starKey] || ziweiData.minorStars[starKey];
  const palaceInfo = ziweiData.palaces[palaceKey];

  if (!starInfo) return;

  // 创建弹窗
  const overlay = document.createElement('div');
  overlay.className = 'ziwei-overlay';
  overlay.onclick = () => overlay.remove();

  const modal = document.createElement('div');
  modal.className = 'ziwei-modal';
  modal.onclick = (e) => e.stopPropagation();

  let content = `
    <div class="ziwei-modal-header">
      <span style="font-size:2rem;color:${starInfo.color};">${starInfo.symbol}</span>
      <div>
        <h3 class="ziwei-modal-title">${starInfo.name}</h3>
        <p class="ziwei-modal-subtitle">${starInfo.element || ''} · ${palaceInfo ? palaceInfo.name : ''}</p>
      </div>
      <button class="ziwei-modal-close" onclick="this.closest('.ziwei-overlay').remove()">✕</button>
    </div>
    <p class="ziwei-modal-desc">${starInfo.description}</p>
  `;

  if (starInfo.palaceEffect && starInfo.palaceEffect[palaceKey]) {
    content += `<p style="margin-top:1rem;"><strong>${palaceInfo.name}中的${starInfo.name}：</strong>${starInfo.palaceEffect[palaceKey]}</p>`;
  }

  if (starInfo.strengths) {
    content += `
      <div class="ziwei-modal-section">
        <p><strong>✦ 优势：</strong>${starInfo.strengths}</p>
        <p><strong>⚠ 注意：</strong>${starInfo.weaknesses || ''}</p>
      </div>
    `;
  }

  if (starInfo.career) {
    content += `
      <div class="ziwei-modal-section">
        <p><strong>💼 事业方向：</strong>${starInfo.career}</p>
      </div>
    `;
  }

  modal.innerHTML = content;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('show'));
}

// 显示宫位详情
function showPalaceDetail(palace) {
  const palaceInfo = ziweiData.palaces[palace.key];
  if (!palaceInfo) return;

  const overlay = document.createElement('div');
  overlay.className = 'ziwei-overlay';
  overlay.onclick = () => overlay.remove();

  const modal = document.createElement('div');
  modal.className = 'ziwei-modal';
  modal.onclick = (e) => e.stopPropagation();

  let content = `
    <div class="ziwei-modal-header">
      <div>
        <h3 class="ziwei-modal-title" style="color:${palaceInfo.color};">${palace.name}</h3>
        <p class="ziwei-modal-subtitle">${palaceInfo.description}</p>
      </div>
      <button class="ziwei-modal-close" onclick="this.closest('.ziwei-overlay').remove()">✕</button>
    </div>
  `;

  // 宫内星曜
  const majorStars = palace.stars.filter(s => ziweiData.majorStars[s]);
  const minorStars = palace.stars.filter(s => ziweiData.minorStars[s]);

  if (majorStars.length > 0) {
    content += '<div class="ziwei-modal-section"><strong>主星：</strong>';
    majorStars.forEach(s => {
      const info = ziweiData.majorStars[s];
      content += ` <span style="color:${info.color};">${info.symbol} ${info.name}</span>`;
    });
    content += '</div>';
  }

  if (minorStars.length > 0) {
    content += '<div class="ziwei-modal-section"><strong>辅星：</strong>';
    minorStars.forEach(s => {
      const info = ziweiData.minorStars[s];
      content += ` <span style="color:${info.color};">${info.symbol} ${info.name}</span>`;
    });
    content += '</div>';
  }

  // 综合解读
  if (majorStars.length > 0) {
    const mainStar = majorStars[0];
    const starInfo = ziweiData.majorStars[mainStar];
    if (starInfo.palaceEffect && starInfo.palaceEffect[palace.key]) {
      content += `
        <div class="ziwei-modal-section" style="margin-top:1rem;">
          <p style="color:var(--text-secondary);line-height:1.8;">${starInfo.palaceEffect[palace.key]}</p>
        </div>
      `;
    }
  }

  modal.innerHTML = content;
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('show'));
}

// 重置
function resetZiwei() {
  selectedGender = null;
  selectedShiChen = null;
  ziweiChart = null;

  document.getElementById('zw-year').value = '';
  document.getElementById('zw-month').value = '';
  document.getElementById('zw-day').value = '';
  document.querySelectorAll('.shichen-item, .gender-item').forEach(el => {
    el.classList.remove('selected');
  });

  AnimationEngine.stopStars();
  showZiweiStep('input');
}

// 页面加载后初始化时辰选择器
document.addEventListener('DOMContentLoaded', () => {
  initShiChenSelector();
});
