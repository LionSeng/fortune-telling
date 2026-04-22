/* ============================================
   紫微斗数 — 排盘核心算法
   包含：公历转农历、天干地支、命宫定位、安十四主星、安辅星
   ============================================ */

const ZiweiEngine = {

  // ---- 天干地支常量 ----
  TIAN_GAN: ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  DI_ZHI:   ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
  WU_XING_GAN: ['木','木','火','火','土','土','金','金','水','水'],
  NA_YIN: ['海中金','海中金','炉中火','炉中火','大林木','大林木',
           '路旁土','路旁土','剑锋金','剑锋金','山头火','山头火',
           '涧下水','涧下水','城头土','城头土','白蜡金','白蜡金',
           '杨柳木','杨柳木','泉中水','泉中水','屋上土','屋上土',
           '霹雳火','霹雳火','松柏木','松柏木','长流水','长流水',
           '砂石金','砂石金','山下火','山下火','平地木','平地木',
           '壁上土','壁上土','金箔金','金箔金','覆灯火','覆灯火',
           '天河水','天河水','大驿土','大驿土','钗钏金','钗钏金',
           '桑柘木','桑柘木','大溪水','大溪水','沙中土','沙中土',
           '天上火','天上火','石榴木','石榴木','大海水','大海水'],

  // 十二地支对应序号
  ZHI_IDX: {'子':0,'丑':1,'寅':2,'卯':3,'辰':4,'巳':5,'午':6,'未':7,'申':8,'酉':9,'戌':10,'亥':11},

  // ---- 公历转农历 ----
  // 农历数据编码（1900-2100），每年用16进制表示
  // 编码规则：4位hex = 16bit
  //   bit[0-3]: 闰月月份（0=无闰月）
  //   bit[4]:   闰月大小（0=29天 1=30天）
  //   bit[5-16]: 1-12月大小（0=29天 1=30天）
  lunarInfo: [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,//1900-1909
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,//1910-1919
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,//1920-1929
    0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,//1930-1939
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,//1940-1949
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,//1950-1959
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,//1960-1969
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,//1970-1979
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,//1980-1989
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,//1990-1999
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,//2000-2009
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,//2010-2019
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,//2020-2029
    0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,//2030-2039
    0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,//2040-2049
    0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,//2050-2059
    0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,//2060-2069
    0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,//2070-2079
    0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,//2080-2089
    0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,//2090-2099
    0x0d520 //2100
  ],

  // 返回农历y年的总天数
  _lYearDays(y) {
    let sum = 348; // 12个月 × 29天
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      sum += (this.lunarInfo[y - 1900] & i) ? 1 : 0;
    }
    return sum + this._leapDays(y);
  },

  // 返回农历y年闰月的天数，无闰月返回0
  _leapDays(y) {
    if (this._leapMonth(y)) {
      return (this.lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
    }
    return 0;
  },

  // 返回农历y年闰哪个月，无闰月返回0
  _leapMonth(y) {
    return this.lunarInfo[y - 1900] & 0xf;
  },

  // 返回农历y年m月（非闰月）的天数
  _monthDays(y, m) {
    return (this.lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
  },

  // 公历转农历
  solarToLunar(year, month, day) {
    // 基准日：1900年1月31日 = 农历庚子年正月初一
    const baseDate = new Date(1900, 0, 31);
    const objDate = new Date(year, month - 1, day);
    let offset = Math.floor((objDate - baseDate) / 86400000);

    // 计算年
    let lunarYear, lunarMonth, lunarDay;
    let isLeap = false;

    for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
      const daysInYear = this._lYearDays(lunarYear);
      offset -= daysInYear;
    }
    if (offset < 0) {
      offset += this._lYearDays(--lunarYear); // 修复：使用 --lunarYear
    }

    const leap = this._leapMonth(lunarYear);

    // 计算月
    for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
      // 闰月
      if (leap > 0 && lunarMonth === (leap + 1) && !isLeap) {
        --lunarMonth;
        isLeap = true;
        const daysInMonth = this._leapDays(lunarYear);
        if (offset < daysInMonth) break;
        offset -= daysInMonth;
        isLeap = false;
      } else {
        const daysInMonth = this._monthDays(lunarYear, lunarMonth);
        if (offset < daysInMonth) break;
        offset -= daysInMonth;
      }
    }

    lunarDay = offset + 1;

    return {
      year: lunarYear,
      month: lunarMonth,
      day: lunarDay,
      isLeap: isLeap
    };
  },

  // ---- 天干地支计算 ----
  // 年干支（以立春为界）
  getYearGanZhi(solarYear, solarMonth, solarDay) {
    // 简化：以2月4日为立春分界
    let year = solarYear;
    if (solarMonth < 2 || (solarMonth === 2 && solarDay < 4)) {
      year--;
    }
    const ganIdx = (year - 4) % 10;
    const zhiIdx = (year - 4) % 12;
    return {
      gan: this.TIAN_GAN[ganIdx],
      zhi: this.DI_ZHI[zhiIdx],
      ganIdx, zhiIdx,
      element: this.WU_XING_GAN[ganIdx],
      naYin: this.NA_YIN[(ganIdx % 5) * 12 + zhiIdx] || ''
    };
  },

  // 月干支
  getMonthGanZhi(yearGanIdx, lunarMonth) {
    const zhiIdx = (lunarMonth + 1) % 12; // 正月=寅
    // 五虎遁月
    const ganIdx = ((yearGanIdx % 5) * 2 + zhiIdx) % 10;
    return {
      gan: this.TIAN_GAN[ganIdx],
      zhi: this.DI_ZHI[zhiIdx],
      ganIdx, zhiIdx
    };
  },

  // 日干支
  getDayGanZhi(year, month, day) {
    const baseDate = new Date(1900, 0, 1); // 1900年1月1日 = 庚子日（甲戌日校正：实际为庚子）
    // 1900年1月1日干支：甲戌（索引0=甲子，这里用偏移计算）
    // 实际：1900-01-01 是庚子日，天干庚=6，地支子=0
    const objDate = new Date(year, month - 1, day);
    const offset = Math.floor((objDate - baseDate) / 86400000);
    const ganIdx = (6 + offset) % 10;
    const zhiIdx = (0 + offset) % 12;
    return {
      gan: this.TIAN_GAN[ganIdx],
      zhi: this.DI_ZHI[zhiIdx],
      ganIdx, zhiIdx
    };
  },

  // 时干支
  getHourGanZhi(dayGanIdx, hourIdx) {
    // 五鼠遁时
    const zhiIdx = hourIdx;
    const ganIdx = ((dayGanIdx % 5) * 2 + zhiIdx) % 10;
    return {
      gan: this.TIAN_GAN[ganIdx],
      zhi: this.DI_ZHI[zhiIdx],
      ganIdx, zhiIdx
    };
  },

  // 获取时辰索引（从小时推算）
  getShiChenIdx(hour) {
    // 子时：23-1，丑时：1-3，...
    if (hour === 23 || hour === 0) return 0;
    return Math.ceil(hour / 2);
  },

  // 获取四柱
  getSiZhu(solarYear, solarMonth, solarDay, hour) {
    const lunar = this.solarToLunar(solarYear, solarMonth, solarDay);
    const yearGZ = this.getYearGanZhi(solarYear, solarMonth, solarDay);
    const monthGZ = this.getMonthGanZhi(yearGZ.ganIdx, lunar.month);
    const dayGZ = this.getDayGanZhi(solarYear, solarMonth, solarDay);
    const hourIdx = this.getShiChenIdx(hour);
    const hourGZ = this.getHourGanZhi(dayGZ.ganIdx, hourIdx);

    return {
      year: yearGZ,
      month: monthGZ,
      day: dayGZ,
      hour: hourGZ,
      lunar: lunar,
      hourIdx: hourIdx
    };
  },

  // ---- 命宫定位 ----
  // 命宫位置（以寅宫为1开始编号）
  getMingGongPos(lunarMonth, hourIdx) {
    // 命宫 = (14 - 月 - 时) % 12，结果0-11对应寅-丑
    // 但实际命宫是从寅宫开始顺数
    const pos = (14 - lunarMonth - hourIdx) % 12;
    return pos === 0 ? 12 : pos; // 1-12，1=寅宫
  },

  // 命宫天干（根据年干推算）
  getMingGongGan(yearGanIdx, mingGongPos) {
    // 寅宫对应月干推算：五虎遁
    // 命宫地支 = 寅 + (mingGongPos - 1)
    const zhiIdx = (mingGongPos - 1 + 2) % 12; // 寅=2
    const ganIdx = ((yearGanIdx % 5) * 2 + zhiIdx) % 10;
    return this.TIAN_GAN[ganIdx];
  },

  // 身宫位置
  getShenGongPos(lunarMonth, hourIdx) {
    const pos = (2 + lunarMonth + hourIdx) % 12;
    return pos === 0 ? 12 : pos;
  },

  // ---- 十四主星安星 ----
  // 紫微星定位（核心算法）
  getZiweiPos(lunarDay, hourGanIdx) {
    // 紫微星在寅宫的位置需要根据五行局来确定
    // 简化算法：根据局数和出生日排紫微
    // 完整算法需要根据命宫五行局数 + 农历日数 + 时干推算
    // 这里使用简化版：五行局由命宫天干地支决定

    // 五行局数（根据命纳音）
    // 水二局、木三局、金四局、土五局、火六局
    const wuxingJuMap = {
      '水': 2, '木': 3, '金': 4, '土': 5, '火': 6
    };

    // 需要先算命宫来决定五行局
    // 此方法返回一个函数，需要先有命宫信息
    return null; // 占位，实际在 calculateChart 中调用
  },

  // 根据局数和农历日算紫微位置
  calcZiweiByJu(juNum, lunarDay) {
    // 紫微安星公式：
    // 局数 × (lunarDay / 局数) 的商，然后查表得宫位
    const qi = Math.floor(lunarDay / juNum);
    const remainder = lunarDay % juNum;

    // 紫微星宫位表（寅宫起，按局数和商数）
    const ziweiTable = {
      2: [0, 1, 8, 3, 10, 5, 12, 7, 2, 9, 4, 11, 6], // 水二局
      3: [0, 1, 2, 9, 4, 11, 6, 7, 8, 3, 10, 5, 12], // 木三局
      4: [0, 1, 2, 3, 10, 5, 12, 7, 8, 9, 4, 11, 6], // 金四局
      5: [0, 1, 2, 3, 4, 11, 6, 7, 8, 9, 10, 5, 12], // 土五局
      6: [0, 1, 2, 3, 4, 5, 12, 7, 8, 9, 10, 11, 6]  // 火六局
    };

    const table = ziweiTable[juNum];
    if (!table) return null;
    return table[qi] || 1;
  },

  // 五行局数（根据命宫天干地支的纳音）
  getWuxingJu(mingGongGan, mingGongZhi) {
    const ganIdx = this.TIAN_GAN.indexOf(mingGongGan);
    const zhiIdx = this.ZHI_IDX[mingGongZhi];
    const naYinIdx = (ganIdx % 5) * 12 + zhiIdx;
    const naYin = this.NA_YIN[naYinIdx] || '';
    const wuxing = naYin.replace(/[^金木水火土]/g, '').charAt(0);
    const juMap = { '水': 2, '木': 3, '金': 4, '土': 5, '火': 6 };
    return { juNum: juMap[wuxing] || 5, naYin, wuxing };
  },

  // 紫微星系（根据紫微位置排天府、太阳、武曲等）
  getZiweiSeries(ziweiPos) {
    // 紫微和天府系根据紫微位置固定排列
    // 紫微-天机-太阳-武曲-天同-廉贞 在紫微逆行
    // 天府-太阴-贪狼-巨门-天相-天梁-七杀-破军 在天府逆行
    const pos = (p) => ((p - 1 + 12) % 12) + 1; // 1-12循环

    return {
      ziwei: ziweiPos,
      tianji: pos(ziweiPos - 1),
      taiyang: pos(ziweiPos - 2),
      wuqu: pos(ziweiPos - 3),
      tiantong: pos(ziweiPos - 4),
      lianzhen: pos(ziweiPos - 5),
    };
  },

  // 天府位置（与紫微对称）
  getTianfuPos(ziweiPos) {
    // 天府在紫微对面（紫微-1的位置，按固定规则）
    // 天府位置 = 14 - 紫微位置（如果>12则-12）
    let fuPos = 14 - ziweiPos;
    return fuPos > 12 ? fuPos - 12 : fuPos;
  },

  // 天府星系
  getTianfuSeries(tianfuPos) {
    const pos = (p) => ((p - 1 + 12) % 12) + 1;

    return {
      tianfu: tianfuPos,
      taiyin: pos(tianfuPos - 1),
      tanlang: pos(tianfuPos - 2),
      jumen: pos(tianfuPos - 3),
      tianxiang: pos(tianfuPos - 4),
      tianliang: pos(tianfuPos - 5),
      qisha: pos(tianfuPos - 6),
      pojun: pos(tianfuPos + 1), // 破军与紫微同宫（对面）
    };
  },

  // 辅星安法
  getMinorStars(solarYear, solarMonth, solarDay, hour, lunarMonth, mingGongPos) {
    const yearGZ = this.getYearGanZhi(solarYear, solarMonth, solarDay);
    const dayGZ = this.getDayGanZhi(solarYear, solarMonth, solarDay);
    const hourIdx = this.getShiChenIdx(hour);
    const lunar = this.solarToLunar(solarYear, solarMonth, solarDay);

    const pos = (p) => ((p - 1 + 12) % 12) + 1;
    const stars = {};

    // 左辅：从辰宫起子，顺行至年支
    stars.zuofu = pos(4 + yearGZ.zhiIdx); // 辰=5位置，但按寅起算...

    // 右弼：从戌宫起子，逆行至年支
    stars.youbi = pos(10 - yearGZ.zhiIdx);

    // 文昌：从戌宫起子，顺行至时支
    stars.wenchang = pos(10 + hourIdx);

    // 文曲：从辰宫起子，顺行至时支
    stars.wenqu = pos(4 + hourIdx);

    // 禄存：从寅宫起子，顺行至年干
    const luPosMap = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // 甲寅、乙卯...
    stars.lucun = luPosMap[yearGZ.ganIdx];

    // 天魁：从戌宫起子，逆行至年干
    stars.tiankui = pos(10 - yearGZ.ganIdx);

    // 天钺：从辰宫起子，逆行至年干
    stars.tiyue = pos(4 - yearGZ.ganIdx);

    // 火星：从寅宫起子，顺数至年支和时支的交点
    stars.huoxing = pos(2 + yearGZ.zhiIdx + hourIdx);

    // 铃星：从午宫起子，顺数至年支和时支的交点
    stars.lingxing = pos(6 + yearGZ.zhiIdx + hourIdx);

    // 擎羊：禄存前一位
    stars.qingyang = pos(stars.lucun + 1);

    // 陀罗：禄存后一位
    stars.tuoluo = pos(stars.lucun - 1);

    // 地空：从亥宫起子，顺行至时支
    stars.diakong = pos(11 + hourIdx);

    // 地劫：从亥宫起子，顺行至时支+1
    stars.dijie = pos(11 + hourIdx + 1);

    // 天马：从寅宫起申，顺行至年支
    stars.tianma = pos(2 + (yearGZ.zhiIdx - 8 + 12) % 12);

    return stars;
  },

  // ---- 完整排盘 ----
  calculateChart(solarYear, solarMonth, solarDay, hour) {
    // 1. 公历转农历
    const lunar = this.solarToLunar(solarYear, solarMonth, solarDay);

    // 2. 四柱
    const siZhu = this.getSiZhu(solarYear, solarMonth, solarDay, hour);

    // 3. 命宫位置
    const mingGongPos = this.getMingGongPos(lunar.month, siZhu.hourIdx);
    const shenGongPos = this.getShenGongPos(lunar.month, siZhu.hourIdx);

    // 4. 命宫干支
    const mingGongZhiIdx = (mingGongPos - 1 + 2) % 12; // 寅宫=2
    const mingGongZhi = this.DI_ZHI[mingGongZhiIdx];
    const mingGongGan = this.getMingGongGan(siZhu.year.ganIdx, mingGongPos);

    // 5. 五行局
    const wuxingJu = this.getWuxingJu(mingGongGan, mingGongZhi);

    // 6. 紫微位置
    const ziweiPos = this.calcZiweiByJu(wuxingJu.juNum, lunar.day);

    // 7. 紫微星系
    const ziweiSeries = this.getZiweiSeries(ziweiPos);

    // 8. 天府位置和星系
    const tianfuPos = this.getTianfuPos(ziweiPos);
    const tianfuSeries = this.getTianfuSeries(tianfuPos);

    // 9. 辅星
    const minorStars = this.getMinorStars(solarYear, solarMonth, solarDay, hour, lunar.month, mingGongPos);

    // 10. 构建十二宫
    const palaces = this.buildPalaces(mingGongPos, shenGongPos, ziweiSeries, tianfuSeries, minorStars);

    return {
      solar: { year: solarYear, month: solarMonth, day: solarDay, hour: hour },
      lunar: lunar,
      siZhu: siZhu,
      mingGongPos,
      shenGongPos,
      mingGongGan,
      mingGongZhi,
      wuxingJu,
      ziweiPos,
      tianfuPos,
      palaces: palaces,
      ziweiSeries,
      tianfuSeries,
      minorStars
    };
  },

  // 构建十二宫数据
  buildPalaces(mingGongPos, shenGongPos, ziweiSeries, tianfuSeries, minorStars) {
    const palaceKeys = ['ming','xiongdi','fuqi','zinv','caibo','jiqu','qianyi','jiaoyou','guanlu','tianzhai','fude','fumu'];
    const palaceNames = {
      ming:'命宫', xiongdi:'兄弟宫', fuqi:'夫妻宫', zinv:'子女宫',
      caibo:'财帛宫', jiqu:'疾厄宫', qianyi:'迁移宫', jiaoyou:'交友宫',
      guanlu:'官禄宫', tianzhai:'田宅宫', fude:'福德宫', fumu:'父母宫'
    };

    const palaces = [];

    for (let i = 0; i < 12; i++) {
      const pos = ((mingGongPos - 1 + i) % 12) + 1;
      const key = palaceKeys[i];
      const stars = [];

      // 检查紫微星系哪些星落入此宫
      const ziweiMap = {
        'ziwei': ziweiSeries.ziwei,
        'tianji': ziweiSeries.tianji,
        'taiyang': ziweiSeries.taiyang,
        'wuqu': ziweiSeries.wuqu,
        'tiantong': ziweiSeries.tiantong,
        'lianzhen': ziweiSeries.lianzhen,
      };

      for (const [starName, starPos] of Object.entries(ziweiMap)) {
        if (starPos === pos) stars.push(starName);
      }

      // 检查天府星系
      const tianfuMap = {
        'tianfu': tianfuSeries.tianfu,
        'taiyin': tianfuSeries.taiyin,
        'tanlang': tianfuSeries.tanlang,
        'jumen': tianfuSeries.jumen,
        'tianxiang': tianfuSeries.tianxiang,
        'tianliang': tianfuSeries.tianliang,
        'qisha': tianfuSeries.qisha,
        'pojun': tianfuSeries.pojun,
      };

      for (const [starName, starPos] of Object.entries(tianfuMap)) {
        if (starPos === pos) stars.push(starName);
      }

      // 检查辅星
      for (const [starName, starPos] of Object.entries(minorStars)) {
        if (starPos === pos) stars.push(starName);
      }

      palaces.push({
        key: key,
        name: palaceNames[key],
        position: pos,
        stars: stars,
        isMingGong: pos === mingGongPos,
        isShenGong: pos === shenGongPos
      });
    }

    return palaces;
  }
};
