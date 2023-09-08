<template>
	<view class="container">
		<unicloud-db ref="udb" :where="'user_id==$cloudEnv_uid && delState==false'" orderby="publish_date desc"
			v-slot:default="{data, pagination, loading, hasMore, error}" collection="article" 
			field="title,description" :page-size="15">
			<view v-if="error">{{error.message}}</view>
			<view v-else-if="data.length">
				<select-checkbox listType="article" :items="data" @checkEvent="checkEvent"></select-checkbox>
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
			<button class="delete" type="warn" @click="delArt" :disabled="delDisable">删除</button>
		</view>
	</view>
</template>

<script>
	import {
		viewArtFun,
		delArtTempFun
	} from '../../utils/tools.js'
	const db = uniCloud.database()
	export default {
		data() {
			return {
				//默认按钮都是禁用状态
				viewDisabled: true,
				delDisable: true,
				checkboxValue: []
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
				viewArtFun(this.checkboxValue, 'article')
			},
			delArt() {
				uni.showModal({
					title: "确认删除吗？",
					confirmColor: "#e15656",
					success: res => {
						if (res.confirm) {
							delArtTempFun(this.checkboxValue).then(res=>{
								if(res[0]){
									uni.hideLoading()
									uni.showToast({
										title: "删除成功"
									})
									this.$refs.udb.refresh()
								}
							})
						}
					}
				})
			},
			handleItemClick(id) {
				uni.navigateTo({
					url: '/pages/detail/detail?id=' + id
				})
			},
			fabClick() {
				// 打开新增页面
				uni.navigateTo({
					url: "/pages/edit/edit?id=0"
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
			}
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