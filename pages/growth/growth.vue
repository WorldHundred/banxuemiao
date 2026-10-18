<template>
  <view class="page-wrapper">
    <view class="page-container">
      <!-- 顶部总结 -->
      <view class="summary-banner anim-summary">
        <view class="summary-bg"></view>
        <view class="summary-content">
          <text class="summary-icon anim-icon-drop">🌱</text>
          <text class="summary-title anim-fade-in">成长记录</text>
          <text class="summary-desc anim-fade-in-delay">每一份坚持，都值得被看见</text>
        </view>
        <view class="summary-stats">
          <view class="summary-stat anim-stat-1">
            <text class="s-num">{{ totalDays }}</text>
            <text class="s-label">累计天数</text>
          </view>
          <view class="summary-divider"></view>
          <view class="summary-stat anim-stat-2">
            <text class="s-num">{{ totalEnergyAll }}</text>
            <text class="s-label">总精力消耗</text>
          </view>
          <view class="summary-divider"></view>
          <view class="summary-stat anim-stat-3">
            <text class="s-num">{{ totalPlansAll }}</text>
            <text class="s-label">完成计划</text>
          </view>
        </view>
      </view>

      <!-- 历史学习项目 - 每项累计精力 -->
      <view class="card section-card card-green anim-card-1" v-if="planStats.length > 0">
        <view class="card-header">
          <text class="card-title">📋 历史学习项目</text>
          <text class="card-badge">{{ planStats.length }} 项</text>
        </view>
        <view class="plan-stats-list">
          <view v-for="(item, index) in planStats" :key="index" class="plan-stat-item anim-row" :style="{ animationDelay: (index * 0.08) + 's' }">
            <view class="plan-stat-bar-wrap">
              <view class="plan-stat-info">
                <text class="plan-stat-name">{{ item.name }}</text>
                <text class="plan-stat-meta">累计 {{ item.count }} 次 · {{ item.totalEnergy }}% 精力</text>
              </view>
              <view class="plan-stat-track">
                <view
                  class="plan-stat-fill"
                  :style="{ width: item.percent + '%', background: item.color }"
                ></view>
              </view>
            </view>
            <view class="plan-stat-badge" :style="{ color: item.color }">
              <text class="plan-stat-percent">{{ item.totalEnergy }}%</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 学习池板块进度 -->
      <view class="card section-card card-blue anim-card-2" v-if="categoryStats.length > 0">
        <view class="card-header">
          <text class="card-title">🗂️ 学习池板块进度</text>
          <text class="card-badge">{{ categoryStats.length }} 个</text>
        </view>
        <view class="category-stats-list">
          <view v-for="(cat, index) in categoryStats" :key="index" class="category-stat-item anim-row" :style="{ animationDelay: (index * 0.08) + 's' }">
            <view class="category-stat-top">
              <view class="category-stat-icon-wrap">
                <text>{{ cat.icon || '📂' }}</text>
              </view>
              <view class="category-stat-info">
                <text class="category-stat-name">{{ cat.name }}</text>
                <text class="category-stat-meta">{{ cat.doneCount }}/{{ cat.totalCount }} 个计划完成</text>
              </view>
              <text class="category-stat-pct">{{ cat.percent }}%</text>
            </view>
            <view class="category-stat-track">
              <view class="category-stat-fill" :style="{ width: cat.percent + '%' }"></view>
            </view>
            <!-- 展开查看板块内的计划 -->
            <view v-if="cat.plans.length > 0" class="category-plan-detail">
              <view v-for="(p, pi) in cat.plans" :key="pi" class="cat-plan-row">
                <text class="cat-plan-name">{{ p.name }}</text>
                <view class="cat-plan-right">
                  <text class="cat-plan-energy" v-if="p.totalEnergy > 0">⚡ {{ p.totalEnergy }}%</text>
                  <text class="cat-plan-done" :class="{ yes: p.doneCount > 0 }">{{ p.doneCount > 0 ? '✓ ' + p.doneCount + '次' : '未完成' }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 学习日历时间线 -->
      <view class="card section-card card-orange anim-card-3" v-if="historyList.length > 0">
        <view class="card-header">
          <text class="card-title">📅 学习时间线</text>
          <text class="card-badge">{{ historyList.length }} 天</text>
        </view>
        <view class="timeline-list">
          <view v-for="(day, index) in historyList" :key="index" class="timeline-item anim-row" :style="{ animationDelay: (index * 0.06) + 's' }">
            <view class="timeline-dot" :class="{ 'dot-active': day.energyUsed > 0 }"></view>
            <view class="timeline-line" v-if="index < historyList.length - 1"></view>
            <view class="timeline-content">
              <view class="timeline-header">
                <text class="timeline-date">{{ formatDate(day.date) }}</text>
                <text class="timeline-energy">⚡ {{ day.energyUsed }}%</text>
              </view>
              <view class="timeline-plans" v-if="day.plans && day.plans.length > 0">
                <text
                  v-for="(p, pi) in day.plans"
                  :key="pi"
                  class="timeline-plan-tag"
                >{{ p.name }}</text>
              </view>
              <text v-else class="timeline-empty">暂无记录</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="planStats.length === 0 && categoryStats.length === 0" class="empty-all anim-fade-in">
        <text class="empty-icon">📭</text>
        <text class="empty-title">还没有学习记录</text>
        <text class="empty-desc">去打卡页面添加并完成今日计划吧~</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getData } from '@/utils/storage.js';

export default {
  data() {
    return {
      totalDays: 0,
      totalEnergyAll: 0,
      totalPlansAll: 0,
      planStats: [],
      categoryStats: [],
      historyList: []
    };
  },
  onShow() {
    this.loadGrowthData();
  },
  methods: {
    loadGrowthData() {
      const data = getData();
      const history = data.history || [];
      const poolCategories = data.poolCategories || [];

      this.totalDays = history.length;
      this.historyList = [...history].reverse(); // 最新在前

      // === 按计划名称聚合历史数据 ===
      const planMap = {};
      let allDoneCount = 0;
      let allEnergySum = 0;

      history.forEach(day => {
        const plans = day.plans || [];
        plans.forEach(p => {
          if (!p || !p.done) return;
          const key = p.name;
          if (!planMap[key]) {
            planMap[key] = { name: key, totalEnergy: 0, count: 0 };
          }
          planMap[key].totalEnergy += Number(p.energy || 0);
          planMap[key].count += 1;
          allDoneCount++;
          allEnergySum += Number(p.energy || 0);
        });
      });

      this.totalPlansAll = allDoneCount;
      this.totalEnergyAll = allEnergySum;

      // 排序并计算百分比
      const planList = Object.values(planMap).sort((a, b) => b.totalEnergy - a.totalEnergy);
      const maxEnergy = planList.length > 0 ? Math.max(...planList.map(p => p.totalEnergy)) : 1;
      const colors = ['#66c9a8', '#5daed6', '#f0b940', '#e8787c', '#9b8ac7', '#f09060'];
      this.planStats = planList.map((p, i) => ({
        ...p,
        percent: Math.round((p.totalEnergy / maxEnergy) * 100),
        color: colors[i % colors.length]
      }));

      // === 学习池板块进度 ===
      const catStats = poolCategories.map(cat => {
        const catPlans = (cat.plans || []).map(p => {
          // 检查这个计划在历史中的完成情况
          let doneCount = 0;
          let energySum = 0;
          history.forEach(day => {
            (day.plans || []).forEach(hp => {
              if (hp && hp.done && hp.name === p.name) {
                doneCount++;
                energySum += Number(hp.energy || 0);
              }
            });
          });
          return { name: p.name, doneCount, totalEnergy: energySum };
        });

        const doneCount = catPlans.filter(p => p.doneCount > 0).length;
        const totalCount = catPlans.length;
        const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

        return {
          icon: cat.icon || '📂',
          name: cat.name,
          totalCount,
          doneCount,
          percent,
          plans: catPlans
        };
      });

      // 只显示有计划的板块
      this.categoryStats = catStats.filter(c => c.totalCount > 0);
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return parts[1] + '月' + parts[2] + '日 · ' + weeks[d.getDay()];
    }
  }
};
</script>

<style scoped>
.page-wrapper { max-width: 480px; margin: 0 auto; }
.page-container {
  background: #f7fbfc;
  min-height: 100vh;
  padding-bottom: 80rpx;
}

/* ====== 顶部总结横幅 ====== */
.summary-banner {
  position: relative;
  overflow: hidden;
  margin-bottom: 24rpx;
}
.summary-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(160deg, #e8f8f4 0%, #d5efe6 40%, #c8e8f0 100%);
}
.summary-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 44rpx 30rpx 20rpx;
}
.summary-icon { font-size: 56rpx; margin-bottom: 8rpx; }
.summary-title { font-size: 36rpx; font-weight: 700; color: #2d5a4e; }
.summary-desc { font-size: 24rpx; color: #5a8d7c; margin-top: 4rpx; }

.summary-stats {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 30rpx 30rpx;
  gap: 0;
}
.summary-stat { flex: 1; text-align: center; }
.summary-divider { width: 2rpx; height: 48rpx; background: rgba(45, 90, 78, 0.12); }
.s-num { font-size: 44rpx; font-weight: 800; color: #2d5a4e; display: block; }
.s-label { font-size: 22rpx; color: #5a8d7c; margin-top: 4rpx; display: block; }

/* ====== 卡片公共 ====== */
.card {
  position: relative;
  overflow: hidden;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin: 0 30rpx 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.03);
  animation: card-breathe 5s ease-in-out infinite;
}
.card-green  { border-top: 4rpx solid #62c7b2; }
.card-blue   { border-top: 4rpx solid #5daed6; }
.card-orange { border-top: 4rpx solid #f0b940; }

/* 卡片背景装饰圆 */
.card::after {
  content: '';
  position: absolute;
  top: -36rpx;
  right: -36rpx;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  opacity: 0.05;
  pointer-events: none;
}
.card-green::after  { background: #62c7b2; }
.card-blue::after   { background: #5daed6; }
.card-orange::after { background: #f0b940; }
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.card-title { font-size: 30rpx; font-weight: 600; color: #1a3a42; }
.card-badge {
  font-size: 22rpx;
  color: #62c7b2;
  background: #e8f8f4;
  padding: 4rpx 14rpx;
  border-radius: 14rpx;
  font-weight: 500;
}

/* ====== 历史学习项目 ====== */
.plan-stats-list { display: flex; flex-direction: column; gap: 20rpx; }
.plan-stat-item { display: flex; align-items: center; gap: 16rpx; }
.plan-stat-bar-wrap { flex: 1; }
.plan-stat-info { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8rpx; }
.plan-stat-name { font-size: 28rpx; font-weight: 600; color: #1a3a42; }
.plan-stat-meta { font-size: 22rpx; color: #a6bdc2; }
.plan-stat-track {
  height: 10rpx;
  background: #eef2f3;
  border-radius: 5rpx;
  overflow: hidden;
}
.plan-stat-fill {
  height: 100%;
  border-radius: 5rpx;
  transition: width 0.6s ease;
  min-width: 4rpx;
}
.plan-stat-badge { flex-shrink: 0; }
.plan-stat-percent { font-size: 26rpx; font-weight: 700; }

/* ====== 学习池板块进度 ====== */
.category-stats-list { display: flex; flex-direction: column; gap: 24rpx; }
.category-stat-item {
  background: #f9fcfc;
  border-radius: 16rpx;
  padding: 20rpx;
}
.category-stat-top {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 12rpx;
}
.category-stat-icon-wrap {
  width: 52rpx; height: 52rpx;
  border-radius: 14rpx;
  background: linear-gradient(135deg, #e8f8f4, #d4efe8);
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx;
}
.category-stat-info { flex: 1; }
.category-stat-name { font-size: 28rpx; font-weight: 600; color: #1a3a42; display: block; }
.category-stat-meta { font-size: 22rpx; color: #8aa5ab; }
.category-stat-pct { font-size: 28rpx; font-weight: 700; color: #62c7b2; }
.category-stat-track {
  height: 12rpx;
  background: #e8f0f1;
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: 14rpx;
}
.category-stat-fill {
  height: 100%;
  background: linear-gradient(90deg, #62c7b2, #4aad98);
  border-radius: 6rpx;
  transition: width 0.6s ease;
}

/* 板块内计划明细 */
.category-plan-detail {
  border-top: 1rpx solid #eef3f4;
  padding-top: 12rpx;
}
.cat-plan-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10rpx 6rpx;
}
.cat-plan-name { font-size: 24rpx; color: #5a7d85; }
.cat-plan-right { display: flex; gap: 16rpx; align-items: center; }
.cat-plan-energy { font-size: 22rpx; color: #a6bdc2; }
.cat-plan-done { font-size: 22rpx; color: #a6bdc2; }
.cat-plan-done.yes { color: #62c7b2; font-weight: 500; }

/* ====== 时间线 ====== */
.timeline-list { position: relative; }
.timeline-item { display: flex; gap: 20rpx; position: relative; padding-bottom: 8rpx; }
.timeline-dot {
  width: 18rpx; height: 18rpx;
  border-radius: 50%;
  background: #d8e2e5;
  flex-shrink: 0;
  margin-top: 4rpx;
  position: relative;
  z-index: 1;
  border: 3rpx solid #fff;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.06);
}
.timeline-dot.dot-active { background: #62c7b2; }
.timeline-line {
  position: absolute;
  left: 7rpx; top: 24rpx;
  width: 2rpx; bottom: 0;
  background: #e8eef0;
}
.timeline-content {
  flex: 1;
  padding-bottom: 24rpx;
}
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.timeline-date { font-size: 26rpx; font-weight: 600; color: #1a3a42; }
.timeline-energy { font-size: 24rpx; color: #62c7b2; font-weight: 500; }
.timeline-plans { display: flex; flex-wrap: wrap; gap: 8rpx; }
.timeline-plan-tag {
  font-size: 22rpx;
  color: #5a7d85;
  background: #eef3f4;
  padding: 4rpx 14rpx;
  border-radius: 12rpx;
}
.timeline-empty { font-size: 24rpx; color: #a6bdc2; }

/* ====== 空状态 ====== */
.empty-all { text-align: center; padding: 120rpx 40rpx; }
.empty-icon { font-size: 80rpx; display: block; margin-bottom: 16rpx; }
.empty-title { font-size: 30rpx; color: #5a7d85; display: block; margin-bottom: 8rpx; font-weight: 500; }
.empty-desc { font-size: 26rpx; color: #a6bdc2; }

/* ====== 入场动画（元素挂载即触发，both 模式保证从隐藏态开始） ====== */

/* 图标掉落弹入 */
.anim-icon-drop {
  animation: growthIconDrop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
/* 标题淡入 */
.anim-fade-in {
  animation: growthFadeIn 0.5s ease 0.15s both;
}
.anim-fade-in-delay {
  animation: growthFadeIn 0.5s ease 0.25s both;
}

/* 统计数字逐个弹入 */
.anim-stat-1 { animation: growthStatPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both; }
.anim-stat-2 { animation: growthStatPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both; }
.anim-stat-3 { animation: growthStatPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both; }

/* 卡片逐个滑入（入场后接续呼吸动画），覆盖 .card 自身的 card-breathe */
.anim-card-1 { animation: growthSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both, card-breathe 5s ease-in-out 1s infinite; }
.anim-card-2 { animation: growthSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.55s both, card-breathe 5s ease-in-out 1.2s infinite; }
.anim-card-3 { animation: growthSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.7s both, card-breathe 5s ease-in-out 1.3s infinite; }

/* 列表行逐行淡入上移（animationDelay 由行内 style 控制） */
.anim-row {
  animation: growthFadeUp 0.4s ease both;
}

@keyframes growthIconDrop {
  from { opacity: 0; transform: scale(0) translateY(-40rpx); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes growthFadeIn {
  from { opacity: 0; transform: translateY(8rpx); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes growthStatPop {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes growthSlideUp {
  from { opacity: 0; transform: translateY(40rpx); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes growthFadeUp {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
