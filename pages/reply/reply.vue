<template>
	<view class="reply">
		<view class="top">
			<!-- 传入replyState为false就代表该页面下不显示回复图标，closebtn代表该模块不显示删除按钮 -->
			<comment-item :closeBtn="false" :replyState="false" :item="replyInfo"></comment-item>
		</view>
		<view class="list">
			<view class="row" v-for="item in sonReply" :key="item._id">
				<comment-item :replyState="false" @CommentDel="CommentDel" :item="item"></comment-item>
			</view>
		</view>

		<view>
			<view v-if="!sonReply.length">
				<u-empty text="暂无评论" mode="message"></u-empty>
			</view>
			<comment-son @commentInfo="getCommentInfo" :commentObj="commentObj" :placeholder="`回复：${getUserName(replyInfo)}`"></comment-son>
		</view>

	</view>
</template>

<script>
	import {
		getUserName,
		getUserAvatar
	} from '../../utils/tools.js'
	import {
		store
	} from '@/uni_modules/uni-id-pages/common/store.js'
	const db = uniCloud.database();
	

	export default {
		data() {
			return {
				replyInfo: null,
				commentObj: {
					article_id: "",
					//被回复的用户id
					reply_user_id: "",
					//给id为哪条评论回复
					reply_comment_id: "",
					comment_type: 1
				},
				//接收二级用户回复的内容
				sonReply:[]
			};
		},
		onLoad() {
			let reply = uni.getStorageSync('replyInfo')
			if (!reply) {
				uni.showToast({
					title: "参数错误！"
				})
				uni.navigateBack()
				return
			}
			this.replyInfo = reply
			this.commentObj.article_id = reply.article_id //获取文章id
			this.commentObj.reply_user_id = reply.user_id[0]._id //获取被回复的用户id
			this.commentObj.reply_comment_id = reply._id //获取被评论的评论id
			this.getComment()
		},
		onUnload() {
			uni.removeStorageSync('replyInfo')
		},
		methods: {
			getUserName,
			getUserAvatar,
			async getComment() {
				//通过联表查询，在获取到评论信息后，还需要获取用户头像
				let comments = await db.collection("article_comment")
				.where(`article_id == "${this.commentObj.article_id}" && comment_type == 1 && reply_comment_id=="${this.commentObj.reply_comment_id}"`)
					.orderBy('comment_date desc').limit(5).getTemp()
				let userInfo = await db.collection("uni-id-users").field("_id,username,nickname,avatar_file").getTemp()
				db.collection(comments, userInfo).get().then(res => {
					this.sonReply=res.result.data
				})
			},
			CommentDel(delCommentId) {
				let index = this.sonReply.findIndex(val => val._id == delCommentId)
				this.sonReply.splice(index, 1)
			},
			//接收评论成功后子级传递过来的数据,实现无感操作
			getCommentInfo(info) {
				this.sonReply.unshift({
					...info,
					...this.commentObj,
					//从本地存储中获取用户信息，不消耗网络资源
					user_id: [store.userInfo]
				})
			},
		}
	}
</script>

<style lang="scss">
	.reply {
		.top {
			padding: 30rpx;
			border-bottom: 15rpx solid #eee;
		}

		.list {
			padding: 30rpx;
			padding-bottom: 120rpx;

			.row {
				padding-bottom: 15rpx;
			}
		}
	}
</style>