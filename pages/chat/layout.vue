<template>
	<view class="app-container">
		<!-- 顶部菜单栏 -->
		<view class="top-header">
			<view class="menu-bar">
				<text class="logo">{{ t('appName') }}</text>
				<view class="nav-links">
					<view class="nav-item dropdown active" @click="showFunctionPicker = !showFunctionPicker">
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
								@click="selectFunction(index)"
							>
								<text>{{ option }}</text>
							</view>
						</view>
					</view>
					<view class="nav-item" @click="navigateTo('/pages/user/center')">{{ t('userCenter') }}</view>
					<view class="nav-item" @click="navigateTo('/pages/user/membership')">{{ t('membership') }}</view>
				</view>
			</view>
			<view class="user-section" @click="showUserMenu = !showUserMenu">
				<view class="avatar">{{ currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U' }}</view>
				<text class="username">{{ currentUser.username || '用户' }}</text>
				<view class="user-popover" v-if="showUserMenu">
					<view class="popover-item" @click="toUserCenter">{{ t('userCenter') }}</view>
					<view class="popover-item logout" @click="handleLogout">{{ t('logout') }}</view>
				</view>
			</view>
		</view>

		<!-- 主内容区 -->
		<view class="main-content">
			<!-- 左侧输入区域 -->
			<scroll-view scroll-y class="left-panel">
				<view class="panel-title">{{ t('paramSettings') }}</view>
				
				<view class="form-group">
					<text class="label">{{ t('purposeLabel') }}</text>
					<textarea
						v-model="formData.purpose"
						class="textarea"
						:placeholder="t('purposePlaceholder')"
						maxlength="200"
					/>
				</view>

				<view class="form-group">
					<text class="label">{{ t('keywordsLabel') }}</text>
					<textarea
						v-model="formData.keywords"
						class="textarea"
						:placeholder="t('keywordsPlaceholder')"
						maxlength="200"
					/>
				</view>

				<view class="form-group">
					<text class="label">{{ t('styleLabel') }}</text>
					<view class="style-tags">
						<text
							v-for="(style, index) in styleOptions"
							:key="index"
							class="style-tag"
							:class="{ active: formData.style === styleKeys[index] }"
							@click="formData.style = styleKeys[index]"
						>{{ style }}</text>
					</view>
				</view>

				<view class="form-group">
					<text class="label">{{ t('wordCountLabel') }}</text>
					<input
						type="number"
						v-model.number="formData.wordCount"
						class="input"
						:placeholder="t('wordCountPlaceholder')"
					/>
				</view>

				<view class="form-group">
					<text class="label">{{ t('countLabel') }}</text>
					<view class="count-selector">
						<text
							v-for="(num, index) in countOptions"
							:key="index"
							class="count-tag"
							:class="{ active: formData.count === num }"
							@click="formData.count = num"
						>{{ num }}{{ t('countUnit') }}</text>
					</view>
				</view>

				<view class="form-group">
					<text class="label">{{ t('languageLabel') }}</text>
					<view class="language-picker-wrapper" @click.stop="showLanguagePicker = !showLanguagePicker">
						<view class="language-display">
							<text>{{ selectedLanguageName }}</text>
							<text class="arrow" :class="{ 'arrow-up': showLanguagePicker }">▼</text>
						</view>
						<view class="language-dropdown" v-if="showLanguagePicker">
							<view
								v-for="(lang, index) in languageOptions"
								:key="lang.value"
								class="language-option"
								:class="{ active: formData.language === lang.value }"
								@click.stop="selectLanguage(lang.value)"
							>
								<text>{{ lang.label }}</text>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>

			<!-- 右侧展示区域 -->
			<view class="right-panel">
				<view class="panel-header">
					<text class="panel-title">{{ t('aiResult') }}</text>
					<view class="model-selector">
						<text class="selector-label">{{ t('aiModel') }}：</text>
						<view class="model-picker-wrapper" @click="showModelPicker = !showModelPicker">
							<view class="model-display">
								<text>{{ selectedModelName }}</text>
								<text class="arrow" :class="{ 'arrow-up': showModelPicker }">▼</text>
							</view>
							<view class="model-dropdown" v-if="showModelPicker">
								<view 
									v-for="(model, index) in modelList" 
									:key="index"
									class="model-option"
									:class="{ active: currentModelIndex === index }"
									@click="selectModel(index)"
								>
									<text>{{ model.name || model }}</text>
								</view>
							</view>
						</view>
					</view>
				</view>

				<scroll-view scroll-y class="result-content">
					<view class="content-inner">
						<view v-if="!resultContent && !generating" class="empty-state">
							<text class="empty-icon">✨</text>
							<text class="empty-text">{{ t('emptyState') }}</text>
						</view>
						<view v-if="generating" class="loading-state">
							<text class="loading-text">{{ t('generating') }}</text>
						</view>
						<view v-if="resultContent" class="result-text">{{ resultContent }}</view>
						
						<button
							class="generate-btn-center"
							:loading="generating"
							@click="handleGenerate"
						>
							{{ generating ? t('generatingBtn') : t('startGenerate') }}
						</button>
					</view>
				</scroll-view>

				<view class="result-footer" v-if="resultContent">
					<button class="action-btn" @click="copyResult">{{ t('copyResult') }}</button>
					<button class="action-btn secondary" @click="handleGenerate">{{ t('regenerate') }}</button>
				</view>
			</view>
		</view>

		<!-- 页面底部 -->
		<AppFooter />
	</view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getAIModels, generateCopywriting } from '@/api/ai.js';
import { t, getLocale, setLocale, getLocaleOptions } from '@/locales/index.js';

// 功能下拉框相关
const functionOptions = computed(() => [t('copywriting')]);
const currentFunctionIndex = ref(0);
const currentFunctionName = computed(() => functionOptions.value[currentFunctionIndex.value] || t('copywriting'));
const showFunctionPicker = ref(false);

const onFunctionChange = (e) => {
	currentFunctionIndex.value = e.detail.value;
	// 目前只有一个功能，后续可以在此添加功能切换逻辑
};

const selectFunction = (index) => {
	currentFunctionIndex.value = index;
	showFunctionPicker.value = false;
};

const showUserMenu = ref(false);
const currentUser = ref(uni.getStorageSync('current_user') || { username: '', email: '', id: '' });
const generating = ref(false);
const resultContent = ref('');
const showModelPicker = ref(false);

// AI模型相关
const modelList = ref([]);
const currentModelIndex = ref(0);
const modelNames = ref([]);

const selectedModelName = computed(() => {
	if (modelList.value.length === 0) return t('loadingModels');
	const model = modelList.value[currentModelIndex.value];
	return model ? (model.name || model) : t('noModel');
});

const selectedModel = computed(() => {
	const model = modelList.value[currentModelIndex.value];
	return model ? (model.code || model.name || model) : '';
});

// 表单数据
const formData = ref({
	purpose: '',
	keywords: '',
	style: 'formal',
	wordCount: 300,
	count: 1,
	language: '简体中文'
});

// 生成语言选项 - value直接使用显示名称传递给后端
const languageOptions = [
	{ value: '简体中文', label: '简体中文' },
	{ value: '繁體中文', label: '繁體中文' },
	{ value: 'English', label: 'English' },
	{ value: '日本語', label: '日本語' },
	{ value: '한국어', label: '한국어' },
	{ value: 'Français', label: 'Français' },
	{ value: 'Deutsch', label: 'Deutsch' },
	{ value: 'Español', label: 'Español' },
	{ value: 'Português', label: 'Português' },
	{ value: 'Русский', label: 'Русский' }
];
const showLanguagePicker = ref(false);

const selectedLanguageName = computed(() => {
	const lang = languageOptions.find(l => l.value === formData.value.language);
	return lang ? lang.label : '简体中文';
});

const selectLanguage = (value) => {
	formData.value.language = value;
	showLanguagePicker.value = false;
};

// 风格选项 - 使用语言键，展示时通过computed获取翻译
const styleKeys = ['formal', 'humor', 'literary', 'lively', 'concise', 'luxury'];
const styleOptions = computed(() => styleKeys.map(key => t(`styles.${key}`)));
const countOptions = [1, 2, 3, 5];

onMounted(() => {
	// 未登录时跳转到登录页
	if (!currentUser.value.id) {
		uni.reLaunch({ url: '/pages/index/index' });
		return;
	}
	loadModels();
});

// 加载可用模型列表
const loadModels = async () => {
	try {
		const res = await getAIModels();
		console.log('模型列表接口返回:', res);
		
		// 处理不同的返回格式
		let models = [];
		if (res.data) {
			models = Array.isArray(res.data) ? res.data : (res.data.list || res.data.models || []);
		} else if (Array.isArray(res)) {
			models = res;
		} else if (res.list) {
			models = res.list;
		} else if (res.models) {
			models = res.models;
		}
		
		if (models.length > 0) {
			modelList.value = models;
			modelNames.value = models.map(m => m.name || m);
			console.log('成功加载模型列表:', modelList.value);
		} else {
			// 使用默认模型
			console.log('接口未返回模型数据，使用默认模型');
			const defaultModels = [
				{ name: 'GPT-4', code: 'gpt-4' },
				{ name: 'GPT-3.5', code: 'gpt-3.5' },
				{ name: 'Claude', code: 'claude' }
			];
			modelList.value = defaultModels;
			modelNames.value = defaultModels.map(m => m.name);
		}
	} catch (e) {
		console.error('加载模型列表失败，使用默认模型:', e);
		const defaultModels = [
			{ name: 'GPT-4', code: 'gpt-4' },
			{ name: 'GPT-3.5', code: 'gpt-3.5' },
			{ name: 'Claude', code: 'claude' }
		];
		modelList.value = defaultModels;
		modelNames.value = defaultModels.map(m => m.name);
	}
};

// 模型切换
const onModelChange = (e) => {
	currentModelIndex.value = e.detail.value;
};

// 选择模型（自定义下拉框）
const selectModel = (index) => {
	currentModelIndex.value = index;
	showModelPicker.value = false;
};

// 生成文案
const handleGenerate = async () => {
	if (!formData.value.purpose) {
		return uni.showToast({ title: t('请输入用途'), icon: 'none' });
	}
	if (!formData.value.keywords) {
		return uni.showToast({ title: t('请输入主题'), icon: 'none' });
	}

	// 检查登录状态
	if (!currentUser.value.id) {
		return uni.showToast({ title: '请先登录', icon: 'none' });
	}

	generating.value = true;
	resultContent.value = '';

	try {
		console.log('=== 生成文案前的用户信息 ===');
		console.log('currentUser:', currentUser.value);
		console.log('userId:', currentUser.value.id, '类型:', typeof currentUser.value.id);
		
		const params = {
			userId: currentUser.value.id,
			purpose: formData.value.purpose,
			keywords: formData.value.keywords,
			style: formData.value.style,
			wordCount: formData.value.wordCount || 300,
			count: formData.value.count || 1,
			language: formData.value.language || '简体中文',
			model: selectedModel.value
		};

		console.log('=== 生成文案请求参数 ===');
		console.log('params:', params);

		const res = await generateCopywriting(params);
		
		// 根据后端实际返回格式处理
		if (res) {
			// 检查是否返回错误信息
			if (res.success === false || res.error) {
				const errorMsg = res.message || res.error || '生成失败';
				
				// 显示具体错误信息
				uni.showModal({
					title: '生成失败',
					content: errorMsg.substring(0, 200),
					showCancel: false
				});
				return;
			}
			
			// 成功的情况
			resultContent.value = res.content || res.data || res.msg || JSON.stringify(res);
		}
	} catch (e) {
		console.error('生成失败', e);
		
		// 解析错误信息
		let errorMsg = '生成失败，请重试';
		if (e && e.data) {
			const data = e.data;
			if (data.message) {
				errorMsg = data.message;
			}
		}
		
		uni.showToast({ 
			title: errorMsg.substring(0, 50), 
			icon: 'none',
			duration: 3000
		});
	} finally {
		generating.value = false;
	}
};

// 复制结果
const copyResult = () => {
	if (!resultContent.value) return;
	uni.setClipboardData({
		data: resultContent.value,
		success: () => {
			uni.showToast({ title: t('复制成功'), icon: 'success' });
		}
	});
};

const handleLogout = () => {
	uni.removeStorageSync('current_user');
	currentUser.value = { username: '用户', email: '', id: '' };
	showUserMenu.value = false;
	uni.showToast({ title: t('已退出'), icon: 'success' });
};

const toUserCenter = () => {
	showUserMenu.value = false;
	uni.navigateTo({ url: '/pages/user/center' });
};

const navigateTo = (url) => {
	if (url === '/pages/chat/layout') return;
	uni.navigateTo({ url });
};
</script>

<style lang="scss" scoped>
.app-container {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: #f5f7fa;
}

/* 顶部菜单栏 */
.top-header {
	height: 120rpx;
	background-color: #1a1a2e;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 40rpx;
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

/* 主内容区 */
.main-content {
	flex: 1;
	display: flex;
	flex-direction: row;
	padding: 32rpx;
	gap: 32rpx;
	overflow: visible;
	height: calc(100vh - 120rpx - 64rpx);
}

/* 左侧面板 */
.left-panel {
	width: 480rpx;
	min-width: 480rpx;
	background-color: #ffffff;
	border-radius: 16rpx;
	padding: 40rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
	display: flex;
	flex-direction: column;
	overflow: hidden;

	.panel-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 24rpx;
		flex-shrink: 0;
	}

	.form-group {
		margin-bottom: 20rpx;
		flex-shrink: 0;

		.label {
			font-size: 26rpx;
			color: #666;
			margin-bottom: 12rpx;
			display: block;
			font-weight: 500;
		}

		.textarea {
			width: 100%;
			min-height: 160rpx;
			max-height: 200rpx;
			padding: 16rpx;
			border: 1px solid #e8e8e8;
			border-radius: 8rpx;
			font-size: 26rpx;
			color: #333;
			background-color: #fafafa;
			transition: border-color 0.3s;
			box-sizing: border-box;

			&:focus {
				border-color: #667eea;
				background-color: #fff;
			}
		}

		.input {
			width: 100%;
			height: 72rpx;
			padding: 0 20rpx;
			border: 1px solid #e8e8e8;
			border-radius: 8rpx;
			font-size: 26rpx;
			color: #333;
			background-color: #fafafa;
			box-sizing: border-box;
		}
	}

	.style-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;

		.style-tag {
			padding: 12rpx 24rpx;
			border: 1px solid #e8e8e8;
			border-radius: 20rpx;
			font-size: 24rpx;
			color: #666;
			background-color: #fafafa;
			cursor: pointer;
			transition: all 0.3s;

			&.active {
				border-color: #667eea;
				background-color: #667eea;
				color: #ffffff;
			}
		}
	}

	.count-selector {
		display: flex;
		gap: 16rpx;

		.count-tag {
			flex: 1;
			text-align: center;
			padding: 16rpx 0;
			border: 1px solid #e8e8e8;
			border-radius: 8rpx;
			font-size: 26rpx;
			color: #666;
			background-color: #fafafa;
			cursor: pointer;
			transition: all 0.3s;

			&.active {
				border-color: #667eea;
				background-color: #667eea;
				color: #ffffff;
			}
		}
	}

	.language-picker-wrapper {
		position: relative;

		.language-display {
			padding: 16rpx 20rpx;
			border: 1px solid #e8e8e8;
			border-radius: 8rpx;
			font-size: 26rpx;
			color: #333;
			background-color: #fafafa;
			display: flex;
			align-items: center;
			justify-content: space-between;
			cursor: pointer;
			transition: all 0.3s;

			&:hover {
				border-color: #667eea;
			}

			.arrow {
				font-size: 18rpx;
				color: #999;
				transition: transform 0.3s;

				&.arrow-up {
					transform: rotate(180deg);
				}
			}
		}

		.language-dropdown {
			position: absolute;
			top: calc(100% + 8rpx);
			left: 0;
			width: 100%;
			background: #ffffff;
			border: 1px solid #e8e8e8;
			border-radius: 8rpx;
			box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
			padding: 8rpx 0;
			z-index: 1000;
			overflow: hidden;
			max-height: 400rpx;
			overflow-y: auto;

			.language-option {
				padding: 16rpx 20rpx;
				font-size: 26rpx;
				color: #333;
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

/* 右侧面板 */
.right-panel {
	flex: 1;
	min-width: 600rpx;
	background-color: #ffffff;
	border-radius: 16rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
	display: flex;
	flex-direction: column;
	height: 100%;
	min-width: 0;
	position: relative;
	overflow: visible;

	.panel-header {
		padding: 24rpx 32rpx;
		border-bottom: 1px solid #f0f0f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
		position: relative;
		z-index: 10;
		overflow: visible;

		.panel-title {
			font-size: 32rpx;
			font-weight: 600;
			color: #1a1a1a;
		}

		.model-selector {
			display: flex;
			align-items: center;
			gap: 16rpx;
			flex-shrink: 0;
			position: relative;
			z-index: 20;
			overflow: visible;

			.selector-label {
				font-size: 26rpx;
				color: #666;
				white-space: nowrap;
			}

			.model-picker-wrapper {
				position: relative;
				flex-shrink: 0;
			}
			
			.model-display {
				width: 160rpx;
				padding: 10rpx 20rpx;
				border: 1px solid #e8e8e8;
				border-radius: 8rpx;
				font-size: 24rpx;
				color: #333;
				background-color: #fafafa;
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 10rpx;
				cursor: pointer;
				transition: all 0.3s;
			
				&:hover {
					border-color: #667eea;
				}
			
				text {
					flex: 1;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}
			
				.arrow {
					font-size: 18rpx;
					color: #999;
					flex-shrink: 0;
					transition: transform 0.3s;
			
					&.arrow-up {
						transform: rotate(180deg);
					}
				}
			}
			
			.model-dropdown {
				position: absolute;
				top: calc(100% + 8rpx);
				left: 0;
				width: 160rpx;
				background: #ffffff;
				border: 1px solid #e8e8e8;
				border-radius: 8rpx;
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
				padding: 8rpx 0;
				z-index: 1000;
				overflow: hidden;
			
				.model-option {
					padding: 16rpx 20rpx;
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
	}

	.result-content {
		flex: 1;
		padding: 40rpx;
		overflow-y: auto;

		.content-inner {
			display: flex;
			flex-direction: column;
			min-height: 100%;
			align-items: center;
			justify-content: center;
			gap: 40rpx;
		}

		.empty-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;

			.empty-icon {
				font-size: 120rpx;
				margin-bottom: 24rpx;
			}

			.empty-text {
				font-size: 28rpx;
				color: #999;
			}
		}

		.loading-state {
			display: flex;
			align-items: center;
			justify-content: center;

			.loading-text {
				font-size: 28rpx;
				color: #667eea;
				animation: pulse 1.5s infinite;
			}
		}

		.result-text {
			font-size: 28rpx;
			line-height: 1.8;
			color: #333;
			white-space: pre-wrap;
			word-break: break-word;
		}

		.generate-btn-center {
			width: 280rpx;
			height: 80rpx;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #ffffff;
			font-size: 30rpx;
			font-weight: 600;
			border-radius: 40rpx;
			box-shadow: 0 6rpx 16rpx rgba(102, 126, 234, 0.3);
			margin-top: 20rpx;

			&::after {
				border: none;
			}

			&[disabled] {
				opacity: 0.6;
			}
		}
	}

	.result-footer {
		padding: 24rpx 40rpx;
		border-top: 1px solid #f0f0f0;
		display: flex;
		gap: 24rpx;

		.action-btn {
			flex: 1;
			height: 72rpx;
			line-height: 72rpx;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: #ffffff;
			font-size: 28rpx;
			border-radius: 36rpx;

			&::after {
				border: none;
			}

			&.secondary {
				background: #ffffff;
				color: #667eea;
				border: 1px solid #667eea;
			}
		}
	}
}

@keyframes pulse {
	0%, 100% {
		opacity: 1;
	}
	50% {
		opacity: 0.5;
	}
}
</style>
