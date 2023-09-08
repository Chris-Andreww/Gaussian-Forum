<template>
	<view class="container">
		<unicloud-db ref="udb" orderby="comment_date desc" v-slot:default="{data, pagination, loading, hasMore, error}"
			:collection="colList" :page-size="15">
			<view v-if="error">{{error.message}}</view>
			<view v-else-if="data.length">
				<select-checkbox listType="comment" :items="data" @checkEvent="checkEvent"></select-checkbox>
			</view>
			<view class="noContent" v-else>
				<!-- 当没有数据时显示 -->
				<view>
					<u-empty text="内容为空" mode="search"></u-empty>
				</view>
			</view>
			<uni-load-more :status="loading?'loading':(hasMore ? 'more' : 'noMore')"></uni-load-more>
		</unicloud-db>
		<view class="btn">
			<button class="view" type="primary" @click="viewArt" :disabled="viewDisabled">查看</button>
			<button class="delete" type="warn" @click="delArt" :disabled="delDisable" :loading="warnLoading">删除</button>
		</view>
	</view>
</template>

<script>
	import {
		viewArtFun,
	} from '../../utils/tools.js'
	const utilsObj = uniCloud.importObject("utilsObj", {
		customUI: true // 取消自动展示的交互提示界面
	})
	const db = uniCloud.database()
	export default {
		data() {
			return {
				//默认按钮都是禁用状态
				viewDisabled: true,
				delDisable: true,
				warnLoading: false,
				checkboxValue: [],
				colList: [
					db.collection('article_comment').where('user_id==$cloudEnv_uid')
					.field('article_id,comment_content,comment_date').getTemp(),
					db.collection('article').where('delState==false').field('_id,title').getTemp()
				]
			}
		},
		onReachBottom() {
			this.$refs.udb.loadMore()
		},
		methods: {
			//用于接收多选框的触发事件，存放点击的选项
			checkEvent(e) {
				this.checkboxValue = e
			},
			viewArt() {
				viewArtFun(this.checkboxValue,'comment')
			},
			delArt() {
				uni.showModal({
					title: "确认删除该评论吗？",
					confirmColor: "#e15656",
					success: res => {
						if (res.confirm) {
							this.warnLoading = true
							uni.showLoading({
								title: "正在删除"
							})
							//遍历并删除选中的数组内容
							this.checkboxValue.forEach(val => {
								db.collection('article_comment').where(`_id=="${val._id}"`).remove()
								utilsObj.operation("article", "comment_count", val.article_id[0]._id, -
										1)
									.then(res => {
										uni.hideLoading()
										uni.showToast({
											title: "删除成功"
										})
										this.$refs.udb.refresh()
										this.warnLoading = false
									})
							})
						}
					}
				})
			},
			handleItemClick(id) {
				uni.navigateTo({
					url: '/pages/detail/detail?id=' + id
				})
			}
		},
		watch: {
			checkboxValue() {
				if (this.checkboxValue.length == 0) {
					this.viewDisabled = true
					this.delDisable = true
				} else if (this.checkboxValue.length > 1) {
					this.viewDisabled = true
				} else {
					this.viewDisabled = false
					this.delDisable = false
				}
			},
			deep: true
		}
	}
</script>

<style lang="scss">
	.title {
		padding: 30rpx;
		font-size: 40rpx;
	}

	.btn {
		display: flex;
		position: fixed;
		width: 100%;
		bottom: 0rpx;
		justify-content: space-between;

		.all {
			margin: 20rpx;
		}

		.view {
			flex: 1;
			margin: 20rpx;
		}

		.delete {
			flex: 1;
			margin: 20rpx;
		}
	}

	.noContent {
		padding-top: 60rpx;
	}
</style>