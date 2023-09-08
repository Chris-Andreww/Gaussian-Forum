<template>
	<view class="detail">
		<!-- 主体内容模块 -->
		<view class="container">
			<view v-if="loading">
				<u-skeleton rows='5' title loading></u-skeleton>
			</view>
			<view v-else>
				<view class="title">{{detailObj.title}}</view>
				<view class="userinfo">
					<view class="avatar">
						<image :src="getUserAvatar(detailObj)" mode="aspectFill">
						</image>
					</view>
					<view class="text">
						<view class="name">{{getUserName(detailObj)}}</view>
						<view class="small">
							<uni-dateformat :date="detailObj.publish_date" format="MM月dd hh:mm:ss "></uni-dateformat>
							· 发布于{{detailObj.province}}
						</view>
					</view>
				</view>
				<view class="content">
					<u-parse :content="detailObj.content" :selectable="true" :tagStyle="tagStyle"></u-parse>
				</view>

				<view class="like">
					<view class="btn" :class="detailObj.isLike?'active':''" @click="clickLike">
						<text class="iconfont icon-good-fill"></text>
						<text>{{detailObj.like_count||''}}</text>
					</view>
					<view class="users">
						<view v-for="avar in likerUser" :key="avar._id">
							<image :src="getUserAvatar(avar)" mode="aspectFill"></image>
						</view>
					</view>
					<view class="text"><text class="num">{{detailObj.view_count}}</text>人看过</view>
				</view>
			</view>
		</view>

		<!-- 评论区模块 -->
		<view class="comment">
			<view v-if="!commentList.length && noComment">
				<u-empty text="评论为空" mode="message"></u-empty>
			</view>

			<view class="content" v-else>
				<view class="content">
					<view class="item" v-for="item in commentList" :key="item._id">
						<comment-item :item="item" @CommentDel="CommentDel"></comment-item>
					</view>
				</view>
			</view>
			<view>
				<uni-load-more :showText="!noComment" :status="loadingState" v-if="!loading"/>
			</view>
		</view>
		
		<!-- 评论区的子级评论模块 -->
		<comment-son :commentObj="commentObj" @commentInfo="getCommentInfo"></comment-son>
	</view>
</template>

<script>
	import pageJson from '@/pages.json'
	import {
		getUserName,
		getUserAvatar,
		likeFun,
		throttleFun
	} from '../../utils/tools.js'
	import {
		store
	} from '@/uni_modules/uni-id-pages/common/store.js'
	import {
		data
	} from '../../uni_modules/uview-ui/libs/mixin/mixin.js'
	const db = uniCloud.database()
	const utilsObj = uniCloud.importObject("utilsObj", {
		customUI: true // 取消自动展示的交互提示界面
	})
	export default {
		data() {
			return {
				loadingState: "more",
				artid: "",
				loading: true,
				tagStyle: {
					p: "line-height:1.7em;font-size:16px;padding-bottom:10rpx",
					img: "margin:10rpx 0"
				},
				detailObj: null,
				likeTime: "", //记录点赞时间，用于节流,
				//存放用户点赞信息
				likerUser: [],
				//用来向评论区模块传递相关的配置信息
				commentObj: {
					article_id: "",
					comment_type: 0
				},
				//存储数据库获取到的评论列表
				commentList: [],
				//处理暂无评论图片显示过早的情况
				noComment: false
			};
		},
		onLoad(e) {
			if (!e.id) {
				this.errFun()
				return
			}
			this.artid = e.id
			this.getData()
			this.readUpdate()
			this.getLiker(),
				this.commentObj.article_id = e.id,
				this.getComment()
		},
		methods: {
			getUserName,
			getUserAvatar,
			//触底时的操作
			onReachBottom() {
				this.loadingState = 'loading'
				this.getComment()
			},
			CommentDel(id) {
				let uid = uniCloud.getCurrentUserInfo().uid
				let index = this.commentList.findIndex(val => val._id == id)
				this.commentList.splice(index, 1)
			},
			//接收评论成功后子级传递过来的数据,实现无感操作
			getCommentInfo(info) {
				this.commentList.unshift({
					...info,
					...this.commentObj,
					//从本地存储中获取用户信息，不消耗网络资源
					user_id: [store.userInfo]
				})
			},
			async getComment() {
				//通过联表查询，在获取到评论信息后，还需要获取用户头像
				let commentTemp = db.collection("article_comment")
					.where(`article_id == "${this.artid}" && comment_type == 0`)
					.orderBy('comment_date desc').skip(this.commentList.length).limit(5).getTemp()
				let userInfoTempt = db.collection("uni-id-users").field("_id,username,nickname,avatar_file").getTemp()
				let res = await db.collection(commentTemp, userInfoTempt).get()

				//没有数据时，关闭后续数据处理
				if (res.result.data.length == 0) {
					this.loadingState = 'no-more'
					this.noComment = true
					return
				}
				//用于触底加载，将老数据和新获取到的数据进行拼接
				let resComArr = [...this.commentList, ...res.result.data]
				

				//获取所有一级评论的_id的集合，并用来关联数据库的二级评论字段，用来统计评论的数量
				let idArr = res.result.data.map(val => {
					return val._id
				})
				//记录当前一级评论下有多少个二级评论
				let replyArr = await db.collection("article_comment").where({
						reply_comment_id: db.command.in(idArr)
					}).groupBy('reply_comment_id')
					.groupField('count(*) as totalReply').get()
				//统计一级评论中的二级评论总数
				res.result.data.forEach(item=>{
					let index = replyArr.result.data.findIndex(find=>{
						return find.reply_comment_id == item._id
					})
					if(index > -1) item.totalReply = replyArr.result.data[index].totalReply
				})

				this.commentList = resComArr
			},
			//获取点赞的用户头像（截取部分用户）
			getLiker() {
				let likeTemp = db.collection('article_like').where(`article_id == '${this.artid}'`).getTemp()
				let userTemp = db.collection('uni-id-users').field('_id,avatar_file').getTemp()
				db.collection(likeTemp, userTemp).orderBy('like_date desc').limit(4).get().then(res => {
					this.likerUser = res.result.data.reverse()
				})
			},
			//错误处理
			errFun() {
				uni.showToast({
					title: "参数有误",
					icon: "none"
				})
				setTimeout(() => {
					uni.reLaunch({
						url: "/pages/index/index"
					})
				}, 1000)
			},
			getData() {
				//主表
				let artTemp = db.collection('article')
					.where(`_id=="${this.artid}"`).getTemp()
				//副表1
				let userTemp = db.collection('uni-id-users')
					.field('_id,username,nickname,avatar_file').getTemp()
				//副表2
				let likeTemp = db.collection('article_like')
					.where(`article_id=="${this.artid}" && user_id==$cloudEnv_uid`).getTemp()

				//判断用户是否登录，如果没有就不把likeTemp表加入联表查询，因为此时未登录的用户没有uid获取不到该表
				let tempArr = [artTemp, userTemp]
				if (store.hasLogin) tempArr.push(likeTemp)

				//进行三表联表查询
				db.collection(...tempArr).get({
					getOne: true
				}).then(res => {
					if (!res.result.data) {
						this.errFun()
						return
					}
					this.loading = false

					//通过返回的数组长度判断用户是否给该文章点赞，长度0为未点赞
					let isLike = false;
					//判断用户是否登录，如果没登录就让isLike为false，不允许点赞
					if (store.hasLogin) isLike = res.result.data._id.article_like.length ? true : false

					//向返回值添加新属性isLike，记录该用户是否点了赞，用于确定是否高亮开关
					res.result.data.isLike = isLike

					this.detailObj = res.result.data

					//设置导航栏
					uni.setNavigationBarTitle({
						title: this.detailObj.title
					})

				}).catch(err => this.errFun())
			},
			//修改阅读量
			readUpdate() {
				utilsObj.operation("article", "view_count", this.artid, 1)
			},
			//点赞操作
			clickLike() {
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

				//点赞节流操作，如果参数为空，则该方法会返回当前时间戳
				let isTrigger = throttleFun(this.likeTime)
				if (!isTrigger) {
					return
				} else {
					this.likeTime = isTrigger
				}

				this.detailObj.isLike = !this.detailObj.isLike //改变本地数据中点赞判断
				this.detailObj.isLike ? this.detailObj.like_count++ : this.detailObj.like_count--

				//调用点赞同步数据库的方法
				likeFun(this.artid)
			}
		}
	}
</script>

<style lang="scss">
	.detail {
		background: #f8f8f8;
		min-height: calc(100vh - var(--window-top));

		.container {
			padding: 30rpx;
			background: #fff;

			.title {
				font-size: 46rpx;
				color: #333;
				line-height: 1.4em;
				font-weight: 600;
			}

			.userinfo {
				padding: 20rpx 0 50rpx;
				display: flex;
				align-items: center;

				.avatar {
					width: 60rpx;
					height: 60rpx;
					padding-right: 15rpx;

					image {
						width: 100%;
						height: 100%;
						border-radius: 50%;
					}
				}

				.text {
					font-size: 28rpx;
					color: #555;

					.small {
						font-size: 20rpx;
						color: #999;
					}
				}
			}

			.content {}

			.like {
				display: flex;
				flex-direction: column;
				align-items: center;
				padding: 80rpx 50rpx 50rpx;

				.btn {
					width: 260rpx;
					height: 120rpx;
					background: #e4e4e4;
					border-radius: 100rpx;
					color: #fff;
					display: flex;
					justify-content: center;
					align-items: center;
					flex-direction: column;
					font-size: 28rpx;

					.iconfont {
						font-size: 50rpx;
					}

					&.active {
						background: #0199FE;
					}
				}

				.text {
					font-size: 26rpx;
					color: #666;

					.num {
						color: #0199FE
					}

					.spot {
						padding: 0 10rpx;
					}
				}

				.users {
					display: flex;
					justify-content: center;
					padding: 30rpx 0;

					image {
						width: 50rpx;
						height: 50rpx;
						border-radius: 50%;
						border: 3px solid #fff;
						margin-left: -20rpx;
					}
				}
			}

		}

		.comment {
			padding: 100rpx 30rpx;
			padding-bottom: 120rpx;

			.item {
				padding: 10rpx 0;
			}
		}
	}
</style>