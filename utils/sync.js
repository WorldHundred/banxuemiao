/**
 * 数据同步服务层
 * - 云端备份：登录后将全部学习数据加密备份到云数据库
 * - 云端恢复：登录后从云端恢复数据到本地
 * - 自动备份：storage.js 每次写入后触发
 */

import { getCurrentUser, getToken, isLoggedIn } from './auth.js';

const SYNC_DEBOUNCE_MS = 5000; // 5秒内最多同步一次
let lastSyncPromise = null;

// ========== 云端调用 ==========

async function dataCall(action, params = {}) {
  try {
    const result = await uniCloud.callFunction({
      name: 'data-api',
      data: { action, params, token: getToken() }
    });
    return result.result || result;
  } catch (e) {
    console.warn('数据同步云函数调用失败:', e.message);
    return { code: 500, message: e.message, cloudError: true };
  }
}

// ========== 公共接口 ==========

/**
 * 上传数据到云端（全量备份）
 * @param {object} data - 完整的学习数据对象
 */
export async function uploadBackup(data) {
  if (!isLoggedIn()) return { success: false, message: '未登录' };

  try {
    const data_json = JSON.stringify(data);
    const res = await dataCall('upload', { data_json });
    if (res.code === 0) {
      // 记录最后同步时间
      uni.setStorageSync('last_sync_time', res.data ? res.data.time : Date.now());
      return { success: true, time: res.data ? res.data.time : Date.now() };
    }
    return { success: false, message: res.message };
  } catch (e) {
    console.error('备份失败:', e);
    return { success: false, message: '备份失败' };
  }
}

/**
 * 从云端下载数据
 */
export async function downloadBackup() {
  if (!isLoggedIn()) return { success: false, message: '未登录' };

  try {
    const res = await dataCall('download');
    if (res.code === 0 && res.data && res.data.data_json) {
      const data = JSON.parse(res.data.data_json);
      return {
        success: true,
        data,
        updated_at: res.data.updated_at
      };
    }
    if (res.code === 404) {
      return { success: false, message: '云端暂无备份' };
    }
    return { success: false, message: res.message };
  } catch (e) {
    console.error('下载备份失败:', e);
    return { success: false, message: '下载失败' };
  }
}

/**
 * 获取云端备份信息
 */
export async function getBackupInfo() {
  if (!isLoggedIn()) return { hasBackup: false };

  try {
    const res = await dataCall('getSyncTime');
    if (res.code === 0 && res.data) {
      return res.data;
    }
    return { hasBackup: false };
  } catch (e) {
    return { hasBackup: false };
  }
}

/**
 * 自动备份（带防抖，5秒内多次调用只执行一次）
 * 由 storage.js 每次 setData 后调用
 */
export function autoBackup(data) {
  if (!isLoggedIn()) return;

  // 防抖
  if (lastSyncPromise) {
    // 用最新数据替换上一个待同步的
    autoBackup._latestData = data;
    return;
  }

  autoBackup._latestData = data;
  lastSyncPromise = new Promise((resolve) => {
    setTimeout(async () => {
      const latest = autoBackup._latestData || data;
      await uploadBackup(latest);
      lastSyncPromise = null;
      autoBackup._latestData = null;
      resolve();
    }, SYNC_DEBOUNCE_MS);
  });
}
