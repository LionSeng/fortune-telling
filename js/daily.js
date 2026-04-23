/* ============================================
   每日占卜 — 今日神谕
   确定性随机（基于日期种子）+ localStorage 缓存
   ============================================ */

const DailyOracle = {
  STORAGE_KEY: 'divination-daily',
  CACHE_VERSION: 3, // 缓存版本号，格式变更时递增以强制刷新
  ICING_SEED: 42,   // 周易偏移种子
  TAROT_SEED: 137,   // 塔罗偏移种子

  // 基于日期字符串的简单哈希
  _hashDate(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      const ch = dateStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0; // 转32位整数
    }
    return Math.abs(hash);
  },

  // 基于种子的伪随机数 (0-1)
  _seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  },

  // 获取今天的日期字符串 YYYY-MM-DD
  _todayStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  },

  // 读取缓存
  _loadCache() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  },

  // 写入缓存
  _saveCache(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  // 生成今日占卜结果（确定性）
  async generate() {
    const today = this._todayStr();
    const cache = this._loadCache();

    // 缓存命中（需版本号匹配）
    if (cache.version === this.CACHE_VERSION && cache.date === today && cache.iching && cache.tarot) {
      return cache;
    }

    const baseHash = this._hashDate(today);

    // --- 周易：基于日期确定性选卦 ---
    let ichingData;
    // 优先使用预加载的全局缓存（兼容 file:// 协议）
    if (window.__DATA_CACHE__ && window.__DATA_CACHE__.ICHING_64) {
      ichingData = window.__DATA_CACHE__.ICHING_64;
    } else {
      try {
        const res = await fetch('data/i-ching-64.json');
        ichingData = await res.json();
      } catch (err) {
        console.error('[DailyOracle] 加载周易数据失败:', err);
        return null;
      }
    }
    const ichingIdx = (baseHash + this.ICING_SEED) % ichingData.hexagrams.length;
    const hexagram = ichingData.hexagrams[ichingIdx];

    // --- 塔罗：基于日期确定性选牌 ---
    let tarotData;
    if (window.__DATA_CACHE__ && window.__DATA_CACHE__.TAROT_78) {
      tarotData = window.__DATA_CACHE__.TAROT_78;
    } else {
      try {
        const res = await fetch('data/tarot-78.json');
        tarotData = await res.json();
      } catch (err) {
        console.error('[DailyOracle] 加载塔罗数据失败:', err);
        return null;
      }
    }

    // 收集所有塔罗牌（大阿卡纳 + 小阿卡纳）
    const allCards = [];
    tarotData.majorArcana.forEach(c => allCards.push({ ...c, arcana: 'major' }));
    Object.values(tarotData.minorArcana).forEach(suitCards => {
      suitCards.forEach(c => allCards.push({ ...c, arcana: 'minor' }));
    });

    // 选第一张：今日指引牌
    const tarotIdx1 = (baseHash + this.TAROT_SEED) % allCards.length;
    const card1 = allCards[tarotIdx1];
    const isReversed1 = this._seededRandom(baseHash + this.TAROT_SEED + 1) < 0.35;

    // 选第二张：行动建议牌（不与第一张重复）
    let tarotIdx2 = (baseHash + this.TAROT_SEED + 999) % allCards.length;
    if (tarotIdx2 === tarotIdx1) tarotIdx2 = (tarotIdx2 + 1) % allCards.length;
    const card2 = allCards[tarotIdx2];
    const isReversed2 = this._seededRandom(baseHash + this.TAROT_SEED + 1000) < 0.35;

    // 组装结果
    const result = {
      version: this.CACHE_VERSION,
      date: today,
      iching: {
        number: hexagram.number,
        name: hexagram.name,
        english: hexagram.english,
        symbol: hexagram.symbol,
        meaning: hexagram.meaning,
        judgment: hexagram.judgment,
        image: hexagram.image,
        advice: hexagram.advice,
        keywords: hexagram.keywords,
        lines: hexagram.lines
      },
      tarot: [
        {
          name: card1.name,
          symbol: card1.symbol,
          isReversed: isReversed1,
          position: '今日指引',
          keywords: isReversed1 ? card1.reversed : card1.upright,
          reading: isReversed1 ? card1.reading_reversed : card1.reading_upright
        },
        {
          name: card2.name,
          symbol: card2.symbol,
          isReversed: isReversed2,
          position: '行动建议',
          keywords: isReversed2 ? card2.reversed : card2.upright,
          reading: isReversed2 ? card2.reading_reversed : card2.reading_upright
        }
      ],
      // 生成一句综合寄语
      fortune: this._generateFortune(hexagram, [card1, card2], [isReversed1, isReversed2])
    };

    this._saveCache(result);
    return result;
  },

  // 综合寄语生成
  _generateFortune(hex, cards, isReversedArr) {
    const ir0 = isReversedArr[0] ? '（逆位）' : '（正位）';
    const ir1 = isReversedArr[1] ? '（逆位）' : '（正位）';
    // 防御：确保 keywords 是字符串
    const kw0 = typeof cards[0].keywords === 'string' ? cards[0].keywords : (Array.isArray(cards[0].keywords) ? cards[0].keywords.join('、') : '');
    const kw1 = typeof cards[1].keywords === 'string' ? cards[1].keywords : (Array.isArray(cards[1].keywords) ? cards[1].keywords.join('、') : '');
    const fortunes = [
      `${hex.symbol} ${hex.name}卦启示今日${hex.advice.split('。')[0]}。${cards[0].symbol} ${cards[0].name}${ir0}提醒你关注内心的声音，顺势而行。`,
      `今日${hex.meaning.split('·')[0].trim()}。${cards[1].symbol} ${cards[1].name}${ir1}为你指引方向——${kw1.split('、')[0]}是今天的主题。`,
      `${hex.name}卦有云：「${hex.judgment}」。今日宜${hex.keywords[Math.abs(this._hashDate(this._todayStr())) % hex.keywords.length]}，${isReversedArr[0] ? '注意' : '把握'}${kw0.split('、')[0]}带来的机遇。`
    ];
    return fortunes[Math.abs(this._hashDate(this._todayStr())) % fortunes.length];
  },

  // 检查今日是否已查看
  hasViewedToday() {
    const cache = this._loadCache();
    return cache.version === this.CACHE_VERSION && cache.date === this._todayStr() && cache.viewed === true;
  },

  // 标记今日已查看
  markViewed() {
    const cache = this._loadCache();
    if (cache.version === this.CACHE_VERSION && cache.date === this._todayStr()) {
      cache.viewed = true;
      this._saveCache(cache);
    }
  },

  // 渲染首页卡片（预览状态）
  renderHomeCard() {
    const cache = this._loadCache();
    const today = this._todayStr();
    const hasData = cache.version === this.CACHE_VERSION && cache.date === today && cache.iching && cache.tarot;
    const viewed = hasData && cache.viewed;

    const card = document.getElementById('daily-card');
    if (!card) return;

    if (viewed) {
      // 已查看：展示预览摘要
      card.innerHTML = `
        <span class="card-badge badge-daily">每日</span>
        <div class="daily-card-preview">
          <div class="daily-preview-row">
            <span class="daily-preview-icon">${cache.iching.symbol}</span>
            <div class="daily-preview-info">
              <div class="daily-preview-label">今日卦象</div>
              <div class="daily-preview-value">${cache.iching.name} · ${cache.iching.meaning.split('·')[0].trim()}</div>
            </div>
          </div>
          <div class="daily-preview-row">
            <span class="daily-preview-icon">${cache.tarot[0].symbol}</span>
            <div class="daily-preview-info">
              <div class="daily-preview-label">今日指引</div>
              <div class="daily-preview-value">${cache.tarot[0].name}${cache.tarot[0].isReversed ? '（逆位）' : ''}</div>
            </div>
          </div>
        </div>
        <div class="daily-card-footer">
          <span class="daily-card-date">${this._formatDate(today)}</span>
          <span class="daily-card-hint">点击查看详情 →</span>
        </div>
      `;
    } else {
      // 未查看：展示「开启今日神谕」
      card.innerHTML = `
        <span class="card-badge badge-daily">每日</span>
        <div class="daily-card-unopened">
          <div class="daily-card-glow"></div>
          <div class="daily-card-icon">✦</div>
          <h2 class="daily-card-title">今日神谕</h2>
          <p class="daily-card-desc">每日一卦 · 一牌，宇宙今日给你的专属启示</p>
        </div>
      `;
    }
  },

  // 格式化日期
  _formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return `${parseInt(m)}月${parseInt(d)}日 周${weekDays[date.getDay()]}`;
  },

  // 展开/查看今日神谕详情
  async showDetail() {
    const overlay = document.getElementById('daily-overlay');
    const content = document.getElementById('daily-detail-content');
    if (!overlay || !content) return;

    // 清除可能残留的内联 display 样式，确保 CSS class 正常生效
    overlay.style.removeProperty('display');

    // 显示加载状态
    overlay.classList.add('open');
    content.innerHTML = `
      <div class="daily-loading">
        <div class="daily-loading-spinner"></div>
        <div style="margin-top:1rem;color:var(--text-secondary);">正在聆听宇宙之声...</div>
      </div>
    `;

    const data = await this.generate();
    if (!data) {
      content.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--text-muted);">数据加载失败，请稍后再试</div>`;
      return;
    }

    this.markViewed();
    this.renderHomeCard();

    // 渲染详情
    content.innerHTML = `
      <div class="daily-detail">
        <!-- 关闭按钮 -->
        <button class="daily-close-btn" onclick="DailyOracle.closeDetail()">✕</button>

        <!-- 日期标题 -->
        <div class="daily-detail-header">
          <div class="daily-detail-date">${this._formatDate(data.date)}</div>
          <h2 class="daily-detail-title">今日神谕</h2>
        </div>

        <!-- 综合寄语 -->
        <div class="daily-fortune-banner">
          <div class="daily-fortune-text">${data.fortune}</div>
        </div>

        <!-- 周易卦象 -->
        <div class="daily-section daily-section-iching">
          <div class="daily-section-label">☯ 今日卦象</div>
          <div class="daily-iching-card">
            <div class="daily-iching-header">
              <span class="daily-iching-symbol">${data.iching.symbol}</span>
              <div>
                <div class="daily-iching-name">第${data.iching.number}卦 · ${data.iching.name}</div>
                <div class="daily-iching-english">${data.iching.english}</div>
                <div class="daily-iching-meaning">${data.iching.meaning}</div>
              </div>
            </div>
            <div class="daily-iching-lines">
              ${this._renderHexLines(data.iching.lines)}
            </div>
            <div class="daily-iching-text">
              <p><strong>卦辞：</strong>${data.iching.judgment}</p>
              <p><strong>象辞：</strong>${data.iching.image}</p>
            </div>
            <div class="daily-iching-advice">
              <strong>🎯 今日建议：</strong>${data.iching.advice}
            </div>
          </div>
        </div>

        <!-- 塔罗双牌 -->
        <div class="daily-section daily-section-tarot">
          <div class="daily-section-label">🃏 今日指引</div>
          <div class="daily-tarot-pair">
            ${data.tarot.map((card, idx) => `
              <div class="daily-tarot-item ${card.isReversed ? 'reversed' : ''}">
                <div class="daily-tarot-position">${card.position}</div>
                <div class="daily-tarot-card-display">
                  <div class="daily-tarot-symbol">${card.symbol}</div>
                  <div class="daily-tarot-name">${card.name}</div>
                  <div class="daily-tarot-orient ${card.isReversed ? 'orient-rev' : 'orient-up'}">
                    ${card.isReversed ? '逆位' : '正位'}
                  </div>
                </div>
                <div class="daily-tarot-keywords">${(typeof card.keywords === 'string' ? card.keywords : card.keywords.join('、')).split('、').slice(0, 3).join(' · ')}</div>
                <div class="daily-tarot-reading">${card.reading}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 底部关键词 -->
        <div class="daily-keywords">
          ${data.iching.keywords.map(k => `<span class="daily-keyword-tag">${k}</span>`).join('')}
        </div>

        <!-- 操作按钮 -->
        <div class="daily-actions">
          <button class="btn-primary btn-ghost" onclick="DailyOracle.closeDetail()">关闭</button>
          <button class="btn-primary btn-ghost" onclick="DailyOracle.shareDaily()">📤 分享</button>
          <button class="btn-primary btn-ai" onclick="requestAIReading('daily')">🔮 AI 深度解读</button>
        </div>

        <!-- AI 解读区域 -->
        <div class="ai-reading" id="daily-ai-reading" style="display:none;">
          <div class="ai-reading-header">🤖 AI 深度解读</div>
          <div class="ai-reading-body" id="daily-ai-body"></div>
        </div>
      </div>
    `;

    // 卡片入场动画
    setTimeout(() => {
      content.querySelectorAll('.daily-section').forEach((el, i) => {
        setTimeout(() => el.classList.add('daily-section-visible'), 100 + i * 200);
      });
    }, 50);
  },

  // 渲染卦象爻线
  _renderHexLines(lines) {
    let html = '';
    for (let i = 0; i < 6; i++) {
      html += `<div class="daily-hex-line daily-hex-${lines[i]}"></div>`;
    }
    return html;
  },

  // 用原生 Canvas 绘制今日神谕分享图（不依赖 html2canvas）
  async shareDaily() {
    const cache = this._loadCache();
    if (!cache.iching || !cache.tarot) {
      showToast('暂无可分享的内容', 'error');
      return;
    }

    // 生成底部祝福语（不依赖 AI 解读）
    const blessings = [
      `愿今日的${cache.iching.name}卦为你照亮前路，${cache.tarot[0].name}指引你心中所向。`,
      `${cache.iching.name}卦示今日之机，${cache.tarot[0].name}${cache.tarot[0].isReversed ? '逆位提醒你沉淀内心' : '正位为你带来力量'}。愿一切顺遂。`,
      `宇宙今日为你翻开${cache.iching.name}卦，搭配${cache.tarot[0].name}的启示——愿你所行皆坦途，所遇皆温柔。`,
      `今日以${cache.iching.name}卦为引，${cache.tarot[0].name}为伴。愿你顺势而为，心想事成。`
    ];
    const blessing = blessings[this._hashDate(this._todayStr()) % blessings.length];

    showToast('正在生成分享图片...', '');

    try {
      const W = 750;
      const P = 40; // 左右 padding
      const textW = W - P * 2; // 可用文本宽度

      const ctx = document.createElement('canvas').getContext('2d');
      const fortuneText = cache.fortune || '';
      const kwArr = cache.iching.keywords || [];

      // ========== 第一遍：测量总高度 ==========
      let y = P;

      // 顶部装饰线
      y += 30;

      // 日期 + 标题
      y += 45 + 40;

      // 综合寄语（动态测量）
      ctx.font = '22px sans-serif';
      const fortuneLines = wrapText(ctx, fortuneText, textW - 40);
      const fortuneBoxH = Math.max(fortuneLines.length * 30 + 20, 60);
      y += fortuneBoxH + 50;

      // 周易卦象标题
      y += 35;

      // 英文名 + 含义（可能换行）
      ctx.font = '20px sans-serif';
      const ichingSub = `${cache.iching.english}  ·  ${cache.iching.meaning}`;
      const ichingSubLines = wrapText(ctx, ichingSub, textW);
      y += 30 + ichingSubLines.length * 28;

      // 卦辞 + 象辞（每条可能换行，最多各2行）
      ctx.font = '18px sans-serif';
      const judgmentLines = wrapText(ctx, `卦辞：${cache.iching.judgment}`, textW).slice(0, 2);
      const imageLines = wrapText(ctx, `象辞：${cache.iching.image}`, textW).slice(0, 2);
      y += judgmentLines.length * 26 + 8 + imageLines.length * 26 + 35;

      // 今日建议（可能换行，最多2行）
      ctx.font = 'bold 20px sans-serif';
      const adviceLines = wrapText(ctx, `🎯 今日建议：${cache.iching.advice}`, textW).slice(0, 2);
      y += adviceLines.length * 28 + 50;

      // 塔罗双牌（动态计算卡片高度）
      ctx.font = '16px sans-serif';
      const cardW = (textW - 20) / 2;
      let maxTarotH = 0;
      cache.tarot.forEach(card => {
        const readingLines = wrapText(ctx, card.reading, cardW - 24).slice(0, 4);
        const h = 100 + readingLines.length * 22 + 16;
        if (h > maxTarotH) maxTarotH = h;
      });
      y += maxTarotH + 20;

      // 关键词
      ctx.font = '16px sans-serif';
      const kwText = kwArr.map(k => `#${k}`).join('  ');
      const kwLines = wrapText(ctx, kwText, textW - 40);
      y += kwLines.length * 24 + 30;

      // 分隔线 + 祝福语
      ctx.font = 'italic 20px sans-serif';
      const blessingLines = wrapText(ctx, blessing, textW - 60);
      y += 30 + 40 + blessingLines.length * 30 + 25;

      // 底部水印
      y += 15 + 30 + 24 + 30;

      const canvasH = y + 10;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = canvasH;
      const c = canvas.getContext('2d');

      // ========== 第二遍：正式绘制 ==========
      y = P;

      // --- 浅色背景 ---
      c.fillStyle = '#f8f6f1';
      c.fillRect(0, 0, W, canvasH);

      // --- 顶部装饰线 ---
      const grad = c.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
      grad.addColorStop(0, 'rgba(180,140,50,0)');
      grad.addColorStop(0.5, 'rgba(180,140,50,0.5)');
      grad.addColorStop(1, 'rgba(180,140,50,0)');
      c.strokeStyle = grad;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(W * 0.1, y);
      c.lineTo(W * 0.9, y);
      c.stroke();
      y += 30;

      // --- 日期 ---
      c.textAlign = 'center';
      c.font = '24px sans-serif';
      c.fillStyle = '#999';
      c.fillText(this._formatDate(cache.date), W / 2, y);
      y += 45;

      // --- 标题 ---
      c.font = 'bold 36px sans-serif';
      c.fillStyle = '#8b6914';
      c.fillText('\u2726 今日神谕 \u2726', W / 2, y);
      y += 40;

      // --- 综合寄语（背景框高度 = 动态计算） ---
      const fortuneGrad = c.createLinearGradient(P, 0, W - P, 0);
      fortuneGrad.addColorStop(0, 'rgba(180,140,50,0.06)');
      fortuneGrad.addColorStop(0.5, 'rgba(180,140,50,0.12)');
      fortuneGrad.addColorStop(1, 'rgba(180,140,50,0.06)');
      c.fillStyle = fortuneGrad;
      roundRect(c, P, y, textW, fortuneBoxH, 12);
      c.fill();

      c.font = '22px sans-serif';
      c.fillStyle = '#5a4a2a';
      const textStartY = y + (fortuneBoxH - fortuneLines.length * 30) / 2 + 24;
      fortuneLines.forEach((line, i) => {
        c.fillText(line, W / 2, textStartY + i * 30);
      });
      y += fortuneBoxH + 50;

      // --- 周易卦象 ---
      c.font = 'bold 26px sans-serif';
      c.fillStyle = '#8b6914';
      c.textAlign = 'left';
      c.fillText(`\u262F 第${cache.iching.number}卦 \u00B7 ${cache.iching.name}`, P, y);
      y += 35;

      c.font = '20px sans-serif';
      c.fillStyle = '#888';
      ichingSubLines.forEach(line => {
        c.fillText(line, P, y);
        y += 28;
      });
      y += 4;

      // 卦辞 + 象辞（自动换行，各限2行）
      c.font = '18px sans-serif';
      c.fillStyle = '#555';
      judgmentLines.forEach(line => {
        c.fillText(line, P, y);
        y += 26;
      });
      y += 8;
      imageLines.forEach(line => {
        c.fillText(line, P, y);
        y += 26;
      });
      y += 35;

      // 今日建议（自动换行，限2行）
      c.font = 'bold 20px sans-serif';
      c.fillStyle = '#6b5a20';
      adviceLines.forEach(line => {
        c.fillText(line, P, y);
        y += 28;
      });
      y += 50 - (adviceLines.length > 1 ? 28 : 0);

      // --- 塔罗双牌 ---
      cache.tarot.forEach((card, idx) => {
        const cx = P + idx * (cardW + 20);
        const orient = card.isReversed ? '（逆位）' : '（正位）';

        // 测量此牌的实际内容高度
        c.font = '16px sans-serif';
        const rLines = wrapText(c, card.reading, cardW - 24).slice(0, 4);
        const thisCardH = Math.max(maxTarotH, 160);

        // 卡片背景
        c.fillStyle = 'rgba(0,0,0,0.04)';
        roundRect(c, cx, y, cardW, thisCardH, 12);
        c.fill();
        if (card.isReversed) {
          c.strokeStyle = 'rgba(197,61,67,0.25)';
          c.lineWidth = 1;
          roundRect(c, cx, y, cardW, thisCardH, 12);
          c.stroke();
        }

        c.textAlign = 'center';
        c.font = '16px sans-serif';
        c.fillStyle = '#999';
        c.fillText(card.position, cx + cardW / 2, y + 22);

        c.font = '36px sans-serif';
        c.fillText(card.symbol, cx + cardW / 2, y + 62);

        c.font = 'bold 20px sans-serif';
        c.fillStyle = card.isReversed ? '#c53d43' : '#8b6914';
        c.fillText(`${card.name}${orient}`, cx + cardW / 2, y + 95);

        c.font = '16px sans-serif';
        c.fillStyle = '#666';
        rLines.forEach((line, li) => {
          c.fillText(line, cx + cardW / 2, y + 120 + li * 22);
        });
      });
      y += maxTarotH + 20;

      // --- 关键词 ---
      if (kwArr.length > 0) {
        c.textAlign = 'center';
        c.font = '16px sans-serif';
        kwLines.forEach(line => {
          c.fillStyle = '#a09070';
          c.fillText(line, W / 2, y);
          y += 24;
        });
        y += 30;
      }

      // --- 分隔线 ---
      const sumGrad = c.createLinearGradient(W * 0.3, 0, W * 0.7, 0);
      sumGrad.addColorStop(0, 'rgba(180,140,50,0)');
      sumGrad.addColorStop(0.5, 'rgba(180,140,50,0.3)');
      sumGrad.addColorStop(1, 'rgba(180,140,50,0)');
      c.strokeStyle = sumGrad;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(W * 0.2, y);
      c.lineTo(W * 0.8, y);
      c.stroke();
      y += 30;

      // --- 祝福语 ---
      c.textAlign = 'center';
      c.font = '28px serif';
      c.fillStyle = 'rgba(180,140,50,0.35)';
      c.fillText('\u201C', W / 2, y + 16);
      y += 20;

      c.font = 'italic 20px sans-serif';
      c.fillStyle = '#5a4a2a';
      blessingLines.forEach(line => {
        y += 30;
        c.fillText(line, W / 2, y);
      });
      y += 25;

      c.font = '28px serif';
      c.fillStyle = 'rgba(180,140,50,0.35)';
      c.fillText('\u201D', W / 2, y + 8);

      // --- 底部水印 ---
      y += 30;
      const btmGrad = c.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
      btmGrad.addColorStop(0, 'rgba(180,140,50,0)');
      btmGrad.addColorStop(0.5, 'rgba(180,140,50,0.3)');
      btmGrad.addColorStop(1, 'rgba(180,140,50,0)');
      c.strokeStyle = btmGrad;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(W * 0.15, y);
      c.lineTo(W * 0.85, y);
      c.stroke();
      y += 30;

      c.font = 'bold 22px sans-serif';
      c.fillStyle = '#8b6914';
      c.fillText('神谕占卜台', W / 2, y);
      y += 24;
      c.font = '14px sans-serif';
      c.fillStyle = '#aaa';
      c.fillText('Oracle Divination', W / 2, y);

      const dataUrl = canvas.toDataURL('image/png');
      showSharePanel(dataUrl);

    } catch (err) {
      console.error('[DailyOracle] shareDaily error:', err);
      showToast('生成分享图片失败', 'error');
    }
  },

  // 关闭详情
  closeDetail() {
    const overlay = document.getElementById('daily-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      // 清除可能残留的内联 display 样式（防止 showSharePanel 等操作干扰）
      overlay.style.removeProperty('display');
    }
  },

  // 初始化
  async init() {
    this.renderHomeCard();
  }
};

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
  DailyOracle.init();
});

// Canvas 辅助函数
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  if (!text) return [''];
  const lines = [];
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const test = current + text[i];
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = text[i];
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
