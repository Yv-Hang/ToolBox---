<template>
	<view class="app-container">
		<!-- 顶部菜单栏 -->
		<TopHeader
			currentPage="chat"
			:showFunctionDropdown="true"
			:functionOptions="functionOptions"
			:currentFunctionIndex="currentFunctionIndex"
			@select-function="selectFunction"
		/>

		<!-- 主内容区 - 文案生成模式 -->
		<view class="main-content" v-if="currentFunctionIndex === 0">
			<!-- 左侧输入区域 -->
			<scroll-view scroll-y class="left-panel">
				<view class="panel-title">{{ t('paramSettings') }}</view>

				<view class="form-group">
					<text class="label">{{ t('purposeLabel') }}</text>
					<textarea
						v-model="copyFormData.purpose"
						class="textarea"
						:placeholder="t('purposePlaceholder')"
						maxlength="200"
					/>
				</view>

				<view class="form-group">
					<text class="label">{{ t('keywordsLabel') }}</text>
					<textarea
						v-model="copyFormData.keywords"
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
							:class="{ active: copyFormData.style === styleKeys[index] }"
							@click="copyFormData.style = styleKeys[index]"
						>{{ style }}</text>
					</view>
				</view>

				<view class="form-group">
					<text class="label">{{ t('wordCountLabel') }}</text>
					<input
						type="number"
						v-model.number="copyFormData.wordCount"
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
							:class="{ active: copyFormData.count === num }"
							@click="copyFormData.count = num"
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
								:class="{ active: copyFormData.language === lang.value }"
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
						<view v-if="!copyResultContent && !copyGenerating" class="empty-state">
							<text class="empty-icon">✨</text>
							<text class="empty-text">{{ t('emptyState') }}</text>
						</view>
						<view v-if="copyGenerating" class="loading-state">
							<text class="loading-text">{{ t('generating') }}</text>
						</view>
						<view v-if="copyResultContent" class="result-text">{{ copyResultContent }}</view>

						<button
							class="generate-btn-center"
							:loading="copyGenerating"
							@click="handleGenerate"
						>
							{{ copyGenerating ? t('generatingBtn') : t('startGenerate') }}
						</button>
					</view>
				</scroll-view>

				<view class="result-footer" v-if="copyResultContent">
					<button class="action-btn" @click="copyResult">{{ t('copyResult') }}</button>
					<button class="action-btn secondary" @click="handleGenerate">{{ t('regenerate') }}</button>
				</view>
			</view>
		</view>

		<!-- 主内容区 - 语音合成模式 -->
		<view class="main-content" v-if="currentFunctionIndex === 1">
			<!-- 左侧参数面板 -->
			<scroll-view scroll-y class="left-panel">
				<!-- 模式切换标签 -->
				<view class="mode-tabs">
					<view
						class="mode-tab"
						:class="{ active: ttsMode === 'preset' }"
						@click="ttsMode = 'preset'"
					>{{ t('ttsModePreset') }}</view>
					<view
						class="mode-tab"
						:class="{ active: ttsMode === 'design' }"
						@click="ttsMode = 'design'"
					>{{ t('ttsModeDesign') }}</view>
					<view
						class="mode-tab"
						:class="{ active: ttsMode === 'clone' }"
						@click="ttsMode = 'clone'"
					>{{ t('ttsModeClone') }}</view>
				</view>

				<!-- 预置音色模式 -->
				<view v-if="ttsMode === 'preset'" class="tts-mode-content">
					<view class="form-group">
						<text class="label">{{ t('ttsTextLabel') }}</text>
						<textarea
							v-model="ttsFormData.text"
							class="textarea tts-textarea"
							:placeholder="t('ttsTextPlaceholder')"
							maxlength="5000"
						/>
					</view>

					<view class="form-group">
						<text class="label">{{ t('ttsVoiceLabel') }}</text>
						<view class="voice-grid">
							<view
								v-for="voice in presetVoices"
								:key="voice.voiceId"
								class="voice-card"
								:class="{ active: ttsFormData.voice === voice.voiceId }"
								@click.stop="ttsFormData.voice = voice.voiceId"
							>
								<text class="voice-name">{{ voice.name }}</text>
								<text class="voice-info">{{ t('lang.' + voice.language) }} · {{ t(voice.gender === 'female' ? 'female' : 'male') }}</text>
							</view>
						</view>
					</view>

					<view class="form-group">
						<text class="label">{{ t('ttsStyleLabel') }}</text>
						<textarea
							v-model="ttsFormData.styleInstruction"
							class="textarea style-textarea"
							:placeholder="t('ttsStylePlaceholder')"
							maxlength="200"
						/>
						<view class="style-tags">
							<text
								v-for="tag in styleTagOptions"
								:key="tag.key"
								class="style-tag"
								:class="{ active: ttsFormData.styleTags.includes(tag.key) }"
								@click.stop="toggleStyleTag(tag.key)"
							>({{ t(tag.key) }})</text>
						</view>
					</view>

					<view class="form-group">
						<text class="label">{{ t('ttsFormatLabel') }}</text>
						<view class="format-selector">
							<view
								class="format-tag"
								:class="{ active: ttsFormData.audioFormat === 'wav' }"
								@click="ttsFormData.audioFormat = 'wav'"
							>WAV</view>
							<view
								class="format-tag"
								:class="{ active: ttsFormData.audioFormat === 'mp3' }"
								@click="ttsFormData.audioFormat = 'mp3'"
							>MP3</view>
						</view>
					</view>
				</view>

				<!-- 音色设计模式 -->
				<view v-if="ttsMode === 'design'" class="tts-mode-content">
					<view class="form-group">
						<text class="label">{{ t('ttsVoiceDescLabel') }}</text>
						<textarea
							v-model="ttsFormData.voiceDescription"
							class="textarea tts-textarea"
							:placeholder="t('ttsVoiceDescPlaceholder')"
							maxlength="200"
						/>
					</view>

					<view class="form-group">
						<text class="label">{{ t('ttsTextLabel') }}</text>
						<textarea
							v-model="ttsFormData.text"
							class="textarea tts-textarea"
							:placeholder="t('ttsDesignTextPlaceholder')"
							maxlength="5000"
						/>
					</view>

					<view class="form-group">
						<view class="checkbox-row">
							<checkbox
								:checked="ttsFormData.optimizeTextPreview"
								@change="ttsFormData.optimizeTextPreview = !ttsFormData.optimizeTextPreview"
							/>
							<text class="checkbox-label">{{ t('ttsOptimizeText') }}</text>
						</view>
					</view>

					<view class="form-group">
						<text class="label">{{ t('ttsFormatLabel') }}</text>
						<view class="format-selector">
							<view
								class="format-tag"
								:class="{ active: ttsFormData.audioFormat === 'wav' }"
								@click="ttsFormData.audioFormat = 'wav'"
							>WAV</view>
							<view
								class="format-tag"
								:class="{ active: ttsFormData.audioFormat === 'mp3' }"
								@click="ttsFormData.audioFormat = 'mp3'"
							>MP3</view>
						</view>
					</view>
				</view>

				<!-- 音色复刻模式 -->
				<view v-if="ttsMode === 'clone'" class="tts-mode-content">
					<view class="form-group">
						<text class="label">{{ t('ttsAudioSampleLabel') }}</text>
						<view class="upload-area" @click="chooseAudioFile">
							<text v-if="!ttsFormData.audioSample" class="upload-hint">{{ t('ttsUploadHint') }}</text>
							<text v-else class="uploaded-file">{{ ttsFormData.audioSample.name }}</text>
						</view>
					</view>

					<view class="form-group">
						<text class="label">{{ t('ttsTextLabel') }}</text>
						<textarea
							v-model="ttsFormData.text"
							class="textarea tts-textarea"
							:placeholder="t('ttsTextPlaceholder')"
							maxlength="5000"
						/>
					</view>

					<view class="form-group">
						<text class="label">{{ t('ttsStyleLabel') }}</text>
						<textarea
							v-model="ttsFormData.styleInstruction"
							class="textarea style-textarea"
							:placeholder="t('ttsStylePlaceholder')"
							maxlength="200"
						/>
					</view>

					<view class="form-group">
						<text class="label">{{ t('ttsFormatLabel') }}</text>
						<view class="format-selector">
							<view
								class="format-tag"
								:class="{ active: ttsFormData.audioFormat === 'wav' }"
								@click="ttsFormData.audioFormat = 'wav'"
							>WAV</view>
							<view
								class="format-tag"
								:class="{ active: ttsFormData.audioFormat === 'mp3' }"
								@click="ttsFormData.audioFormat = 'mp3'"
							>MP3</view>
						</view>
					</view>
				</view>

				<!-- 开始合成按钮 -->
				<button
					class="synthesize-btn"
					:loading="ttsSynthesizing"
					:disabled="ttsSynthesizing"
					@click="handleSynthesize"
				>
					{{ ttsSynthesizing ? t('ttsSynthesizing') : t('ttsStartSynthesize') }}
				</button>
			</scroll-view>

			<!-- 右侧播放面板 -->
			<view class="right-panel">
				<view class="panel-header">
					<text class="panel-title">{{ t('ttsPanelTitle') }}</text>
				</view>

				<view class="tts-playback-content">
					<!-- 空闲状态 -->
					<view v-if="ttsPlayState === 'idle'" class="tts-idle-state">
						<text class="idle-icon">🔊</text>
						<text class="idle-text">{{ t('ttsIdleText') }}</text>
					</view>

					<!-- 合成中状态 -->
					<view v-if="ttsPlayState === 'synthesizing'" class="tts-synthesizing-state">
						<text class="synth-icon">⏳</text>
						<text class="synth-text">{{ t('ttsSynthesizingText') }}</text>
						<view class="progress-bar">
							<view class="progress-inner" :style="{ width: ttsProgress + '%' }"></view>
						</view>
					</view>

					<!-- 准备播放状态 -->
					<view v-if="ttsPlayState === 'ready'" class="tts-ready-state">
						<view class="play-controls">
							<view class="play-btn" @click="playAudio">
								<text class="play-icon">▶</text>
							</view>
							<view class="control-btns">
								<view class="control-btn" @click="pauseAudio">
									<text>⏸</text>
								</view>
								<view class="control-btn" @click="stopAudio">
									<text>⏹</text>
								</view>
							</view>
						</view>

						<!-- 进度条 -->
						<view class="audio-progress">
							<slider
								:min="0"
								:max="100"
								:value="audioProgress"
								@change="onProgressChange"
								class="progress-slider"
							/>
							<view class="time-display">
								<text>{{ formatTime(currentTime) }} / {{ formatTime(totalDuration) }}</text>
							</view>
						</view>

						<!-- 操作按钮 -->
						<view class="action-buttons">
							<button class="action-btn" @click="downloadAudio">{{ t('ttsDownload') }}</button>
							<button class="action-btn secondary" @click="copyAudioUrl">{{ t('ttsCopyUrl') }}</button>
						</view>

						<!-- 成功信息 -->
						<view class="success-info">
							<text class="success-icon">✓</text>
							<text class="success-text">{{ t('ttsSuccess') }} ({{ ttsDuration }}{{ t('ttsSeconds') }})</text>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getAIModels, generateCopywriting } from '@/api/ai.js';
import { t, getLocale, setLocale, getLocaleOptions } from '@/locales/index.js';
import TopHeader from '@/components/TopHeader.vue';

// ================================================================
// [跳过登录检查] 当前用户使用默认值，便于测试
// 复原方法：在 App.vue 中恢复登录检查代码
// ================================================================
const currentUser = ref(uni.getStorageSync('current_user') || { username: 'TestUser', email: 'test@example.com', id: '1' });

// 功能下拉框相关
const functionOptions = computed(() => [t('copywriting'), t('ttsTitle')]);
const currentFunctionIndex = ref(0);
const currentFunctionName = computed(() => functionOptions.value[currentFunctionIndex.value] || t('copywriting'));

const selectFunction = (index) => {
	currentFunctionIndex.value = index;
};

// ================================================================
// 文案生成相关
// ================================================================
const copyGenerating = ref(false);
const copyResultContent = ref('');
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

// 文案表单数据
const copyFormData = ref({
	purpose: '',
	keywords: '',
	style: 'formal',
	wordCount: 300,
	count: 1,
	language: '简体中文'
});

// 生成语言选项
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
	const lang = languageOptions.find(l => l.value === copyFormData.value.language);
	return lang ? lang.label : '简体中文';
});

const selectLanguage = (value) => {
	copyFormData.value.language = value;
	showLanguagePicker.value = false;
};

// 风格选项
const styleKeys = ['formal', 'humor', 'literary', 'lively', 'concise', 'luxury'];
const styleOptions = computed(() => styleKeys.map(key => t(`styles.${key}`)));
const countOptions = [1, 2, 3, 5];

// ================================================================
// TTS 语音合成相关
// ================================================================

// TTS 模式: preset(预置音色), design(音色设计), clone(音色复刻)
const ttsMode = ref('preset');
const ttsSynthesizing = ref(false);
const ttsPlayState = ref('idle'); // idle, synthesizing, ready, playing, paused, stopped
const ttsProgress = ref(0);
const ttsDuration = ref(0);

// 预置音色列表
const presetVoices = [
	{ voiceId: '冰糖', name: '冰糖', language: '中文', gender: 'female' },
	{ voiceId: '茉莉', name: '茉莉', language: '中文', gender: 'female' },
	{ voiceId: '苏打', name: '苏打', language: '中文', gender: 'male' },
	{ voiceId: '白桦', name: '白桦', language: '中文', gender: 'male' },
	{ voiceId: 'Mia', name: 'Mia', language: '英文', gender: 'female' },
	{ voiceId: 'Chloe', name: 'Chloe', language: '英文', gender: 'female' },
	{ voiceId: 'Milo', name: 'Milo', language: '英文', gender: 'male' },
	{ voiceId: 'Dean', name: 'Dean', language: '英文', gender: 'male' }
];

// 风格标签选项
const styleTagOptions = [
	{ key: '开心' },
	{ key: '悲伤' },
	{ key: '愤怒' },
	{ key: '温柔' },
	{ key: '慵懒' },
	{ key: '磁性' },
	{ key: '活泼' },
	{ key: '深沉' },
	{ key: '东北话' },
	{ key: '粤语' },
	{ key: '唱歌' }
];

// TTS 表单数据
const ttsFormData = ref({
	text: '',
	voice: '冰糖',
	styleInstruction: '',
	styleTags: [],
	audioFormat: 'wav',
	voiceDescription: '',
	optimizeTextPreview: true,
	audioSample: null
});

// 音频播放相关
const innerAudioContext = uni.createInnerAudioContext();
const audioProgress = ref(0);
const currentTime = ref(0);
const totalDuration = ref(0);
const audioUrl = ref('');

// 切换风格标签
const toggleStyleTag = (tag) => {
	const index = ttsFormData.value.styleTags.indexOf(tag);
	if (index > -1) {
		ttsFormData.value.styleTags.splice(index, 1);
	} else {
		ttsFormData.value.styleTags.push(tag);
	}
};

// 选择音频文件
const chooseAudioFile = () => {
	uni.chooseFile({
		count: 1,
		type: 'file',
		extension: ['mp3', 'wav'],
		success: (res) => {
			if (res.tempFiles && res.tempFiles.length > 0) {
				const file = res.tempFiles[0];
				if (file.size > 10 * 1024 * 1024) {
					uni.showToast({ title: t('ttsFileSizeError'), icon: 'none' });
					return;
				}
				ttsFormData.value.audioSample = {
					name: file.name,
					path: file.path || file.url,
					size: file.size
				};
			}
		},
		fail: () => {
			uni.showToast({ title: t('ttsChooseFileError'), icon: 'none' });
		}
	});
};

// 合成语音
const handleSynthesize = async () => {
	// 验证表单
	if (ttsMode.value === 'preset' || ttsMode.value === 'clone') {
		if (!ttsFormData.value.text) {
			return uni.showToast({ title: t('ttsTextRequired'), icon: 'none' });
		}
	}
	if (ttsMode.value === 'design') {
		if (!ttsFormData.value.voiceDescription) {
			return uni.showToast({ title: t('ttsVoiceDescRequired'), icon: 'none' });
		}
	}
	if (ttsMode.value === 'clone' && !ttsFormData.value.audioSample) {
		return uni.showToast({ title: t('ttsAudioSampleRequired'), icon: 'none' });
	}

	ttsSynthesizing.value = true;
	ttsPlayState.value = 'synthesizing';
	ttsProgress.value = 0;

	// 模拟合成进度
	const progressTimer = setInterval(() => {
		if (ttsProgress.value < 90) {
			ttsProgress.value += Math.random() * 10;
		}
	}, 500);

	try {
		// 构建风格标签
		let finalText = ttsFormData.value.text;
		if (ttsFormData.value.styleTags.length > 0) {
			const tagsStr = ttsFormData.value.styleTags.map(tag => `(${tag})`).join('');
			finalText = tagsStr + finalText;
		}

		// 根据模式调用不同接口
		let params = {};
		let apiPath = '';

		if (ttsMode.value === 'preset') {
			apiPath = '/api/tts/synthesize';
			params = {
				model: 'mimo-v2.5-tts',
				text: finalText,
				voice: ttsFormData.value.voice,
				styleInstruction: ttsFormData.value.styleInstruction,
				audioFormat: ttsFormData.value.audioFormat
			};
		} else if (ttsMode.value === 'design') {
			apiPath = '/api/tts/voice-design';
			params = {
				model: 'mimo-v2.5-tts-voicedesign',
				voiceDescription: ttsFormData.value.voiceDescription,
				text: ttsFormData.value.text,
				optimizeTextPreview: ttsFormData.value.optimizeTextPreview,
				audioFormat: ttsFormData.value.audioFormat
			};
		} else if (ttsMode.value === 'clone') {
			apiPath = '/api/tts/voice-clone';
			params = {
				model: 'mimo-v2.5-tts-voiceclone',
				text: finalText,
				styleInstruction: ttsFormData.value.styleInstruction,
				audioFormat: ttsFormData.value.audioFormat
			};
		}

		console.log('[TTS] 请求参数:', params);

		// TODO: 调用实际API
		// const res = await uni.request({
		// 	url: apiPath,
		// 	method: 'POST',
		// 	data: params
		// });

		// 模拟成功响应
		await new Promise(resolve => setTimeout(resolve, 2000));

		// 模拟音频URL
		audioUrl.value = 'https://example.com/audio/tts_demo.wav';
		ttsDuration.value = 15.3;
		totalDuration.value = 15.3;

		clearInterval(progressTimer);
		ttsProgress.value = 100;
		ttsPlayState.value = 'ready';

		uni.showToast({ title: t('ttsSuccess'), icon: 'success' });

	} catch (e) {
		clearInterval(progressTimer);
		console.error('[TTS] 合成失败:', e);
		uni.showToast({ title: t('ttsSynthesizeError'), icon: 'none' });
		ttsPlayState.value = 'idle';
	} finally {
		ttsSynthesizing.value = false;
	}
};

// 播放音频
const playAudio = () => {
	if (!audioUrl.value) return;

	innerAudioContext.src = audioUrl.value;
	innerAudioContext.play();

	innerAudioContext.onPlay(() => {
		ttsPlayState.value = 'playing';
	});

	innerAudioContext.onTimeUpdate(() => {
		currentTime.value = innerAudioContext.currentTime;
		totalDuration.value = innerAudioContext.duration;
		audioProgress.value = (innerAudioContext.currentTime / innerAudioContext.duration) * 100;
	});

	innerAudioContext.onEnded(() => {
		ttsPlayState.value = 'ready';
		audioProgress.value = 0;
		currentTime.value = 0;
	});

	innerAudioContext.onError((err) => {
		console.error('[TTS] 播放错误:', err);
		uni.showToast({ title: t('ttsPlayError'), icon: 'none' });
	});
};

// 暂停音频
const pauseAudio = () => {
	innerAudioContext.pause();
	ttsPlayState.value = 'paused';
};

// 停止音频
const stopAudio = () => {
	innerAudioContext.stop();
	ttsPlayState.value = 'ready';
	audioProgress.value = 0;
	currentTime.value = 0;
};

// 进度变化
const onProgressChange = (e) => {
	const seekTime = (e.detail.value / 100) * totalDuration.value;
	innerAudioContext.seek(seekTime);
};

// 格式化时间
const formatTime = (seconds) => {
	if (!seconds || isNaN(seconds)) return '00:00';
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 下载音频
const downloadAudio = () => {
	if (!audioUrl.value) return;
	uni.showToast({ title: t('ttsDownloadStart'), icon: 'success' });
	// 实际下载逻辑
	// uni.downloadFile({
	// 	url: audioUrl.value,
	// 	success: (res) => {
	// 		uni.saveFile({
	// 			tempFilePath: res.tempFilePath,
	// 			success: () => {
	// 				uni.showToast({ title: t('ttsDownloadSuccess'), icon: 'success' });
	// 			}
	// 		});
	// 	}
	// });
};

// 复制音频URL
const copyAudioUrl = () => {
	if (!audioUrl.value) return;
	uni.setClipboardData({
		data: audioUrl.value,
		success: () => {
			uni.showToast({ title: t('ttsCopySuccess'), icon: 'success' });
		}
	});
};

// ================================================================
// 生命周期
// ================================================================
onMounted(() => {
	loadModels();
});

onUnmounted(() => {
	if (innerAudioContext) {
		innerAudioContext.destroy();
	}
});

// 加载可用模型列表
const loadModels = async () => {
	try {
		const res = await getAIModels();
		console.log('模型列表接口返回:', res);

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
		} else {
			const defaultModels = [
				{ name: 'GPT-4', code: 'gpt-4' },
				{ name: 'GPT-3.5', code: 'gpt-3.5' },
				{ name: 'Claude', code: 'claude' }
			];
			modelList.value = defaultModels;
			modelNames.value = defaultModels.map(m => m.name);
		}
	} catch (e) {
		console.error('加载模型列表失败:', e);
		modelList.value = [
			{ name: 'GPT-4', code: 'gpt-4' },
			{ name: 'GPT-3.5', code: 'gpt-3.5' }
		];
		modelNames.value = modelList.value.map(m => m.name);
	}
};

// 模型切换
const selectModel = (index) => {
	currentModelIndex.value = index;
	showModelPicker.value = false;
};

// 生成文案
const handleGenerate = async () => {
	if (!copyFormData.value.purpose) {
		return uni.showToast({ title: t('请输入用途'), icon: 'none' });
	}
	if (!copyFormData.value.keywords) {
		return uni.showToast({ title: t('请输入主题'), icon: 'none' });
	}

	copyGenerating.value = true;
	copyResultContent.value = '';

	try {
		const params = {
			userId: currentUser.value.id,
			purpose: copyFormData.value.purpose,
			keywords: copyFormData.value.keywords,
			style: copyFormData.value.style,
			wordCount: copyFormData.value.wordCount || 300,
			count: copyFormData.value.count || 1,
			language: copyFormData.value.language || '简体中文',
			model: selectedModel.value
		};

		const res = await generateCopywriting(params);

		if (res) {
			if (res.success === false || res.error) {
				const errorMsg = res.message || res.error || '生成失败';
				uni.showModal({
					title: '生成失败',
					content: errorMsg.substring(0, 200),
					showCancel: false
				});
				return;
			}
			copyResultContent.value = res.content || res.data || res.msg || JSON.stringify(res);
		}
	} catch (e) {
		console.error('生成失败', e);
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
		copyGenerating.value = false;
	}
};

// 复制结果
const copyResult = () => {
	if (!copyResultContent.value) return;
	uni.setClipboardData({
		data: copyResultContent.value,
		success: () => {
			uni.showToast({ title: t('复制成功'), icon: 'success' });
		}
	});
};
</script>

<style lang="scss" scoped>
.app-container {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: #f5f7fa;
}

/* 主内容区 */
.main-content {
	flex: 1;
	display: flex;
	flex-direction: row;
	padding: 32rpx;
	gap: 32rpx;
	overflow: hidden;
}

/* 左侧面板 */
.left-panel {
	width: 680rpx;
	min-width: 680rpx;
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
				width: 260rpx;
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
					font-size: 20rpx;
					color: #999;
					transition: transform 0.3s;

					&.arrow-up {
						transform: rotate(-180deg);
					}
				}
			}

			.model-dropdown {
				position: absolute;
				top: calc(100% + 8rpx);
				left: 0;
				width: 360rpx;
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

	/* TTS 播放面板样式 */
	.tts-playback-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40rpx;
	}

	.tts-idle-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		.idle-icon {
			font-size: 120rpx;
			margin-bottom: 24rpx;
		}

		.idle-text {
			font-size: 28rpx;
			color: #999;
		}
	}

	.tts-synthesizing-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 24rpx;

		.synth-icon {
			font-size: 80rpx;
			animation: pulse 1.5s infinite;
		}

		.synth-text {
			font-size: 28rpx;
			color: #667eea;
		}

		.progress-bar {
			width: 400rpx;
			height: 8rpx;
			background-color: #e8e8e8;
			border-radius: 4rpx;
			overflow: hidden;

			.progress-inner {
				height: 100%;
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				transition: width 0.3s;
			}
		}
	}

	.tts-ready-state {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 40rpx;

		.play-controls {
			display: flex;
			align-items: center;
			gap: 32rpx;

			.play-btn {
				width: 120rpx;
				height: 120rpx;
				border-radius: 60rpx;
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;

				.play-icon {
					font-size: 48rpx;
					color: #ffffff;
				}
			}

			.control-btns {
				display: flex;
				gap: 16rpx;

				.control-btn {
					width: 72rpx;
					height: 72rpx;
					border-radius: 36rpx;
					background-color: #f5f7fa;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					font-size: 32rpx;
				}
			}
		}

		.audio-progress {
			width: 100%;
			display: flex;
			flex-direction: column;
			gap: 8rpx;

			.progress-slider {
				width: 100%;
			}

			.time-display {
				text-align: center;
				font-size: 24rpx;
				color: #999;
			}
		}

		.action-buttons {
			display: flex;
			gap: 24rpx;
			width: 100%;

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

		.success-info {
			display: flex;
			align-items: center;
			gap: 8rpx;

			.success-icon {
				color: #52c41a;
				font-size: 28rpx;
			}

			.success-text {
				font-size: 26rpx;
				color: #52c41a;
			}
		}
	}
}

/* TTS 模式切换标签 */
.mode-tabs {
	display: flex;
	gap: 16rpx;
	margin-bottom: 24rpx;
	padding: 8rpx;
	background-color: #ffffff;
	border-radius: 8rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);

	.mode-tab {
		flex: 1;
		padding: 16rpx 24rpx;
		text-align: center;
		font-size: 26rpx;
		color: #333;
		background-color: transparent;
		border-radius: 6rpx;
		cursor: pointer;
		transition: all 0.3s;

		&:hover {
			background-color: #f5f7fa;
		}

		&.active {
			background-color: #f0f4ff;
			color: #667eea;
			font-weight: 600;
		}
	}
}

/* TTS 模式内容 */
.tts-mode-content {
	flex: 1;
	overflow-y: auto;
}

/* TTS 音色选择网格 */
.voice-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16rpx;

	.voice-card {
		padding: 24rpx;
		border: 1px solid #e8e8e8;
		border-radius: 12rpx;
		cursor: pointer;
		transition: all 0.3s;

		&:hover {
			border-color: #667eea;
		}

		&.active {
			border-color: #667eea;
			background-color: #f0f4ff;
		}

		.voice-name {
			display: block;
			font-size: 28rpx;
			color: #333;
			font-weight: 600;
			margin-bottom: 8rpx;
		}

		.voice-info {
			display: block;
			font-size: 22rpx;
			color: #999;
		}
	}
}

/* TTS 文本框 */
.tts-textarea {
	min-height: 200rpx !important;
}

.style-textarea {
	min-height: 100rpx !important;
}

/* TTS 格式选择 */
.format-selector {
	display: flex;
	gap: 16rpx;

	.format-tag {
		padding: 16rpx 40rpx;
		border: 1px solid #e8e8e8;
		border-radius: 8rpx;
		font-size: 26rpx;
		color: #666;
		cursor: pointer;
		transition: all 0.3s;

		&.active {
			border-color: #667eea;
			background-color: #667eea;
			color: #ffffff;
		}
	}
}

/* TTS 复刻模式上传区域 */
.upload-area {
	width: 100%;
	min-height: 160rpx;
	border: 2rpx dashed #e8e8e8;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.3s;

	&:hover {
		border-color: #667eea;
		background-color: #f5f7fa;
	}

	.upload-hint {
		font-size: 26rpx;
		color: #999;
	}

	.uploaded-file {
		font-size: 26rpx;
		color: #667eea;
	}
}

/* TTS 合成按钮 */
.synthesize-btn {
	margin-top: 24rpx;
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #ffffff;
	font-size: 30rpx;
	font-weight: 600;
	border-radius: 44rpx;
	box-shadow: 0 6rpx 16rpx rgba(102, 126, 234, 0.3);

	&::after {
		border: none;
	}

	&[disabled] {
		opacity: 0.6;
	}
}

/* TTS 复选框行 */
.checkbox-row {
	display: flex;
	align-items: center;
	gap: 16rpx;

	.checkbox-label {
		font-size: 26rpx;
		color: #666;
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
