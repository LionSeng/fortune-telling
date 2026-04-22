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
    showToast('未找到要分享的内容', 'error');
    return;
  }

  showToast('正在生成分享图片...', '');

  try {
    // 获取当前主题的 CSS 变量值，供克隆元素使用
    const rootStyle = getComputedStyle(document.documentElement);
    const themeVars = {
      '--bg-primary': rootStyle.getPropertyValue('--bg-primary').trim(),
      '--bg-secondary': rootStyle.getPropertyValue('--bg-secondary').trim(),
      '--bg-card': rootStyle.getPropertyValue('--bg-card').trim(),
      '--text-primary': rootStyle.getPropertyValue('--text-primary').trim(),
      '--text-secondary': rootStyle.getPropertyValue('--text-secondary').trim(),
      '--text-muted': rootStyle.getPropertyValue('--text-muted').trim(),
      '--accent-gold': rootStyle.getPropertyValue('--accent-gold').trim(),
      '--border-color': rootStyle.getPropertyValue('--border-color').trim(),
      '--accent-purple': rootStyle.getPropertyValue('--accent-purple').trim(),
      '--accent-cyan': rootStyle.getPropertyValue('--accent-cyan').trim(),
    };

    // 创建分享容器（添加品牌水印）
    const shareWrapper = document.createElement('div');
    shareWrapper.className = 'share-capture-wrapper';
    shareWrapper.appendChild(element.cloneNode(true));

    // 添加品牌水印
    const watermark = document.createElement('div');
    watermark.className = 'share-watermark';
    watermark.innerHTML = `
      <div class="share-watermark-brand">神谕占卜台</div>
      <div class="share-watermark-sub">Oracle Divination</div>
    `;
    shareWrapper.appendChild(watermark);

    // 临时添加到 DOM — 用 clip 裁剪而非 opacity:0 隐藏（html2canvas 不渲染透明元素）
    shareWrapper.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:-1;clip:rect(0,0,0,0);';
    // 注入当前主题变量，确保克隆元素的样式正确
    Object.entries(themeVars).forEach(([k, v]) => {
      if (v) shareWrapper.style.setProperty(k, v);
    });
    document.body.appendChild(shareWrapper);

    // 截图
    const canvas = await html2canvas(shareWrapper, {
      backgroundColor: themeVars['--bg-primary'] || '#0a0a0f',
      scale: 2,
      useCORS: true,
      logging: false,
      // 确保渲染隐藏区域
      ignoreElements: (el) => false,
    });

    // 移除临时元素
    document.body.removeChild(shareWrapper);

    // 转为图片
    const dataUrl = canvas.toDataURL('image/png');

    // 显示分享面板
    showSharePanel(dataUrl);

  } catch (error) {
    console.error('截图失败:', error);
    showToast('生成分享图片失败', 'error');
  }
}

// 显示分享面板
function showSharePanel(imageDataUrl) {
  // 移除已有的分享面板
  const existing = document.getElementById('share-panel-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'share-panel-overlay';
  overlay.className = 'ziwei-overlay show';
  overlay.onclick = () => overlay.remove();

  const panel = document.createElement('div');
  panel.className = 'share-panel';
  panel.onclick = (e) => e.stopPropagation();

  panel.innerHTML = `
    <div class="share-panel-header">
      <h3>分享占卜结果</h3>
      <button class="ziwei-modal-close" onclick="document.getElementById('share-panel-overlay').remove()">✕</button>
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
