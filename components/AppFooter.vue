<template>
	<view class="app-footer">
		<text class="footer-text">{{ t('copyright') }}</text>
		<view class="lang-switcher">
			<view class="lang-current" @click="showLangPicker = !showLangPicker">
				<text>{{ currentLangLabel }}</text>
				<text class="lang-arrow" :class="{ 'arrow-up': showLangPicker }">▼</text>
			</view>
			<view class="lang-dropdown" v-if="showLangPicker">
				<view
					v-for="option in langOptions"
					:key="option.value"
					class="lang-option"
					:class="{ active: currentLang === option.value }"
					@click="switchLang(option.value)"
				>
					<text>{{ option.label }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { t, getLocale, setLocale, getLocaleOptions } from '@/locales/index.js';

const currentLang = ref(getLocale());
const showLangPicker = ref(false);
const langOptions = getLocaleOptions();

const currentLangLabel = computed(() => {
	const option = langOptions.find(o => o.value === currentLang.value);
	return option ? option.label : '中文';
});

const switchLang = (lang) => {
	currentLang.value = lang;
	setLocale(lang);
	showLangPicker.value = false;
	// 刷新当前页面
	const pages = getCurrentPages();
	if (pages.length > 0) {
		const currentPage = pages[pages.length - 1];
		const url = '/' + currentPage.route;
		uni.reLaunch({ url });
	}
};
</script>

<style lang="scss" scoped>
.app-footer {
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #ffffff;
	border-top: 1px solid #e8e8e8;
	flex-shrink: 0;
	gap: 40rpx;
}

.footer-text {
	font-size: 24rpx;
	color: #999;
	letter-spacing: 1rpx;
}

.lang-switcher {
	position: relative;

	.lang-current {
		display: flex;
		align-items: center;
		gap: 10rpx;
		padding: 10rpx 20rpx;
		border: 1px solid #e8e8e8;
		border-radius: 8rpx;
		font-size: 24rpx;
		color: #666;
		cursor: pointer;
		background-color: #fafafa;
		transition: all 0.3s;

		&:hover {
			border-color: #667eea;
		}

		.lang-arrow {
			font-size: 18rpx;
			color: #999;
			transition: transform 0.3s;

			&.arrow-up {
				transform: rotate(180deg);
			}
		}
	}

	.lang-dropdown {
		position: absolute;
		bottom: calc(100% + 8rpx);
		right: 0;
		min-width: 140rpx;
		background: #ffffff;
		border: 1px solid #e8e8e8;
		border-radius: 8rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		padding: 8rpx 0;
		z-index: 1000;
		overflow: hidden;

		.lang-option {
			padding: 16rpx 24rpx;
			font-size: 24rpx;
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
</style>
