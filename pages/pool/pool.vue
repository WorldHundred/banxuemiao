<template>
  <view class="page-container">
    <view class="header-section">
      <text class="page-title">学习池</text>
      <text class="page-desc">提前规划学习方向，打卡时从这里挑选计划</text>
    </view>

    <!-- 已创建的板块列表 -->
    <view class="pool-list-area">
      <view v-if="categories.length > 0">
        <view v-for="(category, catIndex) in categories" :key="category.id" class="category-card">
          <view class="category-header" @click="toggleCategory(catIndex)">
            <view class="category-left">
              <view class="category-icon-wrap">
                <text class="category-icon">{{ category.icon || '📂' }}</text>
              </view>
              <view class="category-meta">
                <text class="category-name">{{ category.name }}</text>
                <text class="category-count">{{ (category.plans || []).length }} 个计划</text>
              </view>
            </view>
            <view class="category-right">
              <text class="toggle-icon">{{ category.isOpen ? '▼' : '▶' }}</text>
              <text class="cat-del" @click.stop="deleteCategory(catIndex)">✕</text>
            </view>
          </view>
          <view v-if="category.isOpen" class="category-body">
            <view v-for="(plan, planIndex) in category.plans" :key="plan.id" class="pool-item">
              <view class="pool-info">
                <text class="pool-name">📄 {{ plan.name }}</text>
              </view>
              <view class="pool-actions">
                <text class="del" @click="deletePlanFromCategory(catIndex, planIndex)">✕</text>
              </view>
            </view>
            <view class="add-plan-row">
              <input
                class="mini-input"
                v-model="newPlanInputs[catIndex]"
                placeholder="输入具体计划名称..."
                @confirm="addPlanToCategory(catIndex)"
              />
              <button class="mini-btn" @click="addPlanToCategory(catIndex)">添加</button>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <view class="empty-illustration">🗂️</view>
        <text class="empty-title">还没有学习方向</text>
        <text class="empty-desc">在下方选择一个方向开始吧</text>
      </view>
    </view>

    <!-- 分割线 -->
    <view class="divider-area">
      <view class="divider-line"></view>
      <text class="divider-text">推荐方向</text>
      <view class="divider-line"></view>
    </view>

    <!-- 固定推荐列表 -->
    <view class="template-area">
      <view class="template-list">
        <view
          class="template-item"
          v-for="(item, index) in displayTemplates"
          :key="index"
          @click="addTemplateCategory(item)"
        >
          <text class="template-icon">{{ item.icon }}</text>
          <text class="template-name">{{ item.name }}</text>
          <text class="template-plus">+</text>
        </view>
      </view>
    </view>

    <!-- 自定义添加 -->
    <view class="custom-area">
      <view class="custom-card" @click="addCategory">
        <view class="custom-icon-wrap">
          <text class="custom-plus-icon">+</text>
        </view>
        <text class="custom-text">添加自定义方向</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getData, setData } from '@/utils/storage.js';

export default {
  data() {
    return {
      categories: [],
      newPlanInputs: {},
      allTemplates: [
        { icon: '🇬🇧', name: '英语' },
        { icon: '🎨', name: '绘画' },
        { icon: '📷', name: '摄影' },
        { icon: '📖', name: '阅读' },
        { icon: '🎵', name: '音乐' },
        { icon: '🏃', name: '运动' },
        { icon: '🍳', name: '烹饪' },
        { icon: '🌱', name: '种植' },
        { icon: '💻', name: '编程' },
        { icon: '✂️', name: '剪辑' },
        { icon: '✈️', name: '旅行' },
        { icon: '🧠', name: '思维' },
        { icon: '✋', name: '手工' },
        { icon: '👗', name: '穿搭' }
      ]
    }
  },
  computed: {
    displayTemplates() {
      if (!this.categories || this.categories.length === 0) {
        return this.allTemplates;
      }
      const existNames = this.categories.map(item => item.name);
      return this.allTemplates.filter(item => !existNames.includes(item.name));
    }
  },
  onShow() {
    this.loadData();
  },
  methods: {
    loadData() {
      const data = getData();
      if (!data.poolCategories && data.poolPlans) {
        data.poolCategories = [{ id: Date.now() + '_default', icon: '📂', name: '默认', isOpen: true, plans: data.poolPlans }];
        delete data.poolPlans;
        setData(data);
      }
      this.categories = data.poolCategories || [];
    },
    addTemplateCategory(templateItem) {
      const isExist = this.categories.some(item => item.name === templateItem.name);
      if (isExist) return;

      const data = getData();
      if (!data.poolCategories) data.poolCategories = [];
      data.poolCategories.push({
        id: Date.now() + '_' + Math.random().toString(36),
        icon: templateItem.icon,
        name: templateItem.name,
        isOpen: true,
        plans: []
      });
      setData(data);
      this.loadData();
      uni.showToast({ title: `✅ 已创建「${templateItem.name}」`, icon: 'success' });
    },
    addCategory() {
      uni.showModal({
        title: '自定义方向',
        editable: true,
        placeholderText: '例如：吉他、练字、炒股...',
        success: (res) => {
          if (res.confirm && res.content) {
            const name = res.content.trim();
            if (!name) return;
            if (this.categories.some(item => item.name === name)) {
              uni.showToast({ title: `「${name}」已存在`, icon: 'none' });
              return;
            }
            const data = getData();
            if (!data.poolCategories) data.poolCategories = [];
            data.poolCategories.push({
              id: Date.now() + '_' + Math.random().toString(36),
              icon: '✨',
              name: name,
              isOpen: true,
              plans: []
            });
            setData(data);
            this.loadData();
            uni.showToast({ title: `✅ 已创建「${name}」`, icon: 'success' });
          }
        }
      });
    },
    toggleCategory(index) {
      this.categories[index].isOpen = !this.categories[index].isOpen;
      const data = getData();
      data.poolCategories = this.categories;
      setData(data);
    },
    deleteCategory(index) {
      uni.showModal({
        title: '提示',
        content: '确定删除该板块及其所有计划吗？',
        success: (res) => {
          if (res.confirm) {
            const data = getData();
            data.poolCategories.splice(index, 1);
            setData(data);
            this.loadData();
          }
        }
      });
    },
    addPlanToCategory(catIndex) {
      const inputVal = this.newPlanInputs[catIndex];
      if (!inputVal || !inputVal.trim()) return uni.showToast({ title: '请输入具体计划', icon: 'none' });
      const data = getData();
      data.poolCategories[catIndex].plans.push({
        id: Date.now() + '_' + Math.random().toString(36),
        name: inputVal.trim()
      });
      setData(data);
      this.newPlanInputs[catIndex] = '';
      this.loadData();
      uni.showToast({ title: '✅ 已加入板块', icon: 'success' });
    },
    deletePlanFromCategory(catIndex, planIndex) {
      const data = getData();
      data.poolCategories[catIndex].plans.splice(planIndex, 1);
      setData(data);
      this.loadData();
    },
  }
}
</script>

<style scoped>
/* ====== 学习池样式 ====== */
.page-container { padding: 40rpx 30rpx 200rpx; background: #f7fbfc; min-height: 100vh; }

.header-section { margin-bottom: 30rpx; }
.page-title { font-size: 40rpx; font-weight: 700; color: #1a3a42; display: block; }
.page-desc { font-size: 26rpx; color: #8aa5ab; margin-top: 8rpx; display: block; }

/* ====== 板块卡片 ====== */
.category-card {
  position: relative;
  overflow: hidden;
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
  border-top: 4rpx solid #62c7b2;
  transition: all 0.3s ease;
  animation: card-breathe 5s ease-in-out infinite;
}
.category-card::after {
  content: '';
  position: absolute;
  top: -30rpx; right: -30rpx;
  width: 100rpx; height: 100rpx;
  border-radius: 50%;
  background: #62c7b2;
  opacity: 0.04;
  pointer-events: none;
}
.category-card:active { border-color: #e0edef; }

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 0;
}
.category-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
}
.category-icon-wrap {
  width: 60rpx;
  height: 60rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #e8f8f4, #d4efe8);
  display: flex;
  align-items: center;
  justify-content: center;
}
.category-icon { font-size: 36rpx; }
.category-meta { display: flex; flex-direction: column; }
.category-name { font-size: 30rpx; font-weight: 600; color: #1a3a42; }
.category-count { font-size: 22rpx; color: #a6bdc2; margin-top: 2rpx; }

.category-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.toggle-icon { color: #a6bdc2; font-size: 22rpx; }
.cat-del {
  color: #d0d5d8;
  font-size: 28rpx;
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}
.cat-del:active { background: #fff0f0; color: #e9828c; }

.category-body {
  margin-top: 24rpx;
  border-top: 2rpx solid #eaf3f4;
  padding-top: 20rpx;
}

.pool-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 8rpx;
  transition: all 0.2s ease;
}
.pool-item:not(:last-child) { border-bottom: 1rpx solid #f5f7f8; }
.pool-info { flex: 1; }
.pool-name { font-size: 28rpx; color: #1a3a42; }

.pool-actions { display: flex; gap: 20rpx; align-items: center; }
.del {
  color: #d0d5d8;
  font-size: 26rpx;
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}
.del:active { background: #fff0f0; color: #e9828c; }

.add-plan-row { display: flex; gap: 16rpx; margin-top: 16rpx; }
.mini-input {
  flex: 1;
  border: 2rpx solid #e0edef;
  border-radius: 14rpx;
  padding: 14rpx 18rpx;
  font-size: 26rpx;
  background: #f7fbfc;
  transition: border-color 0.2s ease;
}
.mini-input:focus { border-color: #62c7b2; }
.mini-btn {
  background: linear-gradient(135deg, #62c7b2, #4aad98);
  color: #fff;
  border-radius: 14rpx;
  font-size: 26rpx;
  padding: 0 28rpx;
  border: none;
  font-weight: 500;
  box-shadow: 0 4rpx 12rpx rgba(98, 199, 178, 0.2);
}
.mini-btn:active { transform: scale(0.95); opacity: 0.9; }

/* 空状态 */
.empty-state { text-align: center; padding: 60rpx 0; color: #8aa5ab; }
.empty-illustration { font-size: 80rpx; margin-bottom: 12rpx; }
.empty-title { font-size: 30rpx; color: #5a7d85; display: block; margin-bottom: 8rpx; font-weight: 500; }
.empty-desc { font-size: 26rpx; color: #a6bdc2; }

/* ====== 分割线 ====== */
.divider-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  margin: 40rpx 0 30rpx;
}
.divider-line { flex: 1; height: 2rpx; background: #e0e8ea; }
.divider-text {
  font-size: 26rpx;
  color: #8aa5ab;
  font-weight: 500;
  padding: 0 10rpx;
  background: #f7fbfc;
}

/* ====== 推荐模板 ====== */
.template-area { margin-bottom: 30rpx; }
.template-list { display: flex; flex-wrap: wrap; gap: 16rpx; }
.template-item {
  background: #ffffff;
  padding: 14rpx 24rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  border: 2rpx solid #e8eef0;
  border-top: 4rpx solid #9b8ac7;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
  transition: all 0.25s ease;
  animation: card-breathe 5s ease-in-out infinite;
}
.template-item:active {
  background: #e8f8f4;
  border-color: #62c7b2;
  transform: scale(0.95);
}
.template-icon { font-size: 32rpx; }
.template-name { font-size: 26rpx; color: #1a3a42; font-weight: 500; }
.template-plus {
  font-size: 28rpx;
  color: #a6bdc2;
  font-weight: 600;
  margin-left: 4rpx;
  transition: color 0.2s ease;
}
.template-item:active .template-plus { color: #62c7b2; }

/* ====== 自定义添加 ====== */
.custom-area { display: flex; justify-content: center; margin-bottom: 30rpx; }
.custom-card {
  position: relative;
  overflow: hidden;
  background: #ffffff;
  width: 100%;
  padding: 28rpx 0;
  border-radius: 20rpx;
  border: 2rpx dashed #d0d9dc;
  border-top: 4rpx solid #e9828c;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
  animation: card-breathe 5s ease-in-out infinite;
}
.custom-card:active { background: #f7fbfc; border-color: #62c7b2; }

.custom-icon-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #f0fafa, #e0edea);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
  border: 2rpx solid #e8eef0;
  transition: all 0.3s ease;
}
.custom-plus-icon { font-size: 38rpx; color: #7c9aa3; font-weight: 300; line-height: 1; }

.custom-text { font-size: 28rpx; color: #8aa5ab; font-weight: 500; }
</style>
