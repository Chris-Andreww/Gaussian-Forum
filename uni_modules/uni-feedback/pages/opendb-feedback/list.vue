<template>
	<view class="container">
		<unicloud-db ref="udb" v-slot:default="{data, pagination, loading, hasMore, error}" collection="opendb-feedback"
			field="content" :page-size="15">
			<view v-if="error">该用户权限不足,无法查看!</view>
			<view v-else-if="data">
				<uni-list>
					<uni-list-item v-for="(item, index) in data" :key="index" showArrow :clickable="true"
						@click="handleItemClick(item._id)">
						<template v-slot:body>
							<text class="content">
								反馈内容：{{item.content}}
							</text>
						</template>
					</uni-list-item>
				</uni-list>
			</view>
			<uni-load-more :status="loading?'loading':(hasMore ? 'more' : 'noMore')"></uni-load-more>
		</unicloud-db>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				loadMore: {
					contentdown: '',
					contentrefresh: '',
					contentnomore: ''
				}
			}
		},
		onPullDownRefresh() {
			this.$refs.udb.loadData({
				clear: true
			}, () => {
				uni.stopPullDownRefresh()
			})
		},
		onReachBottom() {
			this.$refs.udb.loadMore()
		},
		methods: {
			handleItemClick(id) {
				uni.navigateTo({
					url: './detail?id=' + id
				})
			}
		}
	}
</script>

<style lang="scss">
	.content {
		width: 90%;
		/*动态规定盒子宽高*/
		font-size: 40rpx;
		overflow: hidden;
		/* 超出部分隐藏 */
		display: -webkit-box;
		/* 对象作为伸缩盒子模型显示 */
		-webkit-box-orient: vertical;
		/* 设置或检索伸缩盒对象的子元素的排列方式 */
		-webkit-line-clamp: 1;
		/* 显示的行数 */
	}
</style>