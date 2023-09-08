<template>
	<view>
		<view class="commentSon">
			<uni-easyinput ref="uipt" @confirm="goComment" suffixIcon="paperplane" v-model="replyContent"
				:placeholder="placeholder" @iconClick="goComment">
			</uni-easyinput>
		</view>
	</view>
</template>

<script>
	import {
		getProvince,
	} from "@/utils/tools.js"

	const db = uniCloud.database();
	const utilsObj = uniCloud.importObject("utilsObj", {
		customUI: true
	});

	export default {
		name: "comment-frame",
		props: {
			commentObj: {
				type: Object,
				default: () => {
					return {}
				}
			},
			placeholder:{
				type:String,
				default:"说点什么吧~"
			}
		},
		data() {
			return {
				replyContent: "",
			};
		},
		methods: {
			async goComment() {
				if (!this.commentObj) {
					uni.showToast({
						title: "评论内容不能为空~",
						icon: 'none'
					})
					return
				}
				let province = await getProvince()
				db.collection("article_comment").add({
					...this.commentObj,
					"comment_content": this.replyContent,
					"province": province
				}).then(res => {
					uni.showToast({
						title: "评论成功"
					})
					this.$emit("commentInfo", {
						_id: res.result.id,
						comment_content: this.replyContent,
						province,
						comment_date: Date.now()
					})
					//清空输入框
					this.replyContent = ""
					//增加评论数量到数据库
					utilsObj.operation('article', 'comment_count', this.commentObj.article_id, 1)
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.commentSon {
		width: 100%;
		background: #fff;
		padding: 20rpx 30rpx;
		box-sizing: border-box;
		position: fixed;
		bottom: 0;
		left: 0;
		z-index: 100;
	}
</style>