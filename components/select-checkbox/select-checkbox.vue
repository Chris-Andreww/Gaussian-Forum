<template>
	<view>
		<checkbox-group @change="checkboxChange">
			<label class="uni-list-cell uni-list-cell-pd" v-for="item in items" :key="item._id">
				<view class="checkboxitem">
					<view class="checkbox">
						<checkbox :value="JSON.stringify(item)" />
					</view>
					<view class="item" v-if="listType=='comment'">
						<view>文章标题：{{item.article_id[0].title}}</view>
						<view>评论内容：{{item.comment_content}}</view>
					</view>
					<view class="item" v-if="listType.includes('article')||listType.includes('del')">
						<view>文章标题：{{item.title}}</view>
						<view>文章内容：{{item.description}}</view>
					</view>
					<view class="item" v-if="listType=='like'">
						<view>文章标题：{{item.article_id[0].title}}</view>
						<view>文章内容：{{item.article_id[0].description}}</view>
					</view>
				</view>
			</label>
		</checkbox-group>
	</view>
</template>

<script>
	import checkbox from '../../uni_modules/uview-ui/libs/config/props/checkbox';
	export default {
		name: "select-checkbox",
		props: {
			items: {
				type: Array,
				default: () => []
			},
			//用来确定是哪个组件调用该checkbox，用来渲染不同的结构
			listType: ""
		},
		data() {
			return {
				checkboxValue: []
			};
		},
		methods: {
			checkboxChange(e) {
				this.checkboxValue = []
				e.detail.value.forEach((val, index) => {
					this.checkboxValue[index] = JSON.parse(e.detail.value[index])
				})
				this.checkEvent()
			},
			checkEvent() {
				this.$emit('checkEvent', this.checkboxValue)
			}
		}
	}
</script>

<style lang="scss">
	.checkboxitem {
		display: flex;
		margin: 20rpx;
		padding: 20rpx;
		border-bottom: 2rpx solid #878184;
		align-items: center;

		.checkbox {
			position: absolute;
			right: 10rpx;
		}

		.item {
			width: 90%;
			/*动态规定盒子宽高*/
			font-size: 40rpx;
			overflow: hidden;
			/* 超出部分隐藏 */
			display: -webkit-box;
			/* 对象作为伸缩盒子模型显示 */
			-webkit-box-orient: vertical;
			/* 设置或检索伸缩盒对象的子元素的排列方式 */
			-webkit-line-clamp: 2;
			/* 显示的行数 */
		}
	}
</style>