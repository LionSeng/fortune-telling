/* ============================================
   主题切换 + 设置面板
   ============================================ */

(function() {
  // 主题切换
  const themeBtn = document.getElementById('btn-theme');
  const html = document.documentElement;
  
  // 读取保存的主题
  const savedTheme = localStorage.getItem('divination-theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeBtn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('divination-theme', next);
    updateThemeIcon(next);
  });

  function updateThemeIcon(theme) {
    themeBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  // 设置面板
  const settingsBtn = document.getElementById('btn-settings');
  const settingsPanel = document.getElementById('settings-panel');
  const settingsOverlay = document.getElementById('settings-overlay');
  const saveSettingsBtn = document.getElementById('btn-save-settings');
  const providerSelect = document.getElementById('ai-provider');
  const customEndpointGroup = document.getElementById('custom-endpoint-group');

  // 加载保存的设置
  const settings = JSON.parse(localStorage.getItem('divination-settings') || '{}');
  if (settings.apiKey) document.getElementById('ai-api-key').value = settings.apiKey;
  if (settings.provider) providerSelect.value = settings.provider;
  if (settings.endpoint) document.getElementById('ai-endpoint').value = settings.endpoint;
  if (settings.model) document.getElementById('ai-model').value = settings.model;
  if (settings.provider === 'custom') customEndpointGroup.style.display = 'block';

  providerSelect.addEventListener('change', () => {
    customEndpointGroup.style.display = providerSelect.value === 'custom' ? 'block' : 'none';
  });

  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('open');
    settingsOverlay.classList.add('open');
  });

  settingsOverlay.addEventListener('click', closeSettings);

  saveSettingsBtn.addEventListener('click', () => {
    const newSettings = {
      provider: providerSelect.value,
      apiKey: document.getElementById('ai-api-key').value.trim(),
      endpoint: document.getElementById('ai-endpoint').value.trim(),
      model: document.getElementById('ai-model').value.trim() || 'deepseek-chat'
    };
    localStorage.setItem('divination-settings', JSON.stringify(newSettings));
    closeSettings();
    showToast('设置已保存', 'success');
  });

  function closeSettings() {
    settingsPanel.classList.remove('open');
    settingsOverlay.classList.remove('open');
  }

  // 获取设置（供其他模块调用）
  // 占位符由 build.sh 构建，本地开发时填写 .env 或在设置面板中配置
  const DEFAULT_SETTINGS = {
    provider: '__AI_PROVIDER__',
    apiKey: '__AI_API_KEY__',
    model: '__AI_MODEL__'
  };

  window.getAppSettings = function() {
    const saved = JSON.parse(localStorage.getItem('divination-settings') || '{}');
    const merged = { ...DEFAULT_SETTINGS, ...saved };
    // 如果占位符未被替换，且用户也没配，则清空 apiKey 防止无效请求
    if (merged.apiKey === '__AI_API_KEY__' && !saved.apiKey) {
      merged.apiKey = '';
    }
    return merged;
  };
})();

// Toast 消息
function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast ' + type + ' show';
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}
