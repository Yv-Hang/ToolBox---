<template>
	<view class="app-container">
		<view class="page-wrapper">
			<view class="container">
				<view class="header">
					<text class="title">{{ t('registerTitle') }}</text>
					<text class="subtitle">{{ t('registerSubtitle') }}</text>
				</view>

				<view class="form-container">
					<view class="input-group">
						<text class="label">{{ t('registerUsername') }}</text>
						<input
							type="text"
							v-model="regData.username"
							class="input"
							:placeholder="t('registerUsernamePlaceholder')"
							placeholder-class="placeholder"
						/>
					</view>

					<view class="input-group">
						<text class="label">{{ t('registerEmail') }}</text>
						<input
							type="text"
							v-model="regData.email"
							class="input"
							:placeholder="t('registerEmailPlaceholder')"
							placeholder-class="placeholder"
						/>
					</view>

					<view class="input-group">
						<text class="label">{{ t('registerPassword') }}</text>
						<input
							type="password"
							v-model="regData.password"
							class="input"
							:placeholder="t('registerPasswordPlaceholder')"
							placeholder-class="placeholder"
						/>
					</view>

					<view class="input-group">
						<text class="label">{{ t('registerVerifyCode') }}</text>
						<view class="code-row">
							<input
								type="text"
								v-model="regData.code"
								class="input code-input"
								:placeholder="t('registerVerifyCodePlaceholder')"
								placeholder-class="placeholder"
							/>
							<button
								class="send-code-btn"
								:disabled="countdown > 0 || codeLoading"
								@click="handleSendCode"
							>
								{{ countdown > 0 ? `${countdown}s` : t('registerSendCode') }}
							</button>
						</view>
					</view>
				</view>

				<button class="reg-btn" :loading="loading" @click="handleRegister">
					{{ t('registerBtn') }}
				</button>

				<view class="footer" @click="goBack">
					<text>{{ t('registerHaveAccount') }}<text class="link">{{ t('registerGoLogin') }}</text></text>
				</view>
			</view>
		</view>

		<!-- 页面底部 -->
		<AppFooter />
	</view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { sendRegisterCode, registerUser, normalizeUser } from '@/api/user.js';
import { t } from '@/locales/index.js';

const regData = ref({
	username: '',
	email: '',
	password: '',
	code: ''
});

const loading = ref(false);
const codeLoading = ref(false);
const countdown = ref(0);
let timer = null;

const clearTimer = () => {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
};

onUnmounted(clearTimer);

const startCountdown = () => {
	clearTimer();
	countdown.value = 60;
	timer = setInterval(() => {
		if (countdown.value <= 1) {
			clearTimer();
			countdown.value = 0;
			return;
		}
		countdown.value--;
	}, 1000);
};

const handleSendCode = async () => {
	const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
	if (!emailRegex.test(regData.value.email)) {
		return uni.showToast({ title: t('registerEmailInvalid'), icon: 'none' });
	}

	codeLoading.value = true;
	try {
		const res = await sendRegisterCode(regData.value.email);
		uni.showToast({ title: res?.msg || t('forgetCodeSent'), icon: 'success' });
		startCountdown();
	} catch (e) {}
	finally {
		codeLoading.value = false;
	}
};

const handleRegister = async () => {
	const { username, email, password, code } = regData.value;
	const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

	if (!username) return uni.showToast({ title: t('registerPleaseInputUsername'), icon: 'none' });
	if (!emailRegex.test(email)) return uni.showToast({ title: t('registerEmailInvalid'), icon: 'none' });
	if (password.length < 6) return uni.showToast({ title: t('registerPasswordTooShort'), icon: 'none' });
	if (!code) return uni.showToast({ title: t('registerPleaseInputCode'), icon: 'none' });

	loading.value = true;
	try {
		const res = await registerUser(regData.value);
		const user = normalizeUser(res?.data, { username, email });
		uni.setStorageSync('current_user', user);
		uni.showToast({ title: t('registerSuccess'), icon: 'success' });
		setTimeout(() => {
			uni.reLaunch({ url: '/pages/chat/layout' });
		}, 1500);
	} catch (e) {}
	finally {
		loading.value = false;
	}
};

const goBack = () => uni.navigateBack();
</script>

<style lang="scss" scoped>
.app-container {
	display: flex;
	flex-direction: column;
	min-height: 100vh;
	background-color: #f5f7fa;
}

.page-wrapper {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx 0;
}

.container {
	width: 90%;
	max-width: 800rpx;
	padding: 64rpx;
	background-color: #ffffff;
	border-radius: 24rpx;
	box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.05);
	display: flex;
	flex-direction: column;
}

.header {
	margin-bottom: 80rpx;
	.title {
		font-size: 56rpx;
		font-weight: 700;
		color: #1a1a1a;
		display: block;
		margin-bottom: 16rpx;
	}
	.subtitle {
		font-size: 26rpx;
		color: #999;
		display: block;
	}
}

.form-container {
	.input-group {
		margin-bottom: 40rpx;
		.label {
			font-size: 24rpx;
			color: #666;
			margin-bottom: 12rpx;
			display: block;
			font-weight: 500;
		}
		.input {
			height: 90rpx;
			border-bottom: 1px solid #f0f0f0;
			font-size: 32rpx;
			color: #1a1a1a;
			width: 100%;
		}
		.placeholder {
			color: #ccc;
		}
		.code-row {
			display: flex;
			align-items: center;
			.code-input {
				flex: 1;
			}
			.send-code-btn {
				margin-left: 24rpx;
				height: 72rpx;
				line-height: 72rpx;
				padding: 0 32rpx;
				font-size: 24rpx;
				background-color: #f5f7fa;
				color: #409eff;
				border-radius: 36rpx;
				&::after { border: none; }
				&:disabled {
					color: #999;
					background-color: #f8f8f8;
				}
			}
		}
	}
}

.reg-btn {
	margin-top: 60rpx;
	height: 100rpx;
	line-height: 100rpx;
	background: linear-gradient(135deg, #409eff, #007aff);
	color: #fff;
	font-size: 32rpx;
	font-weight: 600;
	border-radius: 50rpx;
	box-shadow: 0 8rpx 20rpx rgba(0, 122, 255, 0.2);
	&::after { border: none; }
}

.footer {
	margin-top: 64rpx;
	text-align: center;
	font-size: 26rpx;
	color: #999;
	.link {
		color: #409eff;
		font-weight: 500;
		margin-left: 8rpx;
	}
}
</style>
