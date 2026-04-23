/* ============================================
   分享/截图功能模块
   ============================================ */

// 分享结果
async function shareResult(elementId) {
  // 检查 html2canvas 是否加载
  if (typeof html2canvas === 'undefined') {
    showToast('截图组件加载中，请稍后再试', 'error');
    return;
  }

  const element = document.getElementById(elementId);
  if (!element) {
    console.error('[share] 元素未找到:', elementId);
    showToast('未找到要分享的内容', 'error');
    return;
  }

  // 检查元素是否有内容
  if (element.offsetHeight === 0 || element.offsetWidth === 0) {
    console.error('[share] 元素尺寸为0:', elementId, 'offsetWidth:', element.offsetWidth, 'offsetHeight:', element.offsetHeight);
    showToast('分享内容未就绪，请稍后再试', 'error');
    return;
  }

  showToast('正在生成分享图片...', '');

  try {
    // 获取当前主题的 CSS 变量值
    const rootStyle = getComputedStyle(document.documentElement);
    const bgColor = rootStyle.getPropertyValue('--bg-primary').trim() || '#0a0a0f';

    // 记录元素信息
    const elRect = element.getBoundingClientRect();
    console.log('[share] 目标元素:', elementId, '尺寸:', elRect.width, 'x', elRect.height);

    // 直接截图原始元素
    const canvas = await html2canvas(element, {
      backgroundColor: bgColor,
      scale: 2,
      useCORS: true,
      logging: true,  // 开启日志便于调试
      allowTaint: true,
    });

    console.log('[share] canvas 尺寸:', canvas.width, 'x', canvas.height);

    // 检查截图是否有效
    if (canvas.width === 0 || canvas.height === 0) {
      console.error('[share] 截图尺寸为0，尝试克隆方案');
      showToast('截图异常，正在重试...', 'error');
      // 回退方案：克隆节点到可见容器
      await shareResultFallback(element, bgColor);
      return;
    }

    // 在截图 canvas 上追加品牌水印
    const totalHeight = canvas.height + 80;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = totalHeight;
    const fCtx = finalCanvas.getContext('2d');

    // 绘制背景
    fCtx.fillStyle = bgColor;
    fCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // 绘制原始截图
    fCtx.drawImage(canvas, 0, 0);

    // 绘制分隔线
    const goldColor = rootStyle.getPropertyValue('--accent-gold').trim() || '#d4a853';
    fCtx.strokeStyle = goldColor;
    fCtx.lineWidth = 1;
    fCtx.beginPath();
    fCtx.moveTo(finalCanvas.width * 0.15, canvas.height + 20);
    fCtx.lineTo(finalCanvas.width * 0.85, canvas.height + 20);
    fCtx.stroke();

    // 绘制品牌文字
    const mutedColor = rootStyle.getPropertyValue('--text-muted').trim() || '#888';
    fCtx.textAlign = 'center';

    fCtx.font = `600 ${Math.round(finalCanvas.width * 0.035)}px sans-serif`;
    fCtx.fillStyle = goldColor;
    fCtx.fillText('神谕占卜台', finalCanvas.width / 2, canvas.height + 48);

    fCtx.font = `${Math.round(finalCanvas.width * 0.02)}px sans-serif`;
    fCtx.fillStyle = mutedColor;
    fCtx.fillText('Oracle Divination', finalCanvas.width / 2, canvas.height + 68);

    // 转为图片
    const dataUrl = finalCanvas.toDataURL('image/png');
    console.log('[share] dataUrl 长度:', dataUrl.length, '前30字符:', dataUrl.substring(0, 30));

    // 显示分享面板
    showSharePanel(dataUrl);

  } catch (error) {
    console.error('[share] 截图失败:', error);
    showToast('生成分享图片失败: ' + error.message, 'error');
  }
}

// 回退方案：克隆节点到临时可见容器中截图
async function shareResultFallback(element, bgColor) {
  try {
    // 获取当前主题变量
    const rootStyle = getComputedStyle(document.documentElement);
    const themeVars = {};
    for (const prop of rootStyle) {
      if (prop.startsWith('--')) {
        themeVars[prop] = rootStyle.getPropertyValue(prop).trim();
      }
    }

    // 克隆节点
    const clone = element.cloneNode(true);
    // 递归复制计算样式到内联
    applyComputedStyles(element, clone);

    // 创建临时可见容器
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: ${element.offsetWidth}px;
      z-index: -9999;
      pointer-events: none;
      visibility: hidden;
      background: ${bgColor};
    `;
    // 注入主题变量
    Object.entries(themeVars).forEach(([k, v]) => {
      if (v) wrapper.style.setProperty(k, v);
    });

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    const canvas = await html2canvas(wrapper, {
      backgroundColor: bgColor,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: true,
    });

    document.body.removeChild(wrapper);

    console.log('[share-fallback] canvas 尺寸:', canvas.width, 'x', canvas.height);

    const totalHeight = canvas.height + 80;
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = totalHeight;
    const fCtx = finalCanvas.getContext('2d');

    fCtx.fillStyle = bgColor;
    fCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    fCtx.drawImage(canvas, 0, 0);

    // 水印
    const goldColor = rootStyle.getPropertyValue('--accent-gold').trim() || '#d4a853';
    fCtx.strokeStyle = goldColor;
    fCtx.lineWidth = 1;
    fCtx.beginPath();
    fCtx.moveTo(finalCanvas.width * 0.15, canvas.height + 20);
    fCtx.lineTo(finalCanvas.width * 0.85, canvas.height + 20);
    fCtx.stroke();

    const mutedColor = rootStyle.getPropertyValue('--text-muted').trim() || '#888';
    fCtx.textAlign = 'center';
    fCtx.font = `600 ${Math.round(finalCanvas.width * 0.035)}px sans-serif`;
    fCtx.fillStyle = goldColor;
    fCtx.fillText('神谕占卜台', finalCanvas.width / 2, canvas.height + 48);
    fCtx.font = `${Math.round(finalCanvas.width * 0.02)}px sans-serif`;
    fCtx.fillStyle = mutedColor;
    fCtx.fillText('Oracle Divination', finalCanvas.width / 2, canvas.height + 68);

    const dataUrl = finalCanvas.toDataURL('image/png');
    showSharePanel(dataUrl);

  } catch (err) {
    console.error('[share-fallback] 失败:', err);
    showToast('分享功能异常，请尝试截图保存', 'error');
  }
}

// 递归复制计算样式到内联（确保克隆节点保留视觉样式）
function applyComputedStyles(source, target) {
  const sourceStyle = window.getComputedStyle(source);
  // 只复制关键样式属性
  const importantProps = [
    'color', 'background-color', 'background', 'font-size', 'font-family',
    'font-weight', 'text-align', 'line-height', 'padding', 'margin',
    'border', 'border-radius', 'display', 'flex-direction', 'gap',
    'width', 'height', 'max-width', 'overflow', 'position',
    'opacity', 'transform', 'letter-spacing', 'white-space',
  ];
  importantProps.forEach(prop => {
    try {
      const val = sourceStyle.getPropertyValue(prop);
      if (val) target.style.setProperty(prop, val);
    } catch(e) {}
  });
  // 递归处理子元素
  const sourceChildren = source.children;
  const targetChildren = target.children;
  const len = Math.min(sourceChildren.length, targetChildren.length);
  for (let i = 0; i < len; i++) {
    applyComputedStyles(sourceChildren[i], targetChildren[i]);
  }
}

// 显示分享面板
function showSharePanel(imageDataUrl) {
  // 移除已有的分享面板
  const existing = document.getElementById('share-panel-overlay');
  if (existing) existing.remove();

  // 临时隐藏今日神谕浮窗，避免半透明背景干扰
  const dailyOverlay = document.getElementById('daily-overlay');
  const dailyWasOpen = dailyOverlay && dailyOverlay.classList.contains('open');
  if (dailyWasOpen) dailyOverlay.style.display = 'none';

  const overlay = document.createElement('div');
  overlay.id = 'share-panel-overlay';
  overlay.className = 'ziwei-overlay show';
  overlay.style.zIndex = '1001'; // 必须高于今日神谕浮窗的 z-index 1000
  overlay.onclick = () => {
    overlay.remove();
    // 恢复今日神谕浮窗
    if (dailyWasOpen && dailyOverlay) dailyOverlay.style.display = '';
  };

  const panel = document.createElement('div');
  panel.className = 'share-panel';
  panel.onclick = (e) => e.stopPropagation();

  panel.innerHTML = `
    <div class="share-panel-header">
      <h3>分享占卜结果</h3>
      <button class="ziwei-modal-close" onclick="document.getElementById('share-panel-overlay').remove(); if(document.getElementById('daily-overlay')) document.getElementById('daily-overlay').style.display='';">✕</button>
    </div>
    <div class="share-preview">
      <img src="${imageDataUrl}" alt="占卜结果">
    </div>
    <div class="share-actions">
      <button class="btn-primary btn-gold" onclick="saveShareImage(this)" data-url="${imageDataUrl}">
        💾 保存图片
      </button>
      <button class="btn-primary btn-ghost" onclick="copyShareImage(this)" data-url="${imageDataUrl}">
        📋 复制到剪贴板
      </button>
    </div>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

// 保存图片
async function saveShareImage(btn) {
  const url = btn.dataset.url;
  const link = document.createElement('a');
  link.download = `神谕占卜台_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.png`;
  link.href = url;
  link.click();
  showToast('图片已保存', 'success');
}

// 复制到剪贴板
async function copyShareImage(btn) {
  try {
    const url = btn.dataset.url;
    const response = await fetch(url);
    const blob = await response.blob();

    // 尝试使用 Clipboard API
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showToast('已复制到剪贴板', 'success');
    } else {
      showToast('当前浏览器不支持复制图片，请长按图片保存', 'error');
    }
  } catch (error) {
    console.error('复制失败:', error);
    showToast('复制失败，请尝试保存图片', 'error');
  }
}
