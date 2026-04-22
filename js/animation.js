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
  },

  // ---- 铜钱起卦动画（周易·铜钱法）----
  coinCanvas: null,
  coinCtx: null,
  coinAnimId: null,

  initCoin(canvasId) {
    this.stopCoin();
    this.coinCanvas = document.getElementById(canvasId);
    if (!this.coinCanvas) return;
    this.coinCtx = this.coinCanvas.getContext('2d');
    this.coinCanvas.width = this.coinCanvas.parentElement.clientWidth;
    this.coinCanvas.height = this.coinCanvas.parentElement.clientHeight;
  },

  stopCoin() {
    if (this.coinAnimId) {
      cancelAnimationFrame(this.coinAnimId);
      this.coinAnimId = null;
    }
  },

  /**
   * 绘制一枚铜钱（外圆、方孔、文字）
   */
  _drawCoin(ctx, x, y, radius, rotation, faceUp, glow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const r = Math.max(1, radius);
    const inner = r * 0.32; // 方孔边长

    // 光晕
    if (glow > 0) {
      const grad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.8);
      grad.addColorStop(0, `rgba(212, 168, 70, ${0.35 * glow})`);
      grad.addColorStop(1, 'rgba(212, 168, 70, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);
    }

    // 铜钱外缘
    const edgeGrad = ctx.createLinearGradient(-r, -r, r, r);
    edgeGrad.addColorStop(0, '#c9a84c');
    edgeGrad.addColorStop(0.3, '#f0d78c');
    edgeGrad.addColorStop(0.5, '#e8c966');
    edgeGrad.addColorStop(0.7, '#d4a84a');
    edgeGrad.addColorStop(1, '#b8923a');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = edgeGrad;
    ctx.fill();

    // 外缘纹路
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(139, 105, 20, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(139, 105, 20, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 方孔
    ctx.beginPath();
    ctx.rect(-inner, -inner, inner * 2, inner * 2);
    ctx.fillStyle = 'rgba(30, 25, 18, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 105, 20, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 正面字（开元通宝风格）
    ctx.fillStyle = 'rgba(100, 70, 20, 0.7)';
    ctx.font = `bold ${r * 0.32}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (faceUp) {
      // 正面：开、通、宝 上下右左
      ctx.fillText('开', 0, -r * 0.58);
      ctx.fillText('宝', 0, r * 0.58);
      ctx.fillText('通', -r * 0.58, 0);
      ctx.fillText('元', r * 0.58, 0);
    } else {
      // 背面：满文或简单纹路
      ctx.font = `bold ${r * 0.28}px serif`;
      ctx.fillText('福', 0, -r * 0.55);
      ctx.fillText('禄', 0, r * 0.55);
    }

    ctx.restore();
  },

  startCoinAnimation(callbacks) {
    const ctx = this.coinCtx;
    const w = this.coinCanvas.width;
    const h = this.coinCanvas.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const coinRadius = Math.min(32, w * 0.045);

    // 三枚铜钱状态
    const coins = [
      { x: centerX, y: centerY - 60, vx: 0, vy: 0, rotation: 0, faceUp: true, phase: 'idle' },
      { x: centerX, y: centerY,      vx: 0, vy: 0, rotation: 0, faceUp: true, phase: 'idle' },
      { x: centerX, y: centerY + 60, vx: 0, vy: 0, rotation: 0, faceUp: true, phase: 'idle' },
    ];

    // 飞散/飘浮的铜色粒子
    const sparkles = [];
    for (let i = 0; i < 80; i++) {
      sparkles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.4,
        speed: Math.random() * 0.3 + 0.1,
        angle: Math.random() * Math.PI * 2,
      });
    }

    const startTime = performance.now();
    const TOTAL_DURATION = 7000; // 总时长 7 秒
    let throwCount = 0;
    const maxThrows = 6;
    let lastThrowTime = 0;
    let animDone = false;

    const triggerThrow = () => {
      throwCount++;
      coins.forEach((c, i) => {
        const angle = (Math.random() - 0.5) * Math.PI * 0.8 + (i - 1) * 0.3;
        const force = 6 + Math.random() * 4;
        c.vx = Math.cos(angle) * force + (Math.random() - 0.5) * 3;
        c.vy = -Math.abs(Math.sin(angle)) * force - Math.random() * 2;
        c.rotation = Math.random() * Math.PI * 2;
        c.faceUp = Math.random() > 0.5;
        c.phase = 'airborne';
      });
    };

    const animate = (timestamp) => {
      if (animDone) return;

      const elapsed = timestamp - startTime;

      // 清屏
      const theme = document.documentElement.getAttribute('data-theme');
      ctx.fillStyle = theme === 'light' ? 'rgba(250, 247, 242, 0.15)' : 'rgba(10, 10, 15, 0.15)';
      ctx.fillRect(0, 0, w, h);

      // ---- 阶段：基于时间 ----
      if (elapsed < 800) {
        // Phase 1: 散开
        if (elapsed < 50) {
          coins.forEach((c, i) => {
            c.x = centerX + (i - 1) * 40;
            c.y = centerY;
            const angle = (i - 1) * 0.5;
            c.vx = Math.cos(angle) * 3;
            c.vy = Math.sin(angle) * 2 - 1;
          });
        }
      } else if (elapsed < 5000) {
        // Phase 2: 掷铜钱（每700ms抛一次）
        if (elapsed - lastThrowTime > 700 && throwCount < maxThrows) {
          triggerThrow();
          lastThrowTime = elapsed;
          if (throwCount === 1 && callbacks.onPhaseChange) callbacks.onPhaseChange('throw1');
        }
      } else if (elapsed < 6200) {
        // Phase 3: 汇聚
        if (throwCount >= maxThrows) {
          coins.forEach(c => { c.phase = 'converge'; });
          if (elapsed >= 5000 && elapsed < 5050 && callbacks.onPhaseChange) {
            callbacks.onPhaseChange('converge');
          }
        }
      } else if (elapsed >= TOTAL_DURATION) {
        // Phase 4: 完成 — 清空 canvas 并触发回调
        animDone = true;
        ctx.clearRect(0, 0, w, h);
        if (callbacks.onPhaseChange) callbacks.onPhaseChange('settle');
        if (callbacks.onComplete) callbacks.onComplete();
        return;
      }

      // ---- 更新铜钱 ----
      coins.forEach(c => {
        if (c.phase === 'airborne') {
          c.x += c.vx;
          c.y += c.vy;
          c.vy += 0.15; // 重力
          c.vx *= 0.995;
          c.rotation += c.vx * 0.08;

          // 边界反弹
          const margin = coinRadius * 2;
          if (c.x < margin) { c.x = margin; c.vx *= -0.6; }
          if (c.x > w - margin) { c.x = w - margin; c.vx *= -0.6; }
          if (c.y < margin) { c.y = margin; c.vy *= -0.6; }
          if (c.y > h - margin) { c.y = h - margin; c.vy *= -0.5; }

          // 摩擦减速
          if (Math.abs(c.vy) < 0.5 && c.y > h - margin - 10) {
            c.vy = 0;
            c.vx *= 0.92;
            c.rotation += c.vx * 0.02;
            if (Math.abs(c.vx) < 0.1) c.phase = 'settled';
          }
        } else if (c.phase === 'converge') {
          const dx = centerX + (coins.indexOf(c) - 1) * 35 - c.x;
          const dy = centerY - c.y;
          c.x += dx * 0.08;
          c.y += dy * 0.08;
          c.rotation *= 0.93;
        } else if (c.phase === 'settled') {
          c.rotation *= 0.96;
        } else {
          // idle
          c.x += c.vx || 0;
          c.y += c.vy || 0;
          if (c.vx) c.vx *= 0.98;
          if (c.vy) c.vy *= 0.98;
        }
      });

      // ---- 绘制铜色粒子 ----
      sparkles.forEach(s => {
        s.angle += s.speed * 0.02;
        s.alpha = 0.15 + 0.25 * Math.abs(Math.sin(s.angle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 168, 70, ${s.alpha})`;
        ctx.fill();
      });

      // ---- 绘制铜钱 ----
      const isConvergePhase = elapsed >= 5000 && elapsed < TOTAL_DURATION;
      coins.forEach(c => {
        const glowIntensity = isConvergePhase
          ? 0.6
          : (c.phase === 'airborne' ? 0.3 : 0.1);
        this._drawCoin(ctx, c.x, c.y, coinRadius, c.rotation, c.faceUp, glowIntensity);
      });

      // ---- 汇聚阶段的太极光芒 ----
      if (isConvergePhase) {
        const pulse = Math.sin(elapsed * 0.005) * 0.3 + 0.5;
        const gradR = coinRadius * (3 + pulse * 2);
        const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, gradR);
        grad.addColorStop(0, `rgba(212, 168, 70, ${0.2 * pulse})`);
        grad.addColorStop(0.5, `rgba(197, 61, 67, ${0.08 * pulse})`);
        grad.addColorStop(1, 'rgba(212, 168, 70, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, gradR, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- 掷铜钱时的飞溅金色碎粒 ----
      if (elapsed >= 800 && elapsed < 5000 && Math.random() < 0.1) {
        for (let i = 0; i < 2; i++) {
          sparkles.push({
            x: coins[Math.floor(Math.random() * 3)].x + (Math.random() - 0.5) * 20,
            y: coins[Math.floor(Math.random() * 3)].y + (Math.random() - 0.5) * 20,
            size: Math.random() * 1.2 + 0.3,
            alpha: 0.5,
            speed: Math.random() * 0.5 + 0.2,
            angle: Math.random() * Math.PI * 2,
          });
        }
        if (sparkles.length > 150) sparkles.splice(0, sparkles.length - 100);
      }

      this.coinAnimId = requestAnimationFrame(animate);
    };

    this.coinAnimId = requestAnimationFrame(animate);
  }
};
