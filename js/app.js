/* ============================================
   应用路由 + 背景粒子
   ============================================ */

let currentPage = 'home';
let bgAnimation = null;

// 页面导航
let _pageTransitioning = false;
function navigateTo(pageName) {
  if (_pageTransitioning || pageName === currentPage) return;
  _pageTransitioning = true;

  const currentEl = document.getElementById('page-' + currentPage);
  const target = document.getElementById('page-' + pageName);
  
  // 当前页面退出动画
  if (currentEl && currentEl.classList.contains('active')) {
    currentEl.classList.add('page-out');
    currentEl.classList.remove('active');
  }
  
  // 等退出动画结束后显示新页面
  const transitionDelay = (currentEl && pageName !== 'home') ? 200 : 50;
  
  setTimeout(() => {
    // 清理旧页面的退出类
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active', 'page-out');
    });
    
    if (target) {
      target.classList.add('active');
    }
    
    currentPage = pageName;
    _pageTransitioning = false;
    
    // 切换背景粒子风格
    updateBgParticles(pageName);
    
    // 重置子页面状态
    if (pageName === 'i-ching') resetIChing();
    if (pageName === 'tarot') resetTarot();
    if (pageName === 'ziwei') resetZiwei();
    if (pageName === 'astrology') { resetAstrology(); initAstroDatePicker(); }
    if (pageName === 'bazi') { resetBazi(); initBaziShichen(); }
    
    // 滚动到顶部
    window.scrollTo(0, 0);

    // 更新底部导航高亮
    updateBottomNav(pageName);

    // 非首页时隐藏底部导航
    updateBottomNavVisibility(pageName);
  }, transitionDelay);
}

// 更新底部导航高亮
function updateBottomNav(pageName) {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;
  
  // 映射页面到底部导航项
  const navMap = { 'home': 'home', 'i-ching': 'i-ching', 'tarot': 'tarot', 'ziwei': 'ziwei', 'astrology': 'astrology', 'bazi': 'bazi' };
  const activePage = navMap[pageName] || '';
  
  nav.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === activePage);
  });

  // 滚动到选中项（保持居中可见）
  const activeItem = nav.querySelector('.bottom-nav-item.active');
  if (activeItem) {
    const scrollLeft = activeItem.offsetLeft - nav.clientWidth / 2 + activeItem.clientWidth / 2;
    nav.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  }
}

// 控制底部导航显示/隐藏
function updateBottomNavVisibility(pageName) {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;
  
  // 在首页显示底部导航，在子页面隐藏（桌面端始终显示）
  const isSubPage = ['i-ching', 'tarot', 'ziwei', 'astrology', 'bazi'].includes(pageName);
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile && isSubPage) {
    nav.classList.add('nav-hidden');
  } else {
    nav.classList.remove('nav-hidden');
  }
}

// 设置按钮（底部导航触发）
function toggleSettings() {
  document.getElementById('btn-settings').click();
}

// 背景粒子系统
const bgCanvas = document.getElementById('particle-canvas');
const bgCtx = bgCanvas.getContext('2d');
let bgParticles = [];
let bgStyle = 'home'; // 'home' | 'east' | 'west'
let animFrameId = null;

function resizeBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeBgCanvas);
resizeBgCanvas();

// 窗口大小变化时更新底部导航可见性
window.addEventListener('resize', () => {
  updateBottomNavVisibility(currentPage);
});

function updateBgParticles(pageName) {
  switch (pageName) {
    case 'i-ching':
      bgStyle = 'east';
      break;
    case 'tarot':
      bgStyle = 'west';
      break;
    case 'ziwei':
      bgStyle = 'east'; // 紫微斗数用东方风格（金色+紫色）
      break;
    case 'astrology':
      bgStyle = 'west'; // 占星术用西方风格（星空紫蓝）
      break;
    case 'bazi':
      bgStyle = 'east'; // 四柱八字用东方风格
      break;
    default:
      bgStyle = 'home';
  }
  initBgParticles();
}

function initBgParticles() {
  bgParticles = [];
  const count = Math.min(80, Math.floor(window.innerWidth * window.innerHeight / 15000));
  
  for (let i = 0; i < count; i++) {
    bgParticles.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
      pulse: Math.random() * Math.PI * 2
    });
  }
}

function drawBgParticles() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  
  bgParticles.forEach(p => {
    p.x += p.speedX;
    p.y += p.speedY;
    p.pulse += 0.02;
    
    // 边界循环
    if (p.x < 0) p.x = bgCanvas.width;
    if (p.x > bgCanvas.width) p.x = 0;
    if (p.y < 0) p.y = bgCanvas.height;
    if (p.y > bgCanvas.height) p.y = 0;
    
    const pulseOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));
    
    let color;
    switch (bgStyle) {
      case 'east':
        color = isDark ? `rgba(197, 61, 67, ${pulseOpacity})` : `rgba(197, 61, 67, ${pulseOpacity * 0.7})`;
        break;
      case 'west':
        color = isDark ? `rgba(99, 102, 241, ${pulseOpacity})` : `rgba(79, 82, 201, ${pulseOpacity * 0.7})`;
        break;
      default:
        color = isDark ? `rgba(212, 168, 70, ${pulseOpacity})` : `rgba(180, 140, 40, ${pulseOpacity * 0.6})`;
    }
    
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    bgCtx.fillStyle = color;
    bgCtx.fill();
    
    // 光晕
    if (p.size > 1.2) {
      bgCtx.beginPath();
      bgCtx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      const glowOpacity = pulseOpacity * 0.15;
      const glowColor = bgStyle === 'east' 
        ? `rgba(197, 61, 67, ${glowOpacity})`
        : bgStyle === 'west'
          ? `rgba(99, 102, 241, ${glowOpacity})`
          : `rgba(212, 168, 70, ${glowOpacity})`;
      bgCtx.fillStyle = glowColor;
      bgCtx.fill();
    }
  });
  
  // 连线效果（仅首页和稀疏连接）
  if (bgStyle === 'home') {
    for (let i = 0; i < bgParticles.length; i++) {
      for (let j = i + 1; j < bgParticles.length; j++) {
        const dx = bgParticles[i].x - bgParticles[j].x;
        const dy = bgParticles[i].y - bgParticles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const lineOpacity = (1 - dist / 120) * (isDark ? 0.08 : 0.12);
          bgCtx.beginPath();
          bgCtx.moveTo(bgParticles[i].x, bgParticles[i].y);
          bgCtx.lineTo(bgParticles[j].x, bgParticles[j].y);
          bgCtx.strokeStyle = isDark 
            ? `rgba(212, 168, 70, ${lineOpacity})`
            : `rgba(160, 130, 50, ${lineOpacity})`;
          bgCtx.lineWidth = 0.5;
          bgCtx.stroke();
        }
      }
    }
  }
  
  animFrameId = requestAnimationFrame(drawBgParticles);
}

// 初始化
initBgParticles();
drawBgParticles();
