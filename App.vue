<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')

			// ================================================================
			// [跳过登录检查] - 直接进入主界面
			// ================================================================
			// 原始登录检查代码已注释，如需恢复，请：
			// 1. 取消注释下方的登录检查代码
			// 2. 在 pages.json 中把 pages/index/index 放回第一页
			// ================================================================

			/*
			const user = uni.getStorageSync('current_user');
			if (!user || !user.id) {
				uni.reLaunch({ url: '/pages/index/index' });
			}
			*/

			console.log('[跳过登录] 直接进入主界面');
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
