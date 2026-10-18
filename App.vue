<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/* 每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	/* #ifndef APP-NVUE */
	@import '@/static/customicons.css';

	/* ===== CSS 变量设计系统 ===== */
	page {
		--primary: #62c7b2;
		--primary-light: #7dd8c5;
		--primary-dark: #4aad98;
		--primary-bg: #e8f8f4;
		--primary-soft: #f0fafa;

		--accent-warm: #ff8c5a;
		--accent-blue: #6bb6d6;
		--accent-yellow: #ffd166;
		--accent-pink: #e9828c;
		--accent-purple: #8f9ee8;

		--text-primary: #1a3a42;
		--text-secondary: #5a7d85;
		--text-muted: #8aa5ab;
		--text-light: #a6bdc2;

		--bg-page: #f0f5f4;
		--bg-card: #ffffff;
		--bg-subtle: #f7fbfc;

		--border-light: #e8eef0;
		--border-card: #eaf3f4;

		--shadow-sm: 0 4rpx 16rpx rgba(98, 199, 178, 0.08);
		--shadow-md: 0 8rpx 28rpx rgba(98, 199, 178, 0.12);
		--shadow-lg: 0 12rpx 36rpx rgba(98, 199, 178, 0.16);

		--radius-sm: 12rpx;
		--radius-md: 20rpx;
		--radius-lg: 28rpx;
		--radius-xl: 36rpx;
		--radius-full: 60rpx;

		--font-xs: 22rpx;
		--font-sm: 24rpx;
		--font-md: 28rpx;
		--font-lg: 32rpx;
		--font-xl: 36rpx;
		--font-2xl: 44rpx;
		--font-3xl: 56rpx;

		background-color: var(--bg-page);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
	}

	/* #endif */

	/* ===== 全局工具类 ===== */
	.example-info {
		font-size: 14px;
		color: #333;
		padding: 10px;
	}

	/* 通用卡片 */
	.card {
		background: var(--bg-card);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		padding: 30rpx;
		margin: 0 30rpx 30rpx;
	}

	/* 通用按钮动画 */
	button {
		transition: all 0.25s ease;
	}
	button:active {
		transform: scale(0.96);
		opacity: 0.9;
	}

	/* 弹性动画 */
	@keyframes fadeInUp {
		from { opacity: 0; transform: translateY(30rpx); }
		to { opacity: 1; transform: translateY(0); }
	}
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.05); }
	}
	@keyframes shimmer {
		0% { background-position: -200% 0; }
		100% { background-position: 200% 0; }
	}

	.animate-fade-in {
		animation: fadeIn 0.4s ease;
	}
	.animate-fade-in-up {
		animation: fadeInUp 0.5s ease;
	}

	/* 卡片呼吸律动 */
	@keyframes card-breathe {
		0%, 100% { box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03); }
		50% { box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.07); }
	}
</style>
