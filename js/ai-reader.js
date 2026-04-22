/* ============================================
   AI 深度解读模块
   支持 DeepSeek + 自定义 API 入口
   ============================================ */

// 请求 AI 解读
async function requestAIReading(type) {
  const settings = window.getAppSettings();
  
  if (!settings.apiKey) {
    showToast('请先在设置中配置 API Key', 'error');
    document.getElementById('btn-settings').click();
    return;
  }

  // 离线检测：AI 功能需要网络
  if (!navigator.onLine) {
    showToast('当前处于离线状态，AI 解读需要网络连接', 'error');
    const aiSection = document.getElementById(`${type}-ai-reading`);
    const aiBody = document.getElementById(`${type}-ai-body`);
    if (aiSection && aiBody) {
      aiSection.style.display = 'block';
      aiBody.innerHTML = `
        <div style="text-align:center;padding:1.5rem 0;">
          <div style="font-size:2rem;margin-bottom:0.5rem;">📡</div>
          <p style="color:var(--text-muted);margin-bottom:0.25rem;">当前处于离线状态</p>
          <p style="font-size:0.85rem;color:var(--text-muted);">AI 解读功能需要网络，但本地占卜推演可离线使用 ✨</p>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-top:0.5rem;">恢复网络后点击按钮重新解读</p>
        </div>`;
    }
    return;
  }
  
  // 禁用按钮
  const btn = document.getElementById(`btn-${type}-ai`);
  btn.disabled = true;
  btn.innerHTML = '<span class="loading-spinner"></span> 正在解读...';
  
  // 显示 AI 区域
  const aiSection = document.getElementById(`${type}-ai-reading`);
  const aiBody = document.getElementById(`${type}-ai-body`);
  aiSection.style.display = 'block';
  aiBody.innerHTML = '<span class="typing-cursor"></span>';
  
  // 构建提示词
  const prompt = buildPrompt(type);
  
  try {
    // 确定 API 地址
    let endpoint, model;
    
    if (settings.provider === 'custom' && settings.endpoint) {
      endpoint = settings.endpoint;
    } else {
      endpoint = 'https://api.deepseek.com/v1/chat/completions';
    }
    
    model = settings.model || 'deepseek-chat';
    
    // 调用 API（流式输出）
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: '你是一位精通东方和西方占卜术的资深占卜师。你擅长将古老的智慧与现代人的生活经验相结合，给出深入浅出、温暖而有洞察力的解读。你的解读风格： poetic yet practical, mystical yet grounded. 用中文回答。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: true,
        temperature: 0.85,
        max_tokens: 1500
      })
    });
    
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }
    
    // 流式读取
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              aiBody.innerHTML = formatAIText(fullText) + '<span class="typing-cursor"></span>';
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
    
    // 移除光标
    aiBody.innerHTML = formatAIText(fullText);
    
  } catch (error) {
    console.error('AI 解读失败:', error);
    
    // 降级：非流式请求
    try {
      let endpoint = settings.provider === 'custom' && settings.endpoint 
        ? settings.endpoint 
        : 'https://api.deepseek.com/v1/chat/completions';
      const model = settings.model || 'deepseek-chat';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: '你是一位精通东方和西方占卜术的资深占卜师。你擅长将古老的智慧与现代人的生活经验相结合，给出深入浅出、温暖而有洞察力的解读。用中文回答。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.85,
          max_tokens: 1500
        })
      });
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '解读生成失败，请稍后再试。';
      aiBody.innerHTML = formatAIText(content);
      
    } catch (fallbackError) {
      aiBody.innerHTML = `<p style="color:var(--accent-east);">解读失败：${fallbackError.message}</p><p style="margin-top:0.5rem;">请检查 API Key 和网络设置后重试。</p>`;
    }
  } finally {
    // 恢复按钮
    btn.disabled = false;
    btn.innerHTML = '🔮 AI 深度解读';
  }
}

// 构建 Prompt
function buildPrompt(type) {
  if (type === 'iching') {
    const hex = currentHexagram;
    return `请为以下周易占卜进行深度解读：

**所问之事：** ${iChingQuestion || '（未指定）'}

**卦象信息：**
- 第${hex.number}卦：${hex.name}（${hex.english}）
- 卦象：${hex.symbol}
- 含义：${hex.meaning}
- 卦辞：${hex.judgment}
- 象辞：${hex.image}
- 基础解读：${hex.reading}
- 建议：${hex.advice}
- 关键词：${hex.keywords.join('、')}

请提供一份 300-500 字的深度解读，包括：
1. 整体卦象分析与所问之事的关联
2. 当前形势的深层含义
3. 具体的行动建议
4. 需要注意的潜在风险
5. 一个温暖的总结语

请用温暖、智慧、有洞察力的语调，结合现代人的生活场景来解读。`;
  }
  
  if (type === 'tarot') {
    let cardsInfo = drawnCards.map((card, idx) => {
      const orientation = card.isReversed ? '逆位' : '正位';
      const keywords = card.isReversed ? card.reversed : card.upright;
      const reading = card.isReversed ? card.reading_reversed : card.reading_upright;
      return `第${idx + 1}张（${card.position}）：${card.name}（${orientation}）
- 关键词：${keywords}
- 解读：${reading}`;
    }).join('\n\n');
    
    return `请为以下塔罗牌占卜进行深度解读：

**所问之事：** ${tarotQuestion || '（未指定）'}
**牌阵：** ${SPREADS[selectedSpread].name}

**抽出的牌：**
${cardsInfo}

请提供一份 400-600 字的深度解读，包括：
1. 牌阵的整体故事线和内在联系
2. 每张牌与所问之事的具体关联
3. 牌与牌之间的互动和影响
4. 当前的核心问题和隐藏因素
5. 具体的行动建议和未来的可能走向
6. 一个温暖有力的总结语

请用温暖、神秘、有洞察力的语调，如同一位经验丰富的塔罗师在对朋友娓娓道来。`;
  }

  if (type === 'ziwei') {
    const chart = ziweiChart;
    const mingPalace = chart.palaces.find(p => p.isMingGong);
    const mingStars = mingPalace ? mingPalace.stars.filter(s => ziweiData && ziweiData.majorStars[s]) : [];

    let chartInfo = `**出生信息：** ${chart.solar.year}年${chart.solar.month}月${chart.solar.day}日 ${SHICHEN_LIST[chart.solar.hour] ? SHICHEN_LIST[chart.solar.hour].name : ''}时
**性别：** ${chart.gender === 'male' ? '男' : '女'}命
**四柱：** ${chart.siZhu.year.gan}${chart.siZhu.year.zhi} · ${chart.siZhu.month.gan}${chart.siZhu.month.zhi} · ${chart.siZhu.day.gan}${chart.siZhu.day.zhi} · ${chart.siZhu.hour.gan}${chart.siZhu.hour.zhi}
**命宫：** ${chart.mingGongGan}${chart.mingGongZhi}（${chart.wuxingJu.naYin}，${chart.wuxingJu.wuxing}${chart.wuxingJu.juNum}局）
**身宫：** ${chart.shenGongPos ? (() => {
      const zhiIdx = (chart.shenGongPos - 1 + 2) % 12;
      return ZiweiEngine.DI_ZHI[zhiIdx];
    })() : ''}

**命宫主星：** ${mingStars.map(s => ziweiData.majorStars[s].name + '(' + ziweiData.majorStars[s].element + ')').join('、')}

**十二宫主星分布：**
${chart.palaces.map(p => {
  const majors = p.stars.filter(s => ziweiData.majorStars[s]);
  return majors.length > 0 ? `- ${p.name}：${majors.map(s => ziweiData.majorStars[s].name).join('、')}` : '';
}).filter(Boolean).join('\n')}`;

    return `请为以下紫微斗数命盘进行深度解读：

${chartInfo}

请提供一份 500-800 字的全面解读，包括：
1. 命宫主星的性格特质与天赋分析
2. 事业运与适合的发展方向
3. 财运特点与理财建议
4. 感情婚姻方面的特点与建议
5. 健康方面需要注意的领域
6. 人生关键时期与转折点
7. 总体格局评价与总结建议

请用专业但温暖的语调，将古代紫微斗数的智慧与现代人的生活经验结合，给出切实有用的建议。避免使用过于晦涩的专业术语。`;
  }

  if (type === 'astrology') {
    const sign = astrologyResult;
    const currentYear = new Date().getFullYear();
    return `请为以下占星术分析进行深度解读：

**星座信息：**
- 星座：${sign.name}（${sign.english}）${sign.symbol}
- 元素：${sign.element}象
- 守护星：${sign.ruler}
- 模态：${sign.modality}宫
- 日期范围：${sign.dateRange}
- 性格特质：${sign.traits.join('、')}
- 关键词：${sign.keywords}

**当前时间背景：** ${currentYear}年

请提供一份 400-600 字的深度解读，包括：
1. ${sign.name}的核心性格特质与深层心理
2. ${currentYear}年整体运势方向与星象重点（结合当年木星、土星等主要行星过境的大方向）
3. 事业发展在${currentYear}年的建议与关注点
4. 感情关系方面的特点与注意事项
5. 财运和理财方面的建议
6. 个人成长和自我提升的方向
7. 温暖有力的总结语

请用神秘而温暖、有洞察力的语调，如同一位经验丰富的占星师在解读星盘，将星座本命特质与${currentYear}年的年度节奏有机结合。`;
  }

  if (type === 'bazi') {
    const r = baziResult;
    const p = r.pillars;
    return `请为以下四柱八字命局进行深度解读：

**出生信息：** ${baziInfo.year}年${baziInfo.month}月${baziInfo.day}日 ${BaziEngine.SHICHEN[baziInfo.hour] ? BaziEngine.SHICHEN[baziInfo.hour].name : ''}

**四柱：**
- 年柱：${p[0].gan}${p[0].zhi}（${r.naYin[0]}）
- 月柱：${p[1].gan}${p[1].zhi}（${r.naYin[1]}）
- 日柱：${p[2].gan}${p[2].zhi}（${r.naYin[2]}）
- 时柱：${p[3].gan}${p[3].zhi}（${r.naYin[3]}）

**日主：** ${r.dayMaster.gan}${r.dayMaster.yinyang}${r.dayMaster.wuxing}

**十神：** 年柱${r.shiShen[0]} · 月柱${r.shiShen[1]} · 时柱${r.shiShen[3]}

**五行分布：** 金${r.wuxingCount['金'].toFixed(1)} 木${r.wuxingCount['木'].toFixed(1)} 水${r.wuxingCount['水'].toFixed(1)} 火${r.wuxingCount['火'].toFixed(1)} 土${r.wuxingCount['土'].toFixed(1)}

**日主强弱：** ${r.strength.strength}
${r.strength.desc}

**喜用神：** ${r.xiYong.desc}

请提供一份 500-800 字的全面解读，包括：
1. 日主性格分析（${r.dayMaster.gan}${r.dayMaster.yinyang}${r.dayMaster.wuxing}的特征）
2. 事业运与适合的发展方向
3. 财运特点与理财建议
4. 感情婚姻方面的特点
5. 健康方面需要注意的五行
6. 人生运势的总体趋势
7. 温暖有力的总结建议

请用专业但温暖的语调，将传统八字智慧与现代人生活结合，避免过于晦涩。`;
  }
}

// 格式化 AI 文本（简单的 Markdown 渲染）
function formatAIText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}
