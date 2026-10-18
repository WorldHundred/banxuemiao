'use strict';

const db = uniCloud.database();
const postsCollection = db.collection('community_posts');
const likesCollection = db.collection('community_likes');
const commentsCollection = db.collection('community_comments');
const usersCollection = db.collection('users');

/**
 * 通过 token 查找登录用户
 * @returns {{ _id, username, avatar } | null}
 */
async function resolveUser(token) {
  if (!token) return null;
  try {
    const res = await usersCollection.where({ token }).get();
    if (res.data && res.data.length > 0) {
      const u = res.data[0];
      return { _id: u._id, username: u.username, avatar: u.avatar || '😊' };
    }
  } catch (e) { /* ignore */ }
  return null;
}

/**
 * 学习社区 API 云函数
 * 通过 action 参数区分操作类型
 */
exports.main = async (event, context) => {
  const { action, params, userId, token } = event;

  // 解析真实用户身份
  const authUser = await resolveUser(token);
  const uid = authUser ? authUser._id : (userId || context.CLIENTIP || 'anonymous');
  const uname = authUser ? authUser.username : (params ? (params.username || '') : '');
  const uavatar = authUser ? authUser.avatar : (params ? (params.avatar || '😊') : '😊');

  // 如果已登录，将真实身份注入 params
  const enrichedParams = authUser ? Object.assign({}, params, {
    username: uname,
    avatar: uavatar
  }) : params;

  switch (action) {
    case 'getPosts':
      return getPosts(uid);
    case 'createPost':
      return createPost(uid, enrichedParams);
    case 'deletePost':
      return deletePost(uid, enrichedParams);
    case 'toggleLike':
      return toggleLike(uid, enrichedParams);
    case 'getComments':
      return getComments(enrichedParams);
    case 'addComment':
      return addComment(uid, enrichedParams);
    default:
      return { code: 400, message: '未知操作: ' + action };
  }
};

/**
 * 获取所有帖子（按创建时间倒序）
 */
async function getPosts(uid) {
  try {
    const res = await postsCollection
      .orderBy('created_at', 'desc')
      .limit(100)
      .get();

    const posts = res.data || [];

    // 获取当前用户的所有点赞记录，用于标记 liked 状态
    let likedPostIds = new Set();
    if (uid && uid !== 'anonymous') {
      const likesRes = await likesCollection
        .where({ user_id: uid })
        .get();
      (likesRes.data || []).forEach(like => likedPostIds.add(like.post_id));
    }

    // 为每个帖子附加 liked 状态
    const enriched = posts.map(post => ({
      _id: post._id,
      user_id: post.user_id,
      username: post.username,
      avatar: post.avatar || '😊',
      content: post.content,
      tags: post.tags || [],
      likes: post.likes || 0,
      comment_count: post.comment_count || 0,
      created_at: post.created_at,
      liked: likedPostIds.has(post._id)
    }));

    return { code: 0, data: enriched };
  } catch (e) {
    console.error('获取帖子失败:', e);
    return { code: 500, message: '获取帖子失败' };
  }
}

/**
 * 创建帖子
 */
async function createPost(uid, params) {
  try {
    const { username, content, avatar, tags } = params || {};

    if (!content || !content.trim()) {
      return { code: 400, message: '内容不能为空' };
    }
    if (!username || !username.trim()) {
      return { code: 400, message: '昵称不能为空' };
    }

    const doc = {
      user_id: uid,
      username: username.trim().substring(0, 30),
      content: content.trim().substring(0, 500),
      avatar: avatar || '😊',
      tags: (tags || []).slice(0, 3),
      likes: 0,
      comment_count: 0,
      created_at: Date.now()
    };

    const res = await postsCollection.add(doc);

    return {
      code: 0,
      data: {
        _id: res.id,
        ...doc
      }
    };
  } catch (e) {
    console.error('创建帖子失败:', e);
    return { code: 500, message: '发布失败，请重试' };
  }
}

/**
 * 删除帖子（仅限自己的帖子）
 */
async function deletePost(uid, params) {
  try {
    const { postId } = params || {};

    if (!postId) {
      return { code: 400, message: '帖子ID不能为空' };
    }

    // 验证帖子归属
    const post = await postsCollection.doc(postId).get();
    if (!post.data || post.data.length === 0) {
      return { code: 404, message: '帖子不存在' };
    }
    if (post.data[0].user_id !== uid) {
      return { code: 403, message: '只能删除自己的帖子' };
    }

    // 删除帖子
    await postsCollection.doc(postId).remove();

    // 清理相关点赞和评论
    await likesCollection.where({ post_id: postId }).remove();
    await commentsCollection.where({ post_id: postId }).remove();

    return { code: 0, message: '删除成功' };
  } catch (e) {
    console.error('删除帖子失败:', e);
    return { code: 500, message: '删除失败，请重试' };
  }
}

/**
 * 切换点赞状态（原子操作）
 */
async function toggleLike(uid, params) {
  try {
    const { postId } = params || {};

    if (!postId) {
      return { code: 400, message: '帖子ID不能为空' };
    }

    // 检查是否已点赞
    const existing = await likesCollection
      .where({ user_id: uid, post_id: postId })
      .get();

    if (existing.data && existing.data.length > 0) {
      // 取消点赞
      await likesCollection.doc(existing.data[0]._id).remove();
      await postsCollection.doc(postId).update({
        likes: db.command.inc(-1)
      });
      return { code: 0, data: { liked: false } };
    } else {
      // 点赞
      await likesCollection.add({
        user_id: uid,
        post_id: postId,
        created_at: Date.now()
      });
      await postsCollection.doc(postId).update({
        likes: db.command.inc(1)
      });
      return { code: 0, data: { liked: true } };
    }
  } catch (e) {
    console.error('点赞操作失败:', e);
    return { code: 500, message: '操作失败，请重试' };
  }
}

/**
 * 获取帖子的评论列表
 */
async function getComments(params) {
  try {
    const { postId } = params || {};

    if (!postId) {
      return { code: 400, message: '帖子ID不能为空' };
    }

    const res = await commentsCollection
      .where({ post_id: postId })
      .orderBy('created_at', 'asc')
      .get();

    return { code: 0, data: res.data || [] };
  } catch (e) {
    console.error('获取评论失败:', e);
    return { code: 500, message: '获取评论失败' };
  }
}

/**
 * 添加评论
 */
async function addComment(uid, params) {
  try {
    const { postId, username, content, avatar } = params || {};

    if (!postId) {
      return { code: 400, message: '帖子ID不能为空' };
    }
    if (!content || !content.trim()) {
      return { code: 400, message: '评论内容不能为空' };
    }
    if (!username || !username.trim()) {
      return { code: 400, message: '昵称不能为空' };
    }

    const doc = {
      user_id: uid,
      post_id: postId,
      username: username.trim().substring(0, 30),
      content: content.trim().substring(0, 300),
      avatar: avatar || '😊',
      created_at: Date.now()
    };

    const res = await commentsCollection.add(doc);

    // 更新帖子的评论数
    await postsCollection.doc(postId).update({
      comment_count: db.command.inc(1)
    });

    return {
      code: 0,
      data: {
        _id: res.id,
        ...doc
      }
    };
  } catch (e) {
    console.error('添加评论失败:', e);
    return { code: 500, message: '评论失败，请重试' };
  }
}
