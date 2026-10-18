<template>
  <view class="page-container">
    <!-- 账号信息 -->
    <view class="card">
      <view class="card-title">👤 账号信息</view>
      <view class="account-info" v-if="user">
        <view class="account-avatar">
          <image v-if="user.avatar" class="acc-avatar-img" :src="user.avatar" mode="aspectFill"></image>
          <text v-else class="acc-avatar-text">{{ user.name[0] }}</text>
        </view>
        <view class="account-detail">
          <text class="acc-name">{{ user.name }}</text>
          <text class="acc-type">已绑定：{{ getLoginLabel(user.loginType) }}</text>
        </view>
      </view>
      <view class="account-info" v-else>
        <view class="account-avatar placeholder">
          <text>👤</text>
        </view>
        <view class="account-detail">
          <text class="acc-name">未登录</text>
          <text class="acc-type">登录后可同步学习数据</text>
        </view>
      </view>
    </view>

    <!-- 登录方式 -->
    <view class="card">
      <view class="card-title">🔑 登录方式</view>
      <view class="login-btn-group">
        <view class="login-btn wechat" @click="login('wechat')">
          <text class="login-icon">💬</text>
          <view class="login-info">
            <text class="login-name">微信登录</text>
            <text class="login-hint">授权微信账号一键登录</text>
          </view>
          <text class="login-arrow">›</text>
        </view>
        <view class="login-btn qq" @click="login('qq')">
          <text class="login-icon">🐧</text>
          <view class="login-info">
            <text class="login-name">QQ登录</text>
            <text class="login-hint">授权QQ账号一键登录</text>
          </view>
          <text class="login-arrow">›</text>
        </view>
        <view class="login-btn phone" @click="login('phone')">
          <text class="login-icon">📱</text>
          <view class="login-info">
            <text class="login-name">手机号登录</text>
            <text class="login-hint">使用手机号验证登录</text>
          </view>
          <text class="login-arrow">›</text>
        </view>
        <view v-if="user" class="login-btn logout" @click="logout">
          <text class="login-icon">🚪</text>
          <view class="login-info">
            <text class="login-name">退出登录</text>
            <text class="login-hint">清除当前账号登录状态</text>
          </view>
          <text class="login-arrow logout-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 数据管理 -->
    <view class="card">
      <view class="card-title">💾 数据管理</view>
      <view class="data-actions">
        <view class="data-action-item" @click="exportData">
          <text class="action-icon">📤</text>
          <text class="action-label">导出学习数据</text>
          <text class="action-arrow">›</text>
        </view>
        <view class="data-action-item danger" @click="clearData">
          <text class="action-icon">🗑️</text>
          <text class="action-label">清除所有数据</text>
          <text class="action-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 版本信息 -->
    <view class="version-info">
      <text>🐱 坚持蛊 v1.0.0</text>
    </view>
  </view>
</template>

<script>
import { getData, setData } from '@/utils/storage.js';

export default {
  data() {
    return { user: null };
  },
  onShow() {
    this.user = (getData().user) || null;
  },
  methods: {
    getLoginLabel(type) {
      const map = { wechat: '微信', qq: 'QQ', phone: '手机号' };
      return map[type] || '未知';
    },
    login(type) {
      if (type === 'wechat') return this.loginWechat();
      if (type === 'qq') return this.loginQQ();
      this.loginPhone();
    },
    loginWechat() {
      if (typeof uni.login !== 'function') return uni.showToast({ title: '当前环境暂不支持微信登录', icon: 'none' });
      uni.login({ provider: 'weixin', success: (res) => {
        const data = getData();
        data.user = { name: '微信用户', loginType: 'wechat', provider: 'weixin', code: res.code };
        setData(data);
        this.user = data.user;
        uni.showToast({ title: '微信登录成功', icon: 'success' });
      }, fail: () => uni.showToast({ title: '微信登录取消或不可用', icon: 'none' }) });
    },
    loginQQ() {
      if (typeof uni.login !== 'function') return uni.showToast({ title: '当前环境暂不支持QQ登录', icon: 'none' });
      uni.login({ provider: 'qq', success: (res) => {
        const data = getData();
        data.user = { name: 'QQ用户', loginType: 'qq', provider: 'qq', code: res.code };
        setData(data);
        this.user = data.user;
        uni.showToast({ title: 'QQ登录成功', icon: 'success' });
      }, fail: () => uni.showToast({ title: 'QQ登录取消或不可用', icon: 'none' }) });
    },
    loginPhone() {
      uni.showModal({ title: '手机号登录', editable: true, placeholderText: '请输入手机号', success: (res) => {
        if (!res.confirm) return;
        const phone = (res.content || '').trim();
        if (!/^1[3-9]\d{9}$/.test(phone)) return uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
        uni.showModal({ title: '输入验证码', editable: true, placeholderText: '请输入验证码（演示可填任意6位数字）', success: (codeRes) => {
          if (!codeRes.confirm) return;
          const code = (codeRes.content || '').trim();
          if (!/^\d{6}$/.test(code)) return uni.showToast({ title: '验证码应为6位数字', icon: 'none' });
          const data = getData();
          data.user = { name: '手机用户', loginType: 'phone', phone: phone };
          setData(data);
          this.user = data.user;
          uni.showToast({ title: '手机号登录成功', icon: 'success' });
        } });
      } });
    },
    logout() {
      uni.showModal({
        title: '确认退出',
        content: '确定要退出当前账号吗？',
        success: (res) => {
          if (res.confirm) {
            const data = getData();
            data.user = null;
            setData(data);
            this.user = null;
            uni.showToast({ title: '已退出', icon: 'info' });
          }
        }
      });
    },
    exportData() {
      const data = getData();
      const exportObj = {
        history: data.history,
        checkins: data.checkins,
        inventory: data.inventory,
        poolCategories: data.poolCategories
      };
      uni.setClipboardData({
        data: JSON.stringify(exportObj, null, 2),
        success: () => uni.showToast({ title: '数据已复制到剪贴板', icon: 'success' })
      });
    },
    clearData() {
      uni.showModal({
        title: '⚠️ 危险操作',
        content: '确定要清除所有学习数据吗？此操作不可恢复！',
        success: (res) => {
          if (res.confirm) {
            try { uni.removeStorageSync('study_elf_app_data'); } catch (e) {}
            uni.showToast({ title: '数据已清除', icon: 'info' });
            this.user = null;
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.page-container { background: #f7fbfc; min-height: 100vh; padding: 30rpx 30rpx 80rpx; }

/* ====== 卡片 ====== */
.card {
  position: relative;
  overflow: hidden;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.03);
  animation: card-breathe 5s ease-in-out infinite;
  border-top: 4rpx solid #62c7b2;
}
/* 第二、三张卡片不同色 */
.card:nth-child(2) { border-top-color: #5daed6; }
.card:nth-child(3) { border-top-color: #f0b940; }

.card::after {
  content: '';
  position: absolute;
  top: -30rpx; right: -30rpx;
  width: 100rpx; height: 100rpx;
  border-radius: 50%;
  opacity: 0.05;
  pointer-events: none;
}
.card:nth-child(1)::after { background: #62c7b2; }
.card:nth-child(2)::after { background: #5daed6; }
.card:nth-child(3)::after { background: #f0b940; }
.card-title { font-size: 30rpx; font-weight: 600; color: #1a3a42; margin-bottom: 20rpx; }

/* ====== 账号信息 ====== */
.account-info { display: flex; align-items: center; gap: 20rpx; }
.account-avatar {
  width: 80rpx; height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #e8f8f4, #d4efe8);
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx;
}
.account-avatar.placeholder { background: #eef2f3; }
.acc-avatar-img { width: 100%; height: 100%; border-radius: 50%; }
.acc-avatar-text { font-size: 36rpx; color: #62c7b2; font-weight: 700; }
.account-detail { display: flex; flex-direction: column; gap: 4rpx; }
.acc-name { font-size: 32rpx; font-weight: 600; color: #1a3a42; }
.acc-type { font-size: 24rpx; color: #8aa5ab; }

/* ====== 登录按钮 ====== */
.login-btn-group { display: flex; flex-direction: column; gap: 14rpx; }
.login-btn {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 22rpx 24rpx;
  border-radius: 16rpx;
  border: 2rpx solid #e8eef0;
  background: #f9fcfc;
  transition: all 0.2s ease;
}
.login-btn:active { transform: scale(0.98); }
.login-icon { font-size: 36rpx; width: 50rpx; text-align: center; }
.login-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.login-name { font-size: 28rpx; font-weight: 500; color: #315963; }
.login-hint { font-size: 22rpx; color: #a6bdc2; }
.login-arrow { color: #a6bdc2; font-size: 32rpx; font-weight: 300; }

.wechat { border-left: 6rpx solid #07c160; }
.wechat:active { border-color: #07c160; background: #f0fdf6; }
.qq { border-left: 6rpx solid #12b7f5; }
.qq:active { border-color: #12b7f5; background: #f0f8fd; }
.phone { border-left: 6rpx solid #62c7b2; }
.phone:active { border-color: #62c7b2; background: #f0faf8; }

.logout { border-left: 6rpx solid #e9828c; background: #fffafa; border-color: #fde8e8; }
.logout:active { border-color: #e9828c; background: #fff5f5; }
.logout .login-name { color: #e9828c; }
.logout-arrow { color: #e9828c; }

/* ====== 数据管理 ====== */
.data-actions { display: flex; flex-direction: column; gap: 4rpx; }
.data-action-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 12rpx;
  border-radius: 12rpx;
  transition: all 0.2s ease;
}
.data-action-item:active { background: #f9fcfc; }
.action-icon { font-size: 28rpx; width: 40rpx; text-align: center; }
.action-label { flex: 1; font-size: 28rpx; color: #315963; }
.action-arrow { font-size: 28rpx; color: #a6bdc2; }
.data-action-item.danger:active { background: #fff5f5; }
.data-action-item.danger .action-label { color: #e9828c; }
.data-action-item.danger .action-icon { color: #e9828c; }

/* ====== 版本信息 ====== */
.version-info { text-align: center; padding: 40rpx 0; }
.version-info text { font-size: 24rpx; color: #a6bdc2; }
</style>
