<template>
	<view>
		<view class="comment-item" @click="goReply">
			<view class="avatar">
				<u-avatar :src="getUserAvatar(item)" size="26"></u-avatar>
			</view>

			<view class="wrap">
				<view class="username">
					{{getUserName(item)}}
					<!-- click.stop可以阻止删除的点击事件冒泡到父级的goReply上面，导致delComment和 goReply都被执行-->
					<text class="iconfont icon-a-43-guanbi" v-if="closeBtn&&isShowDelBtn()" @click.stop="delComment"></text>
				</view>
				<view class="comment-content">{{item.comment_content}}</view>
				<view class="info">
					<view class="reply-btn" v-if="replyState">{{item.totalReply||''}}回复 </view>
					<view>
						<uni-dateformat :date="item.comment_date" :threshold="[60000,3600000*24*30]">
						</uni-dateformat>
					</view>
					<view>{{item.province}}</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		getUserName,
		getUserAvatar
	} from '../../utils/tools.js'

	const db = uniCloud.database();
	const utilsObj = uniCloud.importObject("utilsObj", {
		customUI: true
	});

	export default {
		name: "comment-item",
		props: {
			item: {
				type: Object,
				default: () => {
					return {}
				}
			},
			//判断是否是二级回复，二级回复就不显示回复按钮，默认是一级回复，显示回复图标，等其他组件传值来修改
			replyState: {
				type: Boolean,
				default: true
			},
			//用来判断二级回复的回复对象不显示删除按钮
			closeBtn:{
				type: Boolean,
				default: true
			}
		},
		data() {
			return {

			};
		},
		created() {

		},
		methods: {
			getUserName,
			getUserAvatar,
			//跳转至回复页面
			goReply() {
				//二级回复页面就不让再次跳转了
				if(!this.replyState) return
				uni.setStorageSync('replyInfo', this.item)
				uni.navigateTo({
					url: "/pages/reply/reply"
				})
			},
			delComment() {
				uni.showModal({
					title: "是否删除该评论？",
					success: res => {
						if (res.confirm) {
							db.collection("article_comment").doc(this.item._id).remove()
							//减少评论数量到数据库
							utilsObj.operation('article', 'comment_count', this.item.article_id, -1)
							//告诉父级删除了哪个，执行无感删除
							this.$emit('CommentDel', this.item._id)
							uni.showToast({
								title: "删除成功！"
							})
						}
					}
				})
			},
			//判断是否显示删除按钮
			isShowDelBtn() {
				let uid = uniCloud.getCurrentUserInfo().uid
				if (uid == this.item.user_id[0]._id || this.uniIDHasRole('webmaster') || this.uniIDHasRole('admin')) {
					return true
				} else false
			}
		}
	}
</script>

<style lang="scss" scoped>
	.comment-item {
		display: flex;

		.wrap {
			flex: 1;
			padding-left: 20rpx;
			padding-bottom: 20rpx;

			.username {
				display: flex;
				font-size: 26rpx;
				color: #666;
				padding: 10rpx 0;
				align-items: center;
				justify-content: space-between;

				.iconfont {
					font-size: 20rpx;
					padding: 10rpx;
					color: #999;
				}
			}

			.comment-content {
				font-size: 34rpx;
				color: #111;
				line-height: 1.8em;
			}

			.info {
				font-size: 26rpx;
				color: #666;
				display: flex;
				padding: 10rpx 0;
				align-items: center;

				view {
					margin-right: 25rpx;
				}

				.reply-btn {
					padding: 6rpx 18rpx;
					background: #e4e4e4;
					border-radius: 30rpx;
				}
			}

			border-bottom: #e4e4e4 3rpx solid;
		}
	}
</style>