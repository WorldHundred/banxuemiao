<template>
  <view class="page-wrapper">
    <view class="page-container">
      <!-- 顶部日期与标题 -->
      <view class="header-section animate-fade-in">
        <view class="date-area">
          <view class="date-badge">
            <text class="day-num">{{ dayNum }}</text>
            <text class="day-text">{{ dayText }}</text>
          </view>
        </view>
        <view class="greeting-area">
          <text class="greeting-text">{{ greetingText }}</text>
          <text class="page-title">今日打卡</text>
        </view>
      </view>

      <!-- 小猫区域 -->
      <view class="cat-section animate-fade-in-up">
        <view class="cat-decoration-ring"></view>
        <!-- 点击泡泡切换文字 -->
        <view class="bubble-area" @click="changeBubbleText">
          <view class="bubble">
            <text class="bubble-dot"></text>
            <text>{{ bubbleText }}</text>
          </view>
        </view>
        <CatPet :status="catState" :feeding="feedingType" class="center-cat"></CatPet>
        <view class="cat-status-tag" :class="'tag-' + catState">{{ statusLabel }}</view>
      </view>

      <!-- 签到与库存栏 -->
      <view class="checkin-row">
        <view class="checkin-btn" :class="{ 'checked-in': checkedIn }" @click="doCheckin">
          <text class="checkin-icon">{{ checkedIn ? '✅' : '🎁' }}</text>
          <text class="checkin-text">{{ checkedIn ? '已签到' : '每日签到' }}</text>
          <text class="checkin-streak" v-if="checkinStreak > 1">连续 {{ checkinStreak }} 天</text>
        </view>
        <view class="inventory-bar">
          <view class="inv-item" @click="doFeed('fish')">
            <text class="inv-icon">🐟</text>
            <text class="inv-count">{{ inventory.fish }}</text>
          </view>
          <view class="inv-item" @click="doFeed('milk')">
            <text class="inv-icon">🥛</text>
            <text class="inv-count">{{ inventory.milk }}</text>
          </view>
          <view class="inv-item" @click="doFeed('can')">
            <text class="inv-icon">🥫</text>
            <text class="inv-count">{{ inventory.can }}</text>
          </view>
        </view>
      </view>

      <!-- 精力条卡片 -->
      <view class="card energy-card">
        <view class="energy-header">
          <view class="energy-label-row">
            <text class="energy-icon">⚡</text>
            <text class="label">今日精力</text>
          </view>
          <view class="energy-value-row">
            <text class="num">{{ energyUsed }}</text>
            <text class="total">/ 100</text>
          </view>
        </view>
        <view class="energy-track">
          <view class="energy-fill" :style="{ width: (energyUsed / 100 * 100) + '%' }">
            <view class="energy-shine"></view>
          </view>
          <view class="energy-markers">
            <view class="marker" style="left: 25%;"></view>
            <view class="marker" style="left: 50%;"></view>
            <view class="marker" style="left: 75%;"></view>
          </view>
        </view>
        <view class="energy-tip">{{ energyTipText }}</view>
      </view>

      <!-- 计划列表 -->
      <view class="plan-section">
        <view class="section-header">
          <text class="section-title">📋 今日计划</text>
          <text class="section-count" v-if="todayPlans.length > 0">{{ completedCount }}/{{ todayPlans.length }} 项</text>
        </view>

        <view v-if="todayPlans.length > 0" class="plan-list">
          <view
            v-for="(plan, index) in todayPlans"
            :key="plan.id"
            class="plan-item"
            :class="{ 'plan-done': plan.done }"
          >
            <view class="plan-left">
              <view class="plan-check" :class="{ checked: plan.done }" @click="donePlan(index)">
                <text v-if="plan.done">✓</text>
              </view>
              <view class="plan-info">
                <text class="plan-name">{{ plan.name }}</text>
                <view class="plan-energy-tag">
                  <text class="energy-dot" :style="{ background: getPlanColor(plan.energy) }"></text>
                  <text>精力 {{ plan.energy }}%</text>
                </view>
              </view>
            </view>
            <view class="plan-right">
              <view class="plan-energy-ring" :style="{ '--fill': plan.energy / 40 }">
                <text class="ring-text">{{ plan.energy }}</text>
              </view>
              <text class="action-del" @click="deletePlan(index)">✕</text>
            </view>
          </view>
        </view>
        <view v-else class="empty-state">
          <view class="empty-illustration">🐱</view>
          <text class="empty-title">今天还没有计划哦</text>
          <text class="empty-desc">点击下方按钮，开始充实的一天吧！</text>
        </view>
      </view>

      <!-- 底部添加按钮 -->
      <view class="bottom-btn-area">
        <button class="add-btn" @click="showAddPlanModal">
          <text class="add-icon">+</text>
          <text>添加今日计划</text>
        </button>
      </view>

      <!-- 添加计划弹窗 -->
      <view class="custom-modal" v-if="showModal || modalClosing" :class="{ 'overlay-enter': showModal && !modalClosing, 'overlay-leave': modalClosing }" @click.self="closeModal">
        <view class="modal-mask" :class="{ 'mask-enter': showModal && !modalClosing, 'mask-leave': modalClosing }" @click="closeModal"></view>
        <view class="modal-content" :class="{ 'modal-enter': showModal && !modalClosing, 'modal-leave': modalClosing }">
          <view class="modal-handle"></view>
          <text class="modal-title">📝 添加学习计划</text>

          <!-- 模式切换 -->
          <view class="add-mode-tabs">
            <view class="add-mode-tab" :class="{ active: addMode === 'pool' }" @click="addMode = 'pool'">
              <text>🗂️ 从学习池选</text>
            </view>
            <view class="add-mode-tab" :class="{ active: addMode === 'custom' }" @click="addMode = 'custom'">
              <text>✏️ 自定义</text>
            </view>
          </view>

          <!-- 从学习池选择 -->
          <view v-if="addMode === 'pool'" class="pool-select-area">
            <view v-if="poolCategories.length === 0" class="pool-empty-tip">
              <text>📭 学习池还没有计划</text>
              <text class="pool-empty-sub">先去"计划"页面创建学习方向吧~</text>
            </view>
            <view v-for="(cat, ci) in poolCategories" :key="cat.id" class="pool-select-cat">
              <view class="pool-select-cat-head">
                <text class="psc-icon">{{ cat.icon || '📂' }}</text>
                <text class="psc-name">{{ cat.name }}</text>
                <text class="psc-count">{{ (cat.plans || []).length }} 项</text>
              </view>
              <view class="psc-plans">
                <view v-for="(p, pi) in cat.plans" :key="p.id" class="psc-plan-item">
                  <text class="psc-plan-name">📄 {{ p.name }}</text>
                  <text class="psc-add-btn" @click="pickFromPool(cat, p, ci, pi)">+ 添加</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 自定义模式 -->
          <view v-if="addMode === 'custom'">
            <view class="modal-input-wrap">
              <text class="input-icon">🎯</text>
              <input class="modal-input" v-model="newPlanName" placeholder="请输入计划名称（如：背单词）" />
            </view>
            <view class="modal-slider-area">
              <view class="slider-header">
                <text>⚡ 精力消耗</text>
                <text class="slider-val">{{ newPlanEnergy }}%</text>
              </view>
              <slider
                class="modal-slider"
                :min="1"
                :max="40"
                :value="newPlanEnergy"
                @change="onPlanSliderChange"
                show-value
                block-size="28"
                activeColor="#62c7b2"
                backgroundColor="#e0edef"
              />
              <view class="slider-labels">
                <text>轻微 (1%)</text>
                <text>适中</text>
                <text>繁重 (40%)</text>
              </view>
            </view>
            <view class="modal-btns">
              <text class="modal-btn cancel" @click="closeModal">取消</text>
              <text class="modal-btn confirm" @click="confirmAddPlan">确认添加</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import CatPet from '@/components/CatPet/CatPet.vue';
import { getData, setData, dailyCheckin, getCheckinStatus, feedCat } from '@/utils/storage.js';

export default {
  components: { CatPet },
  data() {
    return {
      todayPlans: [],
      energyUsed: 0,
      catState: 'happy',
      dayNum: 0,
      dayText: '',
      showModal: false,
      modalClosing: false,
      newPlanName: '',
      newPlanEnergy: 15,
      bubbleText: '舔舔爪子~',
      // 签到与库存
      checkedIn: false,
      checkinStreak: 0,
      inventory: { fish: 0, milk: 0, can: 0 },
      feedAnimating: false,
      feedingType: null,
      poolCategories: [],
      addMode: 'pool',
    }
  },
  computed: {
    completedCount() {
      return this.todayPlans.filter(p => p.done).length;
    },
    greetingText() {
      const hour = new Date().getHours();
      if (hour < 6) return '夜深了 🌙';
      if (hour < 9) return '早上好 ☀️';
      if (hour < 12) return '上午好 🌤️';
      if (hour < 14) return '中午好 ☀️';
      if (hour < 18) return '下午好 🌈';
      if (hour < 21) return '傍晚好 🌅';
      return '晚上好 🌙';
    },
    statusLabel() {
      const labels = {
        play: '🎾 精力充沛，来玩吧！',
        excited: '🤩 精力爆表啦！',
        happy: '😺 状态不错~',
        sit: '🐱 悠闲坐着...',
        tired: '😿 有点累了...',
        sleepy: '😴 困了，该休息了'
      };
      return labels[this.catState] || '悠闲';
    },
    energyTipText() {
      const ratio = this.energyUsed / 100;
      if (ratio === 0) return '还没有消耗精力，快来添加计划吧 ✨';
      if (ratio <= 0.3) return '精力充沛，可以继续添加计划 💪';
      if (ratio <= 0.6) return '按计划进行中，保持节奏 🎯';
      if (ratio <= 0.85) return '精力消耗较多，注意休息哦 🍵';
      return '精力即将耗尽，该歇歇了 😴';
    }
  },
  onShow() {
    this.updateDateInfo();
    this.loadData();
  },
  methods: {
    updateDateInfo() {
      const d = new Date();
      this.dayNum = d.getDate();
      const weeks = ['周日','周一','周二','周三','周四','周五','周六'];
      this.dayText = `${d.getMonth() + 1}月 · ${weeks[d.getDay()]}`;
    },
    loadData() {
      const data = getData();
      this.todayPlans = data.todayPlans || [];
      this.energyUsed = this.todayPlans.reduce((sum, p) => sum + p.energy, 0);
      this.updateCat();

      // 签到与库存
      const status = getCheckinStatus();
      this.checkedIn = status.checkedIn;
      this.checkinStreak = status.streak;
      this.inventory = status.inventory;
      this.poolCategories = data.poolCategories || [];

      const todayStr = new Date().getFullYear() + '-' +
        String(new Date().getMonth()+1).padStart(2,'0') + '-' +
        String(new Date().getDate()).padStart(2,'0');

      // 合并 history：保留 donePlan() 已记录的计划，不被 todayPlans 覆盖
      if (!data.history) data.history = [];
      const existingRecord = data.history.find(h => h.date === todayStr);
      const existingPlans = existingRecord ? (existingRecord.plans || []) : [];
      const existingIds = new Set(existingPlans.map(p => p.id));
      // todayPlans 中已 done 但尚未记录进 history 的（兜底）
      const doneToday = (this.todayPlans || []).filter(p => p && p.done);
      const missing = doneToday.filter(p => !existingIds.has(p.id)).map(p => Object.assign({}, p, { done: true }));
      const merged = [...existingPlans, ...missing];
      data.history = data.history.filter(h => h.date !== todayStr);
      data.history.push({
        date: todayStr,
        plans: merged,
        energyUsed: merged.reduce((sum, p) => sum + Number(p.energy || 0), 0)
      });
      setData(data);
    },
    updateCat() {
      const ratio = this.energyUsed / 100;
      if (ratio <= 0.15) this.catState = 'excited';
      else if (ratio <= 0.3) this.catState = 'play';
      else if (ratio <= 0.5) this.catState = 'happy';
      else if (ratio <= 0.7) this.catState = 'sit';
      else if (ratio <= 0.85) this.catState = 'tired';
      else this.catState = 'sleepy';
    },
    changeBubbleText() {
      const messages = [
        '舔舔爪子~', '摸摸头~ 加油！💪', '继续努力哦！',
        '今天状态不错嘛！🌟', '累了就休息一下吧 ☕', '喵~ 你猜我在想什么？',
        '要去玩球吗？🎾', '主人最棒了！👑', '一起加油吧！🔥',
        '认真学习，天天向上！📖', '喵呜~ 好开心！💕', '坚持就是胜利！🏆'
      ];
      let newText = this.bubbleText;
      while (newText === this.bubbleText) {
        newText = messages[Math.floor(Math.random() * messages.length)];
      }
      this.bubbleText = newText;
    },
    // ===== 签到 =====
    doCheckin() {
      if (this.checkedIn) {
        uni.showToast({ title: '今天已经签到过啦~ 🐱', icon: 'none' });
        return;
      }
      const result = dailyCheckin();
      if (result.success) {
        this.checkedIn = true;
        this.checkinStreak = result.streak;
        this.inventory = result.inventory;
        uni.showModal({
          title: '🎉 ' + result.message,
          content: '已连续坚持 ' + result.streak + ' 天！\n🐟 小鱼干: ' + result.inventory.fish + '\n🥛 牛奶: ' + result.inventory.milk + '\n🥫 猫罐头: ' + result.inventory.can,
          showCancel: false,
          confirmText: '太棒了！'
        });
        // 签到后猫咪开心一下
        this.catState = 'excited';
        this.bubbleText = '喵呜~ 谢谢主人！🎁';
        setTimeout(() => { this.updateCat(); }, 2000);
      }
    },
    // ===== 喂猫 =====
    doFeed(type) {
      if (this.feedingType) return; // 正在喂食中，防止连点
      const result = feedCat(type);
      if (result.success) {
        this.inventory = result.inventory;
        this.feedingType = type;
        this.bubbleText = '好吃好吃！😋';
        uni.showToast({ title: result.message, icon: 'success' });
        // 播放完整喂食 GIF（约 5 秒）
        setTimeout(() => {
          this.feedingType = null;
          this.updateCat();
          this.changeBubbleText();
        }, 5000);
      } else {
        uni.showToast({ title: result.message, icon: 'none' });
      }
    },
    showAddPlanModal() {
      this.newPlanName = '';
      this.newPlanEnergy = 15;
      this.addMode = this.poolCategories.length > 0 ? 'pool' : 'custom';
      this.showModal = true;
      this.modalClosing = false;
    },
    closeModal() {
      this.modalClosing = true;
      setTimeout(() => {
        this.showModal = false;
        this.modalClosing = false;
      }, 280);
    },
    // 从学习池挑选计划
    pickFromPool(cat, plan, catIndex, planIndex) {
      const data = getData();
      const currentEnergy = (data.todayPlans || []).reduce((s, p) => s + Number(p.energy || 0), 0);
      const remaining = 100 - currentEnergy;
      if (remaining <= 0) return uni.showToast({ title: '今日精力已满(上限100)', icon: 'none' });

      const maxEnergy = Math.min(remaining, 40);
      uni.showModal({
        title: '⚡ ' + plan.name,
        editable: true,
        content: String(Math.min(15, maxEnergy)),
        placeholderText: '精力 1-' + maxEnergy,
        success: (res) => {
          if (!res.confirm) return;
          const energy = Number(String(res.content || '').trim());
          if (!Number.isInteger(energy) || energy < 1 || energy > maxEnergy) {
            uni.showToast({ title: '请输入 1-' + maxEnergy + ' 的整数', icon: 'none' });
            return;
          }
          // 记录来源，以便删掉时回到学习池
          data.todayPlans.push({
            id: Date.now() + '_' + Math.random().toString(36),
            name: plan.name,
            energy: energy,
            done: false,
            focusMin: 25,
            poolSource: { categoryId: cat.id }
          });
          // 从学习池中删除
          const poolCat = data.poolCategories.find(c => c.id === cat.id);
          if (poolCat) {
            poolCat.plans = (poolCat.plans || []).filter(p => p.id !== plan.id);
          }
          setData(data);
          this.loadData();
          uni.showToast({ title: '📌 已添加「' + plan.name + '」', icon: 'success' });
        }
      });
    },
    onPlanSliderChange(e) {
      this.newPlanEnergy = e.detail.value;
    },
    confirmAddPlan() {
      if (!this.newPlanName.trim()) return uni.showToast({ title: '请输入计划名称', icon: 'none' });
      if (this.energyUsed + this.newPlanEnergy > 100) return uni.showToast({ title: '精力已满(上限100)', icon: 'none' });
      const data = getData();
      data.todayPlans.push({
        id: Date.now() + '_' + Math.random().toString(36),
        name: this.newPlanName.trim(),
        energy: this.newPlanEnergy,
        done: false,
        focusMin: 25
      });
      setData(data);
      this.closeModal();
      this.loadData();
      uni.showToast({ title: '✅ 计划已添加', icon: 'success' });
    },
    deletePlan(index) {
      const data = getData();
      const plan = data.todayPlans[index];
      const isFromPool = plan && plan.poolSource;
      const isDone = plan && plan.done;
      // 已完成的任务直接删除不回到学习池；未完成且来自学习池的才回去
      const willReturnPool = isFromPool && !isDone;
      const confirmText = willReturnPool
        ? '删除后「' + plan.name + '」将回到学习池，确定吗？'
        : '确定要删除这个计划吗？';
      uni.showModal({
        title: '删除计划',
        content: confirmText,
        success: (res) => {
          if (res.confirm) {
            const latestData = getData();
            const target = latestData.todayPlans[index];
            if (willReturnPool && target && target.poolSource && target.poolSource.categoryId) {
              // 回到学习池
              const cat = (latestData.poolCategories || []).find(c => c.id === target.poolSource.categoryId);
              if (cat) {
                if (!cat.plans) cat.plans = [];
                cat.plans.push({ id: Date.now() + '_' + Math.random().toString(36), name: target.name });
              }
            }
            latestData.todayPlans.splice(index, 1);
            setData(latestData);
            this.loadData();
            uni.showToast({ title: willReturnPool ? '📂 已移回学习池' : '🗑 已删除', icon: 'success' });
          }
        }
      });
    },
    donePlan(index) {
      const data = getData();
      const plan = data.todayPlans[index];
      if (!plan) return;
      const now = new Date();
      const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      if (!data.checkins) data.checkins = [];
      if (!data.checkins.includes(today)) data.checkins.push(today);
      if (!data.history) data.history = [];
      let record = data.history.find(h => h.date === today);
      if (!record) { record = { date: today, plans: [], energyUsed: 0 }; data.history.push(record); }
      if (!Array.isArray(record.plans)) record.plans = [];
      if (!record.plans.some(p => p.id === plan.id)) {
        record.plans.push(Object.assign({}, plan, { done: true }));
        record.energyUsed = record.plans.reduce((sum, p) => sum + Number(p.energy || 0), 0);
      }
      data.todayPlans[index].done = true;
      setData(data);
      this.loadData();
      uni.showToast({ title: '🎉 打卡成功！', icon: 'success' });
    },
    getPlanColor(energy) {
      const ratio = energy / 40;
      if (ratio <= 0.3) return '#62c7b2';
      if (ratio <= 0.55) return '#ffd166';
      if (ratio <= 0.8) return '#ff8c5a';
      return '#e9828c';
    }
  }
}
</script>

<style scoped>
/* ====== 核心布局 ====== */
.page-wrapper { max-width: 480px; margin: 0 auto; }
.page-container {
  padding-bottom: 200rpx;
  background: linear-gradient(180deg, #e8f8f4 0%, #f7fbfc 15%, #f7fbfc 100%);
  min-height: 100vh;
}

/* ====== 顶部日期区域 ====== */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 50rpx 30rpx 20rpx;
}
.date-badge {
  background: #fff;
  border-radius: 20rpx;
  padding: 16rpx 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(98, 199, 178, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100rpx;
}
.day-num {
  font-size: 52rpx;
  font-weight: 800;
  color: #62c7b2;
  line-height: 1;
}
.day-text {
  font-size: 22rpx;
  color: #8aa5ab;
  margin-top: 4rpx;
}
.greeting-area {
  text-align: right;
}
.greeting-text {
  font-size: 26rpx;
  color: #8aa5ab;
  display: block;
}
.page-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1a3a42;
  display: block;
  margin-top: 4rpx;
}

/* ====== 猫咪区域 ====== */
.cat-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10rpx 0 20rpx;
  position: relative;
}
.cat-decoration-ring {
  position: absolute;
  width: 300rpx;
  height: 300rpx;
  border-radius: 50%;
  border: 3rpx dashed rgba(98, 199, 178, 0.2);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: ring-rotate 20s linear infinite;
}
@keyframes ring-rotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.bubble-area { cursor: pointer; z-index: 2; margin-bottom: 6rpx; }
.bubble {
  background: #fff;
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
  border: 2rpx solid rgba(98, 199, 178, 0.25);
  color: #5a7d85;
  font-size: 26rpx;
  box-shadow: 0 4rpx 16rpx rgba(98, 199, 178, 0.08);
  position: relative;
  display: flex;
  align-items: center;
  gap: 8rpx;
  transition: all 0.2s ease;
}
.bubble:active {
  transform: scale(0.95);
  border-color: rgba(98, 199, 178, 0.5);
}
.bubble::after {
  content: '';
  position: absolute;
  bottom: -12rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10rpx solid transparent;
  border-right: 10rpx solid transparent;
  border-top: 14rpx solid #fff;
}
.bubble-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #62c7b2;
  animation: dot-blink 2s ease-in-out infinite;
}
@keyframes dot-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.center-cat { width: 260rpx; height: 260rpx; margin: 6rpx 0; z-index: 1; }

.cat-status-tag {
  padding: 6rpx 24rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  margin-top: 6rpx;
  font-weight: 500;
  background: #e8f8f4;
  color: #62c7b2;
  border: 1rpx solid rgba(98, 199, 178, 0.2);
}
.tag-excited { background: #fff4e8; color: #ff8c5a; border-color: rgba(255, 140, 90, 0.2); }
.tag-play { background: #e8f4ff; color: #6bb6d6; border-color: rgba(107, 182, 214, 0.2); }
.tag-tired, .tag-sleepy { background: #f5f0f5; color: #b496af; border-color: rgba(180, 150, 175, 0.2); }

/* ====== 签到与库存栏 ====== */
.checkin-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 30rpx 24rpx;
  gap: 16rpx;
}
.checkin-btn {
  display: flex;
  align-items: center;
  gap: 10rpx;
  background: linear-gradient(135deg, #fff8e8, #ffe8d0);
  border: 2rpx solid rgba(255, 140, 90, 0.2);
  padding: 16rpx 24rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 140, 90, 0.1);
  transition: all 0.3s ease;
  flex-shrink: 0;
}
.checkin-btn:active { transform: scale(0.95); }
.checkin-btn.checked-in {
  background: linear-gradient(135deg, #e8f8f4, #d4efe8);
  border-color: rgba(98, 199, 178, 0.2);
  box-shadow: 0 4rpx 16rpx rgba(98, 199, 178, 0.1);
}
.checkin-icon { font-size: 32rpx; }
.checkin-text { font-size: 26rpx; font-weight: 600; color: #8a6550; }
.checked-in .checkin-text { color: #4aad98; }
.checkin-streak {
  font-size: 22rpx;
  color: #fff;
  background: #ff8c5a;
  padding: 2rpx 12rpx;
  border-radius: 14rpx;
  font-weight: 600;
}
.checked-in .checkin-streak { background: #62c7b2; }

.inventory-bar {
  display: flex;
  gap: 8rpx;
}
.inv-item {
  display: flex;
  align-items: center;
  gap: 4rpx;
  background: #fff;
  border: 2rpx solid #e8eef0;
  padding: 12rpx 16rpx;
  border-radius: 16rpx;
  transition: all 0.2s ease;
}
.inv-item:active { transform: scale(0.9); border-color: #62c7b2; background: #f9fcfc; }
.inv-icon { font-size: 28rpx; }
.inv-count {
  font-size: 24rpx;
  font-weight: 700;
  color: #1a3a42;
  min-width: 28rpx;
  text-align: center;
}

/* ====== 精力卡片 ====== */
.energy-card {
  position: relative;
  overflow: hidden;
  margin: 0 30rpx 30rpx;
  padding: 28rpx 30rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.04);
  border-top: 4rpx solid #62c7b2;
  animation: card-breathe 5s ease-in-out infinite;
}
.energy-card::after {
  content: '';
  position: absolute;
  top: -30rpx; right: -30rpx;
  width: 100rpx; height: 100rpx;
  border-radius: 50%;
  background: #62c7b2;
  opacity: 0.04;
  pointer-events: none;
}
.energy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.energy-label-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.energy-icon { font-size: 28rpx; }
.energy-label-row .label { font-size: 28rpx; color: #5a7d85; font-weight: 500; }
.energy-value-row .num {
  font-size: 40rpx;
  font-weight: 800;
  color: #62c7b2;
}
.energy-value-row .total {
  font-size: 28rpx;
  color: #a6bdc2;
  font-weight: 500;
}

.energy-track {
  background: #e8f0f1;
  height: 20rpx;
  border-radius: 10rpx;
  overflow: visible;
  position: relative;
  margin-bottom: 8rpx;
}
.energy-fill {
  height: 100%;
  background: linear-gradient(90deg, #62c7b2, #4aad98);
  border-radius: 10rpx;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.energy-shine {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.energy-markers {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.marker {
  position: absolute;
  top: -4rpx;
  width: 2rpx;
  height: 28rpx;
  background: rgba(255, 255, 255, 0.4);
}

.energy-tip {
  font-size: 22rpx;
  color: #a6bdc2;
  text-align: center;
  margin-top: 8rpx;
}

/* ====== 计划列表 ====== */
.plan-section {
  padding: 0 30rpx;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 0 10rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a3a42;
}
.section-count {
  font-size: 24rpx;
  color: #62c7b2;
  font-weight: 500;
  background: #e8f8f4;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.plan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 24rpx 24rpx;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  border: 2rpx solid transparent;
  border-left: 4rpx solid #62c7b2;
  animation: card-breathe 5s ease-in-out infinite;
}
.plan-item:active {
  transform: scale(0.98);
}
.plan-done {
  border-color: rgba(98, 199, 178, 0.3);
  background: #f9fdfc;
}
.plan-done .plan-name {
  color: #a6bdc2;
  text-decoration: line-through;
}

.plan-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
  flex: 1;
}

.plan-check {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 3rpx solid #d0dde0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: transparent;
  transition: all 0.3s ease;
  flex-shrink: 0;
}
.plan-check.checked {
  background: #62c7b2;
  border-color: #62c7b2;
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(98, 199, 178, 0.3);
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.plan-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #1a3a42;
  transition: color 0.3s ease;
}
.plan-energy-tag {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 22rpx;
  color: #8aa5ab;
}
.energy-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  display: inline-block;
}

.plan-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.plan-energy-ring {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: conic-gradient(#62c7b2 calc(var(--fill) * 360deg), #e8f0f1 0deg);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}
.ring-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #1a3a42;
  background: #fff;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-del {
  font-size: 28rpx;
  color: #d0d5d8;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}
.action-del:active {
  background: #fff0f0;
  color: #e9828c;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60rpx 0;
  color: #8aa5ab;
}
.empty-illustration {
  font-size: 80rpx;
  margin-bottom: 16rpx;
  animation: cat-bounce 2s ease-in-out infinite;
}
@keyframes cat-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}
.empty-title {
  font-size: 30rpx;
  color: #5a7d85;
  display: block;
  margin-bottom: 8rpx;
  font-weight: 500;
}
.empty-desc {
  font-size: 26rpx;
  color: #a6bdc2;
}

/* ====== 底部按钮 ====== */
.bottom-btn-area {
  position: fixed;
  bottom: 40rpx;
  left: 0;
  right: 0;
  z-index: 99;
  display: flex;
  justify-content: center;
}
.add-btn {
  background: linear-gradient(135deg, #62c7b2, #4aad98);
  color: #fff;
  border-radius: 60rpx;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 28rpx rgba(98, 199, 178, 0.35);
  border: none;
  padding: 16rpx 0;
  width: 75%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  letter-spacing: 2rpx;
  transition: all 0.3s ease;
}
.add-btn:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 16rpx rgba(98, 199, 178, 0.3);
}
.add-icon {
  font-size: 36rpx;
  font-weight: 300;
  line-height: 1;
}

/* ====== 弹窗 ====== */
.custom-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.custom-modal.overlay-enter .modal-mask { animation: maskFadeIn 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.custom-modal.overlay-leave .modal-mask { animation: maskFadeOut 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.modal-mask {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.45);
}
.modal-content {
  position: relative;
  background: #fff;
  width: 100%;
  max-width: 480px;
  border-radius: 40rpx 40rpx 0 0;
  padding: 0 40rpx 50rpx;
  z-index: 1000;
}
.modal-content.modal-enter { animation: sheetSlideUp 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.modal-content.modal-leave { animation: sheetSlideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.modal-handle {
  width: 60rpx;
  height: 6rpx;
  background: #d0dde0;
  border-radius: 3rpx;
  margin: 16rpx auto 30rpx;
}
.modal-title {
  font-size: 34rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 24rpx;
  text-align: center;
  color: #1a3a42;
}

/* 模式切换标签 */
.add-mode-tabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
}
.add-mode-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 500;
  color: #8aa5ab;
  background: #f3f6f7;
  transition: all 0.2s ease;
}
.add-mode-tab.active {
  background: linear-gradient(135deg, #e8f8f4, #d4efe8);
  color: #4aad98;
  font-weight: 600;
}

/* 学习池选择区 */
.pool-select-area {
  max-height: 500rpx;
  overflow-y: auto;
  margin-bottom: 20rpx;
}
.pool-empty-tip {
  text-align: center;
  padding: 40rpx 0;
  color: #a6bdc2;
  font-size: 26rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.pool-empty-sub { font-size: 22rpx; }
.pool-select-cat {
  background: #f9fcfc;
  border-radius: 16rpx;
  padding: 16rpx 18rpx;
  margin-bottom: 14rpx;
  border: 1rpx solid #eaf3f4;
}
.pool-select-cat-head {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 10rpx;
  padding-bottom: 10rpx;
  border-bottom: 1rpx solid #eef3f4;
}
.psc-icon { font-size: 28rpx; }
.psc-name { font-size: 26rpx; font-weight: 600; color: #1a3a42; flex: 1; }
.psc-count { font-size: 22rpx; color: #a6bdc2; }
.psc-plans { display: flex; flex-direction: column; gap: 6rpx; }
.psc-plan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 8rpx;
  border-radius: 10rpx;
  transition: background 0.15s;
}
.psc-plan-item:active { background: #e8f8f4; }
.psc-plan-name { font-size: 26rpx; color: #5a7d85; }
.psc-add-btn {
  font-size: 24rpx;
  color: #62c7b2;
  font-weight: 600;
  padding: 6rpx 18rpx;
  border-radius: 14rpx;
  background: #e8f8f4;
  transition: all 0.2s;
}
.psc-add-btn:active { background: #d0ebe5; transform: scale(0.95); }

.modal-input-wrap {
  display: flex;
  align-items: center;
  background: #f7fbfc;
  border: 2rpx solid #e0edef;
  border-radius: 16rpx;
  padding: 0 20rpx;
  margin-bottom: 24rpx;
  transition: border-color 0.2s ease;
}
.modal-input-wrap:focus-within {
  border-color: #62c7b2;
}
.input-icon { font-size: 32rpx; margin-right: 12rpx; }
.modal-input {
  flex: 1;
  padding: 18rpx 0;
  font-size: 28rpx;
  background: transparent;
}

.modal-slider-area {
  margin-bottom: 30rpx;
  background: #f7fbfc;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
}
.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: #5a7d85;
}
.slider-val {
  font-size: 32rpx;
  font-weight: 800;
  color: #62c7b2;
}
.modal-slider {
  margin: 8rpx 0;
}
.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 20rpx;
  color: #a6bdc2;
  margin-top: 4rpx;
}

.modal-btns {
  display: flex;
  gap: 20rpx;
  margin-top: 10rpx;
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
.modal-btn.cancel {
  background: #f3f6f7;
  color: #8aa5ab;
}
.modal-btn.confirm {
  background: linear-gradient(135deg, #62c7b2, #4aad98);
  color: #fff;
  box-shadow: 0 6rpx 20rpx rgba(98, 199, 178, 0.3);
}

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
