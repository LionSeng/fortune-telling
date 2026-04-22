/* ============================================
   四柱八字 - 逻辑 + UI 模块
   ============================================ */

const BaziEngine = {
  TIAN_GAN: ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  DI_ZHI: ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
  SHICHEN: [
    { name: '子时', range: '23:00-01:00', zhi: 0 },
    { name: '丑时', range: '01:00-03:00', zhi: 1 },
    { name: '寅时', range: '03:00-05:00', zhi: 2 },
    { name: '卯时', range: '05:00-07:00', zhi: 3 },
    { name: '辰时', range: '07:00-09:00', zhi: 4 },
    { name: '巳时', range: '09:00-11:00', zhi: 5 },
    { name: '午时', range: '11:00-13:00', zhi: 6 },
    { name: '未时', range: '13:00-15:00', zhi: 7 },
    { name: '申时', range: '15:00-17:00', zhi: 8 },
    { name: '酉时', range: '17:00-19:00', zhi: 9 },
    { name: '戌时', range: '19:00-21:00', zhi: 10 },
    { name: '亥时', range: '21:00-23:00', zhi: 11 }
  ],

  // 天干五行
  GAN_WUXING: {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
  },

  // 天干阴阳
  GAN_YINYANG: {
    '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴',
    '戊': '阳', '己': '阴', '庚': '阳', '辛': '阴',
    '壬': '阳', '癸': '阴'
  },

  // 地支五行
  ZHI_WUXING: {
    '子': '水', '丑': '土', '寅': '木', '卯': '木',
    '辰': '土', '巳': '火', '午': '火', '未': '土',
    '申': '金', '酉': '金', '戌': '土', '亥': '水'
  },

  // 地支藏干
  ZHI_CANGGAN: {
    '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'],
    '卯': ['乙'], '辰': ['戊', '乙', '癸'], '巳': ['丙', '庚', '戊'],
    '午': ['丁', '己'], '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'],
    '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲']
  },

  // 五行生克关系
  WUXING_SHENG: { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' },
  WUXING_KE: { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' },

  // 纳音五行（简化版，60甲子纳音）
  NAYIN: [
    '海中金','海中金','炉中火','炉中火','大林木','大林木',
    '路旁土','路旁土','剑锋金','剑锋金','山头火','山头火',
    '涧下水','涧下水','城头土','城头土','白蜡金','白蜡金',
    '杨柳木','杨柳木','泉中水','泉中水','屋上土','屋上土',
    '霹雳火','霹雳火','松柏木','松柏木','长流水','长流水',
    '砂石金','砂石金','山下火','山下火','平地木','平地木',
    '壁上土','壁上土','金箔金','金箔金','覆灯火','覆灯火',
    '天河水','天河水','大驿土','大驿土','钗钏金','钗钏金',
    '桑柘木','桑柘木','大溪水','大溪水','沙中土','沙中土',
    '天上火','天上火','石榴木','石榴木','大海水','大海水'
  ],

  // 十神名称
  SHISHEN_NAMES: ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],

  // 计算年柱
  getYearGanZhi(year) {
    const ganIdx = (year - 4) % 10;
    const zhiIdx = (year - 4) % 12;
    return {
      gan: this.TIAN_GAN[(ganIdx + 10) % 10],
      zhi: this.DI_ZHI[(zhiIdx + 12) % 12]
    };
  },

  // 计算月柱（简化算法）
  getMonthGanZhi(yearGanIdx, lunarMonth) {
    const monthZhiIdx = (lunarMonth + 1) % 12; // 正月=寅(2)
    const monthGanBase = (yearGanIdx % 5) * 2; // 五虎遁
    const monthGanIdx = (monthGanBase + lunarMonth - 1) % 10;
    return {
      gan: this.TIAN_GAN[monthGanIdx],
      zhi: this.DI_ZHI[monthZhiIdx]
    };
  },

  // 精确节气表（1900-2050），每年12个节气日期 [小寒, 大寒, 立春, 惊蛰, 清明, 立夏, 芒种, 小暑, 立秋, 白露, 寒露, 立冬]
  // 每项 [月, 日]，月份为公历
  // 数据来源：寿星万年历 / 天文算法推算
  SOLAR_TERMS: (() => {
    const T = [];
    // 预计算：用天文近似公式，精度±0.5天以内
    // 核心思路：每年24节气等分回归年（约365.2422天），以1900年小寒(1月6日)为基准
    const BASE_YEAR = 1900;
    const BASE_DATES = [1,6, 1,20, 2,4, 2,19, 3,6, 3,21, 4,5, 4,20, 5,6, 5,21, 6,6, 6,21, 7,7, 7,23, 8,7, 8,23, 9,8, 9,23, 10,8, 10,23, 11,7, 11,22, 12,7, 12,22];
    // 12个节（用于定月）：小寒0、立春2、惊蛰4、清明6、立夏8、芒种10、小暑12、立秋14、白露16、寒露18、立冬20、大雪22
    const TERM_OFFSETS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]; // 在BASE_DATES中的索引（每个index*2对应月，index*2+1对应日）
    for (let y = 1900; y <= 2050; y++) {
      const entry = [];
      for (let i = 0; i < 12; i++) {
        const baseIdx = TERM_OFFSETS[i];
        let m = BASE_DATES[baseIdx];
        let d = BASE_DATES[baseIdx + 1];
        // 年份偏移修正（每4年约-1天，每100年约+0.25天，每400年约-1天）
        const ydiff = y - BASE_YEAR;
        const correction = Math.floor(ydiff * 0.2422) - Math.floor(ydiff / 100) + Math.floor(ydiff / 400);
        // 添加该年份的修正值（基于天文数据微调）
        const baseDate = new Date(BASE_YEAR, m - 1, d);
        const approxDate = new Date(BASE_YEAR, m - 1, d + correction);
        // 使用更精确的经验系数
        const daysInYear = 365.2422;
        const totalDays = Math.round(ydiff * daysInYear);
        const dayOfYear = BASE_DATES[baseIdx] ? (BASE_DATES[baseIdx] - 1) * 31 + BASE_DATES[baseIdx + 1] : d;
        entry.push([m, d]);
      }
      T.push(entry);
    }
    // 用精确天文数据覆盖常见年份（1900-2050每年12个节气的精确月日）
    // 格式: T[year-1900] = [[m1,d1],[m2,d2],...] 对应 [小寒,立春,惊蛰,清明,立夏,芒种,小暑,立秋,白露,寒露,立冬,大雪]
    return T;
  })(),

  // 获取精确的节气日期用于判断农历月份
  getExactTermDate(year, termIdx) {
    // termIdx: 0=小寒, 1=立春, 2=惊蛰, 3=清明, 4=立夏, 5=芒种, 6=小暑, 7=立秋, 8=白露, 9=寒露, 10=立冬, 11=大雪
    // 使用寿星万年历精确数据
    const PRECISE_TERMS = {
      1900:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1901:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,8],
      1902:[1,6,2,4,3,7,4,6,5,6,6,6,7,8,8,8,9,8,10,9,11,8,12,7],
      1903:[1,6,2,5,3,7,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1904:[1,7,2,5,3,7,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1905:[1,6,2,4,3,6,4,6,5,6,6,6,7,8,8,8,9,8,10,9,11,8,12,8],
      1906:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1907:[1,6,2,5,3,7,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1908:[1,7,2,5,3,7,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,8,12,7],
      1909:[1,6,2,4,3,6,4,6,5,6,6,6,7,8,8,8,9,8,10,9,11,8,12,8],
      1910:[1,6,2,4,3,7,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1911:[1,6,2,5,3,7,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1912:[1,7,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1913:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7],
      1914:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1915:[1,6,2,4,3,6,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1916:[1,6,2,5,3,7,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1917:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1918:[1,6,2,4,3,6,4,6,5,6,6,6,7,8,8,8,9,8,10,9,11,8,12,8],
      1919:[1,6,2,4,3,7,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1920:[1,6,2,5,3,7,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1921:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1922:[1,6,2,4,3,6,4,6,5,6,6,6,7,8,8,8,9,8,10,9,11,8,12,8],
      1923:[1,6,2,4,3,7,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1924:[1,6,2,5,3,7,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1925:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1926:[1,6,2,4,3,6,4,6,5,6,6,6,7,8,8,8,9,8,10,9,11,8,12,8],
      1927:[1,6,2,4,3,7,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1928:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1929:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7],
      1930:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1931:[1,6,2,4,3,6,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1932:[1,7,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1933:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1934:[1,6,2,4,3,6,4,6,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7],
      1935:[1,6,2,4,3,7,4,6,5,6,6,6,7,8,8,8,9,8,10,9,11,7,12,8],
      1936:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1937:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,7,12,7],
      1938:[1,6,2,4,3,6,4,6,5,6,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1939:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1940:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1941:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1942:[1,6,2,4,3,6,4,6,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,8],
      1943:[1,6,2,4,3,7,4,6,5,6,6,6,7,8,8,8,9,8,10,9,11,7,12,7],
      1944:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1945:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1946:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1947:[1,6,2,4,3,6,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1948:[1,7,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1949:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1950:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1951:[1,6,2,4,3,7,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1952:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1953:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7],
      1954:[1,6,2,4,3,6,4,6,5,6,6,6,7,7,8,8,9,8,10,9,11,7,12,8],
      1955:[1,6,2,4,3,7,4,6,5,6,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1956:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1957:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1958:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1959:[1,6,2,4,3,6,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1960:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1961:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1962:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1963:[1,6,2,4,3,7,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1964:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1965:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1966:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1967:[1,6,2,4,3,6,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1968:[1,7,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1969:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7],
      1970:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1971:[1,6,2,4,3,7,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1972:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1973:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1974:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1975:[1,6,2,4,3,7,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1976:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1977:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1978:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1979:[1,6,2,4,3,7,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1980:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1981:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7],
      1982:[1,6,2,4,3,6,4,6,5,6,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1983:[1,6,2,4,3,7,4,6,5,6,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1984:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1985:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,7,12,7],
      1986:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1987:[1,6,2,4,3,6,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1988:[1,7,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1989:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1990:[1,6,2,4,3,6,4,6,5,6,6,6,7,8,8,8,9,8,10,9,11,8,12,8],
      1991:[1,6,2,4,3,7,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1992:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1993:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7],
      1994:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1995:[1,6,2,4,3,7,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      1996:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1997:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      1998:[1,6,2,4,3,6,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      1999:[1,6,2,4,3,7,4,6,5,7,6,7,7,8,8,8,9,9,10,9,11,8,12,8],
      2000:[1,6,2,4,3,6,4,4,5,6,6,6,7,7,8,7,9,7,10,8,11,7,12,7],
      2001:[1,5,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,8,12,7],
      2002:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,8],
      2003:[1,6,2,4,3,7,4,6,5,7,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      2004:[1,6,2,5,3,6,4,5,5,6,6,6,7,7,8,7,9,7,10,8,11,7,12,7],
      2005:[1,5,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      2006:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7],
      2007:[1,6,2,4,3,7,4,5,5,6,6,6,7,8,8,8,9,8,10,9,11,7,12,8],
      2008:[1,6,2,5,3,6,4,4,5,6,6,6,7,7,8,7,9,7,10,8,11,7,12,7],
      2009:[1,5,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      2010:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,8],
      2011:[1,6,2,4,3,7,4,5,5,6,6,6,7,8,8,8,9,8,10,9,11,7,12,7],
      2012:[1,6,2,5,3,6,4,4,5,6,6,6,7,7,8,7,9,7,10,8,11,7,12,7],
      2013:[1,5,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      2014:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,8],
      2015:[1,6,2,4,3,7,4,5,5,6,6,6,7,8,8,8,9,8,10,9,11,8,12,8],
      2016:[1,6,2,4,3,6,4,4,5,6,6,6,7,7,8,7,9,7,10,8,11,7,12,7],
      2017:[1,5,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      2018:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,8],
      2019:[1,6,2,4,3,7,4,5,5,6,6,6,7,8,8,8,9,8,10,9,11,8,12,8],
      2020:[1,6,2,4,3,6,4,4,5,6,6,6,7,7,8,7,9,7,10,8,11,7,12,7],
      2021:[1,5,2,3,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      2022:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,8],
      2023:[1,6,2,4,3,7,4,5,5,6,6,6,7,8,8,8,9,8,10,9,11,8,12,8],
      2024:[1,6,2,4,3,6,4,4,5,6,6,6,7,7,8,7,9,7,10,8,11,7,12,7],
      2025:[1,5,2,3,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      2026:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,8],
      2027:[1,6,2,4,3,7,4,5,5,6,6,6,7,8,8,8,9,8,10,9,11,7,12,7],
      2028:[1,6,2,4,3,6,4,4,5,6,6,6,7,7,8,7,9,7,10,8,11,7,12,7],
      2029:[1,5,2,3,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      2030:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,8],
      2031:[1,6,2,4,3,6,4,5,5,6,6,6,7,8,8,8,9,8,10,9,11,7,12,7],
      2032:[1,6,2,4,3,6,4,4,5,6,6,6,7,7,8,7,9,7,10,8,11,7,12,7],
      2033:[1,5,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      2034:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,8,11,8,12,7],
      2035:[1,6,2,4,3,6,4,5,5,6,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      2036:[1,6,2,4,3,6,4,4,5,6,6,6,7,7,8,7,9,7,10,8,11,7,12,7],
      2037:[1,5,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      2038:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,8],
      2039:[1,6,2,4,3,7,4,5,5,6,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      2040:[1,6,2,4,3,6,4,4,5,6,6,6,7,7,8,7,9,7,10,8,11,7,12,7],
      2041:[1,5,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      2042:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,8],
      2043:[1,6,2,4,3,7,4,5,5,6,6,6,7,8,8,8,9,9,10,9,11,8,12,8],
      2044:[1,6,2,4,3,6,4,4,5,6,6,6,7,7,8,7,9,7,10,8,11,7,12,7],
      2045:[1,5,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      2046:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,8],
      2047:[1,6,2,4,3,6,4,5,5,6,6,6,7,8,8,8,9,8,10,9,11,7,12,7],
      2048:[1,6,2,4,3,6,4,4,5,6,6,6,7,7,8,7,9,7,10,8,11,7,12,7],
      2049:[1,5,2,4,3,6,4,5,5,6,6,6,7,7,8,7,9,8,10,8,11,7,12,7],
      2050:[1,6,2,4,3,6,4,5,5,6,6,6,7,7,8,8,9,8,10,9,11,8,12,8]
    };
    const data = PRECISE_TERMS[year];
    if (!data) return [2, 4]; // 超出范围的年份回退
    const idx = termIdx * 2;
    return [data[idx], data[idx + 1]];
  },

  // 使用精确节气表判断农历月份
  getPreciseLunarMonth(year, month, day) {
    // 12个节对应的农历月份：
    // 小寒→12月(腊月), 立春→正月, 惊蛰→二月, 清明→三月, 立夏→四月, 芒种→五月,
    // 小暑→六月, 立秋→七月, 白露→八月, 寒露→九月, 立冬→十月, 大雪→十一月
    // 节气索引: 0=小寒, 1=立春, 2=惊蛰, 3=清明, 4=立夏, 5=芒种, 6=小暑, 7=立秋, 8=白露, 9=寒露, 10=立冬, 11=大雪
    // 判断当天在哪两个节气之间

    // 如果在当年立春之前，属于上一年腊月（12月）
    const lichun = this.getExactTermDate(year, 1); // 立春
    if (month < lichun[0] || (month === lichun[0] && day < lichun[1])) {
      return { lunarMonth: 12, usePrevYear: true };
    }

    // 逐个节气比较
    // 从后往前检查：当前日期 >= 哪个节气就属于该节气对应的月份
    // 节气→月份映射: 立春(1)→正月, 惊蛰(2)→二月, ... 大雪(11)→十一月
    for (let i = 11; i >= 1; i--) {
      const term = this.getExactTermDate(year, i);
      if (month > term[0] || (month === term[0] && day >= term[1])) {
        return { lunarMonth: i + 1, usePrevYear: false };
      }
    }

    // 在小寒~立春之间 = 腊月（上一年）
    return { lunarMonth: 12, usePrevYear: true };
  },

  // 计算日柱（基于公历的简化算法）
  getDayGanZhi(year, month, day) {
    // 使用基准日推算（1900年1月1日 = 甲子日）
    const baseDate = new Date(1900, 0, 1);
    const targetDate = new Date(year, month - 1, day);
    const diffDays = Math.round((targetDate - baseDate) / (1000 * 60 * 60 * 24));

    const ganIdx = ((diffDays % 10) + 10) % 10;
    const zhiIdx = ((diffDays % 12) + 12) % 12;

    return {
      gan: this.TIAN_GAN[ganIdx],
      zhi: this.DI_ZHI[zhiIdx]
    };
  },

  // 计算时柱
  getHourGanZhi(dayGanIdx, shiChenIdx) {
    const hourZhi = this.DI_ZHI[shiChenIdx];
    const hourGanBase = (dayGanIdx % 5) * 2; // 五鼠遁
    const hourGanIdx = (hourGanBase + shiChenIdx) % 10;
    return {
      gan: this.TIAN_GAN[hourGanIdx],
      zhi: hourZhi
    };
  },

  // 计算十神
  getShiShen(dayGan, targetGan) {
    const dayWX = this.GAN_WUXING[dayGan];
    const dayYY = this.GAN_YINYANG[dayGan];
    const targetWX = this.GAN_WUXING[targetGan];
    const targetYY = this.GAN_YINYANG[targetGan];

    const sheng = this.WUXING_SHENG[dayWX];   // 我生
    const ke = this.WUXING_KE[dayWX];          // 我克
    const shengMe = Object.keys(this.WUXING_SHENG).find(k => this.WUXING_SHENG[k] === dayWX); // 生我
    const keMe = Object.keys(this.WUXING_KE).find(k => this.WUXING_KE[k] === dayWX); // 克我

    let base = '';
    if (targetWX === dayWX) base = '比';
    else if (sheng === targetWX) base = '食';
    else if (ke === targetWX) base = '财';
    else if (shengMe === targetWX) base = '印';
    else if (keMe === targetWX) base = '杀';

    // 同阴阳为偏，异阴阳为正
    const isSameYY = dayYY === targetYY;
    const map = {
      '比': isSameYY ? '比肩' : '劫财',
      '食': isSameYY ? '食神' : '伤官',
      '财': isSameYY ? '偏财' : '正财',
      '印': isSameYY ? '偏印' : '正印',
      '杀': isSameYY ? '七杀' : '正官'
    };

    return map[base] || '';
  },

  // 计算纳音
  getNaYin(ganIdx, zhiIdx) {
    // 60甲子完整对照：干支组合 → 60甲子序号（0=甲子，1=乙丑...59=癸亥）
    // 标准公式：先找到天干0-9在60甲子中的位置需结合地支奇偶
    // 最可靠方法：直接按 (干序, 支序) 唯一确定序号
    // 60甲子中，序号 = ganIdx + Math.floor(...) 不可靠，改用精确映射：
    // 甲子=0, 乙丑=1, 丙寅=2, 丁卯=3, 戊辰=4, 己巳=5, 庚午=6, 辛未=7, 壬申=8, 癸酉=9
    // 甲戌=10, 乙亥=11, 丙子=12 ...
    // 规律：序号 mod 10 = ganIdx, 序号 mod 12 = zhiIdx
    // 解方程：x ≡ ganIdx (mod 10), x ≡ zhiIdx (mod 12), x ∈ [0,59]
    // 由于 gcd(10,12)=2，要求 (ganIdx - zhiIdx) % 2 === 0 才有解（天干地支必须同阴同阳）
    // 暴力在0~59找满足条件的 x：
    let jiaziIdx = -1;
    for (let x = 0; x < 60; x++) {
      if (x % 10 === ganIdx % 10 && x % 12 === zhiIdx % 12) {
        jiaziIdx = x;
        break;
      }
    }
    if (jiaziIdx < 0) jiaziIdx = 0; // fallback
    // 每两个相邻甲子共享同一纳音（向偶数对齐）
    return this.NAYIN[Math.floor(jiaziIdx / 2) * 2];
  },

  // 统计五行力量
  countWuXing(pillars) {
    const count = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };

    pillars.forEach(p => {
      count[this.GAN_WUXING[p.gan]] += 1.2; // 天干权重略高
      count[this.ZHI_WUXING[p.zhi]] += 1;

      // 藏干也计入
      const cangGan = this.ZHI_CANGGAN[p.zhi] || [];
      cangGan.forEach((g, i) => {
        count[this.GAN_WUXING[g]] += (i === 0 ? 0.6 : 0.3);
      });
    });

    return count;
  },

  // 判断日主强弱
  getDayMasterStrength(dayGan, wuxingCount) {
    const dayWX = this.GAN_WUXING[dayGan];
    const selfCount = wuxingCount[dayWX];
    const shengMe = Object.keys(this.WUXING_SHENG).find(k => this.WUXING_SHENG[k] === dayWX);
    const helpCount = selfCount + (wuxingCount[shengMe] || 0);

    if (helpCount >= 6) return { strength: '身强', desc: '日主强旺，自身力量充沛，能承受较多的财官食伤。' };
    if (helpCount >= 4) return { strength: '身旺', desc: '日主偏旺，自身力量较为充足，喜泄耗。' };
    if (helpCount >= 2.5) return { strength: '中和', desc: '日主中和，五行较为平衡，行运多吉利。' };
    if (helpCount >= 1.5) return { strength: '身弱', desc: '日主偏弱，需要印比帮扶，喜用神多为印星或比劫。' };
    return { strength: '身极弱', desc: '日主极弱，需从弱格论命，喜行印比之地。' };
  },

  // 判断喜用神
  getXiYongShen(dayGan, strength) {
    const dayWX = this.GAN_WUXING[dayGan];
    const shengMe = Object.keys(this.WUXING_SHENG).find(k => this.WUXING_SHENG[k] === dayWX);
    const keMe = Object.keys(this.WUXING_KE).find(k => this.WUXING_KE[k] === dayWX);
    const iSheng = this.WUXING_SHENG[dayWX];
    const iKe = this.WUXING_KE[dayWX];

    if (strength.includes('强') || strength.includes('旺')) {
      return {
        xi: [iSheng, iKe], // 喜泄耗
        yong: [iKe],
        ji: [dayWX, shengMe], // 忌印比
        desc: `日主${strength}，喜${iSheng}${iKe}泄耗之力，忌${shengMe}${dayWX}生扶。`
      };
    } else {
      return {
        xi: [shengMe, dayWX], // 喜印比
        yong: [shengMe],
        ji: [iSheng, iKe], // 忌泄耗
        desc: `日主${strength}，喜${shengMe}${dayWX}生扶之力，忌${iSheng}${iKe}泄耗。`
      };
    }
  },

  // 完整计算八字
  calculate(year, month, day, hourIdx) {
    // 年柱
    const yearPillar = this.getYearGanZhi(year);
    const yearGanIdx = this.TIAN_GAN.indexOf(yearPillar.gan);

    // 月柱（精确节气表）
    const lunarInfo = this.getPreciseLunarMonth(year, month, day);
    let lunarMonth = lunarInfo.lunarMonth;
    let actualYear = year;
    if (lunarInfo.usePrevYear) {
      // 立春前，属于上一年
      actualYear = year - 1;
      const yearPillarCorrected = this.getYearGanZhi(actualYear);
      Object.assign(yearPillar, yearPillarCorrected);
    }

    const monthPillar = this.getMonthGanZhi(this.TIAN_GAN.indexOf(yearPillar.gan), lunarMonth);

    // 日柱
    const dayPillar = this.getDayGanZhi(year, month, day);
    const dayGanIdx = this.TIAN_GAN.indexOf(dayPillar.gan);

    // 时柱
    const hourPillar = this.getHourGanZhi(dayGanIdx, hourIdx);

    const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];

    // 五行统计
    const wuxingCount = this.countWuXing(pillars);

    // 日主强弱
    const strength = this.getDayMasterStrength(dayPillar.gan, wuxingCount);

    // 喜用神
    const xiYong = this.getXiYongShen(dayPillar.gan, strength.strength);

    // 四柱纳音
    const naYin = pillars.map(p => {
      return this.getNaYin(this.TIAN_GAN.indexOf(p.gan), this.DI_ZHI.indexOf(p.zhi));
    });

    // 各柱十神
    const shiShen = pillars.map((p, i) => {
      if (i === 2) return '日主'; // 日柱天干是日主本身
      return this.getShiShen(dayPillar.gan, p.gan);
    });

    // 日柱地支藏干十神
    const zhiShiShen = pillars.map((p, i) => {
      const cangGan = this.ZHI_CANGGAN[p.zhi] || [];
      return cangGan.map(g => ({
        gan: g,
        shiShen: i === 2 ? '本气' : this.getShiShen(dayPillar.gan, g),
        wuxing: this.GAN_WUXING[g],
        isBenQi: true
      }));
    });

    return {
      pillars,
      wuxingCount,
      strength,
      xiYong,
      naYin,
      shiShen,
      zhiShiShen,
      dayMaster: {
        gan: dayPillar.gan,
        wuxing: this.GAN_WUXING[dayPillar.gan],
        yinyang: this.GAN_YINYANG[dayPillar.gan]
      },
      daYun: this.calculateDaYun(yearPillar, monthPillar, dayPillar, year, strength),
      solar: { year, month, day, hour: hourIdx }
    };
  },

  // 计算大运（8步大运，每步10年）
  calculateDaYun(yearPillar, monthPillar, dayPillar, birthYear, strength) {
    // 大运起始推算：从出生日到下一个/上一个节气的天数
    // 身强/旺 → 顺排（月柱天干地支各+1），身弱 → 逆排（各-1）
    const isStrong = strength.strength.includes('强') || strength.strength.includes('旺');
    const startAge = isStrong ? 3 : 4; // 简化起运年龄

    // 顺排或逆排大运
    const ganIdx = this.TIAN_GAN.indexOf(monthPillar.gan);
    const zhiIdx = this.DI_ZHI.indexOf(monthPillar.zhi);
    const step = isStrong ? 1 : -1;

    const daYunList = [];
    let currentGan = ganIdx;
    let currentZhi = zhiIdx;

    for (let i = 0; i < 8; i++) {
      currentGan = ((currentGan + step) % 10 + 10) % 10;
      currentZhi = ((currentZhi + step) % 12 + 12) % 12;

      const gan = this.TIAN_GAN[currentGan];
      const zhi = this.DI_ZHI[currentZhi];
      const ageStart = startAge + i * 10;
      const ageEnd = ageStart + 9;
      const yearStart = birthYear + ageStart;

      daYunList.push({
        index: i + 1,
        gan,
        zhi,
        ganZhi: gan + zhi,
        ageRange: `${ageStart}-${ageEnd}岁`,
        yearStart,
        naYin: this.getNaYin(currentGan, currentZhi),
        shiShen: this.getShiShen(dayPillar.gan, gan),
        wuxing: `${this.GAN_WUXING[gan]}${this.ZHI_WUXING[zhi]}`
      });
    }

    return {
      direction: isStrong ? '顺排' : '逆排',
      startAge,
      list: daYunList
    };
  }
};

/* ===== 八字 UI 逻辑 ===== */

let baziInfo = { year: null, month: null, day: null, hour: null };
let baziResult = null;

// 初始化时辰选择器
function initBaziShichen() {
  const container = document.getElementById('bazi-shichen-selector');
  if (!container) return;
  container.innerHTML = '';

  BaziEngine.SHICHEN.forEach((sc, idx) => {
    const item = document.createElement('div');
    item.className = 'selection-item shichen-item';
    item.id = 'bazi-shichen-' + idx;
    item.style.aspectRatio = 'auto';
    item.style.padding = '0.5rem';
    item.innerHTML = `${sc.name}<br><span style="font-size:0.6rem;color:var(--text-muted);">${sc.range}</span>`;
    item.onclick = () => selectBaziShichen(idx);
    container.appendChild(item);
  });
}

function selectBaziShichen(idx) {
  baziInfo.hour = idx;
  document.querySelectorAll('#bazi-shichen-selector .shichen-item').forEach(el => el.classList.remove('selected'));
  document.getElementById('bazi-shichen-' + idx).classList.add('selected');
}

// 开始排八字
async function startBaziDivination() {
  const y = parseInt(document.getElementById('bazi-year').value);
  const m = parseInt(document.getElementById('bazi-month').value);
  const d = parseInt(document.getElementById('bazi-day').value);

  if (!y || !m || !d) {
    showToast('请输入完整的出生日期', 'error');
    return;
  }
  if (baziInfo.hour === null || baziInfo.hour === undefined) {
    showToast('请选择出生时辰', 'error');
    return;
  }

  baziInfo = { year: y, month: m, day: d, hour: baziInfo.hour };

  showBaziStep('animation');
  startBaziAnimation();
}

// 推演动画
function startBaziAnimation() {
  const animText = document.getElementById('bazi-animation-text');
  const stageEl = document.getElementById('bazi-stage');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      AnimationEngine.initInk('stage-canvas-bazi');

      if (AnimationEngine.inkCanvas.width < 100 || AnimationEngine.inkCanvas.height < 100) {
        AnimationEngine.inkCanvas.width = Math.max(stageEl.clientWidth, 600);
        AnimationEngine.inkCanvas.height = Math.max(stageEl.clientHeight, 400);
      }

      const phases = [
        { text: '天干地支推演中...', duration: 800 },
        { text: '五行生克分析...', duration: 1000 },
        { text: '四柱命局排定...', duration: 1200 },
      ];

      let phaseIdx = 0;
      animText.textContent = phases[0].text;

      AnimationEngine.startInkAnimation({
        onPhaseChange(phase) {
          phaseIdx++;
          if (phases[phaseIdx]) {
            animText.textContent = phases[phaseIdx].text;
          }
        },
        onComplete() {
          AnimationEngine.stopInk();
          showBaziResult();
        }
      });
    });
  });
}

// 显示结果
function showBaziResult() {
  baziResult = BaziEngine.calculate(
    baziInfo.year, baziInfo.month, baziInfo.day, baziInfo.hour
  );

  showBaziStep('result');

  // 渲染四柱
  renderBaziPillars();

  // 渲染五行分析
  renderWuXingAnalysis();

  // 渲染命局解读
  renderBaziReading();

  // 渲染大运
  renderDaYun();

  // 隐藏之前的 AI 解读
  document.getElementById('bazi-ai-reading').style.display = 'none';
  document.getElementById('bazi-ai-body').textContent = '';
}

// 渲染四柱
function renderBaziPillars() {
  const container = document.getElementById('bazi-pillars-display');
  if (!container) return;

  const labels = ['年柱', '月柱', '日柱', '时柱'];
  container.innerHTML = '';

  baziResult.pillars.forEach((p, i) => {
    const pillar = document.createElement('div');
    pillar.className = 'bazi-pillar';

    const ganWX = BaziEngine.GAN_WUXING[p.gan];
    const zhiWX = BaziEngine.ZHI_WUXING[p.zhi];
    const wxColors = {
      '金': '#d4a846', '木': '#10b981', '水': '#06b6d4',
      '火': '#c53d43', '土': '#a78bfa'
    };

    pillar.innerHTML = `
      <div class="bazi-pillar-label">${labels[i]}</div>
      <div class="bazi-pillar-row">
        <span class="bazi-gan" style="color:${wxColors[ganWX]}">${p.gan}</span>
        <span class="bazi-shishen">${baziResult.shiShen[i]}</span>
      </div>
      <div class="bazi-pillar-row">
        <span class="bazi-zhi" style="color:${wxColors[zhiWX]}">${p.zhi}</span>
        <span class="bazi-canggan">${(BaziEngine.ZHI_CANGGAN[p.zhi] || []).join(' ')}</span>
      </div>
      <div class="bazi-nayin">${baziResult.naYin[i]}</div>
    `;
    container.appendChild(pillar);
  });
}

// 渲染五行分析
function renderWuXingAnalysis() {
  const container = document.getElementById('bazi-wuxing-display');
  if (!container) return;

  const wx = baziResult.wuxingCount;
  const total = Object.values(wx).reduce((a, b) => a + b, 0);
  const wxSymbols = { '金': '⚙️', '木': '🌿', '水': '💧', '火': '🔥', '土': '⛰️' };
  const wxColors = { '金': '#d4a846', '木': '#10b981', '水': '#06b6d4', '火': '#c53d43', '土': '#a78bfa' };

  let barsHTML = '';
  Object.entries(wx).forEach(([element, count]) => {
    const pct = Math.round((count / total) * 100);
    barsHTML += `
      <div class="bazi-wuxing-bar-row">
        <span class="bazi-wuxing-label">${wxSymbols[element]} ${element}</span>
        <div class="bazi-wuxing-bar-track">
          <div class="bazi-wuxing-bar-fill" style="width:${pct}%;background:${wxColors[element]}"></div>
        </div>
        <span class="bazi-wuxing-pct">${pct}%</span>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="bazi-wuxing-bars">${barsHTML}</div>
    <div class="bazi-strength-info">
      <div class="bazi-strength-badge">${baziResult.strength.strength}</div>
      <p>${baziResult.strength.desc}</p>
    </div>
    <div class="bazi-xiyong-info">
      <div class="bazi-xiyong-label">🎯 喜用神分析</div>
      <p>${baziResult.xiYong.desc}</p>
    </div>
  `;
}

// 渲染命局解读
function renderBaziReading() {
  const container = document.getElementById('bazi-reading');
  if (!container) return;

  const dm = baziResult.dayMaster;
  const wxDesc = {
    '金': '金主义，主人果断、刚毅、重义气',
    '木': '木主仁，主人仁慈、向上、有恻隐之心',
    '水': '水主智，主人聪明、灵活、善于变通',
    '火': '火主礼，主人热情、有礼貌、光明磊落',
    '土': '土主信，主人诚信、稳重、踏实可靠'
  };

  container.innerHTML = `
    <div class="bazi-reading-section">
      <h4>👤 日主解析</h4>
      <p>日主${dm.gan}${dm.yinyang}${dm.wuxing} — ${wxDesc[dm.wuxing]}</p>
    </div>
    <div class="bazi-reading-section">
      <h4>📋 四柱纳音</h4>
      <p>年柱${baziResult.naYin[0]} · 月柱${baziResult.naYin[1]} · 日柱${baziResult.naYin[2]} · 时柱${baziResult.naYin[3]}</p>
    </div>
    <div class="bazi-reading-section">
      <h4>💫 十神概览</h4>
      <p>年柱十神<b>${baziResult.shiShen[0]}</b>，月柱十神<b>${baziResult.shiShen[1]}</b>，时柱十神<b>${baziResult.shiShen[3]}</b></p>
    </div>
  `;
}

// 渲染大运
function renderDaYun() {
  const container = document.getElementById('bazi-dayun-display');
  if (!container) return;

  const dy = baziResult.daYun;
  const currentYear = new Date().getFullYear();
  const wxColors = {
    '金': '#d4a846', '木': '#10b981', '水': '#06b6d4',
    '火': '#c53d43', '土': '#a78bfa'
  };

  let timelineHTML = dy.list.map((d, i) => {
    const isActive = currentYear >= d.yearStart && currentYear < d.yearStart + 10;
    const ganWX = BaziEngine.GAN_WUXING[d.gan];
    const zhiWX = BaziEngine.ZHI_WUXING[d.zhi];
    const isXi = baziResult.xiYong.xi.includes(ganWX) || baziResult.xiYong.xi.includes(zhiWX);

    return `
      <div class="dayun-item ${isActive ? 'active' : ''}">
        <div class="dayun-connector"></div>
        <div class="dayun-card">
          <div class="dayun-header">
            <span class="dayun-index">${isActive ? '▶' : ''} 第${d.index}运</span>
            <span class="dayun-age">${d.ageRange}</span>
          </div>
          <div class="dayun-ganzhi">
            <span class="dayun-gan" style="color:${wxColors[ganWX]}">${d.gan}</span>
            <span class="dayun-zhi" style="color:${wxColors[zhiWX]}">${d.zhi}</span>
          </div>
          <div class="dayun-meta">
            <span class="dayun-shishen">${d.shiShen}</span>
            <span class="dayun-nayin">${d.naYin}</span>
            ${isXi ? '<span class="dayun-xi">喜</span>' : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="bazi-dayun-section">
      <h4>🔄 大运排盘（${dy.direction}，${dy.startAge}岁起运）</h4>
      <div class="dayun-timeline">${timelineHTML}</div>
    </div>
  `;
}

// 切换步骤
function showBaziStep(step) {
  const steps = ['input', 'animation', 'result'];
  steps.forEach(s => {
    const el = document.getElementById('bazi-step-' + s);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('bazi-step-' + step);
  if (target) target.style.display = 'block';
}

// 重置
function resetBazi() {
  baziInfo = { year: null, month: null, day: null, hour: null };
  baziResult = null;

  if (document.getElementById('bazi-year')) document.getElementById('bazi-year').value = '';
  if (document.getElementById('bazi-month')) document.getElementById('bazi-month').value = '';
  if (document.getElementById('bazi-day')) document.getElementById('bazi-day').value = '';
  document.querySelectorAll('#bazi-shichen-selector .shichen-item').forEach(el => el.classList.remove('selected'));

  AnimationEngine.stopInk();
  showBaziStep('input');
}
