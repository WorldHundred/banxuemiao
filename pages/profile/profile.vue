<template>
  <view class="page-container">
    <!-- 日历面板 -->
    <view v-if="calendarOpen || calendarClosing" class="calendar-panel" :class="{ 'panel-enter': calendarOpen && !calendarClosing, 'panel-leave': calendarClosing }">
      <view class="calendar-head">
        <text class="month-btn" @click="changeMonth(-1)">‹</text>
        <text class="month-title">{{ calendarYear }}年{{ calendarMonth }}月</text>
        <text class="month-btn" @click="changeMonth(1)">›</text>
      </view>
      <view class="week-row">
        <text v-for="w in weeks" :key="w">{{ w }}</text>
      </view>
      <view class="days-grid">
        <view
          v-for="(d, i) in calendarDays"
          :key="i"
          class="day-cell"
          :class="{ checked: d.checked, empty: !d.day }"
        >
          <text>{{ d.day }}</text>
        </view>
      </view>
      <view class="calendar-tip">绿色标记 = 已打卡学习日</view>
      <button class="close-calendar" @click="closeCalendar">返回我的</button>
    </view>

    <view v-else>
      <!-- 个人信息卡片 -->
      <view class="profile-hero">
        <view class="hero-bg"></view>
        <!-- 右上角设置按钮 -->
        <view class="settings-gear" @click="openSettings">
          <text>⚙️</text>
        </view>
        <view class="hero-content">
          <!-- 已登录状态 -->
          <template v-if="authUser">
            <view class="avatar-section" @click="changeAvatar">
              <image v-if="localAvatar" class="avatar-large avatar-image" :src="localAvatar" mode="aspectFill"></image>
              <view v-else class="avatar-large avatar-placeholder">
                <text>{{ authUser.avatar || '😊' }}</text>
              </view>
              <view class="avatar-camera-badge">📷</view>
            </view>
            <text class="profile-name" @click="changeName">{{ authUser.username }}</text>
            <view class="profile-login-row">
              <text class="profile-sub">已登录 · 数据自动云备份</text>
              <text class="profile-logout-link" @click="handleLogout">退出</text>
            </view>
          </template>
          <!-- 未登录状态 -->
          <template v-else>
            <view class="avatar-section">
              <image v-if="localAvatar" class="avatar-large avatar-image" :src="localAvatar" mode="aspectFill" @click="showLoginModal"></image>
              <view v-else class="avatar-large avatar-placeholder" @click="showLoginModal">
                <text>👤</text>
              </view>
            </view>
            <text class="profile-name" @click="showLoginModal">点击登录</text>
            <text class="profile-sub">登录后可同步学习数据到云端</text>
            <view class="profile-login-btns">
              <view class="profile-login-btn" @click="showLoginModal">
                <text>🔐 登录 / 注册</text>
              </view>
            </view>
          </template>
        </view>
      </view>

      <!-- 连续打卡 -->
      <view class="streak-banner">
        <view class="streak-glow"></view>
        <view class="streak-inner">
          <view class="streak-flame-ring">
            <text class="streak-flame">🔥</text>
          </view>
          <view class="streak-info">
            <text class="streak-num">{{ streakDays }}</text>
            <text class="streak-label">天连续坚持</text>
          </view>
          <view class="streak-days-badge">
            <text>💪</text>
          </view>
        </view>
      </view>

      <!-- 学习数据 -->
      <view class="section-label">📋 学习数据</view>
      <view class="data-grid">
        <view class="data-card card-calendar" @click="openCalendar">
          <view class="dc-bg-circle"></view>
          <view class="dc-icon-wrap">
            <text class="dc-icon">📅</text>
          </view>
          <view class="dc-info">
            <text class="dc-value">{{ studyDays }}</text>
            <text class="dc-unit">天</text>
          </view>
          <text class="dc-label">学习天数</text>
        </view>
        <view class="data-card card-plans" @click="openPlans">
          <view class="dc-bg-circle"></view>
          <view class="dc-icon-wrap">
            <text class="dc-icon">📝</text>
          </view>
          <view class="dc-info">
            <text class="dc-value">{{ planCount }}</text>
            <text class="dc-unit">项</text>
          </view>
          <text class="dc-label">今日计划</text>
        </view>
        <view class="data-card card-growth" @click="openGrowth">
          <view class="dc-bg-circle"></view>
          <view class="dc-icon-wrap">
            <text class="dc-icon">🌱</text>
          </view>
          <view class="dc-info">
            <text class="dc-value">{{ totalDays }}</text>
            <text class="dc-unit">天</text>
          </view>
          <text class="dc-label">成长记录</text>
        </view>
        <view class="data-card card-pool" @click="openPool">
          <view class="dc-bg-circle"></view>
          <view class="dc-icon-wrap">
            <text class="dc-icon">🗂️</text>
          </view>
          <view class="dc-info">
            <text class="dc-value">{{ poolCount }}</text>
            <text class="dc-unit">项</text>
          </view>
          <text class="dc-label">学习池</text>
        </view>
      </view>

      <!-- 云同步（仅登录后显示） -->
      <view v-if="authUser" class="section-label">☁️ 云同步</view>
      <view v-if="authUser" class="sync-card">
        <view class="sync-row">
          <view class="sync-info">
            <text class="sync-title">云端备份</text>
            <text class="sync-desc" v-if="backupInfo.hasBackup">
              最后同步：{{ formatSyncTime(backupInfo.updated_at) }}
            </text>
            <text class="sync-desc" v-else>暂无云端备份</text>
          </view>
          <view class="sync-btns">
            <view class="sync-btn upload" :class="{ loading: syncing }" @click="syncUpload">
              <text>{{ syncing ? '⏳' : '⬆️' }}</text>
              <text>备份</text>
            </view>
            <view class="sync-btn download" :class="{ loading: restoring }" @click="syncDownload">
              <text>{{ restoring ? '⏳' : '⬇️' }}</text>
              <text>恢复</text>
            </view>
          </view>
        </view>
        <view class="sync-tip">
          <text>💡 每次修改学习数据后自动云备份，换手机登录即可恢复</text>
        </view>
      </view>

      <!-- 底部提示 -->
      <view class="footer-tip">
        <text>🐱 坚持蛊 · 陪你一起成长</text>
      </view>
    </view>

    <!-- 登录弹窗 -->
    <view class="login-overlay" v-if="showLogin || loginClosing" :class="{ 'overlay-enter': showLogin && !loginClosing, 'overlay-leave': loginClosing }" @click.self="closeLoginModal">
      <view class="login-mask" @click="closeLoginModal"></view>
      <view class="login-sheet" :class="{ 'modal-enter': showLogin && !loginClosing, 'modal-leave': loginClosing }">
        <view class="modal-handle"></view>
        <view class="login-tabs">
          <view class="login-tab" :class="{ active: loginTab === 'login' }" @click="loginTab = 'login'"><text>登录</text></view>
          <view class="login-tab" :class="{ active: loginTab === 'register' }" @click="loginTab = 'register'"><text>注册</text></view>
        </view>
        <view class="form-group">
          <text class="form-label">👤 头像选择</text>
          <view class="avatar-picker">
            <view v-for="(av, ai) in loginAvatarOptions" :key="ai" class="avatar-option" :class="{ selected: loginAvatar === av }" @click="loginAvatar = av"><text>{{ av }}</text></view>
          </view>
        </view>
        <view class="form-group">
          <text class="form-label">用户名</text>
          <input class="form-input" v-model="loginUsername" placeholder="给自己起个名字" />
        </view>
        <view class="form-group">
          <text class="form-label">密码</text>
          <input class="form-input" v-model="loginPassword" placeholder="至少4位" :password="true" />
        </view>
        <view class="login-tip-text" v-if="loginTab === 'register'"><text>注册后学习数据将自动备份到云端 📡</text></view>
        <view class="modal-btns">
          <text class="modal-btn cancel" @click="closeLoginModal">取消</text>
          <text class="modal-btn confirm" @click="doLogin">{{ loginTab === 'login' ? '登录' : '注册' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getData, setData } from '@/utils/storage.js';
import { getCurrentUser, isLoggedIn, login, register, logout, updateProfile } from '@/utils/auth.js';
import { uploadBackup, downloadBackup, getBackupInfo } from '@/utils/sync.js';

export default {
  data() {
    return {
      authUser: null,
      localAvatar: '',
      studyDays: 0,
      streakDays: 0,
      planCount: 0,
      totalEnergy: 0,
      totalDays: 0,
      poolCount: 0,
      calendarOpen: false,
      calendarClosing: false,
      calendarYear: new Date().getFullYear(),
      calendarMonth: new Date().getMonth() + 1,
      weeks: ['日', '一', '二', '三', '四', '五', '六'],
      calendarDays: [],
      // 登录
      showLogin: false,
      loginClosing: false,
      loginTab: 'login',
      loginUsername: '',
      loginPassword: '',
      loginAvatar: '😊',
      loginAvatarOptions: ['😊', '😎', '🤓', '💪', '🌟', '🔥', '🎯', '📚', '🐱', '🧑‍💻', '👩‍🎓', '🚀'],
      // 云同步
      backupInfo: { hasBackup: false },
      syncing: false,
      restoring: false
    };
  },
  onShow() {
    this.authUser = getCurrentUser();
    this.loadData();
    if (isLoggedIn()) {
      this.loadBackupInfo();
    }
  },
  methods: {
    loadData() {
      const data = getData();
      this.localAvatar = (data.user && data.user.avatar) ? data.user.avatar : '';
      this.studyDays = data.history ? data.history.length : 0;
      this.streakDays = this.getConsecutiveDays(data.checkins || []);
      const completedPlans = (data.todayPlans || []).filter(p => p && p.done === true);
      this.planCount = completedPlans.length;
      this.totalEnergy = completedPlans.reduce((s, p) => s + Number(p.energy || 0), 0);
      this.totalDays = data.history ? data.history.length : 0;
      this.poolCount = (data.poolCategories || []).length;
    },
    getConsecutiveDays(checkins) {
      if (!checkins.length) return 0;
      const set = new Set(checkins);
      let count = 0;
      const d = new Date();
      while (true) {
        const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        if (!set.has(key)) break;
        count++;
        d.setDate(d.getDate() - 1);
      }
      return count;
    },
    buildCalendar() {
      const first = new Date(this.calendarYear, this.calendarMonth - 1, 1).getDay();
      const total = new Date(this.calendarYear, this.calendarMonth, 0).getDate();
      const dates = getData().checkins || [];
      const arr = [];
      for (let i = 0; i < first; i++) arr.push({ day: '' });
      for (let d = 1; d <= total; d++) {
        const month = this.calendarMonth < 10 ? '0' + this.calendarMonth : '' + this.calendarMonth;
        const day = d < 10 ? '0' + d : '' + d;
        const key = this.calendarYear + '-' + month + '-' + day;
        arr.push({ day: d, checked: dates.indexOf(key) >= 0 });
      }
      this.calendarDays = arr;
    },
    changeMonth(step) {
      this.calendarMonth += step;
      if (this.calendarMonth < 1) {
        this.calendarMonth = 12;
        this.calendarYear--;
      }
      if (this.calendarMonth > 12) {
        this.calendarMonth = 1;
        this.calendarYear++;
      }
      this.buildCalendar();
    },
    openCalendar() {
      this.calendarOpen = true;
      this.calendarClosing = false;
      this.buildCalendar();
    },
    closeCalendar() {
      this.calendarClosing = true;
      setTimeout(() => {
        this.calendarOpen = false;
        this.calendarClosing = false;
      }, 280);
    },
    openPlans() {
      uni.switchTab({ url: '/pages/today/today' });
    },
    openGrowth() {
      uni.navigateTo({ url: '/pages/growth/growth' });
    },
    openSettings() {
      uni.navigateTo({ url: '/pages/settings/settings' });
    },
    openPool() {
      uni.switchTab({ url: '/pages/pool/pool' });
    },
    changeAvatar() {
      const self = this;
      uni.chooseImage({
        count: 1,
        sourceType: ['album', 'camera'],
        success(img) {
          const tempPath = img.tempFilePaths[0];
          const setAvatar = (url) => {
            const data = getData();
            data.user = data.user || {};
            data.user.avatar = url;
            setData(data);
            self.loadData();
            uni.showToast({ title: '头像已更新', icon: 'success' });
          };
          // 转 base64
          if (uni.getFileSystemManager) {
            uni.getFileSystemManager().readFile({
              filePath: tempPath,
              encoding: 'base64',
              success: (res) => setAvatar('data:image/jpeg;base64,' + res.data),
              fail: () => setAvatar(tempPath)
            });
          } else {
            try {
              const xhr = new XMLHttpRequest();
              xhr.open('GET', tempPath, true);
              xhr.responseType = 'blob';
              xhr.onload = () => {
                const reader = new FileReader();
                reader.onloadend = () => setAvatar(reader.result);
                reader.readAsDataURL(xhr.response);
              };
              xhr.onerror = () => setAvatar(tempPath);
              xhr.send();
            } catch (e) {
              setAvatar(tempPath);
            }
          }
        }
      });
    },
    changeName() {
      if (!this.authUser) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      uni.showModal({
        title: '修改用户名',
        editable: true,
        content: this.authUser.username || '',
        placeholderText: '请输入新用户名',
        success: async (res) => {
          if (!res.confirm) return;
          const name = (res.content || '').trim();
          if (!name || name.length < 2) return uni.showToast({ title: '用户名至少2个字符', icon: 'none' });
          const result = await updateProfile({ username: name });
          if (result.success) {
            this.authUser = result.data;
            uni.showToast({ title: '用户名已更新', icon: 'success' });
          } else {
            uni.showToast({ title: result.message, icon: 'none' });
          }
        }
      });
    },

    // ===== 登录 =====
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
        this.closeLoginModal();
        this.loadBackupInfo();
        // 登录后立刻备份当前数据
        const data = getData();
        uploadBackup(data);
        uni.showToast({ title: result.message, icon: 'success' });
      } else {
        uni.showToast({ title: result.message, icon: 'none' });
      }
    },
    handleLogout() {
      uni.showModal({
        title: '退出登录',
        content: '退出后本地学习数据不会丢失，下次登录可恢复。',
        success: (res) => {
          if (res.confirm) {
            logout();
            this.authUser = null;
            this.backupInfo = { hasBackup: false };
            uni.showToast({ title: '已退出登录', icon: 'info' });
          }
        }
      });
    },

    // ===== 云同步 =====
    async loadBackupInfo() {
      const info = await getBackupInfo();
      this.backupInfo = info;
    },
    formatSyncTime(ts) {
      if (!ts) return '未知';
      const d = new Date(ts);
      const pad = n => String(n).padStart(2, '0');
      return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    },
    async syncUpload() {
      if (this.syncing) return;
      this.syncing = true;
      const data = getData();
      const result = await uploadBackup(data);
      this.syncing = false;
      if (result.success) {
        this.backupInfo = { hasBackup: true, updated_at: result.time };
        uni.showToast({ title: '✅ 备份成功', icon: 'success' });
      } else {
        uni.showToast({ title: result.message || '备份失败', icon: 'none' });
      }
    },
    async syncDownload() {
      const self = this;
      uni.showModal({
        title: '恢复数据',
        content: '云端数据将覆盖本地数据，确定恢复吗？',
        success: async (res) => {
          if (!res.confirm) return;
          self.restoring = true;
          const result = await downloadBackup();
          self.restoring = false;
          if (result.success && result.data) {
            setData(result.data);
            self.loadData();
            uni.showToast({ title: '✅ 数据已恢复', icon: 'success' });
          } else {
            uni.showToast({ title: result.message || '恢复失败', icon: 'none' });
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.page-container { background: #f7fbfc; min-height: 100vh; padding-bottom: 80rpx; }

/* ====== 个人信息区 ====== */
.profile-hero {
  position: relative;
  overflow: hidden;
  margin-bottom: 24rpx;
}
.settings-gear {
  position: absolute;
  top: 20rpx;
  right: 24rpx;
  z-index: 10;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  background: rgba(255,255,255,0.7);
  border-radius: 50%;
  transition: all 0.3s ease;
}
.settings-gear:active { transform: rotate(90deg); background: rgba(255,255,255,0.95); }
.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 220rpx;
  background: linear-gradient(180deg, #e8f8f4 0%, #f7fbfc 100%);
  border-radius: 0 0 40rpx 40rpx;
}
.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 30rpx 20rpx;
}

.avatar-section {
  position: relative;
  margin-bottom: 16rpx;
}
.avatar-large {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 6rpx solid #fff;
  box-shadow: 0 8rpx 28rpx rgba(98, 199, 178, 0.2);
}
.avatar-placeholder {
  background: linear-gradient(135deg, #62c7b2, #4aad98);
  font-size: 60rpx;
  color: #fff;
}
.avatar-image { display: block; overflow: hidden; }
.avatar-camera-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.profile-name {
  font-size: 38rpx;
  font-weight: 700;
  color: #1a3a42;
  display: block;
}
.profile-sub {
  font-size: 24rpx;
  color: #8aa5ab;
  display: block;
  margin-top: 6rpx;
}

/* ====== 连续打卡条 ====== */
.streak-banner {
  position: relative;
  margin: 0 30rpx 24rpx;
  background: linear-gradient(135deg, #fff8ee, #ffeed8, #ffe4c8);
  border-radius: 24rpx;
  padding: 28rpx 30rpx;
  overflow: hidden;
  box-shadow: 0 6rpx 24rpx rgba(255, 160, 80, 0.12);
  border-top: 4rpx solid #ff8c5a;
  animation: card-breathe 5s ease-in-out infinite;
}
.streak-glow {
  position: absolute;
  top: -40rpx;
  right: -20rpx;
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 140, 90, 0.18) 0%, transparent 70%);
  pointer-events: none;
}
.streak-inner {
  display: flex;
  align-items: center;
  gap: 18rpx;
  position: relative;
  z-index: 1;
}
.streak-flame-ring {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: rgba(255, 140, 90, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}
.streak-flame { font-size: 40rpx; animation: flame-bounce 1.5s ease-in-out infinite; }
@keyframes flame-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
.streak-info { flex: 1; display: flex; flex-direction: column; gap: 2rpx; }
.streak-num { font-size: 48rpx; font-weight: 800; color: #e8784a; line-height: 1; }
.streak-label { font-size: 24rpx; color: #b08060; }
.streak-days-badge {
  font-size: 36rpx;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
}

/* ====== 数据网格 ====== */
.section-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #5a7d85;
  margin: 0 30rpx 16rpx;
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin: 0 30rpx 24rpx;
}

.data-card {
  position: relative;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 20rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
  animation: card-breathe 5s ease-in-out infinite;
}
.data-card:active {
  transform: translateY(-4rpx);
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.08);
}

/* 装饰背景圆 */
.dc-bg-circle {
  position: absolute;
  top: -30rpx;
  right: -30rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  opacity: 0.12;
  pointer-events: none;
}
.card-calendar .dc-bg-circle { background: #62c7b2; }
.card-plans .dc-bg-circle     { background: #5daed6; }
.card-growth .dc-bg-circle    { background: #f0b940; }
.card-pool .dc-bg-circle      { background: #9b8ac7; }

/* 图标 */
.dc-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14rpx;
  position: relative;
  z-index: 1;
}
.card-calendar .dc-icon-wrap { background: #e8f8f4; }
.card-plans .dc-icon-wrap     { background: #e8f4ff; }
.card-growth .dc-icon-wrap    { background: #fff8e8; }
.card-pool .dc-icon-wrap      { background: #f0e8ff; }

.dc-icon {
  font-size: 32rpx;
}

/* 数值 */
.dc-info {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  margin-bottom: 6rpx;
  position: relative;
  z-index: 1;
}
.dc-value {
  font-size: 44rpx;
  font-weight: 800;
  line-height: 1;
}
.card-calendar .dc-value { color: #62c7b2; }
.card-plans .dc-value     { color: #5daed6; }
.card-growth .dc-value    { color: #f0b940; }
.card-pool .dc-value      { color: #9b8ac7; }

.dc-unit {
  font-size: 24rpx;
  color: #a6bdc2;
  font-weight: 500;
}

.dc-label {
  font-size: 24rpx;
  color: #8aa5ab;
  position: relative;
  z-index: 1;
}

/* 卡片边框光晕 */
.card-calendar { border-top: 4rpx solid #62c7b2; }
.card-plans     { border-top: 4rpx solid #5daed6; }
.card-growth    { border-top: 4rpx solid #f0b940; }
.card-pool      { border-top: 4rpx solid #9b8ac7; }

/* 登录行 */
.profile-login-row { display: flex; align-items: center; gap: 20rpx; margin-top: 4rpx; }
.profile-logout-link { font-size: 24rpx; color: #e9828c; }
.profile-login-btns { margin-top: 16rpx; }
.profile-login-btn {
  background: linear-gradient(135deg, #62c7b2, #4aad98);
  border-radius: 28rpx;
  padding: 14rpx 40rpx;
  box-shadow: 0 6rpx 20rpx rgba(98, 199, 178, 0.3);
}
.profile-login-btn:active { transform: scale(0.95); }
.profile-login-btn text { color: #fff; font-size: 28rpx; font-weight: 600; }

/* ====== 云同步卡片 ====== */
.sync-card {
  margin: 0 30rpx 20rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
  border-top: 4rpx solid #8ab4f8;
  animation: card-breathe 5s ease-in-out infinite;
}
.sync-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12rpx; }
.sync-info { flex: 1; }
.sync-title { font-size: 28rpx; font-weight: 700; color: #1a3a42; display: block; }
.sync-desc { font-size: 24rpx; color: #8aa5ab; margin-top: 4rpx; display: block; }
.sync-btns { display: flex; gap: 14rpx; }
.sync-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 24rpx;
  font-weight: 600;
  padding: 12rpx 22rpx;
  border-radius: 24rpx;
  transition: all 0.2s ease;
}
.sync-btn:active { transform: scale(0.92); }
.sync-btn.upload { background: #e8f4ff; color: #5daed6; }
.sync-btn.download { background: #f0e8ff; color: #9b8ac7; }
.sync-btn.loading { opacity: 0.5; pointer-events: none; }
.sync-tip { margin-top: 6rpx; }
.sync-tip text { font-size: 22rpx; color: #a6bdc2; }

/* ====== 登录弹窗（与社区页一致） ====== */
.login-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.login-overlay.overlay-enter .login-mask { animation: maskFadeIn 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.login-overlay.overlay-leave .login-mask { animation: maskFadeOut 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.login-mask { position: absolute; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.45); }
.login-sheet {
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
.login-sheet.modal-enter { animation: sheetSlideUp 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.login-sheet.modal-leave { animation: sheetSlideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.login-tabs { display: flex; margin-bottom: 28rpx; background: #f3f6f7; border-radius: 16rpx; padding: 6rpx; }
.login-tab { flex: 1; text-align: center; padding: 16rpx 0; font-size: 28rpx; font-weight: 600; color: #8aa5ab; border-radius: 12rpx; }
.login-tab.active { background: #fff; color: #1a3a42; box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05); }
.login-tip-text { text-align: center; padding: 8rpx 0 20rpx; font-size: 24rpx; color: #62c7b2; }

/* 复用发帖弹窗的通用样式 */
.modal-handle { width: 60rpx; height: 6rpx; background: #d0dde0; border-radius: 3rpx; margin: 16rpx auto 24rpx; }
.modal-btns { display: flex; gap: 20rpx; margin-top: 20rpx; }
.modal-btn { flex: 1; font-size: 30rpx; font-weight: 600; text-align: center; padding: 20rpx 0; border-radius: 16rpx; }
.modal-btn:active { transform: scale(0.96); }
.modal-btn.cancel { background: #f3f6f7; color: #8aa5ab; }
.modal-btn.confirm { background: linear-gradient(135deg, #62c7b2, #4aad98); color: #fff; box-shadow: 0 6rpx 20rpx rgba(98, 199, 178, 0.3); }

/* 底部 */
.footer-tip { text-align: center; padding: 40rpx 0 20rpx; }
.footer-tip text { font-size: 24rpx; color: #a6bdc2; }

/* ====== 日历面板 ====== */
.calendar-panel {
  padding: 28rpx 30rpx;
  background: #fff;
  margin: 0 30rpx;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}
.calendar-panel.panel-enter { animation: panelFadeSlideIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.calendar-panel.panel-leave { animation: panelFadeSlideOut 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.calendar-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 34rpx;
  color: #315963;
  font-weight: 600;
}
.month-title { min-width: 200rpx; text-align: center; }
.month-btn {
  font-size: 52rpx;
  color: #62c7b2;
  padding: 0 24rpx;
  font-weight: 300;
}
.week-row, .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; }
.week-row { margin: 30rpx 0 16rpx; color: #8aa5ab; font-size: 24rpx; }
.day-cell { height: 72rpx; display: flex; align-items: center; justify-content: center; color: #315963; font-size: 26rpx; }
.day-cell text { width: 52rpx; height: 52rpx; line-height: 52rpx; border-radius: 50%; }
.day-cell.checked text {
  background: linear-gradient(135deg, #62c7b2, #4aad98);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(98, 199, 178, 0.3);
}
.calendar-tip {
  text-align: center;
  color: #8aa5ab;
  font-size: 24rpx;
  margin: 20rpx 0;
}
.close-calendar {
  background: linear-gradient(135deg, #62c7b2, #4aad98);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  box-shadow: 0 6rpx 20rpx rgba(98, 199, 178, 0.3);
}

/* ====== 面板过渡动画 ====== */
@keyframes panelFadeSlideIn {
  from { opacity: 0; transform: translateY(-20rpx); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes panelFadeSlideOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-16rpx); }
}

/* 登录弹窗动画 */
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
