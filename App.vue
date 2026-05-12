<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			const user = uni.getStorageSync('current_user');
			if (!user || !user.id) {
				uni.reLaunch({ url: '/pages/index/index' });
			}
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
