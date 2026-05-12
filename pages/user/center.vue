<template>
	<view class="app-container">
		<!-- 顶部菜单栏 -->
		<view class="top-header">
			<view class="menu-bar">
				<text class="logo">{{ t('appName') }}</text>
				<view class="nav-links">
					<view class="nav-item" @click="navigateTo('/pages/chat/layout')">{{ t('copywriting') }}</view>
					<view class="nav-item active">{{ t('userCenter') }}</view>
					<view class="nav-item" @click="navigateTo('/pages/user/membership')">{{ t('membership') }}</view>
				</view>
			</view>
			<view class="user-section" @click="showUserMenu = !showUserMenu">
				<view class="avatar">{{ currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U' }}</view>
				<text class="username">{{ currentUser.username || '用户' }}</text>
				<view class="user-popover" v-if="showUserMenu">
					<view class="popover-item" @click="navigateTo('/pages/chat/layout')">{{ t('backToHome') }}</view>
					<view class="popover-item logout" @click="handleLogout">{{ t('logout') }}</view>
				</view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="main-content">
			<view class="content-card">
				<view class="card-header">
					<text class="card-title">{{ t('personalCenter') }}</text>
					<text class="card-subtitle">{{ t('viewPersonalInfo') }}</text>
				</view>

				<!-- 上半部分：左右并排 -->
				<view class="top-row">
					<!-- 左侧：基本信息 + 卡密兑换 -->
					<view class="left-col">
						<!-- 基本信息 -->
						<view class="card">
							<view class="section-header">
								<text class="section-title">{{ t('basicInfo') }}</text>
							</view>
							<view class="row">
								<text class="label">{{ t('userId') }}</text>
								<text class="value">{{ userIdText }}</text>
							</view>
							<view class="row">
								<text class="label">{{ t('username') }}</text>
								<text class="value">{{ info.username || '-' }}</text>
							</view>
							<view class="row">
								<text class="label">{{ t('email') }}</text>
								<text class="value">{{ info.email || '-' }}</text>
							</view>
						</view>
						<!-- 卡密兑换 -->
						<view class="card">
							<view class="section-header">
								<text class="section-title">{{ t('cardRedeem') }}</text>
							</view>
							<view class="redeem-section">
								<input v-model="cardKeyInput" class="redeem-input" :placeholder="t('enterCardKey')" placeholder-style="color: #999;" />
								<button class="btn redeem-btn" :loading="redeeming" :disabled="!cardKeyInput.trim()" @click="handleRedeem">{{ t('redeemPoints') }}</button>
							</view>
							<text class="tip-text">{{ t('redeemTip') }}</text>
						</view>
					</view>

					<!-- 右侧：会员与积分 -->
					<view class="right-col">
						<view class="card">
							<view class="section-header">
								<text class="section-title">{{ t('memberAndPoints') }}</text>
							</view>
							<view class="row">
								<text class="label">{{ t('memberStatus') }}</text>
								<text class="value" :class="{ 'member-active': info.isMember }">{{ info.isMember ? t('memberActive') : t('memberInactive') }}</text>
							</view>
							<view class="row">
								<text class="label">{{ t('memberLevel') }}</text>
								<text class="value">{{ info.membershipLevel || '-' }}</text>
							</view>
							<view class="row">
								<text class="label">{{ t('expireTime') }}</text>
								<text class="value">{{ info.membershipExpireTime || '-' }}</text>
							</view>
							<view class="row">
								<text class="label">{{ t('pointsBalance') }}</text>
								<text class="value highlight">{{ balanceText }} {{ t('points') }}</text>
							</view>
							<button class="btn full" @click="toMembership">{{ t('buyMemberRecharge') }}</button>
						</view>
					</view>
				</view>

				<!-- 下半部分：生成历史 -->
				<view class="card history-card">
					<view class="section-header">
						<text class="section-title">{{ t('generationHistory') }}</text>
						<view class="pager">
							<button class="pager-btn" :disabled="historyLoading || page <= 1" @click="prevPage">{{ t('prevPage') }}</button>
							<text class="pager-text">{{ page }}</text>
							<button class="pager-btn" :disabled="historyLoading || historyList.length < size" @click="nextPage">{{ t('nextPage') }}</button>
						</view>
					</view>
					<view v-if="historyLoading" class="hint">{{ t('loading') }}</view>
					<view v-else-if="historyList.length === 0" class="hint">{{ t('noHistory') }}</view>
					<view v-else class="history-list">
						<view v-for="item in historyList" :key="item.id" class="history-item">
							<view class="history-meta">
								<text class="history-time">{{ item.createdAt || '' }}</text>
								<text class="history-model">{{ item.model || '' }}</text>
							</view>
							<view class="bubble user">
								<text class="bubble-title">{{ t('user') }}</text>
								<text class="bubble-text">{{ item.prompt }}</text>
							</view>
							<view class="bubble assistant">
								<text class="bubble-title">AI</text>
								<text class="bubble-text">{{ item.response }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 页面底部 -->
		<AppFooter />
	</view>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue';
import { getUserInfo, getBalance, redeemCardKey } from '@/api/user.js';
import { getHistory } from '@/api/ai.js';
import { t } from '@/locales/index.js';

const showUserMenu = ref(false);
const currentUser = ref(uni.getStorageSync('current_user') || {});
const userId = computed(() => currentUser.value?.id);
const userIdText = computed(() => (userId.value === undefined || userId.value === null || userId.value === '' ? '-' : String(userId.value)));

const info = ref({
	username: '',
	email: '',
	membershipLevel: '',
	membershipExpireTime: '',
	isMember: false
});

const balance = ref(0);
const balanceText = computed(() => (balance.value === null || balance.value === undefined ? '-' : String(balance.value)));

const loadingInfo = ref(false);
const redeeming = ref(false);
const cardKeyInput = ref('');

const page = ref(1);
const size = 10;
const historyList = ref([]);
const historyLoading = ref(false);
const refreshInfo = async () => {
	currentUser.value = uni.getStorageSync('current_user') || {};
	loadingInfo.value = true;
	try {
		const res = await getUserInfo(userId.value);
		info.value = res || info.value;
	} catch (e) {}

	try {
		const res = await getBalance(userId.value);
		balance.value = res !== undefined && res !== null ? res : 0;
	} catch (e) {}
	loadingInfo.value = false;
};

const loadHistory = async () => {
	historyLoading.value = true;
	try {
		const res = await getHistory({ userId: userId.value, page: page.value, size });
		historyList.value = Array.isArray(res) ? res : (res?.data || res?.list || []);
	} catch (e) {
		historyList.value = [];
	} finally {
		historyLoading.value = false;
	}
};

const prevPage = async () => {
	if (page.value <= 1) return;
	page.value -= 1;
	await loadHistory();
};

const nextPage = async () => {
	page.value += 1;
	await loadHistory();
};
const handleRedeem = async () => {
	if (!cardKeyInput.value.trim()) {
		uni.showToast({ title: '请输入卡密', icon: 'none' });
		return;
	}
	uni.showModal({
		title: '确认兑换',
		content: '确定使用卡密兑换积分吗？',
		success: async (res) => {
			if (res.confirm) {
				redeeming.value = true;
				try {
					await redeemCardKey(userId.value, cardKeyInput.value.trim());
					uni.showToast({ title: '兑换成功', icon: 'success' });
					cardKeyInput.value = '';
					await refreshInfo();
				} catch (e) {} finally {
					redeeming.value = false;
				}
			}
		}
	});
};

const toMembership = () => uni.navigateTo({ url: '/pages/user/membership' });
const navigateTo = (url) => uni.navigateTo({ url });
const handleLogout = () => {
	uni.removeStorageSync('current_user');
	currentUser.value = { username: '用户', email: '' };
	uni.showToast({ title: t('已退出'), icon: 'success' });
};

onMounted(async () => {
	const user = uni.getStorageSync('current_user');
	if (!user || !user.id) {
		uni.reLaunch({ url: '/pages/index/index' });
		return;
	}
	await refreshInfo();
	await loadHistory();
});
</script>
<style lang="scss" scoped>
.app-container {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: #f5f7fa;
}

.top-header {
	height: 120rpx;
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
		.logo { font-size: 36rpx; font-weight: 700; color: #ffffff; }
		.nav-links {
			display: flex;
			gap: 40rpx;
			.nav-item {
				font-size: 28rpx;
				color: rgba(255, 255, 255, 0.7);
				padding: 16rpx 24rpx;
				border-radius: 8rpx;
				transition: all 0.3s;
				&:hover, &.active { color: #ffffff; background-color: rgba(255, 255, 255, 0.1); }
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
			width: 72rpx; height: 72rpx; border-radius: 36rpx;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #fff; display: flex; align-items: center; justify-content: center;
			font-size: 32rpx; font-weight: 600;
		}
		.username { font-size: 28rpx; color: #ffffff; }
		.user-popover {
			position: absolute; top: 90rpx; right: 0; width: 240rpx;
			background: #ffffff; box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
			border-radius: 12rpx; padding: 16rpx 0; z-index: 1000;
			.popover-item {
				padding: 24rpx 32rpx; font-size: 28rpx; color: #333; text-align: center;
				&:hover { background-color: #f5f7fa; }
				&.logout { color: #ff4d4f; border-top: 1px solid #f0f0f0; margin-top: 8rpx; }
			}
		}
	}
}

.main-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	padding: 40rpx 0;
	overflow-y: auto;
}

.content-card {
	width: 60%;
	min-width: 800rpx;
	padding: 48rpx;
	background-color: #ffffff;
	border-radius: 20rpx;
	box-shadow: 0 2rpx 24rpx rgba(0, 0, 0, 0.05);
	box-sizing: border-box;

	.card-header {
		margin-bottom: 40rpx;
		text-align: center;
		.card-title { display: block; font-size: 44rpx; font-weight: 700; color: #1a1a1a; margin-bottom: 12rpx; }
		.card-subtitle { display: block; font-size: 26rpx; color: #999; }
	}
}

.top-row {
	display: flex;
	gap: 32rpx;
	margin-bottom: 32rpx;
}

.left-col {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.right-col {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.card {
	background: #f8f9fc;
	border: none;
	border-radius: 16rpx;
	padding: 32rpx;
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
}

.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;

	.section-title {
		font-size: 30rpx;
		font-weight: 700;
		color: #1a1a1a;
		position: relative;
		padding-left: 20rpx;

		&::before {
			content: '';
			position: absolute;
			left: 0;
			top: 50%;
			transform: translateY(-50%);
			width: 6rpx;
			height: 28rpx;
			background: linear-gradient(180deg, #667eea, #764ba2);
			border-radius: 3rpx;
		}
	}

	.pager {
		display: flex;
		align-items: center;
		gap: 12rpx;

		.pager-text { font-size: 26rpx; color: #666; width: 60rpx; text-align: center; }
		.pager-btn {
			height: 64rpx;
			line-height: 64rpx;
			padding: 0 24rpx;
			font-size: 24rpx;
			background: #ffffff;
			color: #667eea;
			border-radius: 32rpx;
			box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
			&::after { border: none; }
			&:disabled { color: #ccc; box-shadow: none; }
		}
	}
}

.row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 18rpx 0;
	border-bottom: 1px solid rgba(0, 0, 0, 0.04);

	&:last-child { border-bottom: none; }

	.label { color: #666; font-size: 26rpx; flex-shrink: 0; }
	.value { color: #1a1a1a; font-size: 26rpx; font-weight: 500; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
	.value.highlight { color: #667eea; font-weight: 700; font-size: 32rpx; }
	.value.member-active { color: #52c41a; font-weight: 600; }
}

.btn.full {
	width: 100%;
	margin-top: 24rpx;
	height: 80rpx;
	line-height: 80rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	font-size: 28rpx;
	font-weight: 600;
	border-radius: 40rpx;
	box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
	&::after { border: none; }
}

.redeem-section {
	display: flex;
	gap: 16rpx;
	align-items: center;

	.redeem-input {
		flex: 1;
		min-width: 0;
		height: 80rpx;
		padding: 0 24rpx;
		border: 2px solid #eef2f7;
		border-radius: 12rpx;
		font-size: 26rpx;
		background: #ffffff;
		box-sizing: border-box;
		transition: all 0.3s;
		&:focus { border-color: #667eea; background: #fafbfd; }
	}
	.redeem-btn {
		flex-shrink: 0;
		height: 80rpx;
		line-height: 80rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		font-size: 26rpx;
		font-weight: 600;
		border-radius: 40rpx;
		&::after { border: none; }
		&:disabled { background: #e0e0e0; color: #999; box-shadow: none; }
	}
}

.tip-text { display: block; margin-top: 16rpx; font-size: 22rpx; color: #bbb; line-height: 1.6; }
.hint { color: #999; font-size: 26rpx; padding: 40rpx 0; text-align: center; }

.history-card {
	width: 100%;
	margin-top: 0;
}

.history-list { display: flex; flex-direction: column; gap: 0; }

.history-item {
	padding: 24rpx 0;
	border-bottom: 1px solid rgba(0, 0, 0, 0.04);

	&:last-child { border-bottom: none; }

	.history-meta {
		display: flex;
		gap: 16rpx;
		align-items: center;
		margin-bottom: 16rpx;
	}
	.history-time { font-size: 22rpx; color: #bbb; }
	.history-model {
		font-size: 22rpx;
		color: #667eea;
		background: rgba(102, 126, 234, 0.08);
		padding: 4rpx 16rpx;
		border-radius: 20rpx;
	}
}

.bubble {
	margin-top: 12rpx;
	padding: 20rpx 24rpx;
	border-radius: 12rpx;

	.bubble-title { display: block; font-size: 22rpx; color: #999; margin-bottom: 10rpx; font-weight: 500; }
	.bubble-text { font-size: 26rpx; color: #333; line-height: 1.7; word-break: break-word; }

	&.user { background: linear-gradient(135deg, rgba(102, 126, 234, 0.06), rgba(102, 126, 234, 0.02)); }
	&.assistant { background: #f8f9fc; }
}

.app-footer {
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #ffffff;
	border-top: 1px solid #f0f0f0;
	flex-shrink: 0;
}
.footer-text { font-size: 24rpx; color: #ccc; letter-spacing: 1rpx; }
</style>
