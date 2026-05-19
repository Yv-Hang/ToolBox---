<template>
	<view class="top-header">
		<view class="menu-bar">
			<text class="logo">{{ t('appName') }}</text>
			<view class="nav-links">
				<!-- 功能下拉选择器（可选） -->
				<view v-if="showFunctionDropdown" class="nav-item dropdown active" @click="showFunctionPicker = !showFunctionPicker">
					<view class="nav-item-content">
						<text>{{ currentFunctionName }}</text>
						<text class="nav-arrow" :class="{ 'arrow-up': showFunctionPicker }">▼</text>
					</view>
					<view class="function-dropdown" v-if="showFunctionPicker">
						<view
							v-for="(option, index) in functionOptions"
							:key="index"
							class="function-option"
							:class="{ active: currentFunctionIndex === index }"
							@click.stop="handleSelectFunction(index)"
						>
							<text>{{ option }}</text>
						</view>
					</view>
				</view>

				<!-- 固定导航项 -->
				<view
					v-for="nav in navItems"
					:key="nav.page"
					class="nav-item"
					:class="{ active: currentPage === nav.page }"
					@click="navigateTo(nav.page)"
				>{{ t(nav.label) }}</view>
			</view>
		</view>
		<view class="user-section" @click="showUserMenu = !showUserMenu">
			<view class="avatar">{{ currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U' }}</view>
			<text class="username">{{ currentUser.username || t('defaultUser') }}</text>
			<view class="user-popover" v-if="showUserMenu">
				<view class="popover-item" @click="navigateTo('/pages/chat/layout')">{{ t('backToHome') }}</view>
				<view class="popover-item logout" @click="handleLogout">{{ t('logout') }}</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { t } from '@/locales/index.js';

const props = defineProps({
	currentPage: {
		type: String,
		default: 'chat'
	},
	showFunctionDropdown: {
		type: Boolean,
		default: false
	},
	functionOptions: {
		type: Array,
		default: () => []
	},
	currentFunctionIndex: {
		type: Number,
		default: 0
	}
});

const emit = defineEmits(['select-function']);

const showFunctionPicker = ref(false);
const showUserMenu = ref(false);

const currentUser = ref(uni.getStorageSync('current_user') || { username: 'TestUser', email: 'test@example.com', id: '1' });

const currentFunctionName = computed(() => {
	if (props.functionOptions.length === 0) return '';
	return props.functionOptions[props.currentFunctionIndex] || '';
});

const navItems = computed(() => {
	if (props.showFunctionDropdown) {
		return [
			{ page: '/pages/user/center', label: 'userCenter' },
			{ page: '/pages/user/membership', label: 'membership' }
		];
	}
	return [
		{ page: '/pages/chat/layout', label: 'copywriting' },
		{ page: '/pages/user/center', label: 'userCenter' },
		{ page: '/pages/user/membership', label: 'membership' }
	];
});

const handleSelectFunction = (index) => {
	emit('select-function', index);
	showFunctionPicker.value = false;
};

const navigateTo = (page) => {
	if (typeof page === 'string' && page.startsWith('/')) {
		uni.navigateTo({ url: page });
	} else {
		uni.switchTab({ url: page });
	}
};

const handleLogout = () => {
	uni.removeStorageSync('current_user');
	currentUser.value = { username: t('defaultUser'), email: '', id: '' };
	showUserMenu.value = false;
	uni.showToast({ title: t('已退出'), icon: 'success' });
};
</script>

<style lang="scss" scoped>
.top-header {
	height: 130rpx;
	background-color: #1a1a2e;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 60rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

	.menu-bar {
		display: flex;
		align-items: center;
		gap: 60rpx;

		.logo {
			font-size: 36rpx;
			font-weight: 700;
			color: #ffffff;
		}

		.nav-links {
			display: flex;
			gap: 40rpx;

			.nav-item {
				position: relative;
				font-size: 28rpx;
				color: rgba(255, 255, 255, 0.7);
				padding: 16rpx 24rpx;
				border-radius: 8rpx;
				transition: all 0.3s;
				cursor: pointer;

				&:hover, &.active {
					color: #ffffff;
					background-color: rgba(255, 255, 255, 0.1);
				}

				&.dropdown {
					display: flex;
					align-items: center;
					gap: 12rpx;

					.nav-item-content {
						display: flex;
						align-items: center;
						gap: 12rpx;
					}

					.nav-arrow {
						font-size: 20rpx;
						color: rgba(255, 255, 255, 0.5);
						transition: transform 0.3s;

						&.arrow-up {
							transform: rotate(180deg);
						}
					}

					.function-dropdown {
						position: absolute;
						top: calc(100% + 8rpx);
						left: 0;
						min-width: 200rpx;
						background: #ffffff;
						border-radius: 8rpx;
						box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
						padding: 8rpx 0;
						z-index: 1000;
						overflow: hidden;

						.function-option {
							padding: 16rpx 24rpx;
							font-size: 26rpx;
							color: #333;
							text-align: center;
							cursor: pointer;
							transition: all 0.3s;

							&:hover {
								background-color: #f5f7fa;
							}

							&.active {
								color: #667eea;
								background-color: #f0f4ff;
								font-weight: 600;
							}
						}
					}
				}
			}
		}
	}

	.user-section {
		position: relative;
		display: flex;
		align-items: center;
		gap: 16rpx;
		cursor: pointer;

		.avatar {
			width: 72rpx;
			height: 72rpx;
			border-radius: 36rpx;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 32rpx;
			font-weight: 600;
		}

		.username {
			font-size: 28rpx;
			color: #ffffff;
		}

		.user-popover {
			position: absolute;
			top: 90rpx;
			right: 0;
			width: 240rpx;
			background: #ffffff;
			box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
			border-radius: 12rpx;
			padding: 16rpx 0;
			z-index: 1000;

			.popover-item {
				padding: 24rpx 32rpx;
				font-size: 28rpx;
				color: #333;
				text-align: center;

				&:hover {
					background-color: #f5f7fa;
				}

				&.logout {
					color: #ff4d4f;
					border-top: 1px solid #f0f0f0;
					margin-top: 8rpx;
				}
			}
		}
	}
}
</style>
