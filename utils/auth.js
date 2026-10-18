/**
 * 认证服务层
 * - 优先云端（uniCloud auth-api 云函数）
 * - 云端不可用时回退 localStorage 简易登录
 */

const AUTH_KEY = 'community_auth';

// ========== 持久化存储 ==========

function saveAuth(data) {
  uni.setStorageSync(AUTH_KEY, data);
}

function loadAuth() {
  try {
    return uni.getStorageSync(AUTH_KEY) || null;
  } catch (e) {
    return null;
  }
}

function clearAuth() {
  uni.removeStorageSync(AUTH_KEY);
}

// ========== 云端调用 ==========

async function authCall(action, params = {}) {
  try {
    const result = await uniCloud.callFunction({
      name: 'auth-api',
      data: { action, params }
    });
    return result.result || result;
  } catch (e) {
    console.warn('认证云函数调用失败:', e.message);
    return { code: 500, message: e.message, cloudError: true };
  }
}

// ========== 公共接口 ==========

/**
 * 获取当前登录用户（从本地缓存）
 */
export function getCurrentUser() {
  return loadAuth();
}

/**
 * 获取 token
 */
export function getToken() {
  const auth = loadAuth();
  return auth ? auth.token : '';
}

/**
 * 是否已登录
 */
export function isLoggedIn() {
  return !!loadAuth();
}

/**
 * 注册
 * @returns {{ success, message, data? }}
 */
export async function register(username, password, avatar) {
  if (!username || username.trim().length < 2) {
    return { success: false, message: '用户名至少2个字符' };
  }
  if (!password || password.length < 4) {
    return { success: false, message: '密码至少4位' };
  }

  const res = await authCall('register', {
    username: username.trim(),
    password: password,
    avatar: avatar || '😊'
  });

  if (res.code === 0 && res.data) {
    saveAuth(res.data);
    return { success: true, message: '注册成功', data: res.data };
  }
  if (res.cloudError) {
    // 本地模式注册
    return localRegister(username.trim(), password, avatar);
  }
  return { success: false, message: res.message };
}

/**
 * 登录
 * @returns {{ success, message, data? }}
 */
export async function login(username, password) {
  if (!username || !password) {
    return { success: false, message: '请输入用户名和密码' };
  }

  const res = await authCall('login', {
    username: username.trim(),
    password: password
  });

  if (res.code === 0 && res.data) {
    saveAuth(res.data);
    return { success: true, message: '登录成功', data: res.data };
  }
  if (res.cloudError) {
    return localLogin(username.trim(), password);
  }
  return { success: false, message: res.message };
}

/**
 * 退出登录
 */
export function logout() {
  clearAuth();
}

/**
 * 验证 token 有效性（从云端）
 */
export async function verifyToken() {
  const auth = loadAuth();
  if (!auth || !auth.token) return false;

  const res = await authCall('checkToken', { token: auth.token });
  if (res.code === 0) {
    // 更新用户信息
    if (res.data) {
      saveAuth({ ...auth, ...res.data });
    }
    return true;
  }
  if (res.cloudError) {
    // 本地模式：token 存在即有效
    return true;
  }
  return false;
}

/**
 * 更新用户资料
 */
export async function updateProfile({ username, avatar }) {
  const auth = loadAuth();
  if (!auth || !auth.token) {
    return { success: false, message: '未登录' };
  }

  const res = await authCall('updateProfile', {
    token: auth.token,
    username,
    avatar
  });

  if (res.code === 0 && res.data) {
    saveAuth({ ...auth, ...res.data });
    return { success: true, data: res.data };
  }
  if (res.cloudError) {
    // 本地模式更新
    const updated = { ...auth };
    if (username) updated.username = username.trim();
    if (avatar) updated.avatar = avatar;
    saveAuth(updated);
    return { success: true, data: updated, localOnly: true };
  }
  return { success: false, message: res.message };
}

// ========== 本地回退（简易模式） ==========

function localRegister(username, password, avatar) {
  // 本地模式下，检查"用户名"是否已存在（从 localStorage）
  const localUsers = uni.getStorageSync('local_users') || [];
  if (localUsers.find(u => u.username === username)) {
    return { success: false, message: '该用户名已被注册（本地模式）' };
  }

  const user = {
    _id: 'local_' + Date.now().toString(36),
    username: username,
    avatar: avatar || '😊',
    token: 'local_token_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    localOnly: true
  };

  localUsers.push({ username, password, avatar: user.avatar });
  uni.setStorageSync('local_users', localUsers);
  saveAuth(user);
  return { success: true, message: '注册成功（本地模式）', data: user };
}

function localLogin(username, password) {
  const localUsers = uni.getStorageSync('local_users') || [];
  const found = localUsers.find(u => u.username === username && u.password === password);

  if (!found) {
    return { success: false, message: '用户名或密码错误（本地模式）' };
  }

  const user = {
    _id: 'local_' + Date.now().toString(36),
    username: found.username,
    avatar: found.avatar || '😊',
    token: 'local_token_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    localOnly: true
  };

  saveAuth(user);
  return { success: true, message: '登录成功（本地模式）', data: user };
}
