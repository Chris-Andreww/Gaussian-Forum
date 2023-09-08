<template>
	<view class="user">
		<view class="top">
			<view class="group">
				<view class="userinfo">
					<view class="pic">
						<!-- 判断用户是否有头像，有就用网络头像，没有就用v-else后面的本地头像 -->
						<image v-if="hasLogin&&userInfo.avatar_file&&userInfo.avatar_file.url"
							:src="userInfo.avatar_file.url" mode="aspectFill"></image>
						<image v-else src="../../static/images/user-default.jpg" mode="aspectFill"></image>
					</view>
					<view class="text" v-if="isLogin" @click="toUserInfo">
						<!-- 如果用户有别名就显示别名，以此类推 -->
						<view class="nickname">{{userInfo.nickname||userInfo.username||userInfo.mobile}}</view>
						<view class="year">
							<uni-dateformat :date="userInfo.register_date"
								:threshold="[3600,99*365*24*60*60*1000]"></uni-dateformat>
							注册
						</view>
					</view>
					<view class="text" v-else @click="toLogin">
						<view class="nickname">点击登录</view>
					</view>
				</view>

				<view class="more">
					<text class="iconfont icon-a-10-you"></text>
				</view>
			</view>

			<view class="bg">
				<!-- 判断用户是否有头像，有就用网络头像，没有就用v-else后面的本地头像 -->
				<image v-if="hasLogin&&userInfo.avatar_file&&userInfo.avatar_file.url" :src="userInfo.avatar_file.url"
					mode="aspectFill"></image>
				<image v-else src="../../static/images/user-default.jpg" mode="aspectFill"></image>
			</view>
		</view>

		<view class="main">
			<view class="info" v-if="isLogin">
				<view class="item"><text>{{totalObj.likeNum}}</text>获赞</view>
				<!-- <view class="item"><text>11</text>评论</view> -->
				<view class="item"><text>{{totalObj.artNum}}</text>发文</view>
			</view>

			<view class="list">
				<view class="group" v-if="isLogin">
					<view class="item" @click="myArticle">
						<view class="left"><text class="iconfont icon-a-24-bianji"></text>
							<text class="text">我的文章</text>
						</view>
						<view class="right"><text class="iconfont icon-a-10-you"></text></view>
					</view>
					<view class="item" @click="myLike">
						<view class="left"><text class="iconfont icon-a-106-xihuan"></text><text
								class="text">我的点赞</text></view>
						<view class="right"><text class="iconfont icon-a-10-you"></text></view>
					</view>
					<view class="item" @click="myComment">
						<view class="left"><text class="iconfont icon-a-21-xiugai"></text>
						<text class="text">评论过的</text>
						</view>
						<view class="right"><text class="iconfont icon-a-10-you"></text></view>
					</view>
					<view class="item" @click="myDel">
						<view class="left"><text class="iconfont icon-a-123-cuowu"></text><text
								class="text">我删除的文章</text></view>
						<view class="right"><text class="iconfont icon-a-10-you"></text></view>
					</view>
				</view>

				<view class="group">
					<view class="item" @click="about()">
						<view class="left"><text class="iconfont icon-a-32-wenjian"></text>
							<text class="text">关于</text>
						</view>
						<view class="right"><text class="iconfont icon-a-10-you"></text></view>
					</view>
					<view class="item" v-if="uniIDHasRole('admin') || uniIDHasRole('webmaster')" @click="showUserFeedBack()">
						<view class="left">
							<text class="iconfont icon-a-5-xinxi">
							</text><text class="text">用户反馈信息</text>
						</view>
						<view class="right"><text class="iconfont icon-a-10-you"></text></view>
					</view>
					<view class="item" v-else>
						<view class="left" @click="goFeedBack">
							<text class="iconfont icon-a-5-xinxi">
							</text><text class="text">意见反馈</text>
						</view>
						<view class="right"><text class="iconfont icon-a-10-you"></text></view>
					</view>
				</view>

				<view class="group" v-if="isLogin">
					<view class="item" @click="logout">
						<view class="left"><text class="iconfont icon-a-73-tuichu"></text><text class="text">退出登录</text>
						</view>
						<view class="right"><text class="iconfont icon-a-10-you"></text></view>
					</view>
				</view>
			</view>
		</view>

	</view>
</template>

<script>
	import pageJson from '@/pages.json'
	import {
		store,
		mutations
	} from '@/uni_modules/uni-id-pages/common/store.js'
	const db = uniCloud.database()

	export default {
		data() {
			return {
				isLogin: false,
				//统计用户的发布点赞信息
				totalObj: {
					artNum: 0,
					likeNum: 0
				}
			};
		},
		onShow() {
			this.isLogin = this.hasLogin
			this.getTotal()
		},
		computed: {
			//获取并返回本地保存的用户信息
			userInfo() {
				return store.userInfo
			},
			hasLogin() {
				return store.hasLogin
			},
		},
		methods: {
			//统计用户信息
			async getTotal() {
				if (!this.hasLogin) return
				let artCount = await db.collection('article').where(
					`user_id==$cloudEnv_uid && delState !=true`).count()
				this.totalObj.artNum = artCount.result.total
				let likeCount = await db.collection('article').where(
						`user_id==$cloudEnv_uid && delState !=true`)
					.groupBy('user_id')
					.groupField('sum(like_count) as totalLike').get()

				if (likeCount.result.data[0]) {
					this.totalObj.likeNum = likeCount.result.data[0].totalLike
				}
			},
			//退出登录
			logout() {
				uni.showModal({
					title: "是否确认退出？",
					success: res => {
						if (res.confirm) {
							mutations.logout()
							this.isLogin = false
						}
					}
				})
			},
			//编辑个人资料
			toUserInfo() {
				uni.navigateTo({
					url: pageJson.uniIdRouter.needLogin[1]
				})
			},
			//跳转至登录页
			toLogin() {
				uni.navigateTo({
					url: '/uni_modules/uni-id-pages/pages/login/login-withpwd?uniIdRedirectUrl=/pages/index/index'
				})
			},
			//跳转到我的长文
			myArticle() {
				uni.navigateTo({
					url: pageJson.globalPath.myListPage
				})
			},
			//跳转点赞列表
			myLike() {
				uni.navigateTo({
					url: pageJson.globalPath.myLikePage
				})
			},
			myDel(){
				uni.navigateTo({
					url: pageJson.globalPath.myDelPage
				})
			},
			myComment(){
				uni.navigateTo({
					url: pageJson.globalPath.myCommentPage
				})
			},
			goFeedBack() {
				if (!this.isLogin) return
				uni.navigateTo({
					url: pageJson.globalPath.feedBackPage
				})
			},
			//查看用户反馈（可选）
			showUserFeedBack() {
				uni.navigateTo({
					url: pageJson.globalPath.showUserFeedBack
				})
			},
			about(){
				uni.navigateTo({
					url: '/pages/about/about'
				})
			}
		}
	}
</script>

<style lang="scss">
	.user {

		.top {
			height: 300rpx;
			background: #bbb;
			padding: 0 30rpx;
			padding-top: var(--status-bar-height);
			position: relative;
			display: flex;
			align-items: center;

			.group {
				position: relative;
				z-index: 10;
				display: flex;
				align-items: center;
				justify-content: space-between;
				width: 100%;
				color: #fff;

				.userinfo {
					display: flex;
					width: 100%;
					align-items: center;

					.pic {
						width: 120rpx;
						height: 120rpx;
						border-radius: 50%;
						overflow: hidden;
						border: 2px solid #fff;

						image {
							width: 100%;
							height: 100%;
						}
					}

					.text {
						padding-left: 20rpx;

						.nickname {
							font-size: 44rpx;
							font-weight: 600;
						}

						.year {
							font-size: 26rpx;
							opacity: 0.6;
							padding-top: 5rpx;
						}
					}
				}

				.more {
					.iconfont {
						font-size: 40rpx;
					}
				}

			}

			.bg {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				overflow: hidden;

				image {
					width: 100%;
					height: 100%;
					filter: blur(20px);
					transform: scale(2);
					opacity: 0.5;
				}
			}
		}

		.main {
			width: 100%;
			min-height: 200rpx;
			background: #fff;
			border-radius: 30rpx;
			transform: translateY(-30rpx);
			padding: 30rpx 0;

			.info {
				padding: 10rpx 30rpx;
				display: flex;
				font-size: 30rpx;

				.item {
					padding-right: 20rpx;
					color: #888;

					text {
						font-weight: 600;
						color: #333;
					}
				}
			}

			.list {
				.group {
					padding: 15rpx 30rpx;
					border-bottom: 15rpx solid #f4f4f4;

					.item {
						display: flex;
						justify-content: space-between;
						align-items: center;
						padding: 25rpx 0;
						font-size: 36rpx;
						color: #555;
						border-bottom: 1rpx solid #f8f8f8;

						.left {
							display: flex;
							align-items: center;

							.iconfont {
								font-size: 38rpx;
								margin-right: 10rpx;
							}
						}

						.right {
							.iconfont {
								font-size: 26rpx;
							}
						}
					}

					.item:last-child {
						border: none;
					}
				}

				.group:last-child {
					border: none;
				}
			}
		}

	}
</style>