<template>
  <view class="cat-box" :class="displayClass">
    <view class="cat-glow"></view>
    <!-- 喂食飘出特效 -->
    <view class="feed-float" v-if="feeding">
      <text class="feed-emoji">{{ feedEmoji }}</text>
    </view>
    <image class="pixel-cat" :src="imageSrc" mode="aspectFit"></image>
    <view class="cat-sparkle" v-if="status === 'excited' || status === 'play' || feeding">✨</view>
  </view>
</template>

<script>
export default {
  name: 'CatPet',
  props: {
    status: {
      type: String,
      default: 'happy'
    },
    // 喂食类型: null | 'fish' | 'milk' | 'can'
    feeding: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      idleTimer: null,
      showTimer: null,
      idleGif: ''
    };
  },
  computed: {
    // 喂食对应 GIF 文件名
    feedGif() {
      const map = { fish: 'fish', milk: 'milk', can: 'tin' };
      return this.feeding ? map[this.feeding] || null : null;
    },
    feedEmoji() {
      const map = { fish: '🐟', milk: '🥛', can: '🥫' };
      return this.feeding ? map[this.feeding] || '🎁' : '';
    },
    // 实际显示的 GIF：喂食中优先使用喂食 GIF
    imageSrc() {
      if (this.feeding && this.feedGif) {
        return '/static/cat/' + this.feedGif + '.gif';
      }
      if (this.idleGif) {
        return '/static/cat/' + this.idleGif + '.gif';
      }
      const map = {
        excited: 'excited',
        happy: 'happy',
        sit: 'sit',
        tired: 'tired',
        sleepy: 'sleepy',
        play: 'play'
      };
      return '/static/cat/' + (map[this.status] || 'happy') + '.gif';
    },
    displayClass() {
      if (this.feeding) return 'cat-feeding cat-feeding-' + this.feeding;
      return 'cat-' + this.status;
    }
  },
  watch: {
    feeding(val, oldVal) {
      if (val) {
        // 喂食开始：立即打断所有休闲动画
        if (this.idleTimer) clearTimeout(this.idleTimer);
        if (this.showTimer) clearTimeout(this.showTimer);
        this.idleGif = '';
      } else if (oldVal && !val) {
        // 喂食结束：重新启动空闲动画循环
        this.scheduleIdle();
      }
    }
  },
  mounted() {
    this.scheduleIdle();
  },
  beforeDestroy() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.showTimer) clearTimeout(this.showTimer);
  },
  methods: {
    scheduleIdle() {
      // 喂食中不调度空闲动画
      if (this.feeding) return;
      const delay = 8000 + Math.random() * 4000;
      this.idleTimer = setTimeout(() => {
        // 二次确认：喂食中不播放
        if (this.feeding) {
          this.scheduleIdle();
          return;
        }
        const pool = ['ear', 'active', 'raw'];
        this.idleGif = pool[Math.floor(Math.random() * pool.length)];
        this.showTimer = setTimeout(() => {
          this.idleGif = '';
          // 确认没在喂食再继续循环
          if (!this.feeding) this.scheduleIdle();
        }, 5000);
      }, delay);
    }
  }
};
</script>

<style>
.cat-box {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  overflow: visible;
  background: linear-gradient(145deg, #f0fafa 0%, #e0f5f0 50%, #d4efe8 100%);
  box-shadow:
    0 8rpx 32rpx rgba(98, 199, 178, 0.15),
    inset 0 2rpx 12rpx rgba(255, 255, 255, 0.6),
    0 0 0 8rpx rgba(98, 199, 178, 0.08);
  transition: all 0.5s ease;
  animation: cat-breathe 4s ease-in-out infinite;
}

/* 光晕 */
.cat-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(98, 199, 178, 0.15) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

/* 兴奋状态 */
.cat-box.cat-excited {
  background: linear-gradient(145deg, #fff8e8 0%, #ffe8c8 50%, #ffd8a8 100%);
  box-shadow:
    0 8rpx 32rpx rgba(255, 140, 90, 0.2),
    inset 0 2rpx 12rpx rgba(255, 255, 255, 0.6),
    0 0 0 8rpx rgba(255, 140, 90, 0.1);
  animation: cat-bounce 1.5s ease-in-out infinite;
}
.cat-box.cat-excited .cat-glow {
  opacity: 1;
  background: radial-gradient(circle, rgba(255, 140, 90, 0.2) 0%, transparent 70%);
}

/* 玩耍状态 */
.cat-box.cat-play {
  background: linear-gradient(145deg, #e8f8ff 0%, #d0edff 50%, #bce2ff 100%);
  box-shadow:
    0 8rpx 32rpx rgba(107, 182, 214, 0.2),
    inset 0 2rpx 12rpx rgba(255, 255, 255, 0.6),
    0 0 0 8rpx rgba(107, 182, 214, 0.1);
  animation: cat-bounce 2s ease-in-out infinite;
}
.cat-box.cat-play .cat-glow {
  opacity: 0.8;
  background: radial-gradient(circle, rgba(107, 182, 214, 0.18) 0%, transparent 70%);
}

/* ====== 喂食状态 ====== */
.cat-box.cat-feeding {
  animation: cat-nom 0.4s ease-in-out infinite;
}
/* 吃鱼 */
.cat-box.cat-feeding-fish {
  background: linear-gradient(145deg, #fff8ee 0%, #ffe8d0 50%, #ffd8b8 100%);
  box-shadow:
    0 8rpx 32rpx rgba(255, 160, 80, 0.22),
    inset 0 2rpx 12rpx rgba(255, 255, 255, 0.6),
    0 0 0 8rpx rgba(255, 160, 80, 0.1);
}
.cat-box.cat-feeding-fish .cat-glow {
  opacity: 1;
  background: radial-gradient(circle, rgba(255, 180, 80, 0.22) 0%, transparent 70%);
}
/* 喝牛奶 */
.cat-box.cat-feeding-milk {
  background: linear-gradient(145deg, #f8f8ff 0%, #e8e8ff 50%, #d8d8ff 100%);
  box-shadow:
    0 8rpx 32rpx rgba(140, 140, 220, 0.22),
    inset 0 2rpx 12rpx rgba(255, 255, 255, 0.6),
    0 0 0 8rpx rgba(140, 140, 220, 0.1);
}
.cat-box.cat-feeding-milk .cat-glow {
  opacity: 1;
  background: radial-gradient(circle, rgba(140, 140, 220, 0.2) 0%, transparent 70%);
}
/* 吃罐头 */
.cat-box.cat-feeding-can {
  background: linear-gradient(145deg, #fef8f0 0%, #fce8d0 50%, #fad8b0 100%);
  box-shadow:
    0 8rpx 32rpx rgba(200, 140, 60, 0.22),
    inset 0 2rpx 12rpx rgba(255, 255, 255, 0.6),
    0 0 0 8rpx rgba(200, 140, 60, 0.1);
}
.cat-box.cat-feeding-can .cat-glow {
  opacity: 1;
  background: radial-gradient(circle, rgba(200, 140, 60, 0.2) 0%, transparent 70%);
}

/* 喂食浮动图标 */
.feed-float {
  position: absolute;
  top: -20rpx;
  z-index: 5;
  animation: feed-rise 1.5s ease-out forwards;
  pointer-events: none;
}
.feed-emoji { font-size: 48rpx; }

@keyframes feed-rise {
  0%   { transform: translateY(0) scale(0.5); opacity: 1; }
  60%  { transform: translateY(-60rpx) scale(1.2); opacity: 0.8; }
  100% { transform: translateY(-100rpx) scale(0.8); opacity: 0; }
}

@keyframes cat-nom {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

/* 累/困状态 */
.cat-box.cat-tired,
.cat-box.cat-sleepy {
  background: linear-gradient(145deg, #f5f0f5 0%, #ede0ea 50%, #e5d0df 100%);
  box-shadow:
    0 8rpx 32rpx rgba(180, 150, 175, 0.15),
    inset 0 2rpx 12rpx rgba(255, 255, 255, 0.5),
    0 0 0 8rpx rgba(180, 150, 175, 0.06);
  animation: cat-breathe 5s ease-in-out infinite;
}

.pixel-cat {
  width: 80%;
  height: 80%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  z-index: 2;
  filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.08));
}

.cat-sparkle {
  position: absolute;
  top: 8rpx;
  right: 20rpx;
  font-size: 36rpx;
  z-index: 3;
  animation: sparkle-float 1.5s ease-in-out infinite;
}

/* 呼吸动画（默认状态） */
@keyframes cat-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

/* 弹跳动画（兴奋/玩耍） */
@keyframes cat-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  25% { transform: translateY(-8rpx) scale(1.02); }
  50% { transform: translateY(0) scale(1); }
  75% { transform: translateY(-4rpx) scale(1.01); }
}

/* 闪光浮动 */
@keyframes sparkle-float {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
  50% { transform: translateY(-12rpx) rotate(15deg); opacity: 1; }
}
</style>
