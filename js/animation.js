/* ============================================
   推演动画引擎
   水墨粒子（周易）+ 星空粒子（塔罗）
   ============================================ */

const AnimationEngine = {
  
  // 获取当前主题背景色
  _getCanvasBg() {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'light' ? 'rgba(250, 247, 242, 0.08)' : 'rgba(10, 10, 15, 0.08)';
  },
  
  _getStarBg() {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'light' ? 'rgba(250, 247, 242, 0.15)' : 'rgba(10, 10, 25, 0.15)';
  },
  
  // ---- 水墨粒子（周易）----
  inkParticles: [],
  inkCanvas: null,
  inkCtx: null,
  inkAnimId: null,
  
  initInk(canvasId) {
    // 防止单例污染：初始化前强制停止前一个动画
    this.stopInk();
    this.inkCanvas = document.getElementById(canvasId);
    if (!this.inkCanvas) return;
    this.inkCtx = this.inkCanvas.getContext('2d');
    this.inkCanvas.width = this.inkCanvas.parentElement.clientWidth;
    this.inkCanvas.height = this.inkCanvas.parentElement.clientHeight;
    this.inkParticles = [];
  },
  
  startInkAnimation(callbacks) {
    const ctx = this.inkCtx;
    const w = this.inkCanvas.width;
    const h = this.inkCanvas.height;
    const centerX = w / 2;
    const centerY = h / 2;
    
    // 生成墨迹粒子
    const particles = [];
    for (let i = 0; i < 300; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particles.push({
        x: centerX + (Math.random() - 0.5) * 40,
        y: centerY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 1,
        life: 1,
        decay: Math.random() * 0.008 + 0.003,
        color: Math.random() > 0.7 
          ? `rgba(197, 61, 67, ` // 朱红
          : `rgba(${Math.floor(Math.random()*40+20)}, ${Math.floor(Math.random()*40+20)}, ${Math.floor(Math.random()*40+20)}, ` // 墨色
      });
    }
    
    let frame = 0;
    let phase = 'scatter'; // scatter -> converge -> reveal
    
    const animate = () => {
      ctx.fillStyle = this._getCanvasBg();
      ctx.fillRect(0, 0, w, h);
      
      frame++;
      
      if (phase === 'scatter' && frame > 60) {
        phase = 'converge';
        if (callbacks.onPhaseChange) callbacks.onPhaseChange('converge');
      }
      
      if (phase === 'converge' && frame > 160) {
        phase = 'reveal';
        if (callbacks.onPhaseChange) callbacks.onPhaseChange('reveal');
      }
      
      if (phase === 'reveal' && frame > 200) {
        if (callbacks.onComplete) callbacks.onComplete();
        return;
      }
      
      particles.forEach(p => {
        if (phase === 'scatter') {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.99;
          p.vy *= 0.99;
          p.life -= p.decay * 0.5;
        } else if (phase === 'converge') {
          const dx = centerX - p.x;
          const dy = centerY - p.y;
          p.vx += dx * 0.02;
          p.vy += dy * 0.02;
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.x += p.vx;
          p.y += p.vy;
          p.life = Math.min(1, p.life + 0.01);
        } else {
          // 聚集后缓慢消散
          const angle = Math.random() * Math.PI * 2;
          p.x += Math.cos(angle) * 0.3;
          p.y += Math.sin(angle) * 0.3;
          p.life -= p.decay * 1.5;
        }
        
        if (p.life > 0) {
          ctx.beginPath();
          const r = Math.max(0.1, p.size * p.life);
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = p.color + (p.life * 0.6).toFixed(3) + ')';
          ctx.fill();
          
          // 墨迹扩散效果
          if (p.size > 2 && p.life > 0.3) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
            ctx.fillStyle = p.color + (p.life * 0.08).toFixed(3) + ')';
            ctx.fill();
          }
        }
      });
      
      // 添加新的流动粒子
      if (phase !== 'reveal') {
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 50 + Math.random() * 100;
          particles.push({
            x: centerX + Math.cos(angle) * dist,
            y: centerY + Math.sin(angle) * dist,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 2 + 0.5,
            life: 0.8,
            decay: 0.015,
            color: Math.random() > 0.8 
              ? 'rgba(212, 168, 70, '
              : 'rgba(40, 35, 30, '
          });
        }
      }
      
      this.inkAnimId = requestAnimationFrame(animate);
    };
    
    animate();
  },
  
  stopInk() {
    if (this.inkAnimId) {
      cancelAnimationFrame(this.inkAnimId);
      this.inkAnimId = null;
    }
  },
  
  // ---- 星空粒子（塔罗）----
  starParticles: [],
  starCanvas: null,
  starCtx: null,
  starAnimId: null,
  
  initStars(canvasId) {
    // 防止单例污染：初始化前强制停止前一个动画
    this.stopStars();
    this.starCanvas = document.getElementById(canvasId);
    if (!this.starCanvas) return;
    this.starCtx = this.starCanvas.getContext('2d');
    this.starCanvas.width = this.starCanvas.parentElement.clientWidth;
    this.starCanvas.height = this.starCanvas.parentElement.clientHeight;
    this.starParticles = [];
  },
  
  startStarAnimation(cardCount, callbacks) {
    const ctx = this.starCtx;
    const w = this.starCanvas.width;
    const h = this.starCanvas.height;
    
    // 星空背景粒子
    const stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01
      });
    }
    
    // 卡牌位置（用于汇聚效果）
    const cardPositions = [];
    const spacing = Math.min(160, (w - 100) / cardCount);
    const startX = (w - spacing * (cardCount - 1)) / 2;
    for (let i = 0; i < cardCount; i++) {
      cardPositions.push({
        x: startX + spacing * i,
        y: h / 2
      });
    }
    
    // 汇聚粒子
    const convergingParticles = [];
    const particlesPerCard = 50;
    for (let c = 0; c < cardCount; c++) {
      for (let i = 0; i < particlesPerCard; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 200;
        convergingParticles.push({
          targetX: cardPositions[c].x,
          targetY: cardPositions[c].y,
          x: cardPositions[c].x + Math.cos(angle) * dist,
          y: cardPositions[c].y + Math.sin(angle) * dist,
          size: Math.random() * 2.5 + 0.5,
          speed: 0.01 + Math.random() * 0.02,
          progress: 0,
          hue: 220 + Math.random() * 60 // 蓝紫色
        });
      }
    }
    
    let frame = 0;
    
    const animate = () => {
      ctx.fillStyle = this._getStarBg();
      ctx.fillRect(0, 0, w, h);
      
      frame++;
      
      // 绘制星空
      stars.forEach(s => {
        s.twinkle += s.speed;
        const alpha = 0.3 + 0.7 * Math.abs(Math.sin(s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 210, 255, ${alpha})`;
        ctx.fill();
      });
      
      // 汇聚粒子
      if (frame < 180) {
        convergingParticles.forEach(p => {
          p.progress = Math.min(1, p.progress + p.speed);
          const ease = 1 - Math.pow(1 - p.progress, 3); // easeOutCubic
          const currentX = p.x + (p.targetX - p.x) * ease;
          const currentY = p.y + (p.targetY - p.y) * ease;
          
          ctx.beginPath();
          ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${0.6 * (1 - ease * 0.5)})`;
          ctx.fill();
          
          // 光尾
          ctx.beginPath();
          ctx.arc(currentX, currentY, p.size * 4, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 70%, 70%, ${0.1 * (1 - ease)})`;
          ctx.fill();
        });
        
        // 轨道线
        if (frame > 60) {
          cardPositions.forEach(pos => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 40 + (frame - 60) * 0.3, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.15 * Math.min(1, (frame - 60) / 60)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          });
        }
      }
      
      if (frame === 60 && callbacks.onPhaseChange) {
        callbacks.onPhaseChange('converge');
      }
      
      if (frame === 180) {
        // 到达，闪光效果
        cardPositions.forEach(pos => {
          const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 80);
          gradient.addColorStop(0, 'rgba(212, 168, 70, 0.6)');
          gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.2)');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.fillRect(pos.x - 80, pos.y - 80, 160, 160);
        });
      }
      
      if (frame > 180 && frame < 200) {
        // 持续闪光
        cardPositions.forEach(pos => {
          const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 50);
          glow.addColorStop(0, `rgba(212, 168, 70, ${0.4 * (1 - (frame - 180) / 20)})`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(pos.x - 50, pos.y - 50, 100, 100);
        });
      }
      
      if (frame === 200) {
        if (callbacks.onComplete) callbacks.onComplete();
        return;
      }
      
      this.starAnimId = requestAnimationFrame(animate);
    };
    
    animate();
  },
  
  stopStars() {
    if (this.starAnimId) {
      cancelAnimationFrame(this.starAnimId);
      this.starAnimId = null;
    }
  }
};
