'use strict';

const db = uniCloud.database();
const userDataCollection = db.collection('user_data');
const usersCollection = db.collection('users');

/**
 * 数据同步 API
 * action: upload | download | getSyncTime
 */

/** 通过 token 查找用户 */
async function resolveUser(token) {
  if (!token) return null;
  try {
    const res = await usersCollection.where({ token }).get();
    if (res.data && res.data.length > 0) {
      return res.data[0];
    }
  } catch (e) { /* ignore */ }
  return null;
}

exports.main = async (event, context) => {
  const { action, params, token } = event;

  // 所有操作都需要登录
  const user = await resolveUser(token);
  if (!user) {
    return { code: 401, message: '请先登录' };
  }

  switch (action) {
    case 'upload':
      return uploadData(user._id, params);
    case 'download':
      return downloadData(user._id);
    case 'getSyncTime':
      return getSyncTime(user._id);
    default:
      return { code: 400, message: '未知操作: ' + action };
  }
};

/**
 * 上传数据备份（全量覆盖）
 */
async function uploadData(userId, params) {
  try {
    const { data_json } = params || {};

    if (!data_json) {
      return { code: 400, message: '数据不能为空' };
    }

    const size = data_json.length;

    // 查找已有备份
    const existing = await userDataCollection.where({ user_id: userId }).get();

    if (existing.data && existing.data.length > 0) {
      // 更新已有备份
      await userDataCollection.doc(existing.data[0]._id).update({
        data_json,
        data_size: size,
        updated_at: Date.now()
      });
    } else {
      // 创建新备份
      await userDataCollection.add({
        user_id: userId,
        data_json,
        data_size: size,
        updated_at: Date.now()
      });
    }

    return {
      code: 0,
      message: '同步成功',
      data: { size, time: Date.now() }
    };
  } catch (e) {
    // 数据太大时分片提示
    if (e.message && e.message.includes('size')) {
      return { code: 400, message: '数据过大，请清理部分历史记录后重试' };
    }
    console.error('上传数据失败:', e);
    return { code: 500, message: '同步失败' };
  }
}

/**
 * 下载数据备份
 */
async function downloadData(userId) {
  try {
    const res = await userDataCollection.where({ user_id: userId }).get();

    if (!res.data || res.data.length === 0) {
      return { code: 404, message: '暂无云端备份' };
    }

    const record = res.data[0];
    return {
      code: 0,
      data: {
        data_json: record.data_json,
        updated_at: record.updated_at
      }
    };
  } catch (e) {
    console.error('下载数据失败:', e);
    return { code: 500, message: '下载失败' };
  }
}

/**
 * 获取最后同步时间
 */
async function getSyncTime(userId) {
  try {
    const res = await userDataCollection.where({ user_id: userId }).get();

    if (!res.data || res.data.length === 0) {
      return { code: 0, data: { hasBackup: false } };
    }

    return {
      code: 0,
      data: {
        hasBackup: true,
        updated_at: res.data[0].updated_at,
        data_size: res.data[0].data_size || 0
      }
    };
  } catch (e) {
    return { code: 0, data: { hasBackup: false } };
  }
}
