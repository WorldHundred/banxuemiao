'use strict';

const crypto = require('crypto');
const db = uniCloud.database();
const usersCollection = db.collection('users');

/**
 * 认证 API
 * action: register | login | checkToken | updateProfile
 */
exports.main = async (event, context) => {
  const { action, params } = event;

  switch (action) {
    case 'register':
      return register(params);
    case 'login':
      return login(params);
    case 'checkToken':
      return checkToken(params);
    case 'updateProfile':
      return updateProfile(params);
    default:
      return { code: 400, message: '未知操作: ' + action };
  }
};

/** 简单的密码哈希（SHA-256 + 固定盐） */
function hashPassword(password) {
  const salt = 'persistence_gu_salt_2024';
  return crypto.createHash('sha256').update(salt + password).digest('hex');
}

/** 生成随机 token */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 注册
 */
async function register(params) {
  try {
    const { username, password, avatar } = params || {};

    if (!username || !username.trim() || username.trim().length < 2) {
      return { code: 400, message: '用户名至少2个字符' };
    }
    if (!password || password.length < 4) {
      return { code: 400, message: '密码至少4位' };
    }

    const cleanName = username.trim();

    // 检查用户名是否已存在
    const exist = await usersCollection.where({ username: cleanName }).get();
    if (exist.data && exist.data.length > 0) {
      return { code: 400, message: '该用户名已被注册' };
    }

    const token = generateToken();
    const user = {
      username: cleanName,
      password_hash: hashPassword(password),
      avatar: avatar || '😊',
      token: token,
      created_at: Date.now()
    };

    const res = await usersCollection.add(user);

    return {
      code: 0,
      message: '注册成功',
      data: {
        _id: res.id,
        username: cleanName,
        avatar: user.avatar,
        token: token
      }
    };
  } catch (e) {
    console.error('注册失败:', e);
    return { code: 500, message: '注册失败，请重试' };
  }
}

/**
 * 登录
 */
async function login(params) {
  try {
    const { username, password } = params || {};

    if (!username || !password) {
      return { code: 400, message: '请输入用户名和密码' };
    }

    const res = await usersCollection.where({ username: username.trim() }).get();
    if (!res.data || res.data.length === 0) {
      return { code: 400, message: '用户名或密码错误' };
    }

    const user = res.data[0];
    const hash = hashPassword(password);

    if (user.password_hash !== hash) {
      return { code: 400, message: '用户名或密码错误' };
    }

    // 生成新 token（旧 token 失效）
    const token = generateToken();
    await usersCollection.doc(user._id).update({ token });

    return {
      code: 0,
      message: '登录成功',
      data: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar || '😊',
        token: token
      }
    };
  } catch (e) {
    console.error('登录失败:', e);
    return { code: 500, message: '登录失败，请重试' };
  }
}

/**
 * 验证 token 并返回用户信息
 */
async function checkToken(params) {
  try {
    const { token } = params || {};

    if (!token) {
      return { code: 401, message: '未登录' };
    }

    const res = await usersCollection.where({ token }).get();
    if (!res.data || res.data.length === 0) {
      return { code: 401, message: '登录已过期，请重新登录' };
    }

    const user = res.data[0];
    return {
      code: 0,
      data: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar || '😊'
      }
    };
  } catch (e) {
    console.error('验证token失败:', e);
    return { code: 500, message: '验证失败' };
  }
}

/**
 * 更新用户资料（头像、昵称）
 */
async function updateProfile(params) {
  try {
    const { token, username, avatar } = params || {};

    if (!token) {
      return { code: 401, message: '未登录' };
    }

    // 通过 token 查找用户
    const userRes = await usersCollection.where({ token }).get();
    if (!userRes.data || userRes.data.length === 0) {
      return { code: 401, message: '登录已过期' };
    }

    const user = userRes.data[0];
    const updates = {};

    if (username && username.trim().length >= 2) {
      // 检查新用户名是否冲突
      const conflict = await usersCollection.where({ username: username.trim() }).get();
      if (conflict.data && conflict.data.length > 0 && conflict.data[0]._id !== user._id) {
        return { code: 400, message: '该用户名已被使用' };
      }
      updates.username = username.trim();
    }
    if (avatar) {
      updates.avatar = avatar;
    }

    if (Object.keys(updates).length === 0) {
      return { code: 400, message: '没有需要更新的内容' };
    }

    await usersCollection.doc(user._id).update(updates);

    return {
      code: 0,
      message: '更新成功',
      data: {
        _id: user._id,
        username: updates.username || user.username,
        avatar: updates.avatar || user.avatar || '😊'
      }
    };
  } catch (e) {
    console.error('更新资料失败:', e);
    return { code: 500, message: '更新失败，请重试' };
  }
}
