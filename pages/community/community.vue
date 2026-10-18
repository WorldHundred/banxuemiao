<template>
  <view class="page-container">
    <view class="header-section">
      <view class="header-top">
        <view class="header-text">
          <text class="page-title">学习社区</text>
          <text class="page-desc">记录学习日常，和同学们一起进步！</text>
        </view>
        <view class="login-btn" v-if="!authUser" @click="showLoginModal">
          <text class="login-btn-text">登录</text>
        </view>
        <view class="user-badge" v-else @click="showLogoutMenu">
          <view class="user-badge-avatar">
            <text>{{ authUser.avatar || '😊' }}</text>
          </view>
          <text class="user-badge-name">{{ authUser.username }}</text>
        </view>
      </view>
    </view>

    <!-- 帖子列表 -->
    <view class="community-list">
      <view
        class="post-card"
        v-for="(item, index) in posts"
        :key="item.id"
        :class="{ 'post-mine': item.isMine }"
      >
        <view class="post-header">
          <view class="avatar-wrap" :class="'avatar-' + (index % 3)">
            <text class="avatar">{{ item.avatar }}</text>
          </view>
          <view class="user-info">
            <view class="username-row">
              <text class="username">{{ item.user }}</text>
              <text v-if="item.isMine" class="my-badge">我</text>
            </view>
            <view class="time-row">
              <text class="time-dot"></text>
              <text class="time">{{ item.time }}</text>
            </view>
          </view>
          <view class="more-btn" @click="showPostMenu(index)">
            <text>···</text>
          </view>
        </view>

        <view class="post-content">
          <text>{{ item.content }}</text>
        </view>

        <view class="post-tags" v-if="item.tags && item.tags.length > 0">
          <text class="tag" v-for="tag in item.tags" :key="tag">{{ tag }}</text>
        </view>

        <view class="post-actions">
          <view class="action-item" @click="likePost(index)">
            <text class="icon">{{ item.liked ? '❤️' : '🤍' }}</text>
            <text class="num">{{ item.likes }}</text>
          </view>
          <view class="action-item" @click="openComments(index)">
            <text class="icon">💬</text>
            <text class="num">{{ item.comments }}</text>
          </view>
          <view class="action-item">
            <text class="icon">🔄</text>
            <text class="num">{{ item.shares }}</text>
          </view>
        </view>
      </view>

      <!-- 底部提示 -->
      <view class="load-more">
        <text class="load-text">{{ posts.length === 0 ? '还没有帖子，来发第一条吧 ✨' : '—— 已经到底了 ——' }}</text>
      </view>
    </view>

    <!-- 发帖按钮 -->
    <view class="publish-btn" @click="showPublishModal">
      <text class="publish-icon">✏️</text>
    </view>

    <!-- 发帖弹窗 -->
    <view class="custom-modal" v-if="showModal || modalClosing" :class="{ 'overlay-enter': showModal && !modalClosing, 'overlay-leave': modalClosing }" @click.self="closePublishModal">
      <view class="modal-mask" :class="{ 'mask-enter': showModal && !modalClosing, 'mask-leave': modalClosing }" @click="closePublishModal"></view>
      <view class="modal-content" :class="{ 'modal-enter': showModal && !modalClosing, 'modal-leave': modalClosing }">
        <view class="modal-handle"></view>
        <text class="modal-title">📝 发表动态</text>

        <!-- 头像选择 -->
        <view class="form-group">
          <text class="form-label">选择头像</text>
          <view class="avatar-picker">
            <view
              v-for="(av, ai) in avatarOptions"
              :key="ai"
              class="avatar-option"
              :class="{ selected: newPostAvatar === av }"
              @click="newPostAvatar = av"
            >
              <text>{{ av }}</text>
            </view>
          </view>
        </view>

        <!-- 昵称 -->
        <view class="form-group">
          <text class="form-label">昵称</text>
          <input
            class="form-input"
            v-model="newPostUser"
            placeholder="给自己起个名字吧"
          />
        </view>

        <!-- 内容 -->
        <view class="form-group">
          <text class="form-label">内容</text>
          <textarea
            class="form-textarea"
            v-model="newPostContent"
            placeholder="记录今天的学习心得、打卡成果..."
            :maxlength="300"
            auto-height
          />
          <text class="char-count">{{ newPostContent.length }}/300</text>
        </view>

        <!-- 标签 -->
        <view class="form-group">
          <text class="form-label">标签（可选）</text>
          <view class="tag-input-row">
            <view v-for="(tag, ti) in newPostTags" :key="ti" class="tag-chip">
              <text>{{ tag }}</text>
              <text class="tag-remove" @click="removeTag(ti)">×</text>
            </view>
            <input
              v-if="newPostTags.length < 3"
              class="tag-input"
              v-model="tagInput"
              placeholder="输入标签后回车"
              @confirm="addTag"
            />
          </view>
        </view>

        <!-- 按钮 -->
        <view class="modal-btns">
          <text class="modal-btn cancel" @click="closePublishModal">取消</text>
          <text class="modal-btn confirm" @click="publishPost">发布动态</text>
        </view>
      </view>
    </view>

    <!-- 帖子操作菜单 -->
    <view class="action-sheet-mask" v-if="showActionSheet || sheetClosing" :class="{ 'overlay-enter': showActionSheet && !sheetClosing, 'overlay-leave': sheetClosing }" @click="closeActionSheet">
      <view class="action-sheet" :class="{ 'modal-enter': showActionSheet && !sheetClosing, 'modal-leave': sheetClosing }">
        <view class="sheet-item" @click="editPost">✏️ 编辑</view>
        <view class="sheet-item danger" @click="confirmDelete">🗑️ 删除</view>
        <view class="sheet-cancel" @click="closeActionSheet">取消</view>
      </view>
    </view>

    <!-- 评论弹窗 -->
    <view class="comment-modal" v-if="showComments || commentClosing" :class="{ 'overlay-enter': showComments && !commentClosing, 'overlay-leave': commentClosing }">
      <view class="modal-mask" :class="{ 'mask-enter': showComments && !commentClosing, 'mask-leave': commentClosing }" @click="closeComments"></view>
      <view class="comment-panel" :class="{ 'modal-enter': showComments && !commentClosing, 'modal-leave': commentClosing }">
        <view class="modal-handle"></view>
        <view class="comment-header">
          <text class="comment-title">💬 评论 ({{ comments.length }})</text>
          <text class="comment-close" @click="closeComments">✕</text>
        </view>

        <!-- 评论列表 -->
        <scroll-view class="comment-list" scroll-y :style="{ maxHeight: commentListHeight }">
          <view v-if="comments.length === 0 && !commentLoading" class="comment-empty">
            <text class="empty-icon">💭</text>
            <text class="empty-text">还没有评论，来说点什么吧</text>
          </view>
          <view class="comment-item" v-for="(c, ci) in comments" :key="c._id || ci">
            <view class="comment-avatar-wrap">
              <text class="comment-avatar">{{ c.avatar || '😊' }}</text>
            </view>
            <view class="comment-body">
              <view class="comment-meta">
                <text class="comment-username">{{ c.username }}</text>
                <text class="comment-time">{{ timeAgo(c.created_at || c.createdAt || Date.now()) }}</text>
              </view>
              <text class="comment-text">{{ c.content }}</text>
            </view>
          </view>
        </scroll-view>

        <!-- 评论输入 -->
        <view class="comment-input-row">
          <view class="comment-input-avatar">
            <text>{{ commentAvatar }}</text>
          </view>
          <input
            class="comment-input"
            v-model="newComment"
            placeholder="写评论..."
            :maxlength="200"
            @confirm="submitComment"
            confirm-type="send"
          />
          <text class="comment-send" :class="{ active: newComment.trim() }" @click="submitComment">发送</text>
        </view>
      </view>
    </view>

    <!-- 登录/注册弹窗 -->
    <view class="custom-modal" v-if="showLogin || loginClosing" :class="{ 'overlay-enter': showLogin && !loginClosing, 'overlay-leave': loginClosing }" @click.self="closeLoginModal">
      <view class="modal-mask" :class="{ 'mask-enter': showLogin && !loginClosing, 'mask-leave': loginClosing }" @click="closeLoginModal"></view>
      <view class="modal-content" :class="{ 'modal-enter': showLogin && !loginClosing, 'modal-leave': loginClosing }">
        <view class="modal-handle"></view>

        <!-- Tab 切换 -->
        <view class="login-tabs">
          <view class="login-tab" :class="{ active: loginTab === 'login' }" @click="loginTab = 'login'">
            <text>登录</text>
          </view>
          <view class="login-tab" :class="{ active: loginTab === 'register' }" @click="loginTab = 'register'">
            <text>注册</text>
          </view>
        </view>

        <!-- 表单 -->
        <view class="form-group">
          <text class="form-label">👤 头像选择</text>
          <view class="avatar-picker">
            <view
              v-for="(av, ai) in loginAvatarOptions"
              :key="ai"
              class="avatar-option"
              :class="{ selected: loginAvatar === av }"
              @click="loginAvatar = av"
            >
              <text>{{ av }}</text>
            </view>
          </view>
        </view>

        <view class="form-group">
          <text class="form-label">用户名</text>
          <input
            class="form-input"
            v-model="loginUsername"
            placeholder="给自己起个名字"
          />
        </view>

        <view class="form-group">
          <text class="form-label">密码</text>
          <input
            class="form-input"
            v-model="loginPassword"
            placeholder="至少4位"
            :password="true"
          />
        </view>

        <view class="login-tip" v-if="loginTab === 'register'">
          <text>注册后，你的帖子和评论将永久保存在云端 📡</text>
        </view>

        <view class="modal-btns">
          <text class="modal-btn cancel" @click="closeLoginModal">取消</text>
          <text class="modal-btn confirm" @click="doLogin">
            {{ loginTab === 'login' ? '登录' : '注册' }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getData } from '@/utils/storage.js';
import { fetchPosts, publishPost as publishPostService, deletePost as deletePostService, toggleLike as toggleLikeService, fetchComments, addComment, getUserId } from '@/utils/community.js';
import { getCurrentUser, isLoggedIn, login, register, logout, verifyToken } from '@/utils/auth.js';

export default {
  data() {
    return {
      posts: [],
      currentUserId: '',
      authUser: null,
      showModal: false,
      modalClosing: false,
      showActionSheet: false,
      sheetClosing: false,
      actionSheetIndex: -1,
      // 登录
      showLogin: false,
      loginClosing: false,
      loginTab: 'login',
      loginUsername: '',
      loginPassword: '',
      loginAvatar: '😊',
      loginAvatarOptions: ['😊', '😎', '🤓', '💪', '🌟', '🔥', '🎯', '📚', '🐱', '🧑‍💻', '👩‍🎓', '🚀'],
      // 评论
      showComments: false,
      commentClosing: false,
      commentPostIndex: -1,
      comments: [],
      commentLoading: false,
      commentListHeight: '60vh',
      newComment: '',
      commentAvatar: '😊',
      commentUser: '',
      // 发帖
      newPostAvatar: '😊',
      newPostUser: '',
      newPostContent: '',
      newPostTags: [],
      tagInput: '',
      avatarOptions: ['😊', '😎', '🤓', '💪', '🌟', '🔥', '🎯', '📚', '🐱', '🎨', '🧑‍💻', '👩‍🎓', '👨‍🏫', '🌈', '💡', '🚀']
    }
  },
  onShow() {
    this.authUser = getCurrentUser();
    this.currentUserId = getUserId();
    this.loadPosts();
    // 后台验证 token 是否仍然有效
    if (isLoggedIn()) {
      verifyToken().then(valid => {
        if (!valid) {
          this.authUser = null;
          logout();
        }
      });
    }
  },
  methods: {
    // ===== 登录/注册 =====
    showLoginModal() {
      this.showLogin = true;
      this.loginClosing = false;
      this.loginTab = 'login';
      this.loginUsername = '';
      this.loginPassword = '';
      this.loginAvatar = '😊';
    },
    closeLoginModal() {
      this.loginClosing = true;
      setTimeout(() => {
        this.showLogin = false;
        this.loginClosing = false;
      }, 280);
    },
    async doLogin() {
      const username = this.loginUsername.trim();
      const password = this.loginPassword;

      if (!username) return uni.showToast({ title: '请输入用户名', icon: 'none' });
      if (!password || password.length < 4) return uni.showToast({ title: '密码至少4位', icon: 'none' });

      uni.showLoading({ title: this.loginTab === 'login' ? '登录中...' : '注册中...', mask: true });

      let result;
      if (this.loginTab === 'login') {
        result = await login(username, password);
      } else {
        result = await register(username, password, this.loginAvatar);
      }

      uni.hideLoading();

      if (result.success) {
        this.authUser = result.data;
        this.currentUserId = getUserId();
        this.closeLoginModal();
        await this.loadPosts();
        uni.showToast({ title: result.message, icon: 'success' });
      } else {
        uni.showToast({ title: result.message, icon: 'none' });
      }
    },
    showLogoutMenu() {
      uni.showModal({
        title: '退出登录',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            logout();
            this.authUser = null;
            this.currentUserId = getUserId();
            uni.showToast({ title: '已退出登录', icon: 'info' });
          }
        }
      });
    },

    // ===== 帖子 =====
    // 相对时间格式化
    timeAgo(timestamp) {
      const now = Date.now();
      const date = new Date(timestamp).getTime();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return '刚刚';
      if (minutes < 60) return minutes + '分钟前';
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return hours + '小时前';
      const days = Math.floor(hours / 24);
      if (days < 7) return days + '天前';
      if (days < 30) return Math.floor(days / 7) + '周前';
      const d = new Date(timestamp);
      return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
    },

    async loadPosts() {
      uni.showLoading({ title: '加载中...', mask: true });
      try {
        const rawPosts = await fetchPosts();
        // 统一数据格式
        this.posts = rawPosts.map(p => ({
          id: p._id || p.id,
          avatar: p.avatar || '😊',
          user: p.username || p.user || '',
          time: this.timeAgo(p.created_at || p.createdAt || Date.now()),
          content: p.content || '',
          likes: p.likes || 0,
          comments: p.comment_count || p.comments || 0,
          shares: p.shares || 0,
          liked: p.liked || false,
          tags: p.tags || [],
          createdAt: p.created_at || p.createdAt || Date.now(),
          isMine: p.user_id === this.currentUserId || (p.user === this.currentUserId)
        }));
      } catch (e) {
        console.error('加载帖子失败:', e);
        uni.showToast({ title: '加载失败，请下拉刷新', icon: 'none' });
      } finally {
        uni.hideLoading();
      }
    },

    showPublishModal() {
      // 优先使用登录用户信息
      if (this.authUser) {
        this.newPostUser = this.authUser.username || '';
        this.newPostAvatar = this.authUser.avatar || '😊';
      } else {
        const data = getData();
        const name = (data.user && data.user.name) ? data.user.name : '';
        this.newPostUser = name || '学习者';
        this.newPostAvatar = '😊';
      }
      this.newPostContent = '';
      this.newPostTags = [];
      this.tagInput = '';
      this.showModal = true;
      this.modalClosing = false;
    },
    closePublishModal() {
      this.modalClosing = true;
      setTimeout(() => {
        this.showModal = false;
        this.modalClosing = false;
      }, 280);
    },
    closeActionSheet() {
      this.sheetClosing = true;
      setTimeout(() => {
        this.showActionSheet = false;
        this.sheetClosing = false;
      }, 250);
    },

    // ===== 评论 =====
    async openComments(index) {
      const post = this.posts[index];
      if (!post) return;
      this.commentPostIndex = index;
      this.showComments = true;
      this.commentClosing = false;
      this.comments = [];
      this.newComment = '';
      // 优先使用登录用户信息
      if (this.authUser) {
        this.commentUser = this.authUser.username || '';
        this.commentAvatar = this.authUser.avatar || '😊';
      } else {
        const data = getData();
        const name = (data.user && data.user.name) ? data.user.name : '';
        this.commentUser = name || '学习者';
        this.commentAvatar = '😊';
      }

      this.commentLoading = true;
      try {
        const list = await fetchComments(post.id);
        this.comments = list || [];
      } catch (e) {
        console.error('加载评论失败:', e);
      } finally {
        this.commentLoading = false;
      }
    },
    closeComments() {
      this.commentClosing = true;
      setTimeout(() => {
        this.showComments = false;
        this.commentClosing = false;
        this.comments = [];
        this.commentPostIndex = -1;
      }, 250);
    },
    async submitComment() {
      const content = this.newComment.trim();
      if (!content) return;
      const post = this.posts[this.commentPostIndex];
      if (!post) return;

      // 乐观插入
      const tempComment = {
        _id: 'temp_' + Date.now(),
        username: this.commentUser,
        avatar: this.commentAvatar,
        content: content,
        created_at: Date.now()
      };
      this.comments.push(tempComment);
      this.newComment = '';

      const result = await addComment({
        postId: post.id,
        username: this.commentUser,
        content: content,
        avatar: this.commentAvatar
      });

      if (result.success) {
        // 用服务端返回的数据替换临时评论
        const tempIdx = this.comments.findIndex(c => c._id === tempComment._id);
        if (tempIdx >= 0 && result.data) {
          this.comments.splice(tempIdx, 1, result.data);
        }
        // 更新帖子评论数
        post.comments = (post.comments || 0) + 1;
      } else {
        // 回滚
        const tempIdx = this.comments.findIndex(c => c._id === tempComment._id);
        if (tempIdx >= 0) this.comments.splice(tempIdx, 1);
        uni.showToast({ title: result.message || '评论失败', icon: 'none' });
      }
    },

    addTag() {
      const tag = this.tagInput.trim();
      if (!tag) return;
      if (this.newPostTags.includes(tag)) {
        uni.showToast({ title: '标签已存在', icon: 'none' });
        return;
      }
      if (this.newPostTags.length >= 3) {
        uni.showToast({ title: '最多添加3个标签', icon: 'none' });
        return;
      }
      this.newPostTags.push(tag);
      this.tagInput = '';
    },

    removeTag(index) {
      this.newPostTags.splice(index, 1);
    },

    async publishPost() {
      const content = this.newPostContent.trim();
      if (!content) return uni.showToast({ title: '请输入内容', icon: 'none' });
      if (!this.newPostUser.trim()) return uni.showToast({ title: '请输入昵称', icon: 'none' });

      uni.showLoading({ title: '发布中...', mask: true });
      const result = await publishPostService({
        username: this.newPostUser.trim(),
        content: content,
        avatar: this.newPostAvatar,
        tags: [...this.newPostTags]
      });

      uni.hideLoading();
      if (result.success) {
        this.closePublishModal();
        await this.loadPosts();
        uni.showToast({ title: '🎉 发布成功！', icon: 'success' });
      } else {
        uni.showToast({ title: result.message || '发布失败', icon: 'none' });
      }
    },

    showPostMenu(index) {
      const post = this.posts[index];
      if (!post.isMine) {
        // 非自己的帖子可以举报
        uni.showModal({
          title: '举报帖子',
          content: '确定要举报这条帖子吗？',
          success: (res) => {
            if (res.confirm) {
              uni.showToast({ title: '已提交举报，管理员将尽快处理', icon: 'none' });
            }
          }
        });
        return;
      }
      this.actionSheetIndex = index;
      this.showActionSheet = true;
      this.sheetClosing = false;
    },

    editPost() {
      this.closeActionSheet();
      const post = this.posts[this.actionSheetIndex];
      if (!post || !post.isMine) return;

      this.newPostAvatar = post.avatar;
      this.newPostUser = post.user;
      this.newPostContent = post.content;
      this.newPostTags = [...(post.tags || [])];
      this.tagInput = '';

      // 先删除旧帖再打开编辑弹窗
      this.doDelete();
      this.showModal = true;
    },

    confirmDelete() {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条动态吗？此操作不可恢复。',
        success: (res) => {
          if (res.confirm) {
            this.doDelete();
            this.closeActionSheet();
          }
        }
      });
    },

    async doDelete() {
      const post = this.posts[this.actionSheetIndex];
      if (!post || !post.isMine) return;

      uni.showLoading({ title: '删除中...', mask: true });
      const result = await deletePostService(post.id);
      uni.hideLoading();

      if (result.success) {
        await this.loadPosts();
        uni.showToast({ title: '已删除', icon: 'info' });
      } else {
        uni.showToast({ title: result.message || '删除失败', icon: 'none' });
      }
    },

    async likePost(index) {
      const post = this.posts[index];
      if (!post) return;

      // 乐观更新
      const wasLiked = post.liked;
      post.liked = !wasLiked;
      post.likes = wasLiked ? Math.max(0, post.likes - 1) : post.likes + 1;

      const result = await toggleLikeService(post.id);
      if (!result.success) {
        // 回滚
        post.liked = wasLiked;
        post.likes = wasLiked ? post.likes + 1 : Math.max(0, post.likes - 1);
        return;
      }

      // 以服务端返回为准
      if (result.liked !== undefined) {
        post.liked = result.liked;
      }
      if (!result.localOnly && !wasLiked && result.liked) {
        uni.showToast({ title: '❤️ 已点赞', icon: 'none' });
      }
    }
  }
}
</script>

<style scoped>
/* ====== 布局 ====== */
.page-container { padding: 40rpx 30rpx 120rpx; background: #f7fbfc; min-height: 100vh; }

.header-section { margin-bottom: 32rpx; }
.header-top { display: flex; align-items: flex-start; justify-content: space-between; }
.header-text { flex: 1; }
.page-title { font-size: 40rpx; font-weight: 700; color: #1a3a42; display: block; }
.page-desc { font-size: 26rpx; color: #8aa5ab; margin-top: 6rpx; display: block; }

/* 登录按钮 */
.login-btn {
  background: linear-gradient(135deg, #62c7b2, #4aad98);
  border-radius: 28rpx;
  padding: 12rpx 30rpx;
  box-shadow: 0 4rpx 14rpx rgba(98, 199, 178, 0.3);
  flex-shrink: 0;
}
.login-btn:active { transform: scale(0.95); }
.login-btn-text { color: #fff; font-size: 26rpx; font-weight: 600; }

/* 已登录用户 */
.user-badge {
  display: flex;
  align-items: center;
  gap: 10rpx;
  background: #f0f7f5;
  border-radius: 30rpx;
  padding: 8rpx 20rpx 8rpx 8rpx;
  flex-shrink: 0;
}
.user-badge-avatar {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8f8f4, #d0efe8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}
.user-badge-name { font-size: 24rpx; color: #315963; font-weight: 500; max-width: 120rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ====== 帖子列表 ====== */
.community-list { display: flex; flex-direction: column; gap: 24rpx; }

.post-card {
  position: relative;
  overflow: hidden;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
  border-top: 4rpx solid #62c7b2;
  transition: transform 0.2s ease;
  animation: card-breathe 5s ease-in-out infinite;
}
.post-card::after {
  content: '';
  position: absolute;
  top: -28rpx; right: -28rpx;
  width: 96rpx; height: 96rpx;
  border-radius: 50%;
  background: #62c7b2;
  opacity: 0.04;
  pointer-events: none;
}
.post-card:active { transform: scale(0.99); }
.post-mine { border-color: rgba(98, 199, 178, 0.15); }

.post-header {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 20rpx;
}

.avatar-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-0 { background: linear-gradient(135deg, #e8f8f4, #d0efe8); }
.avatar-1 { background: linear-gradient(135deg, #e8f4ff, #d0e5f5); }
.avatar-2 { background: linear-gradient(135deg, #fff4e8, #ffe8d0); }

.avatar { font-size: 36rpx; }

.user-info { display: flex; flex-direction: column; flex: 1; }
.username-row { display: flex; align-items: center; gap: 10rpx; }
.username { font-size: 30rpx; font-weight: 600; color: #1a3a42; }
.my-badge {
  font-size: 20rpx;
  color: #fff;
  background: linear-gradient(135deg, #62c7b2, #4aad98);
  padding: 2rpx 10rpx;
  border-radius: 10rpx;
  font-weight: 500;
}
.time-row { display: flex; align-items: center; gap: 8rpx; margin-top: 4rpx; }
.time-dot { width: 8rpx; height: 8rpx; border-radius: 50%; background: #62c7b2; }
.time { font-size: 24rpx; color: #a6bdc2; }

.more-btn {
  font-size: 32rpx;
  color: #a6bdc2;
  padding: 8rpx 12rpx;
  letter-spacing: 4rpx;
  border-radius: 50%;
  transition: background 0.2s;
}
.more-btn:active { background: #f3f6f7; }

.post-content {
  font-size: 28rpx;
  color: #315963;
  line-height: 1.7;
  margin-bottom: 18rpx;
}

.post-tags {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}
.tag {
  font-size: 22rpx;
  color: #62c7b2;
  background: #e8f8f4;
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
  font-weight: 500;
}

.post-actions {
  display: flex;
  gap: 48rpx;
  border-top: 1rpx solid #f3f6f8;
  padding-top: 18rpx;
}
.action-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: #8aa5ab;
  transition: transform 0.15s ease;
}
.action-item:active { transform: scale(0.9); }
.action-item .icon { font-size: 28rpx; }
.action-item .num { font-size: 24rpx; }

.load-more { text-align: center; padding: 30rpx 0; }
.load-text { font-size: 24rpx; color: #a6bdc2; }

/* ====== 发帖按钮 ====== */
.publish-btn {
  position: fixed;
  bottom: 120rpx;
  right: 30rpx;
  z-index: 90;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #62c7b2, #4aad98);
  box-shadow: 0 8rpx 28rpx rgba(98, 199, 178, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}
.publish-btn:active { transform: scale(0.9); box-shadow: 0 4rpx 16rpx rgba(98, 199, 178, 0.3); }
.publish-icon { font-size: 44rpx; }

/* ====== 发帖弹窗 ====== */
.custom-modal {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.custom-modal.overlay-enter .modal-mask { animation: maskFadeIn 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.custom-modal.overlay-leave .modal-mask { animation: maskFadeOut 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.modal-mask {
  position: absolute;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.45);
}
.modal-content {
  position: relative;
  background: #fff;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  border-radius: 40rpx 40rpx 0 0;
  padding: 0 36rpx 60rpx;
  z-index: 1000;
  overflow-y: auto;
}
.modal-content.modal-enter { animation: sheetSlideUp 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.modal-content.modal-leave { animation: sheetSlideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.modal-handle {
  width: 60rpx;
  height: 6rpx;
  background: #d0dde0;
  border-radius: 3rpx;
  margin: 16rpx auto 24rpx;
}
.modal-title {
  font-size: 34rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 28rpx;
  text-align: center;
  color: #1a3a42;
}

/* 表单 */
.form-group { margin-bottom: 24rpx; }
.form-label {
  font-size: 26rpx;
  font-weight: 600;
  color: #5a7d85;
  display: block;
  margin-bottom: 12rpx;
}
.form-input {
  background: #f7fbfc;
  border: 2rpx solid #e0edef;
  border-radius: 14rpx;
  padding: 16rpx 20rpx;
  font-size: 28rpx;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: #62c7b2; }
.form-textarea {
  background: #f7fbfc;
  border: 2rpx solid #e0edef;
  border-radius: 14rpx;
  padding: 16rpx 20rpx;
  font-size: 28rpx;
  min-height: 160rpx;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.form-textarea:focus { border-color: #62c7b2; }
.char-count {
  text-align: right;
  font-size: 22rpx;
  color: #a6bdc2;
  display: block;
  margin-top: 8rpx;
}

/* 头像选择 */
.avatar-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.avatar-option {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: #f3f6f7;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  border: 3rpx solid transparent;
  transition: all 0.2s ease;
}
.avatar-option.selected {
  border-color: #62c7b2;
  background: #e8f8f4;
  transform: scale(1.1);
  box-shadow: 0 4rpx 12rpx rgba(98, 199, 178, 0.2);
}

/* 标签输入 */
.tag-input-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  align-items: center;
  background: #f7fbfc;
  border: 2rpx solid #e0edef;
  border-radius: 14rpx;
  padding: 12rpx 16rpx;
  min-height: 56rpx;
}
.tag-chip {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: #e8f8f4;
  color: #62c7b2;
  padding: 6rpx 14rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  font-weight: 500;
}
.tag-remove {
  font-size: 26rpx;
  color: #4aad98;
  font-weight: 700;
  cursor: pointer;
}
.tag-input {
  flex: 1;
  min-width: 120rpx;
  font-size: 24rpx;
  background: transparent;
  border: none;
}

.modal-btns {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}
.modal-btn {
  flex: 1;
  font-size: 30rpx;
  font-weight: 600;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 16rpx;
  transition: all 0.2s ease;
}
.modal-btn:active { transform: scale(0.96); }
.modal-btn.cancel { background: #f3f6f7; color: #8aa5ab; }
.modal-btn.confirm {
  background: linear-gradient(135deg, #62c7b2, #4aad98);
  color: #fff;
  box-shadow: 0 6rpx 20rpx rgba(98, 199, 178, 0.3);
}

/* 登录Tabs */
.login-tabs {
  display: flex;
  margin-bottom: 28rpx;
  background: #f3f6f7;
  border-radius: 16rpx;
  padding: 6rpx;
}
.login-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  font-weight: 600;
  color: #8aa5ab;
  border-radius: 12rpx;
  transition: all 0.2s ease;
}
.login-tab.active {
  background: #fff;
  color: #1a3a42;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}
.login-tip {
  text-align: center;
  padding: 8rpx 0 20rpx;
  font-size: 24rpx;
  color: #62c7b2;
}

/* ====== 操作菜单 ====== */
.action-sheet-mask {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 999;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.action-sheet-mask.overlay-enter { animation: maskFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.action-sheet-mask.overlay-leave { animation: maskFadeOut 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.action-sheet {
  background: #fff;
  width: 100%;
  max-width: 480px;
  border-radius: 32rpx 32rpx 0 0;
  padding: 20rpx 30rpx 50rpx;
}
.action-sheet.modal-enter { animation: sheetSlideUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.action-sheet.modal-leave { animation: sheetSlideDown 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.sheet-item {
  text-align: center;
  padding: 24rpx 0;
  font-size: 32rpx;
  color: #315963;
  border-bottom: 1rpx solid #f3f6f7;
  transition: background 0.2s;
}
.sheet-item:active { background: #f9fcfc; border-radius: 12rpx; }
.sheet-item.danger { color: #e9828c; }
.sheet-cancel {
  text-align: center;
  padding: 24rpx 0;
  margin-top: 16rpx;
  background: #f3f6f7;
  font-size: 30rpx;
  color: #8aa5ab;
  border-radius: 16rpx;
  font-weight: 500;
}

/* ====== 评论弹窗 ====== */
.comment-modal {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.comment-modal.overlay-enter .modal-mask { animation: maskFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.comment-modal.overlay-leave .modal-mask { animation: maskFadeOut 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.comment-panel {
  position: relative;
  background: #fff;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  border-radius: 40rpx 40rpx 0 0;
  padding: 0 0 20rpx;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}
.comment-panel.modal-enter { animation: sheetSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.comment-panel.modal-leave { animation: sheetSlideDown 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 36rpx 20rpx;
  border-bottom: 1rpx solid #f3f6f8;
}
.comment-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1a3a42;
}
.comment-close {
  font-size: 32rpx;
  color: #a6bdc2;
  padding: 8rpx 12rpx;
  border-radius: 50%;
  transition: background 0.2s;
}
.comment-close:active { background: #f3f6f7; }

/* 评论列表 */
.comment-list {
  flex: 1;
  padding: 0 36rpx;
}
.comment-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}
.empty-icon { font-size: 60rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 26rpx; color: #a6bdc2; }

.comment-item {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f7fbfc;
}
.comment-avatar-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #f3f6f7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.comment-avatar { font-size: 30rpx; }
.comment-body { flex: 1; }
.comment-meta {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 6rpx;
}
.comment-username {
  font-size: 26rpx;
  font-weight: 600;
  color: #1a3a42;
}
.comment-time {
  font-size: 22rpx;
  color: #a6bdc2;
}
.comment-text {
  font-size: 26rpx;
  color: #4a6d75;
  line-height: 1.6;
}

/* 评论输入 */
.comment-input-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 16rpx 28rpx 30rpx;
  border-top: 1rpx solid #f3f6f8;
  background: #fff;
}
.comment-input-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #f3f6f7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 28rpx;
}
.comment-input {
  flex: 1;
  background: #f7fbfc;
  border: 2rpx solid #e0edef;
  border-radius: 28rpx;
  padding: 14rpx 24rpx;
  font-size: 26rpx;
  height: 60rpx;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.comment-input:focus { border-color: #62c7b2; }
.comment-send {
  font-size: 28rpx;
  font-weight: 600;
  color: #a6bdc2;
  padding: 8rpx 12rpx;
  flex-shrink: 0;
  transition: color 0.2s;
}
.comment-send.active {
  color: #62c7b2;
}
.comment-send:active { transform: scale(0.92); }

/* ====== 弹窗过渡动画 ====== */
@keyframes maskFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes maskFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes sheetSlideUp {
  from { opacity: 0; transform: translateY(80rpx); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes sheetSlideDown {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(60rpx); }
}
</style>
