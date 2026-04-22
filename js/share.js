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
    // 获取当前主题的 CSS 变量值
    const rootStyle = getComputedStyle(document.documentElement);
    const bgColor = rootStyle.getPropertyValue('--bg-primary').trim() || '#0a0a0f';

    // 直接截图原始元素（不克隆），避免样式丢失
    const canvas = await html2canvas(element, {
      backgroundColor: bgColor,
      scale: 2,
      useCORS: true,
      logging: false,
    });

    // 在截图 canvas 上追加品牌水印
    const ctx = canvas.getContext('2d');
    const watermarkY = canvas.height + 40;
    const totalHeight = canvas.height + 80;

    // 创建新 canvas，包含水印区域
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
