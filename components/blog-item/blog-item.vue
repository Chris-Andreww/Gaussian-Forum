<template>
	<view class="blogitem">
		<view class="head">
			<view class="userinfo">
				<view class="avatar">
					<image :src="getUserAvatar(item)" mode="aspectFill"></image>
				</view>
				<!-- 判断用户别名是否存在，不存在就用真实用户名 -->
				<view class="name">{{getUserName(item)}}</view>
				<view class="time">
					<uni-dateformat :date="item.publish_date" format="MM月dd hh:mm"
						:threshold="[60000,3600000*24*30]"></uni-dateformat>
				</view>
			</view>

			<view class="more" @click="SelectShow">
				<text class="iconfont icon-ellipsis"></text>
			</view>
		</view>

		<view class="body" @click="goDetail">
			<view class="title">{{item.title}}</view>
			<view class="text" v-if="item.description">
				<view class="t">{{item.description}}</view>
			</view>
			<view class="piclist" v-if="item.picurls.length">
				<view class="pic" :class="item.picurls.length==1 ? 'only': ''" v-for="(pic,index) in item.picurls"
					:key="pic">
					<image @click.stop="clickPic(index)" :src="pic" mode="aspectFill"></image>
				</view>
			</view>
		</view>

		<view class="info">
			<view class="box"><text class="iconfont icon-a-27-liulan"></text> <text>{{item.view_count}}</text></view>
			<view class="box" @click="goDetail">
				<text class="iconfont icon-a-5-xinxi"></text>
				<text>{{item.comment_count||'评论'}}</text>
			</view>
			<view class="box" :class="item.isLike?'active':''" @click="clickLike"><text
					class="iconfont icon-a-106-xihuan"></text>
				<text>{{item.like_count||'点赞'}}</text>
			</view>
		</view>

	</view>
</template>

<script>
	import pageJson from '@/pages.json'
	import {
		getUserName,
		getUserAvatar,
		likeFun
	} from '../../utils/tools.js'

	import {
		store
	} from '@/uni_modules/uni-id-pages/common/store.js'
	const db = uniCloud.database()
	export default {
		name: "blog-item",
		props: {
			item: {
				type: Object,
				default () {
					return {}
				}
			},
			isLike: Boolean,
			like_count: Number
		},
		data() {
			return {

			};
		},
		created() {

		},
		methods: {
			//挂载导入的方法
			getUserName,
			getUserAvatar,
			//点赞操作
			async clickLike() {

				if (!store.hasLogin) {
					uni.showModal({
						title: "未登录，是否登录？",
						success: res => {
							if (res.confirm) {
								uni.navigateTo({
									url: pageJson.uniIdRouter.loginPage
								})
							}
						}
					})
					return
				}

				//节流操作
				if (!this.throttleFun()) return

				let like_count = this.item.like_count
				this.item.isLike ? like_count-- : like_count++
				let isLike = !this.item.isLike
				this.$emit('update:isLike', isLike)
				this.$emit('update:like_count', like_count)
				//调用点赞同步数据库的方法
				likeFun(this.item._id)
			},
			//节流方法
			throttleFun() {
				//添加节流判断，防止按钮恶意点击，2秒只能触发一次
				let time = Date.now()
				if (time - this.likeTime < 2000) {
					uni.showToast({
						title: "操作太频繁，请稍后再试...",
						icon: "error"
					})
					return false
				}
				this.likeTime = time
				return true
			},
			clickPic(index) {
				uni.previewImage({
					urls: this.item.picurls,
					current: index
				})
			},
			//跳转至详情页
			goDetail() {
				uni.navigateTo({
					url: '/pages/detail/detail?id=' + this.item._id
				})
			},
			//点击更多操作，显示弹窗
			SelectShow() {
				uni.showActionSheet({
					itemList: ["修改", "删除"],
					success: res => {
						//校验用户身份，确定是否允许更多操作
						let uid = uniCloud.getCurrentUserInfo().uid
						if (!(uid == this.item.user_id[0]._id || this.uniIDHasRole('webmaster') || this
								.uniIDHasRole('admin'))) {
							uni.showToast({
								title: "权限不足！您不是该文章作者/管理员",
								icon: "error",
								duration: 2000
							})
							return
						}
						if (res.tapIndex == 0) {
							this.goEdit()
						} else {
							uni.showModal({
								title:"确认删除吗？",
								confirmColor:"#e15656",
								success:res=>{
									if (res.confirm) this.delFun()
								}
							})
						}
					}
				})
			},
			goEdit() {
				uni.$emit('goEdit', this.item)
				uni.navigateTo({
					url: '/pages/edit/edit?id=' + this.item._id,
				})
			},
			delFun() {
				uni.showLoading({
					title: "正在删除"
				})
				db.collection('article').doc(this.item._id).update({
					delState: true,
					Del_date: Date.now()
				}).then(res => {
					this.$emit('delEvent', this.item._id)
					uni.hideLoading()
					uni.showToast({
						title: "删除成功"
					})
				})
			}
		}
	}
</script>

<style lang="scss">
	.blogitem {
		.head {
			display: flex;
			font-size: 32rpx;
			align-items: center;
			justify-content: space-between;

			.userinfo {
				display: flex;
				align-items: center;

				.avatar {
					width: 40rpx;
					height: 40rpx;
					border-radius: 50%;
					overflow: hidden;

					image {
						width: 100%;
						height: 100%;
						display: block;
					}
				}

				.name {
					color: #222;
					padding-left: 10rpx;
				}

				.time {
					color: #888;
					font-size: 22rpx;
					padding-left: 20rpx;
				}
			}

			.more {
				padding: 5rpx;

				.iconfont {
					font-size: 50rpx;
					color: #888;
				}
			}
		}

		.body {
			padding: 15rpx 0 30rpx;

			.title {
				font-size: 44rpx;
				color: #000;
				font-weight: 600;
				text-align: justify;
			}

			.text {
				padding-top: 10rpx;
				padding-bottom: 10rpx;
				font-size: 30rpx;
				text-align: justify;
				color: #888;

				.t {
					overflow: hidden;
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
				}
			}

			.piclist {
				display: flex;
				padding-top: 20rpx;

				.pic {
					width: 225rpx;
					height: 225rpx;
					margin-right: 6rpx;
					overflow: hidden;

					image {
						width: 100%;
						height: 100%;
					}

					&:first-child {
						border-radius: 20rpx 0 0 20rpx;
					}

					&:last-child {
						border-radius: 0 20rpx 20rpx 0;
					}

					&.only {
						border-radius: 20rpx;
					}

				}

			}
		}

		.info {
			display: flex;
			align-items: center;
			justify-content: space-around;
			font-size: 26rpx;
			color: #333;

			.box {
				display: flex;
				align-items: center;
				padding: 15rpx 0 5rpx;
				flex: 1;
				display: flex;
				justify-content: center;

				.iconfont {
					font-size: 40rpx;
					padding-right: 10rpx;
				}
			}

			.box.active {
				color: #0199FE;
			}
		}
	}
</style>