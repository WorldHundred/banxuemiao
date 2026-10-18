import { autoBackup } from './sync.js';

const STORAGE_KEY = 'study_elf_app_data';

function getDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function createDefaultData() {
  return {
    todayPlans: [],
    poolCategories: [],
    user: null,
    history: [],
    checkins: [],
    lastDateKey: getDateKey(),
    inventory: { fish: 5, milk: 5, can: 1 },
    lastCheckinDate: null,
    checkinStreak: 0,
    rewardClaimed7: false,
    rewardClaimed30: false,
    focusSessions: []
  };
}

function normalizeData(data) {
  const todayKey = getDateKey();
  if (!data || typeof data !== 'object') return createDefaultData();

  if (!Array.isArray(data.todayPlans)) data.todayPlans = [];
  if (!Array.isArray(data.poolCategories)) data.poolCategories = [];
  if (!Array.isArray(data.history)) data.history = [];
  if (!Array.isArray(data.checkins)) data.checkins = [];
  data.history = data.history.map(h => {
    const plans = Array.isArray(h.plans) ? h.plans.filter(p => p && p.done === true) : [];
    return Object.assign({}, h, { plans, energyUsed: plans.reduce((sum, p) => sum + Number(p.energy || 0), 0) });
  });
  if (!data.user) data.user = null;
  if (!data.inventory) data.inventory = { fish: 5, milk: 5, can: 1 };
  if (!data.lastCheckinDate) data.lastCheckinDate = null;
  if (typeof data.checkinStreak !== 'number') data.checkinStreak = 0;
  if (typeof data.rewardClaimed7 !== 'boolean') data.rewardClaimed7 = false;
  if (typeof data.rewardClaimed30 !== 'boolean') data.rewardClaimed30 = false;
  if (!Array.isArray(data.focusSessions)) data.focusSessions = [];

  const lastDateKey = data.lastDateKey || todayKey;
  if (lastDateKey !== todayKey) {
    // 已通过 donePlan() 实时记录到 history 的计划
    const existingRecord = data.history.find(h => h.date === lastDateKey);
    const existingPlans = existingRecord ? (existingRecord.plans || []) : [];
    const existingIds = new Set(existingPlans.map(p => p.id));

    // todayPlans 中标记为 done 但尚未记录进 history 的（兜底）
    const doneInToday = (data.todayPlans || []).filter(p => p && p.done === true);
    const missingPlans = doneInToday.filter(p => !existingIds.has(p.id)).map(p => Object.assign({}, p, { done: true }));

    // 合并：已有的 + 遗漏的
    const mergedPlans = [...existingPlans, ...missingPlans];
    const mergedEnergy = mergedPlans.reduce((sum, p) => sum + Number(p.energy || 0), 0);

    data.history = data.history.filter(h => h.date !== lastDateKey);
    data.history.push({
      date: lastDateKey,
      plans: mergedPlans,
      energyUsed: mergedEnergy
    });
    data.todayPlans = [];
    data.lastDateKey = todayKey;

    // 重置连续打卡奖励标记
    data.rewardClaimed7 = false;
    data.rewardClaimed30 = false;
  }

  return data;
}

export function getData() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY);
    if (raw) {
      const data = normalizeData(raw);
      if (data !== raw) setData(data);
      return data;
    }
  } catch (e) {
    console.warn('读取数据失败，重新初始化');
  }
  const defaultData = createDefaultData();
  setData(defaultData);
  return defaultData;
}

export function setData(newData) {
  try {
    const data = normalizeData(newData);
    uni.setStorageSync(STORAGE_KEY, data);
    // 自动云端备份（登录后生效，带5秒防抖）
    autoBackup(data);
  } catch (e) {
    console.error('保存数据失败', e);
  }
}

export function addPlanToToday(planName, energy) {
  try {
    const raw = uni.getStorageSync('study_elf_app_data');
    let data = normalizeData(raw || createDefaultData());

    const currentEnergy = data.todayPlans.reduce((s, p) => s + p.energy, 0);
    if (currentEnergy + energy > 100) {
      uni.showToast({ title: '今日精力已满(上限100)', icon: 'none' });
      return false;
    }

    data.todayPlans.push({
      id: Date.now() + '_' + Math.random().toString(36),
      name: planName,
      energy: energy,
      done: false
    });

    uni.setStorageSync('study_elf_app_data', data);
    return true;
  } catch (e) {
    console.error('写入失败:', e);
    return false;
  }
}

// ===== 签到系统 =====

/**
 * 每日签到：返回 { fish, milk, can, streak, ... }
 * 每天签到可获得 5 🐟 小鱼干 + 2 🥛 牛奶 + 1 🥫 猫罐头
 */
export function dailyCheckin() {
  const data = getData();
  const today = getDateKey();

  // 今天已经签到过
  if (data.lastCheckinDate === today) {
    return {
      success: false,
      message: '今天已经签到过啦~',
      streak: data.checkinStreak,
      inventory: { ...data.inventory }
    };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);

  // 判断是否连续
  if (data.lastCheckinDate === yesterdayKey) {
    data.checkinStreak += 1;
  } else {
    data.checkinStreak = 1;
  }

  data.lastCheckinDate = today;
  if (!data.checkins.includes(today)) data.checkins.push(today);

  // 每日奖励：5 小鱼干 + 2 牛奶 + 1 猫罐头
  const fishReward = 5;
  const milkReward = 2;
  const canReward = 1;

  data.inventory.fish += fishReward;
  data.inventory.milk += milkReward;
  data.inventory.can += canReward;

  setData(data);

  return {
    success: true,
    message: `签到成功！获得 ${fishReward}🐟 ${milkReward}🥛 ${canReward}🥫`,
    streak: data.checkinStreak,
    fish: fishReward,
    milk: milkReward,
    can: canReward,
    inventory: { ...data.inventory }
  };
}

/**
 * 获取今日签到状态
 */
export function getCheckinStatus() {
  const data = getData();
  const today = getDateKey();
  return {
    checkedIn: data.lastCheckinDate === today,
    streak: data.checkinStreak,
    inventory: { ...data.inventory }
  };
}

/**
 * 喂猫咪：消耗库存
 * @param {'fish'|'milk'|'can'} type
 * @returns 结果
 */
export function feedCat(type) {
  const data = getData();
  const names = { fish: '🐟 小鱼干', milk: '🥛 牛奶', can: '🥫 猫罐头' };

  if (!data.inventory[type] || data.inventory[type] <= 0) {
    return { success: false, message: names[type] + ' 不足~' };
  }

  data.inventory[type] -= 1;
  setData(data);

  return {
    success: true,
    message: '喂了猫咪 ' + names[type] + '！',
    inventory: { ...data.inventory }
  };
}
