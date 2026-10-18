<template>
  <view class="page-wrapper">
    <view class="page-container">
      <!-- ====== 顶部栏 ====== -->
      <view class="focus-header">
        <view class="focus-header-left">
          <text class="focus-title">🧘 专注</text>
          <text class="focus-subtitle">{{ encourageText }}</text>
        </view>
        <view class="focus-header-right">
          <view class="header-icon-btn" @click="openStatsPanel" :class="{ 'btn-active': showStatsPanel }">
            <text class="header-icon">{{ showStatsPanel ? '✕' : '⋮' }}</text>
          </view>
          <view class="header-icon-btn chart-btn" @click="openChartModal" :class="{ 'btn-active': showChartModal }">
            <text class="header-icon">📊</text>
          </view>
        </view>
      </view>

      <!-- ====== 番茄钟板块 ====== -->
      <view class="card pomodoro-card">
        <view class="pomodoro-inner">
          <view class="pomo-ring" :class="{ running: globalTimer.running, paused: globalTimer.paused }">
            <view class="pomo-ring-inner">
              <text class="pomo-time">{{ formatTime(globalTimer.seconds) }}</text>
              <text class="pomo-state">{{ globalTimer.running ? '专注中...' : globalTimer.paused ? '已暂停' : '准备开始' }}</text>
              <text class="pomo-task-name" v-if="globalTimer.taskName">{{ globalTimer.taskName }}</text>
            </view>
          </view>
          <view class="pomo-label-row">
            <text class="pomo-icon">🍅</text>
            <text class="pomo-title">番茄钟</text>
          </view>
          <view class="pomo-controls">
            <text class="pomo-ctrl-btn" v-if="!globalTimer.running && !globalTimer.paused" @click="startGlobalTimer(25)">25 分钟</text>
            <text class="pomo-ctrl-btn" v-if="!globalTimer.running && !globalTimer.paused" @click="startGlobalTimer(45)">45 分钟</text>
            <text class="pomo-ctrl-btn pause" v-if="globalTimer.running" @click="pauseGlobalTimer">⏸ 暂停</text>
            <text class="pomo-ctrl-btn resume" v-if="globalTimer.paused" @click="resumeGlobalTimer">▶ 继续</text>
            <text class="pomo-ctrl-btn reset" v-if="globalTimer.running || globalTimer.paused" @click="resetGlobalTimer">↺ 重置</text>
          </view>
        </view>
      </view>

      <!-- ====== 任务列表标题 ====== -->
      <view class="task-section-header">
        <view class="task-section-left">
          <text class="task-section-title">📋 任务列表</text>
          <text class="task-section-sub">点击开始，逐项专注</text>
        </view>
        <view class="task-section-right">
          <view class="todo-badge">
            <text class="todo-num">{{ todoCount }}</text>
            <text class="todo-label">待办</text>
          </view>
        </view>
      </view>

      <!-- ====== 任务项（点击后由顶部番茄钟计时） ====== -->
      <view class="task-list" v-if="todayPlans.length > 0">
        <view
          v-for="(plan, index) in todayPlans"
          :key="plan.id"
          class="task-item"
          :class="{
            'task-active': activeTaskIndex === index && globalTimer.running,
            'task-done': plan.done
          }"
        >
          <view class="task-left">
            <view class="task-focus-badge" :class="{ active: activeTaskIndex === index && (globalTimer.running || globalTimer.paused) }">
              <view class="tf-dot"></view>
            </view>
            <view class="task-info">
              <text class="task-name" :class="{ 'name-done': plan.done }">{{ plan.name }}</text>
              <text class="task-focus-info">已专注 {{ getTaskFocusMinutes(plan.name) }} 分钟</text>
            </view>
          </view>
          <view class="task-right" v-if="!plan.done">
            <view
              v-if="activeTaskIndex === index && globalTimer.running"
              class="task-start-btn icon-only focusing"
              @click="pauseTaskTimer"
            ><text class="tsb-icon">⏸</text></view>
            <view
              v-else-if="activeTaskIndex === index && globalTimer.paused"
              class="task-start-btn icon-only paused"
              @click="resumeTaskTimer"
            ><text class="tsb-icon">▶</text></view>
            <view
              v-else
              class="task-start-btn icon-only"
              @click="startTaskTimer(index)"
            ><text class="tsb-icon">▶</text></view>
            <!-- 任务计时中显示停止按钮 -->
            <view
              v-if="activeTaskIndex === index && (globalTimer.running || globalTimer.paused)"
              class="task-stop-btn"
              @click="stopTaskTimer"
            ><text class="tsb-icon">⏹</text></view>
          </view>
        </view>
      </view>

      <view v-else class="empty-tasks">
        <text class="empty-task-icon">☕</text>
        <text class="empty-task-text">暂无任务，去"打卡"页添加吧</text>
      </view>

      <!-- ====== 底部自由计时 ====== -->
      <view class="free-timer-area">
        <view class="free-timer-btn" @click="startFreeTimer">
          <text class="free-timer-icon">🍅</text>
          <text class="free-timer-text">自由计时</text>
        </view>
        <text class="free-timer-hint">不设限，想专注多久就多久</text>
      </view>

      <!-- ====== 统计面板（竖三点） ====== -->
      <view class="stats-overlay" v-if="showStatsPanel || statsClosing" :class="{ 'overlay-enter': showStatsPanel && !statsClosing, 'overlay-leave': statsClosing }" @click="closeStatsPanel">
        <view class="stats-modal" :class="{ 'modal-enter': showStatsPanel && !statsClosing, 'modal-leave': statsClosing }" @click.stop>
          <view class="stats-modal-header">
            <text class="stats-modal-title">📊 专注统计</text>
            <text class="stats-modal-close" @click="closeStatsPanel">✕</text>
          </view>

          <!-- 四个统计卡片 -->
          <view class="stats-grid">
            <view class="stats-item stats-today-pomo">
              <text class="stats-val">{{ todayStats.pomoCount }}</text>
              <text class="stats-lbl">今日番茄钟</text>
            </view>
            <view class="stats-item stats-today-time">
              <text class="stats-val">{{ formatDuration(todayStats.totalSec) }}</text>
              <text class="stats-lbl">今日专注时长</text>
            </view>
            <view class="stats-item stats-all-pomo">
              <text class="stats-val">{{ allStats.pomoCount }}</text>
              <text class="stats-lbl">总番茄钟</text>
            </view>
            <view class="stats-item stats-all-time">
              <text class="stats-val">{{ formatDuration(allStats.totalSec) }}</text>
              <text class="stats-lbl">总专注时长</text>
            </view>
          </view>

          <!-- 今日任务专注时长环形图 -->
          <view class="stats-chart-block" v-if="focusChartData.length > 0">
            <text class="stats-chart-title">🍩 今日专注分布</text>
            <view class="stats-ring-wrap">
              <canvas canvas-id="focusRingChart" class="focus-ring-canvas"></canvas>
            </view>
            <view class="focus-legend">
              <view v-for="(item, i) in focusChartData" :key="i" class="legend-item">
                <view class="legend-dot" :style="{ background: focusColors[i % focusColors.length] }"></view>
                <text class="legend-name">{{ item.name }}</text>
                <text class="legend-time">{{ formatDuration(item.seconds) }}</text>
              </view>
            </view>
          </view>
          <view v-else class="stats-empty">
            <text>今天还没有专注记录~</text>
          </view>
        </view>
      </view>

      <!-- ====== 图表弹窗 ====== -->
      <view class="chart-overlay" v-if="showChartModal || chartClosing" :class="{ 'overlay-enter': showChartModal && !chartClosing, 'overlay-leave': chartClosing }" @click="closeChartModal">
        <view class="chart-modal" :class="{ 'modal-enter': showChartModal && !chartClosing, 'modal-leave': chartClosing }" @click.stop>
          <view class="chart-modal-header">
            <text class="chart-modal-title">📈 数据统计</text>
            <text class="chart-modal-close" @click="closeChartModal">✕</text>
          </view>
          <view class="chart-block">
            <view class="chart-block-head">
              <text class="chart-block-title">{{ chartTitle }}</text>
              <view class="chart-tabs">
                <text class="chart-tab" :class="{ active: chartMode === 'day' }" @click="switchChart('day')">日</text>
                <text class="chart-tab" :class="{ active: chartMode === 'week' }" @click="switchChart('week')">周</text>
                <text class="chart-tab" :class="{ active: chartMode === 'month' }" @click="switchChart('month')">月</text>
              </view>
            </view>
            <canvas canvas-id="lineChart" class="canvas-box"></canvas>
          </view>
          <view class="chart-block">
            <view class="chart-block-head">
              <text class="chart-block-title">🍩 今日精力分布</text>
            </view>
            <view class="ring-wrap">
              <canvas canvas-id="ringChart" class="canvas-ring"></canvas>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getData, setData } from '@/utils/storage.js';

const FOCUS_COLORS = ['#66c9a8','#5daed6','#f0b940','#e8787c','#9b8ac7','#f09060'];

export default {
  data() {
    return {
      todayPlans: [],
      poolPlanCount: 0,
      globalTimer: { running: false, paused: false, seconds: 0, total: 0, interval: null, taskName: '', mode: 'countdown' },
      activeTaskIndex: null,
      showChartModal: false,
      chartClosing: false,
      chartMode: 'day',
      showStatsPanel: false,
      statsClosing: false,
      focusSessions: [],
      encourageIdx: 0,
      focusColors: FOCUS_COLORS
    };
  },
  computed: {
    encourageText() {
      const msgs = [
        '专注当下，每一分钟都有意义 ✨',
        '慢慢来，比较快 🌱',
        '今天的努力，明天的底气 💪',
        '心无旁骛，方能致远 🧘',
        '沉浸式学习，从这一刻开始 🔥',
        '一份专注，一份收获 🌟'
      ];
      return msgs[this.encourageIdx] || msgs[0];
    },
    todoCount() {
      return this.todayPlans.filter(p => !p.done).length;
    },
    chartTitle() {
      if (this.chartMode === 'day') return '近 7 日精力趋势';
      if (this.chartMode === 'week') return '近 4 周精力趋势';
      return '近 6 月精力趋势';
    },
    todayStats() {
      const today = this.dateKey(new Date());
      const sessions = this.focusSessions.filter(s => s.date === today);
      return {
        pomoCount: sessions.length,
        totalSec: sessions.reduce((s, sess) => s + (sess.duration || 0), 0)
      };
    },
    allStats() {
      return {
        pomoCount: this.focusSessions.length,
        totalSec: this.focusSessions.reduce((s, sess) => s + (sess.duration || 0), 0)
      };
    },
    focusChartData() {
      const today = this.dateKey(new Date());
      const sessions = this.focusSessions.filter(s => s.date === today);
      const map = {};
      sessions.forEach(s => {
        const key = s.taskName || '自由计时';
        if (!map[key]) map[key] = 0;
        map[key] += (s.duration || 0);
      });
      return Object.entries(map).map(([name, seconds]) => ({ name, seconds }));
    }
  },
  watch: {
    showStatsPanel(val) {
      if (val) {
        this.$nextTick(() => {
          setTimeout(() => { this.drawFocusRing(); }, 350);
        });
      }
    },
    showChartModal(val) {
      if (val) {
        this.$nextTick(() => {
          setTimeout(() => {
            this.drawLineChart();
            this.drawRingChart();
          }, 350);
        });
      }
    }
  },
  onShow() {
    this.loadData();
    this.encourageIdx = Math.floor(Math.random() * 6);
  },
  beforeDestroy() {
    this._clearAllTimers();
  },
  methods: {
    loadData() {
      const data = getData();
      this.todayPlans = (data.todayPlans || []).map(p => ({
        ...p,
        focusMin: p.focusMin || 25
      }));
      this.focusSessions = data.focusSessions || [];
    },

    _clearAllTimers() {
      if (this.globalTimer.interval) clearInterval(this.globalTimer.interval);
    },

    // ===== 工具 =====
    formatTime(sec) {
      if (sec == null || isNaN(sec)) sec = 0;
      const m = Math.floor(Math.abs ? Math.abs(sec) / 60 : sec / 60);
      const s = (sec || 0) % 60;
      return String(Math.floor(m)).padStart(2, '0') + ':' + String(Math.abs(s)).padStart(2, '0');
    },
    formatDuration(totalSec) {
      if (!totalSec || totalSec <= 0) return '0 分钟';
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      if (h > 0) return h + ' 小时 ' + m + ' 分';
      return m + ' 分钟';
    },
    formatTaskTime(index) {
      const t = this.taskTimers[index];
      if (t && (t.running || t.paused)) {
        return this.formatTime(t.seconds);
      }
      const plan = this.todayPlans[index];
      return (plan ? (plan.focusMin || 25) : 25) + '\'';
    },
    dateKey(d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    getTaskFocusMinutes(taskName) {
      const today = this.dateKey(new Date());
      const sec = this.focusSessions
        .filter(s => s.date === today && s.taskName === taskName)
        .reduce((s, sess) => s + (sess.duration || 0), 0);
      return Math.floor(sec / 60);
    },

    // ===== 保存专注记录 =====
    saveSession(taskName, duration) {
      const data = getData();
      if (!data.focusSessions) data.focusSessions = [];
      data.focusSessions.push({
        date: this.dateKey(new Date()),
        taskName: taskName,
        duration: duration,
        timestamp: Date.now()
      });
      setData(data);
      this.focusSessions = data.focusSessions;
    },

    // ===== 全局番茄钟（独立使用，倒计时） =====
    startGlobalTimer(minutes) {
      this.activeTaskIndex = null;
      this.globalTimer.seconds = minutes * 60;
      this.globalTimer.total = minutes * 60;
      this.globalTimer.running = true;
      this.globalTimer.paused = false;
      this.globalTimer.taskName = '番茄钟';
      this.globalTimer.mode = 'countdown';
      this._runGlobal();
    },
    _runGlobal() {
      if (this.globalTimer.interval) clearInterval(this.globalTimer.interval);
      this.globalTimer.interval = setInterval(() => {
        if (!this.globalTimer.running) return;
        if (this.globalTimer.mode === 'countdown') {
          this.globalTimer.seconds--;
          if (this.globalTimer.seconds <= 0) {
            this.globalTimer.seconds = 0;
            this.globalTimer.running = false;
            this.globalTimer.paused = false;
            clearInterval(this.globalTimer.interval);
            this.saveSession(this.globalTimer.taskName, this.globalTimer.total);
            this.activeTaskIndex = null;
            uni.showToast({ title: '🍅 专注完成！', icon: 'success' });
          }
        } else {
          // 正计时模式（任务计时 / 自由计时）
          this.globalTimer.seconds++;
        }
      }, 1000);
    },
    pauseGlobalTimer() { this.globalTimer.running = false; this.globalTimer.paused = true; },
    resumeGlobalTimer() { this.globalTimer.running = true; this.globalTimer.paused = false; },
    resetGlobalTimer() {
      if (this.globalTimer.mode === 'countup' && this.globalTimer.seconds > 0) {
        this.saveSession(this.globalTimer.taskName, this.globalTimer.seconds);
      }
      clearInterval(this.globalTimer.interval);
      this.globalTimer = { running: false, paused: false, seconds: 0, total: 0, interval: null, taskName: '', mode: 'countdown' };
      this.activeTaskIndex = null;
    },

    // ===== 任务计时（正计时，从 0 开始） =====
    startTaskTimer(index) {
      const plan = this.todayPlans[index];
      if (!plan) return;
      clearInterval(this.globalTimer.interval);
      this.globalTimer.seconds = 0;
      this.globalTimer.total = 0;
      this.globalTimer.running = true;
      this.globalTimer.paused = false;
      this.globalTimer.taskName = plan.name;
      this.globalTimer.mode = 'countup';
      this.activeTaskIndex = index;
      this._runGlobal();
    },
    stopTaskTimer() {
      const elapsed = this.globalTimer.seconds;
      const taskName = this.globalTimer.taskName;
      clearInterval(this.globalTimer.interval);
      this.globalTimer = { running: false, paused: false, seconds: 0, total: 0, interval: null, taskName: '', mode: 'countdown' };
      this.activeTaskIndex = null;
      if (elapsed > 0) {
        this.saveSession(taskName, elapsed);
        this.loadData();
      }
      uni.showToast({ title: '✅ 已记录 ' + this.formatTime(elapsed), icon: 'success' });
    },
    pauseTaskTimer() { this.pauseGlobalTimer(); },
    resumeTaskTimer() { this.resumeGlobalTimer(); },

    // ===== 自由计时 =====
    startFreeTimer() {
      this.resetGlobalTimer();
      this.globalTimer.seconds = 0;
      this.globalTimer.total = 0;
      this.globalTimer.running = true;
      this.globalTimer.paused = false;
      this.globalTimer.taskName = '自由计时';
      this.globalTimer.mode = 'countup';
      this.activeTaskIndex = null;
      this._runGlobal();
    },
    _runFreeGlobal() {
      if (this.globalTimer.interval) clearInterval(this.globalTimer.interval);
      this.globalTimer.interval = setInterval(() => {
        if (!this.globalTimer.running) return;
        this.globalTimer.seconds++;
      }, 1000);
    },

    // ===== 统计面板 =====
    openStatsPanel() {
      this.showStatsPanel = true;
      this.statsClosing = false;
    },
    closeStatsPanel() {
      this.statsClosing = true;
      setTimeout(() => {
        this.showStatsPanel = false;
        this.statsClosing = false;
      }, 280);
    },

    // ===== 图表弹窗 =====
    openChartModal() {
      this.showChartModal = true;
      this.chartClosing = false;
    },
    closeChartModal() {
      this.chartClosing = true;
      setTimeout(() => {
        this.showChartModal = false;
        this.chartClosing = false;
      }, 280);
    },
    switchChart(mode) {
      this.chartMode = mode;
      this.$nextTick(() => {
        setTimeout(() => { this.drawLineChart(); }, 200);
      });
    },
    drawLineChart() {
      const ctx = uni.createCanvasContext('lineChart', this);
      const W = 310, H = 220;
      ctx.clearRect(0, 0, W, H);
      const p = { top: 26, right: 18, bottom: 32, left: 18 };
      const cw = W - p.left - p.right;
      const ch = H - p.top - p.bottom;
      const sx = p.left, ex = W - p.right;
      const by = H - p.bottom, ty = p.top;

      const data = getData();
      const history = data.history || [];
      const now = new Date();
      const dpts = [], dlbs = [];
      let n;

      if (this.chartMode === 'day') {
        n = 7;
        for (let i = n - 1; i >= 0; i--) {
          const d = new Date(now); d.setDate(d.getDate() - i);
          const ds = this.dateKey(d);
          const rec = history.find(h => h.date === ds);
          dpts.push(rec ? Number(rec.energyUsed || 0) : 0);
          if (i === 0) dlbs.push('今天'); else if (i === 1) dlbs.push('昨天');
          else dlbs.push((d.getMonth()+1)+'/'+d.getDate());
        }
      } else if (this.chartMode === 'week') {
        n = 4;
        for (let i = n - 1; i >= 0; i--) {
          const d = new Date(now); d.setDate(d.getDate() - i * 7);
          let total = 0;
          for (let j = 0; j < 7; j++) {
            const dd = new Date(d); dd.setDate(dd.getDate() - j);
            const rec = history.find(h => h.date === this.dateKey(dd));
            total += rec ? Number(rec.energyUsed || 0) : 0;
          }
          dpts.push(Math.round(total / 7));
          if (i === 0) dlbs.push('本周'); else if (i === 1) dlbs.push('上周');
          else dlbs.push((d.getMonth()+1)+'/'+(d.getDate()-6));
        }
      } else {
        n = 6;
        for (let i = n - 1; i >= 0; i--) {
          const d = new Date(now); d.setMonth(d.getMonth() - i);
          let total = 0, dc = 0;
          const dim = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
          for (let j = 1; j <= dim; j++) {
            const ds = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(j).padStart(2,'0');
            const rec = history.find(h => h.date === ds);
            if (rec) { total += Number(rec.energyUsed || 0); dc++; }
          }
          dpts.push(dc > 0 ? Math.round(total / dc) : 0);
          dlbs.push((d.getMonth()+1)+'月');
        }
      }

      const stx = cw / (n - 1);
      const mx = Math.max(...dpts, 10);
      const gp = (i) => ({ x: sx + i * stx, y: by - (dpts[i] / mx) * ch });

      for (let g = 0; g <= 4; g++) {
        const gy = ty + (ch / 4) * g;
        ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(ex, gy);
        ctx.setStrokeStyle(g === 0 ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.04)');
        ctx.setLineWidth(1);
        ctx.setLineDash(g > 0 ? [4,4] : []); ctx.stroke();
        ctx.setFillStyle('#bcccd0'); ctx.setFontSize(10);
        ctx.setTextAlign('left'); ctx.setTextBaseline('middle');
        ctx.fillText(Math.round(mx * (1 - g / 4)) + '%', ex + 4, gy);
      }
      ctx.setLineDash([]);

      ctx.beginPath(); ctx.moveTo(gp(0).x, by);
      for (let i = 0; i < n; i++) ctx.lineTo(gp(i).x, gp(i).y);
      ctx.lineTo(gp(n - 1).x, by); ctx.closePath();
      const fg = ctx.createLinearGradient(0, ty, 0, by);
      fg.addColorStop(0, 'rgba(98,199,178,0.28)');
      fg.addColorStop(0.5, 'rgba(98,199,178,0.1)');
      fg.addColorStop(1, 'rgba(98,199,178,0.01)');
      ctx.setFillStyle(fg); ctx.fill();

      ctx.beginPath();
      for (let i = 0; i < n; i++) i === 0 ? ctx.moveTo(gp(i).x, gp(i).y) : ctx.lineTo(gp(i).x, gp(i).y);
      ctx.setStrokeStyle('rgba(98,199,178,0.2)'); ctx.setLineWidth(8); ctx.setLineCap('round'); ctx.stroke();

      const lg = ctx.createLinearGradient(sx, 0, ex, 0);
      lg.addColorStop(0, '#7dd8c5'); lg.addColorStop(0.5, '#62c7b2'); lg.addColorStop(1, '#4aad98');
      ctx.beginPath();
      for (let i = 0; i < n; i++) i === 0 ? ctx.moveTo(gp(i).x, gp(i).y) : ctx.lineTo(gp(i).x, gp(i).y);
      ctx.setStrokeStyle(lg); ctx.setLineWidth(3); ctx.setLineCap('round'); ctx.stroke();

      dpts.forEach((val, i) => {
        const pt = gp(i);
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
        ctx.setFillStyle('#fff'); ctx.fill();
        ctx.setStrokeStyle('#e0edea'); ctx.setLineWidth(1.5); ctx.stroke();
        const dg = ctx.createLinearGradient(pt.x - 3, pt.y - 3, pt.x + 3, pt.y + 3);
        dg.addColorStop(0, '#7dd8c5'); dg.addColorStop(1, '#4aad98');
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.setFillStyle(dg); ctx.fill();
        if (val > 0) {
          ctx.setFillStyle('#1a3a42'); ctx.setFontSize(10);
          ctx.setTextAlign('center'); ctx.setTextBaseline('middle');
          ctx.fillText(val + '%', pt.x, pt.y - 16);
        }
      });
      dlbs.forEach((lb, i) => {
        ctx.setFillStyle('#8aa5ab'); ctx.setFontSize(11);
        ctx.setTextAlign('center'); ctx.setTextBaseline('top');
        ctx.fillText(lb, gp(i).x, by + 7);
      });
      ctx.draw();
    },

    // ===== 图表弹窗中的精力环形图（右侧标注任务占比） =====
    drawRingChart() {
      const ctx = uni.createCanvasContext('ringChart', this);
      const cx = 115, cy = 140, oR = 85, iR = 55;
      ctx.clearRect(0, 0, 320, 300);

      const donePlans = this.todayPlans.filter(p => p && p.done);
      const total = donePlans.reduce((s, p) => s + Number(p.energy || 0), 0) || 0;

      if (donePlans.length === 0) {
        ctx.beginPath(); ctx.arc(cx, cy, oR, 0, Math.PI * 2);
        ctx.setStrokeStyle('#e8edef'); ctx.setLineWidth(22); ctx.stroke();
      } else {
        let angle = -Math.PI / 2;
        const fc = Math.PI * 2;
        const segCount = donePlans.length;
        const gapAngle = 0.04;
        const totalGap = gapAngle * segCount;
        const slice = (fc - totalGap) / segCount;

        donePlans.forEach((plan, idx) => {
          const c = FOCUS_COLORS[idx % FOCUS_COLORS.length];
          ctx.beginPath();
          ctx.arc(cx, cy, oR, angle, angle + slice);
          ctx.arc(cx, cy, iR, angle + slice, angle, true);
          ctx.closePath();
          ctx.setFillStyle(c);
          ctx.fill();
          angle += slice + gapAngle;
        });

        // 右侧标注
        const lx = cx + oR + 22;
        let labelY = cy - (donePlans.length - 1) * 16;
        donePlans.forEach((plan, idx) => {
          const pct = total > 0 ? Math.round(Number(plan.energy || 0) / total * 100) : 0;
          const c = FOCUS_COLORS[idx % FOCUS_COLORS.length];
          // 色块
          ctx.beginPath(); ctx.rect(lx, labelY - 5, 10, 10);
          ctx.setFillStyle(c); ctx.fill();
          // 名称 + 百分比
          ctx.setFillStyle('#2a4a44'); ctx.setFontSize(11);
          ctx.setTextAlign('left'); ctx.setTextBaseline('middle');
          const label = plan.name.length > 4 ? plan.name.slice(0, 4) + '..' : plan.name;
          ctx.fillText(label + '  ' + pct + '%', lx + 14, labelY);
          labelY += 32;
        });
      }

      ctx.beginPath(); ctx.arc(cx, cy, oR, 0, Math.PI * 2);
      ctx.setStrokeStyle('rgba(0,0,0,0.06)'); ctx.setLineWidth(1.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, iR, 0, Math.PI * 2);
      ctx.setStrokeStyle('rgba(0,0,0,0.04)'); ctx.setLineWidth(1); ctx.stroke();

      ctx.beginPath(); ctx.arc(cx, cy, iR - 1, 0, Math.PI * 2);
      ctx.setFillStyle('#fff'); ctx.fill();
      ctx.setFillStyle('#2a4a44'); ctx.setFontSize(28);
      ctx.setTextAlign('center'); ctx.setTextBaseline('middle');
      ctx.fillText(total + '%', cx, cy - 4);
      ctx.setFillStyle('#8aa5ab'); ctx.setFontSize(12);
      ctx.fillText('精力消耗', cx, cy + 18);
      ctx.draw();
    },

    // ===== 统计面板中的专注环形图 =====
    drawFocusRing() {
      const ctx = uni.createCanvasContext('focusRingChart', this);
      const cx = 125, cy = 155, oR = 100, iR = 60;
      ctx.clearRect(0, 0, 370, 340);

      const data = this.focusChartData;
      const totalSec = data.reduce((s, d) => s + d.seconds, 0);

      if (data.length === 0) {
        ctx.beginPath(); ctx.arc(cx, cy, oR, 0, Math.PI * 2);
        ctx.setStrokeStyle('#e8edef'); ctx.setLineWidth(28); ctx.stroke();
      } else {
        let angle = -Math.PI / 2;
        const fc = Math.PI * 2;
        const segCount = data.length;
        const gapAngle = 0.04;
        const totalGap = gapAngle * segCount;

        data.forEach((item, idx) => {
          const ratio = item.seconds / totalSec;
          const slice = ratio * (fc - totalGap);
          const c = FOCUS_COLORS[idx % FOCUS_COLORS.length];
          ctx.beginPath();
          ctx.arc(cx, cy, oR, angle, angle + slice);
          ctx.arc(cx, cy, iR, angle + slice, angle, true);
          ctx.closePath();
          ctx.setFillStyle(c);
          ctx.fill();
          angle += slice + gapAngle;
        });

        // 右侧标注：任务名 + 占比 + 时长
        const lx = cx + oR + 18;
        let labelY = cy - (data.length - 1) * 18;
        data.forEach((item, idx) => {
          const pct = totalSec > 0 ? Math.round(item.seconds / totalSec * 100) : 0;
          const c = FOCUS_COLORS[idx % FOCUS_COLORS.length];
          ctx.beginPath(); ctx.rect(lx, labelY - 6, 12, 12);
          ctx.setFillStyle(c); ctx.fill();
          ctx.setFillStyle('#2a4a44'); ctx.setFontSize(12);
          ctx.setTextAlign('left'); ctx.setTextBaseline('middle');
          const name = item.name.length > 5 ? item.name.slice(0, 5) + '..' : item.name;
          const mins = Math.floor(item.seconds / 60);
          ctx.fillText(name + '  ' + pct + '%  ' + mins + '\'', lx + 16, labelY);
          labelY += 36;
        });
      }

      ctx.beginPath(); ctx.arc(cx, cy, oR, 0, Math.PI * 2);
      ctx.setStrokeStyle('rgba(0,0,0,0.06)'); ctx.setLineWidth(1.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, iR, 0, Math.PI * 2);
      ctx.setStrokeStyle('rgba(0,0,0,0.04)'); ctx.setLineWidth(1); ctx.stroke();

      ctx.beginPath(); ctx.arc(cx, cy, iR - 1, 0, Math.PI * 2);
      ctx.setFillStyle('#fff'); ctx.fill();
      const totalMin = Math.floor(totalSec / 60);
      ctx.setFillStyle('#2a4a44'); ctx.setFontSize(26);
      ctx.setTextAlign('center'); ctx.setTextBaseline('middle');
      ctx.fillText(totalMin + ' 分钟', cx, cy - 4);
      ctx.setFillStyle('#8aa5ab'); ctx.setFontSize(12);
      ctx.fillText('今日专注', cx, cy + 20);
      ctx.draw();
    }
  }
};
</script>

<style scoped>
.page-wrapper { max-width: 480px; margin: 0 auto; }
.page-container { background: #f7fbfc; min-height: 100vh; padding: 30rpx 30rpx 120rpx; }

/* ====== 顶部栏 ====== */
.focus-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28rpx; }
.focus-header-left { display: flex; flex-direction: column; gap: 6rpx; }
.focus-title { font-size: 44rpx; font-weight: 800; color: #1a3a42; }
.focus-subtitle { font-size: 24rpx; color: #8aa5ab; }
.focus-header-right { display: flex; gap: 12rpx; align-items: center; }
.header-icon-btn {
  width: 56rpx; height: 56rpx; border-radius: 50%;
  background: #fff; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06); transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.header-icon-btn:active { transform: scale(0.88); background: #f0f5f4; }
.header-icon-btn.btn-active { background: #1a3a42; box-shadow: 0 4rpx 18rpx rgba(26,58,66,0.25); }
.header-icon-btn.btn-active .header-icon { color: #fff; }
.header-icon { font-size: 32rpx; transition: transform 0.3s ease; }
.chart-btn { background: linear-gradient(135deg, #e8f8f4, #d4efe8); }
.chart-btn.btn-active { background: linear-gradient(135deg, #62c7b2, #4aad98); }

/* ====== 番茄钟 ====== */
.pomodoro-card {
  position: relative; overflow: hidden;
  background: #fff; border-radius: 28rpx; padding: 36rpx 24rpx;
  margin-bottom: 28rpx; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.04);
  border-top: 4rpx solid #e8787c; animation: card-breathe 5s ease-in-out infinite;
}
.pomodoro-card::after {
  content: ''; position: absolute; top: -40rpx; right: -40rpx;
  width: 160rpx; height: 160rpx; border-radius: 50%;
  background: #e8787c; opacity: 0.04; pointer-events: none;
}
.pomodoro-inner { display: flex; flex-direction: column; align-items: center; gap: 20rpx; position: relative; z-index: 1; }
.pomo-ring {
  width: 220rpx; height: 220rpx; border-radius: 50%;
  background: linear-gradient(145deg, #fef5f5, #fde8e8);
  display: flex; align-items: center; justify-content: center;
  border: 6rpx solid #f5d0d0; transition: all 0.4s ease;
}
.pomo-ring.running { border-color: #e8787c; background: linear-gradient(145deg, #fff5f0, #ffe8e0); box-shadow: 0 0 40rpx rgba(232,120,124,0.2); }
.pomo-ring.paused { border-color: #f0b940; background: linear-gradient(145deg, #fffef5, #fff8e0); }
.pomo-ring-inner { display: flex; flex-direction: column; align-items: center; gap: 4rpx; }
.pomo-time { font-size: 52rpx; font-weight: 800; color: #3d2a2a; font-variant-numeric: tabular-nums; letter-spacing: 2rpx; }
.pomo-state { font-size: 22rpx; color: #b08080; }
.pomo-task-name { font-size: 20rpx; color: #e8787c; font-weight: 500; }
.pomo-label-row { display: flex; align-items: center; gap: 8rpx; }
.pomo-icon { font-size: 32rpx; }
.pomo-title { font-size: 28rpx; font-weight: 700; color: #5a3a3a; }
.pomo-controls { display: flex; gap: 14rpx; flex-wrap: wrap; justify-content: center; }
.pomo-ctrl-btn {
  font-size: 26rpx; font-weight: 600; padding: 12rpx 28rpx;
  border-radius: 24rpx; background: #fef5f5; color: #e8787c;
  border: 2rpx solid #f5d0d0; transition: all 0.2s ease;
}
.pomo-ctrl-btn:active { transform: scale(0.95); }
.pomo-ctrl-btn.pause { background: #fff5e8; color: #f0b940; border-color: #f5d8a0; }
.pomo-ctrl-btn.resume { background: #e8f8f4; color: #62c7b2; border-color: #b5e6d8; }
.pomo-ctrl-btn.reset { background: #f3f6f7; color: #8aa5ab; border-color: #d0dde0; }

/* ====== 任务列表 ====== */
.task-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18rpx; }
.task-section-left { display: flex; flex-direction: column; gap: 2rpx; }
.task-section-title { font-size: 32rpx; font-weight: 700; color: #1a3a42; }
.task-section-sub { font-size: 22rpx; color: #a6bdc2; }
.todo-badge {
  display: flex; align-items: baseline; gap: 6rpx;
  background: #fff4e8; padding: 10rpx 20rpx; border-radius: 20rpx;
  border: 2rpx solid #ffe0c0;
}
.todo-num { font-size: 32rpx; font-weight: 800; color: #ff8c5a; }
.todo-label { font-size: 22rpx; color: #b08060; }

.task-list { display: flex; flex-direction: column; gap: 14rpx; margin-bottom: 30rpx; }
.task-item {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; padding: 20rpx 24rpx; border-radius: 20rpx;
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.03); transition: all 0.25s ease;
  border-left: 4rpx solid #d0dde0; animation: card-breathe 5s ease-in-out infinite;
}
.task-active { border-left-color: #e8787c; background: #fffbfb; }
.task-done { opacity: 0.55; border-left-color: #ddd; }
.name-done { text-decoration: line-through; color: #aaa; }
.task-left { display: flex; align-items: center; gap: 16rpx; flex: 1; }
.task-focus-badge {
  width: 56rpx; height: 56rpx; border-radius: 50%;
  background: #f5f5f5; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.3s ease;
}
.task-focus-badge.active { background: #333; }
.tf-dot {
  width: 12rpx; height: 12rpx; border-radius: 50%;
  background: #bbb; transition: all 0.3s ease;
}
.task-focus-badge.active .tf-dot { background: #fff; }
.task-info { display: flex; flex-direction: column; gap: 4rpx; }
.task-name { font-size: 28rpx; font-weight: 600; color: #1a3a42; }
.task-focus-info { font-size: 22rpx; color: #999; }

.task-right { flex-shrink: 0; }
.task-start-btn {
  width: 64rpx; height: 64rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #333; transition: all 0.2s ease;
}
.task-start-btn:active { transform: scale(0.9); opacity: 0.8; }
.task-start-btn.focusing { background: #666; }
.task-start-btn.paused { background: #999; }
.task-stop-btn {
  width: 48rpx; height: 48rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #ddd; transition: all 0.2s ease; margin-left: 10rpx;
}
.task-stop-btn:active { transform: scale(0.9); background: #ccc; }
.task-right { display: flex; align-items: center; gap: 0; }
.tsb-icon { font-size: 32rpx; color: #fff; }
.task-stop-btn .tsb-icon { font-size: 24rpx; color: #666; }

.empty-tasks { text-align: center; padding: 60rpx 0; color: #a6bdc2; }
.empty-task-icon { font-size: 60rpx; display: block; margin-bottom: 12rpx; }
.empty-task-text { font-size: 26rpx; }

/* ====== 自由计时 ====== */
.free-timer-area { display: flex; flex-direction: column; align-items: center; gap: 10rpx; padding: 36rpx 0; }
.free-timer-btn {
  display: flex; align-items: center; gap: 12rpx;
  background: linear-gradient(135deg, #e8787c, #d06068);
  padding: 18rpx 48rpx; border-radius: 50rpx;
  box-shadow: 0 8rpx 28rpx rgba(232,120,124,0.3); transition: all 0.3s ease;
}
.free-timer-btn:active { transform: scale(0.95); }
.free-timer-icon { font-size: 40rpx; }
.free-timer-text { font-size: 30rpx; font-weight: 600; color: #fff; }
.free-timer-hint { font-size: 22rpx; color: #a6bdc2; }

/* ====== 统计面板 ====== */
.stats-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  z-index: 999; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
}
.stats-overlay.overlay-enter { animation: overlayFadeIn 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.stats-overlay.overlay-leave { animation: overlayFadeOut 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.stats-modal {
  background: #f7fbfc; width: 92%; max-width: 480px; max-height: 85vh;
  border-radius: 32rpx; padding: 30rpx; overflow-y: auto;
}
.stats-modal.modal-enter { animation: modalSlideUp 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.stats-modal.modal-leave { animation: modalSlideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.stats-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.stats-modal-title { font-size: 34rpx; font-weight: 700; color: #1a3a42; }
.stats-modal-close {
  width: 52rpx; height: 52rpx; border-radius: 50%;
  background: #f3f6f7; display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; color: #8aa5ab;
}

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14rpx; margin-bottom: 24rpx; }
.stats-item {
  background: #fff; border-radius: 20rpx; padding: 22rpx 18rpx;
  text-align: center; border-top: 4rpx solid #62c7b2;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.03);
}
.stats-today-pomo { border-top-color: #e8787c; }
.stats-today-time { border-top-color: #5daed6; }
.stats-all-pomo { border-top-color: #f0b940; }
.stats-all-time { border-top-color: #9b8ac7; }
.stats-val { font-size: 36rpx; font-weight: 800; color: #1a3a42; display: block; }
.stats-lbl { font-size: 22rpx; color: #8aa5ab; margin-top: 4rpx; display: block; }

.stats-chart-block { background: #fff; border-radius: 20rpx; padding: 20rpx; margin-bottom: 14rpx; }
.stats-chart-title { font-size: 28rpx; font-weight: 600; color: #1a3a42; display: block; margin-bottom: 8rpx; }
.stats-ring-wrap { display: flex; justify-content: center; }
.focus-ring-canvas { width: 370px; height: 340px; }

.focus-legend { display: flex; flex-direction: column; gap: 10rpx; margin-top: 12rpx; padding: 0 12rpx; }
.legend-item { display: flex; align-items: center; gap: 10rpx; }
.legend-dot { width: 14rpx; height: 14rpx; border-radius: 50%; flex-shrink: 0; }
.legend-name { font-size: 26rpx; color: #5a7d85; flex: 1; }
.legend-time { font-size: 26rpx; font-weight: 600; color: #1a3a42; }
.stats-empty { text-align: center; padding: 40rpx; color: #a6bdc2; font-size: 26rpx; }

/* ====== 图表弹窗 ====== */
.chart-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  z-index: 999; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
}
.chart-overlay.overlay-enter { animation: overlayFadeIn 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.chart-overlay.overlay-leave { animation: overlayFadeOut 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.chart-modal {
  background: #f7fbfc; width: 92%; max-width: 480px; max-height: 85vh;
  border-radius: 32rpx; padding: 30rpx; overflow-y: auto;
}
.chart-modal.modal-enter { animation: modalSlideUp 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.chart-modal.modal-leave { animation: modalSlideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.chart-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.chart-modal-title { font-size: 34rpx; font-weight: 700; color: #1a3a42; }
.chart-modal-close {
  width: 52rpx; height: 52rpx; border-radius: 50%;
  background: #f3f6f7; display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; color: #8aa5ab;
}

.chart-block { background: #fff; border-radius: 20rpx; padding: 22rpx 16rpx; margin-bottom: 20rpx; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.03); }
.chart-block-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14rpx; padding: 0 6rpx; }
.chart-block-title { font-size: 28rpx; font-weight: 600; color: #1a3a42; }

.chart-tabs { display: flex; gap: 4rpx; background: #f0f4f5; border-radius: 18rpx; padding: 3rpx; }
.chart-tab {
  width: 48rpx; height: 40rpx; display: flex; align-items: center; justify-content: center;
  font-size: 22rpx; font-weight: 500; color: #8aa5ab; border-radius: 16rpx; transition: all 0.25s ease;
}
.chart-tab.active { background: #fff; color: #62c7b2; font-weight: 600; box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.05); }

.canvas-box { width: 310px; height: 220px; margin: 0 auto; }
.ring-wrap { display: flex; justify-content: center; }
.canvas-ring { width: 320px; height: 300px; }

/* ====== 弹窗过渡动画 ====== */
@keyframes overlayFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes overlayFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(60rpx) scale(0.94); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes modalSlideDown {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(40rpx) scale(0.96); }
}
</style>
