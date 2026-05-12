<template>
	<view class="app-container">
		<!-- 顶部菜单栏 -->
		<view class="top-header">
			<view class="menu-bar">
				<text class="logo">{{ t('appName') }}</text>
				<view class="nav-links">
					<view class="nav-item" @click="navigateTo('/pages/chat/layout')">{{ t('copywriting') }}</view>
					<view class="nav-item" @click="navigateTo('/pages/user/center')">{{ t('userCenter') }}</view>
					<view class="nav-item active">{{ t('membership') }}</view>
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
					<text class="card-title">{{ t('memberCenter') }}</text>
					<text class="card-subtitle">{{ t('buyMemberOrRecharge') }}</text>
				</view>

				<!-- 上半部分：左右并排 -->
				<view class="top-row">
					<!-- 左侧：当前状态 + 卡密兑换 -->
					<view class="left-col">
						<!-- 当前状态 -->
						<view class="card">
							<view class="section-header">
								<text class="section-title">{{ t('currentStatus') }}</text>
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
						</view>
						<!-- 卡密兑换 -->
						<view class="card">
							<view class="section-header">
								<text class="section-title">{{ t('cardRedeemPoints') }}</text>
							</view>
							<view class="redeem-section">
								<input v-model="cardKeyInput" class="redeem-input" :placeholder="t('enterCardKey')" placeholder-style="color: #999;" />
								<button class="btn redeem-btn" :loading="redeeming" :disabled="!cardKeyInput.trim()" @click="handleRedeem">{{ t('redeemPoints') }}</button>
							</view>
							<text class="tip-text">{{ t('redeemTipMember') }}</text>
						</view>
					</view>

					<!-- 右侧：会员套餐 -->
					<view class="right-col">
						<view class="card">
							<view class="section-header">
								<text class="section-title">{{ t('memberPackages') }}</text>
							</view>
							<view class="plans">
								<view
									v-for="plan in plans"
									:key="plan.id"
									class="plan"
									:class="{ active: selectedPlanId === plan.id }"
									@click="selectPlan(plan.id)"
								>
									<view class="plan-header">
										<text class="plan-name">{{ plan.name }}</text>
										<text class="plan-tag" v-if="plan.tag">{{ plan.tag }}</text>
									</view>
									<view class="plan-price">
										<text class="price-symbol">¥</text>
										<text class="price-value">{{ plan.price }}</text>
										<text class="price-unit">/{{ plan.unit }}</text>
									</view>
									<text class="plan-desc">{{ plan.desc }}</text>
									<view class="plan-benefits">
										<view class="plan-benefit" v-for="(b, i) in plan.benefits" :key="i">
											<text class="benefit-check">✓</text>
											<text>{{ b }}</text>
										</view>
									</view>
								</view>
							</view>
							<button class="btn primary" :disabled="!selectedPlanId || purchasing" :loading="purchasing" @click="submitPurchase">
								{{ purchasing ? t('buying') : t('buyNow') }}
							</button>
						</view>
					</view>
				</view>

				<!-- 下半部分：会员权益 -->
				<view class="card full-card">
					<view class="section-header">
						<text class="section-title">{{ t('memberBenefits') }}</text>
					</view>
					<view class="benefits-grid">
						<view class="benefit-item" v-for="(item, index) in benefitList" :key="index">
							<view class="benefit-icon">{{ item.icon }}</view>
							<view class="benefit-info">
								<text class="benefit-title">{{ item.title }}</text>
								<text class="benefit-desc">{{ item.desc }}</text>
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
import { getUserInfo, getBalance, buyMembership, redeemCardKey } from '@/api/user.js';
import { t } from '@/locales/index.js';

const showUserMenu = ref(false);
const currentUser = ref(uni.getStorageSync('current_user') || {});
const userId = computed(() => currentUser.value?.id);

const info = ref({
	username: '',
	email: '',
	membershipLevel: '',
	membershipExpireTime: '',
	isMember: false
});

const balance = ref(0);
const balanceText = computed(() => (balance.value === null || balance.value === undefined ? '-' : String(balance.value)));

const purchasing = ref(false);
const redeeming = ref(false);
const cardKeyInput = ref('');
const selectedPlanId = ref(null);

const plans = ref([
	{
		id: 1,
		name: '月度会员',
		price: '29.9',
		unit: '月',
		tag: null,
		desc: '适合短期体验',
		benefits: ['赠送 500 积分', '优先响应', '基础模型']
	},
	{
		id: 2,
		name: '季度会员',
		price: '79.9',
		unit: '季',
		tag: '热门',
		desc: '性价比之选',
		benefits: ['赠送 1800 积分', '优先响应', '高级模型']
	},
	{
		id: 3,
		name: '年度会员',
		price: '299.9',
		unit: '年',
		tag: '超值',
		desc: '长期最佳选择',
		benefits: ['赠送 8000 积分', '极速响应', '全部模型', '专属客服']
	}
]);

const benefitList = ref([
	{ icon: '🎁', title: '赠送积分', desc: '开通会员即赠大量积分，生成更多优质文案' },
	{ icon: '⚡', title: '优先响应', desc: '会员用户享有更快的生成响应速度' },
	{ icon: '🤖', title: '高级模型', desc: '解锁更多高性能 AI 模型可供选择' },
	{ icon: '💰', title: '积分优惠', desc: '会员专属积分单价，消费更划算' },
	{ icon: '🛡️', title: '专属客服', desc: '年度会员享受一对一专属客服支持' },
	{ icon: '🔄', title: '优先更新', desc: '新功能优先体验，抢先使用最新能力' }
]);

const selectPlan = (id) => {
	selectedPlanId.value = id;
};

const refreshInfo = async () => {
	currentUser.value = uni.getStorageSync('current_user') || {};
	try {
		const res = await getUserInfo(userId.value);
		info.value = res || info.value;
	} catch (e) {}
	try {
		const res = await getBalance(userId.value);
		balance.value = res !== undefined && res !== null ? res : 0;
	} catch (e) {}
};

const submitPurchase = async () => {
	if (!selectedPlanId.value) return;
	uni.showModal({
		title: t('confirmBuy'),
		content: t('confirmBuyContent'),
		success: async (res) => {
			if (res.confirm) {
				purchasing.value = true;
				try {
					await buyMembership(userId.value, selectedPlanId.value);
					uni.showToast({ title: t('buySuccess'), icon: 'success' });
					await refreshInfo();
				} catch (e) {
					uni.showToast({ title: t('buyFailed'), icon: 'none' });
				} finally {
					purchasing.value = false;
				}
			}
		}
	});
};

const handleRedeem = async () => {
	if (!cardKeyInput.value.trim()) {
		uni.showToast({ title: t('enterCardKeyPlease'), icon: 'none' });
		return;
	}
	uni.showModal({
		title: t('confirmRedeem'),
		content: t('confirmRedeemContent'),
		success: async (res) => {
			if (res.confirm) {
				redeeming.value = true;
				try {
					await redeemCardKey(userId.value, cardKeyInput.value.trim());
					uni.showToast({ title: t('redeemSuccess'), icon: 'success' });
					cardKeyInput.value = '';
					await refreshInfo();
				} catch (e) {
					uni.showToast({ title: t('redeemFailed'), icon: 'none' });
				} finally {
					redeeming.value = false;
				}
			}
		}
	});
};

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

.full-card {
	background: #f8f9fc;
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

.plans {
	display: flex;
	gap: 20rpx;
	margin-bottom: 24rpx;
}

.plan {
	flex: 1;
	background: #ffffff;
	border: 2px solid transparent;
	border-radius: 16rpx;
	padding: 28rpx 20rpx;
	cursor: pointer;
	transition: all 0.3s;
	box-sizing: border-box;

	&:hover {
		border-color: rgba(102, 126, 234, 0.3);
	}

	&.active {
		border-color: #667eea;
		background: rgba(102, 126, 234, 0.03);
		box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.15);
	}

	.plan-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16rpx;

		.plan-name { font-size: 28rpx; font-weight: 700; color: #1a1a1a; }
		.plan-tag {
			font-size: 20rpx;
			color: #667eea;
			background: rgba(102, 126, 234, 0.1);
			padding: 4rpx 12rpx;
			border-radius: 20rpx;
			font-weight: 600;
		}
	}

	.plan-price {
		display: flex;
		align-items: baseline;
		margin-bottom: 12rpx;

		.price-symbol { font-size: 24rpx; color: #667eea; font-weight: 600; }
		.price-value { font-size: 48rpx; font-weight: 700; color: #667eea; line-height: 1; }
		.price-unit { font-size: 22rpx; color: #999; margin-left: 4rpx; }
	}

	.plan-desc {
		display: block;
		font-size: 22rpx;
		color: #999;
		margin-bottom: 16rpx;
	}

	.plan-benefits {
		display: flex;
		flex-direction: column;
		gap: 10rpx;

		.plan-benefit {
			display: flex;
			align-items: center;
			gap: 8rpx;
			font-size: 22rpx;
			color: #666;

			.benefit-check { color: #52c41a; font-weight: 700; }
		}
	}
}

.btn.primary {
	width: 100%;
	height: 80rpx;
	line-height: 80rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	font-size: 28rpx;
	font-weight: 600;
	border-radius: 40rpx;
	box-shadow: 0 4rpx 16rpx rgba(102, 126, 234, 0.3);
	&::after { border: none; }
	&:disabled { opacity: 0.5; box-shadow: none; }
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
		min-width: 160rpx;
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

.benefits-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 24rpx;
}

.benefit-item {
	flex: 1 1 calc(33.333% - 16rpx);
	min-width: 200rpx;
	display: flex;
	align-items: flex-start;
	gap: 20rpx;
	background: #ffffff;
	border-radius: 12rpx;
	padding: 24rpx;
	transition: all 0.3s;

	&:hover {
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
	}

	.benefit-icon {
		font-size: 40rpx;
		flex-shrink: 0;
		width: 64rpx;
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(102, 126, 234, 0.08);
		border-radius: 16rpx;
	}

	.benefit-info {
		flex: 1;
		min-width: 0;

		.benefit-title { display: block; font-size: 26rpx; font-weight: 700; color: #1a1a1a; margin-bottom: 8rpx; }
		.benefit-desc { display: block; font-size: 22rpx; color: #999; line-height: 1.5; }
	}
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
