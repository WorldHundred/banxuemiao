/**
 * 社区服务层
 * - 优先使用 uniCloud 云端数据
 * - 云端不可用时回退到 localStorage
 * - 用户标识：localStorage UUID
 */

import { getData, setData } from './storage.js';
import { getCurrentUser, getToken } from './auth.js';

// ========== 用户标识 ==========

const UID_KEY = 'community_user_id';

function getUserId() {
  // 登录用户使用真实 ID，未登录用户使用本地 UUID
  const auth = getCurrentUser();
  if (auth && auth._id) {
    return auth._id;
  }
  let uid = uni.getStorageSync(UID_KEY);
  if (!uid) {
    uid = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    uni.setStorageSync(UID_KEY, uid);
  }
  return uid;
}

// ========== 云端操作 ==========

async function cloudCall(action, params = {}) {
  try {
    const result = await uniCloud.callFunction({
      name: 'community-api',
      data: {
        action,
        params,
        userId: getUserId(),
        token: getToken()
      }
    });
    return result.result || result;
  } catch (e) {
    console.warn('云函数调用失败:', e.message);
    return { code: 500, message: e.message, cloudError: true };
  }
}

// ========== 本地操作（回退方案） ==========

function localGetPosts() {
  const data = getData();
  const userPosts = (data.communityPosts || []).map(p => {
    const userId = getUserId();
    return {
      _id: p.id || ('user_' + Date.now()),
      user_id: userId,
      username: p.user || '',
      avatar: p.avatar || '😊',
      content: p.content || '',
      tags: p.tags || [],
      likes: p.likes || 0,
      comment_count: p.comments || 0,
      created_at: p.createdAt || Date.now(),
      liked: p.liked || false
    };
  });

  // 系统预设帖子（首次使用时或没有用户帖子时展示）
  const systemPosts = getSystemPosts();

  // 合并并按时间排序
  return [...userPosts, ...systemPosts].sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
}

function localCreatePost(params) {
  const data = getData();
  if (!data.communityPosts) data.communityPosts = [];

  const post = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    avatar: params.avatar || '😊',
    user: params.username || '',
    content: params.content || '',
    tags: params.tags || [],
    likes: 0,
    comments: 0,
    shares: 0,
    liked: false,
    createdAt: Date.now(),
    isMine: true
  };

  data.communityPosts.unshift(post);
  setData(data);
  return post;
}

function localDeletePost(postId) {
  const data = getData();
  data.communityPosts = (data.communityPosts || []).filter(p => p.id !== postId);
  setData(data);
}

function localToggleLike(postId) {
  const data = getData();
  const idx = (data.communityPosts || []).findIndex(p => p.id === postId);
  if (idx >= 0) {
    const post = data.communityPosts[idx];
    post.liked = !post.liked;
    post.likes = post.liked ? post.likes + 1 : Math.max(0, post.likes - 1);
    setData(data);
    return { liked: post.liked };
  }
  return { liked: false };
}

function localAddComment(params) {
  const data = getData();
  if (!data.communityComments) data.communityComments = [];

  const comment = {
    _id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    user_id: getUserId(),
    post_id: params.postId,
    username: params.username || '',
    content: params.content || '',
    avatar: params.avatar || '😊',
    created_at: Date.now()
  };

  data.communityComments.unshift(comment);

  // 更新帖子的评论数
  const postIdx = (data.communityPosts || []).findIndex(p => p.id === params.postId);
  if (postIdx >= 0) {
    data.communityPosts[postIdx].comments = (data.communityPosts[postIdx].comments || 0) + 1;
  }

  setData(data);
  return comment;
}

function getSystemPosts() {
  const now = Date.now();
  return [
    {
      _id: 'sys_1',
      user_id: 'system', username: '小明同学', avatar: '🧑‍🎓',
      content: '今天完成了数学复习，精力用了30%，感觉还不错！坚持打卡第15天啦 💪',
      likes: 12, comment_count: 4, liked: false,
      tags: ['数学', '坚持打卡'], created_at: now - 7200000
    },
    {
      _id: 'sys_2',
      user_id: 'system', username: '代码少女', avatar: '👩‍💻',
      content: '用学习精灵记录学习已经一周了，数据分析功能太棒了！猫咪还会根据学习状态变化，太可爱了！🐱',
      likes: 8, comment_count: 6, liked: true,
      tags: ['编程', '工具推荐'], created_at: now - 18000000
    },
    {
      _id: 'sys_3',
      user_id: 'system', username: '备考达人', avatar: '🧑‍🏫',
      content: '今天计划了5项学习，精力分配合理，效率翻倍！推荐大家试试番茄工作法+精力管理组合 🍅⚡',
      likes: 24, comment_count: 9, liked: false,
      tags: ['学习方法', '效率提升'], created_at: now - 86400000
    },
    {
      _id: 'sys_4',
      user_id: 'system', username: '画画的小美', avatar: '👩‍🎨',
      content: '每天练速写1小时，用精力条控制学习节奏，不会过度疲劳。这个方法真的很科学！🎨✨',
      likes: 18, comment_count: 5, liked: false,
      tags: ['绘画', '每日一练'], created_at: now - 86400000
    }
  ];
}

// ========== 统一导出接口 ==========

/**
 * 获取帖子列表
 */
export async function fetchPosts() {
  const res = await cloudCall('getPosts');
  if (res.code === 0 && !res.cloudError) {
    return res.data || [];
  }
  console.log('社区：云端不可用，使用本地数据');
  return localGetPosts();
}

/**
 * 发布帖子
 */
export async function publishPost(params) {
  const res = await cloudCall('createPost', params);
  if (res.code === 0 && !res.cloudError) {
    return { success: true, data: res.data };
  }
  if (res.cloudError) {
    // 云端不可用，回退本地
    const post = localCreatePost(params);
    return { success: true, data: post, localOnly: true };
  }
  return { success: false, message: res.message };
}

/**
 * 删除帖子
 */
export async function deletePost(postId) {
  const res = await cloudCall('deletePost', { postId });
  if (res.code === 0 && !res.cloudError) {
    return { success: true };
  }
  // 云端不可用，回退本地
  localDeletePost(postId);
  return { success: true, localOnly: true };
}

/**
 * 切换点赞
 */
export async function toggleLike(postId) {
  const res = await cloudCall('toggleLike', { postId });
  if (res.code === 0 && !res.cloudError) {
    return { success: true, liked: res.data.liked };
  }
  // 回退本地（仅对用户自己的帖子有效）
  const result = localToggleLike(postId);
  return { success: true, liked: result.liked, localOnly: true };
}

/**
 * 获取评论
 */
export async function fetchComments(postId) {
  const res = await cloudCall('getComments', { postId });
  if (res.code === 0 && !res.cloudError) {
    return res.data || [];
  }
  // 回退本地评论
  const data = getData();
  const localComments = (data.communityComments || []).filter(c => c.post_id === postId);
  return localComments.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
}

/**
 * 添加评论
 */
export async function addComment(params) {
  const res = await cloudCall('addComment', params);
  if (res.code === 0 && !res.cloudError) {
    return { success: true, data: res.data };
  }
  if (res.cloudError) {
    // 云端不可用时，回退本地评论存储
    const comment = localAddComment(params);
    if (comment) {
      return { success: true, data: comment, localOnly: true };
    }
    return { success: false, message: '评论失败' };
  }
  return { success: false, message: res.message };
}

/**
 * 获取当前用户ID
 */
export { getUserId };
