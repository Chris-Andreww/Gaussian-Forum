<template>
	<view class="container">
		<unicloud-db ref="udb" v-slot:default="{data, loading, error, options}" :options="options"
			collection="opendb-feedback" field="content,imgs,contact,mobile" :where="queryWhere" :getone="true"
			:manual="true">
			<view v-if="error">{{error.message}}</view>
			<view v-else-if="loading">
				<uni-load-more :contentText="loadMore" status="loading"></uni-load-more>
			</view>
			<view v-else-if="data" class="content">
				<view>
					<text style="color: #0199fe;">反馈内容：</text>
					<text>{{data.content||'(内容为空)'}}</text>
				</view>
				<view v-if="data.imgs.length">
					<text>图片列表：</text>
					<template v-for="(file, j) in data.imgs">
						<uni-file-picker v-if="file.fileType == 'image'" :value="file" :file-mediatype="file.fileType"
							return-type="object" readonly></uni-file-picker>
						<uni-link v-else :href="file.url" :text="file.url"></uni-link>
					</template>
				</view>
				<view>
					<text style="color: #0199fe;">联系人：</text>
					<text>{{data.contact||'(内容为空)'}}</text>
				</view>
				<view>
					<text style="color: #0199fe;">联系电话：</text>
					<text>{{data.mobile||'(内容为空)'}}</text>
				</view>
			</view>
		</unicloud-db>
		<view class="btn">
			<button type="warn" class="btn-delete" @click="handleDelete">删除</button>
		</view>
	</view>
</template>

<script>
	// 由schema2code生成，包含校验规则和enum静态数据
	import {
		enumConverter
	} from '../../js_sdk/validator/opendb-feedback.js';

	export default {
		data() {
			return {
				queryWhere: '',
				loadMore: {
					contentdown: '',
					contentrefresh: '',
					contentnomore: ''
				},
				options: {
					// 将scheme enum 属性静态数据中的value转成text
					...enumConverter
				}
			}
		},
		onLoad(e) {
			this._id = e.id
		},
		onReady() {
			if (this._id) {
				this.queryWhere = '_id=="' + this._id + '"'
			}
		},
		methods: {
			handleDelete() {
				this.$refs.udb.remove(this._id, {
					success: (res) => {
						uni.showToast({
							title: "删除成功！"
						})
						setTimeout(() => {
							// 删除数据成功后跳转到list页面
							uni.navigateBack()
						}, 1000)
					}
				})
			}
		}
	}
</script>

<style lang="scss">
	.container {
		.content {
			padding: 10px;

			view {
				&:nth-child(1) {
					font-size: 40rpx;
				}

				&:nth-child(2) {
					font-size: 40rpx;
				}

				&:nth-child(3) {
					font-size: 40rpx;
				}

				&:nth-child(4) {
					font-size: 40rpx;
				}

				border-bottom: 2rpx solid #878184;
				padding: 40rpx 20rpx;
			}
		}

		.btn {
			display: flex;
			position: fixed;
			box-sizing: border-box;
			width: 100%;
			bottom: 0rpx;
			padding: 20rpx;

			.btn-delete {
				flex: 1;
			}
		}
	}
</style>