/* ============================================
   周易六十四卦 - 逻辑模块
   ============================================ */

let iChingData = null;
let selectedIChingMethod = null;
let currentHexagram = null;
let iChingQuestion = '';

// 加载数据
async function loadIChingData() {
  if (iChingData) return iChingData;
  const res = await fetch('data/i-ching-64.json');
  if (!res.ok) throw new Error(`加载周易数据失败: ${res.status}`);
  iChingData = await res.json();
  return iChingData;
}

// 选择起卦方式
function selectIChingMethod(method) {
  selectedIChingMethod = method;
  document.querySelectorAll('#method-manual, #method-coin, #method-random').forEach(el => {
    el.classList.remove('selected');
  });
  document.getElementById('method-' + method).classList.add('selected');
  
  // 延迟进入下一步
  setTimeout(() => {
    if (method === 'manual') {
      showHexagramSelector();
    } else {
      showIChingStep('question');
    }
  }, 300);
}

// 显示手动选卦面板
function showHexagramSelector() {
  showIChingStep('selector');
  
  const container = document.getElementById('iching-step-selector') || createHexagramSelector();
  container.style.display = 'block';
}

function createHexagramSelector() {
  const container = document.getElementById('iching-selector-container');
  if (container) {
    container.parentElement.style.display = 'block';
    return container;
  }
  
  loadIChingData().then(data => {
    const grid = document.createElement('div');
    grid.className = 'selection-grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
    
    data.hexagrams.forEach(hex => {
      const item = document.createElement('div');
      item.className = 'selection-item';
      item.style.cursor = 'pointer';
      item.innerHTML = `${hex.symbol}<span style="font-size:0.55rem;color:var(--text-muted);position:absolute;bottom:3px;">${hex.name}</span>`;
      item.onclick = () => {
        currentHexagram = hex;
        showIChingStep('question');
      };
      grid.appendChild(item);
    });
    
    const wrapper = document.createElement('div');
    wrapper.id = 'iching-step-selector';
    wrapper.innerHTML = `
      <div class="input-section">
        <label class="input-label">选择卦象（${data.hexagrams.length}卦）</label>
        <div id="iching-selector-container" class="selection-grid" style="grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));"></div>
        <div style="margin-top:1rem;">
          <button class="btn-primary btn-ghost" onclick="showIChingStep('choose')">返回</button>
        </div>
      </div>
    `;
    wrapper.querySelector('#iching-selector-container').appendChild = grid.appendChild;
    wrapper.querySelector('#iching-selector-container').innerHTML = '';
    wrapper.querySelector('#iching-selector-container').appendChild(grid);
    
    // 插入到 step-question 之前
    const questionStep = document.getElementById('iching-step-question');
    questionStep.parentElement.insertBefore(wrapper, questionStep);
  });
}

// 切换周易步骤
function showIChingStep(step) {
  const steps = ['choose', 'selector', 'question', 'animation', 'result'];
  steps.forEach(s => {
    const el = document.getElementById('iching-step-' + s);
    if (el) el.style.display = 'none';
  });
  
  const target = document.getElementById('iching-step-' + step);
  if (target) target.style.display = 'block';
}

// 上一步
function ichingPrevStep() {
  if (selectedIChingMethod === 'manual') {
    showIChingStep('selector');
  } else {
    showIChingStep('choose');
  }
}

// 开始起卦
async function startIChingDivination() {
  iChingQuestion = document.getElementById('iching-question').value.trim();
  if (!iChingQuestion) {
    showToast('请输入你想问的问题', 'error');
    return;
  }
  
  if (!selectedIChingMethod) {
    showToast('请先选择起卦方式', 'error');
    showIChingStep('choose');
    return;
  }
  
  try {
    await loadIChingData();
    
    // 根据方式生成卦象
    if (selectedIChingMethod === 'manual') {
      if (!currentHexagram) {
        showToast('请先选择卦象', 'error');
        showIChingStep('selector');
        return;
      }
    } else if (selectedIChingMethod === 'coin') {
      currentHexagram = generateHexagramByCoin();
    } else {
      const idx = Math.floor(Math.random() * iChingData.hexagrams.length);
      currentHexagram = iChingData.hexagrams[idx];
    }
    
    // 开始动画
    showIChingStep('animation');
    startIChingAnimation();
  } catch (err) {
    console.error('起卦失败:', err);
    showToast('起卦失败，请重试', 'error');
    showIChingStep('choose');
  }
}

// 铜钱起卦模拟 —— 三枚铜钱掷六次
// 铜钱规则（正面=3字，背面=2字）：
//   三正(3+3+3=9) → 老阳(9) → 变爻 yang → moving
//   二正一背(3+3+2=8) → 少阴(8) → 稳定阴 yin
//   一正二背(3+2+2=7) → 少阳(7) → 稳定阳 yang
//   三背(2+2+2=6) → 老阴(6) → 变爻 yin → moving
function generateHexagramByCoin() {
  const lines = []; // 从初爻到上爻（底→顶）
  for (let i = 0; i < 6; i++) {
    const coins = Array.from({ length: 3 }, () => Math.random() < 0.5 ? 3 : 2);
    const sum = coins.reduce((a, b) => a + b, 0);
    // sum=6 老阴, 7 少阳, 8 少阴, 9 老阳
    if (sum === 6) lines.push('yin');
    else if (sum === 7) lines.push('yang');
    else if (sum === 8) lines.push('yin');
    else lines.push('yang');
  }
  // lines[0]=初爻(下卦底), lines[5]=上爻(上卦顶)
  // 在数据中 lines 数组: [上卦顶, 上卦中, 上卦底, 下卦顶, 下卦中, 下卦底]
  // 所以需要翻转：lines[0]→data[5], lines[1]→data[4], ..., lines[5]→data[0]
  const dataLines = [...lines].reverse();

  // 查找匹配的卦
  const match = iChingData.hexagrams.find(hex =>
    hex.lines.length === 6 &&
    hex.lines.every((l, i) => l === dataLines[i])
  );

  return match || iChingData.hexagrams[Math.floor(Math.random() * 64)];
}

// 推演动画
function startIChingAnimation() {
  const animText = document.getElementById('iching-animation-text');
  const stageEl = document.getElementById('iching-stage');
  
  // 双重 rAF + setTimeout 确保布局完成
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      AnimationEngine.initInk('stage-canvas');
      
      // 安全兜底：如果 canvas 尺寸为 0，手动设置
      if (AnimationEngine.inkCanvas.width < 100 || AnimationEngine.inkCanvas.height < 100) {
        AnimationEngine.inkCanvas.width = Math.max(stageEl.clientWidth, 600);
        AnimationEngine.inkCanvas.height = Math.max(stageEl.clientHeight, 400);
      }
      
      console.log('Canvas size:', AnimationEngine.inkCanvas.width, 'x', AnimationEngine.inkCanvas.height);
      
      const phases = [
        { text: '静心凝神...', duration: 800 },
        { text: '天地之气交汇...', duration: 1000 },
        { text: '卦象成形中...', duration: 1200 },
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
          showIChingResult();
        }
      });
    });
  });
}

// 显示结果
function showIChingResult() {
  showIChingStep('result');
  
  const hex = currentHexagram;
  
  document.getElementById('result-iching-symbol').textContent = hex.symbol;
  document.getElementById('result-iching-name').textContent = `第${hex.number}卦 · ${hex.name} · ${hex.english}`;
  document.getElementById('result-iching-meaning').textContent = hex.meaning;
  
  // 绘制卦象
  const linesContainer = document.getElementById('result-iching-lines');
  linesContainer.innerHTML = '';
  
  // 上卦
  const upperLabel = document.createElement('div');
  upperLabel.className = 'hexagram-trigram-label';
  upperLabel.textContent = '上卦';
  linesContainer.appendChild(upperLabel);
  
  for (let i = 0; i < 3; i++) {
    const line = document.createElement('div');
    line.className = 'hexagram-line ' + hex.lines[i];
    linesContainer.appendChild(line);
  }
  
  // 分隔
  const spacer = document.createElement('div');
  spacer.style.height = '12px';
  linesContainer.appendChild(spacer);
  
  // 下卦
  const lowerLabel = document.createElement('div');
  lowerLabel.className = 'hexagram-trigram-label';
  lowerLabel.textContent = '下卦';
  linesContainer.appendChild(lowerLabel);
  
  for (let i = 3; i < 6; i++) {
    const line = document.createElement('div');
    line.className = 'hexagram-line ' + hex.lines[i];
    linesContainer.appendChild(line);
  }
  
  // 解读文本
  const body = document.getElementById('result-iching-body');
  body.innerHTML = `
    <p><strong>卦辞：</strong>${hex.judgment}</p>
    <p><strong>象辞：</strong>${hex.image}</p>
    <p style="margin-top:1rem;">${hex.reading}</p>
    <p style="color:var(--accent-gold);margin-top:0.5rem;"><strong>🎯 建议：</strong>${hex.advice}</p>
    <p style="margin-top:0.5rem;color:var(--text-muted);font-size:0.85rem;">关键词：${hex.keywords.join(' · ')}</p>
  `;
  
  // 隐藏之前的 AI 解读
  document.getElementById('iching-ai-reading').style.display = 'none';
  document.getElementById('iching-ai-body').textContent = '';
}

// 重置
function resetIChing() {
  selectedIChingMethod = null;
  currentHexagram = null;
  iChingQuestion = '';
  
  document.getElementById('iching-question').value = '';
  document.querySelectorAll('#method-manual, #method-coin, #method-random').forEach(el => {
    el.classList.remove('selected');
  });
  
  AnimationEngine.stopInk();
  showIChingStep('choose');
}
