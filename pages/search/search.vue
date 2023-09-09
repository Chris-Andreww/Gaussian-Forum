<template>
	<view>
		<view class="navbar">
			<uni-search-bar radius="100" placeholder="搜索内容" v-model="searchInput" @confirm="search"></uni-search-bar>
		</view>
		<!-- 该元素用来解决上面元素使用fixed绝对定位后影响下方盒子的情况 -->
		<view class="navbarBox"></view>
		<view>
			<u-skeleton rows='5' title :loading="loading"></u-skeleton>
		</view>
		<view class="res" v-if="dataList.length">
			<view class="item" v-for="item in dataList" :key="item._id">
				<blog-item :item="item" @delEvent="Son_delEvent" :isLike.sync="item.isLike"
					:like_count.sync="item.like_count"></blog-item>
			</view>
		</view>
		<view v-else-if="!loading">
			<u-empty text="暂无搜索结果" mode="search"></u-empty>
		</view>
		<view>
			<uni-load-more :status="loadingState" v-if="!loading" />
		</view>
	</view>
</template>

<script>
	import {
		store
	} from '@/uni_modules/uni-id-pages/common/store.js'
	const db = uniCloud.database();
	const dbCmd = db.command
	export default {
		data() {
			return {
				searchInput: '',
				dataList: [],
				loading: true,
				loadingState: "more",
			};
		},
		onLoad(e) {
			this.searchInput = e.search
			this.getData()
		},
		//触底时的操作
		onReachBottom() {
			this.loadingState = 'loading'
			this.getData()
		},
		methods: {
			search() {
				this.dataList = []
				this.loading = true
				this.getData()
			},
			async getData(input) {
				if (!this.searchInput) {
					return
				}
				//获取文章标题和简介匹配的内容，同时过滤出已删除的文章
				let artTemp = await db.collection('article').where(dbCmd.or({
						title: new RegExp(this.searchInput, 'gi'),
						delState: false
					}, {
						description: new RegExp(this.searchInput, 'gi'),
						delState: false
					})).field('user_id,view_count,like_count,comment_count,publish_date,title,description,picurls')
					.getTemp()
				//获取用户信息
				let userTemp = db.collection("uni-id-users").field("_id,username,nickname,avatar_file").getTemp()

				let res = await db.collection(artTemp, userTemp).skip(this.dataList.length).limit(5).get()

				let ArtArr = []
				//用于触底加载，将老数据和新获取到的数据进行拼接
				let resDataArr = [...this.dataList, ...res.result.data]

				//用户要先登录才能获取点赞列表
				if (store.hasLogin) {
					//获取当前所有文章的信息
					resDataArr.forEach(val => {
						ArtArr.push(val._id)
					})

					//查找出当前用户所喜欢的文章信息
					let likeRes = await db.collection("article_like").where({
						article_id: dbCmd.in(ArtArr),
						user_id: uniCloud.getCurrentUserInfo().uid
					}).get()


					likeRes.result.data.forEach(val => {
						let findIndex = resDataArr.findIndex(find => {
							return val.article_id == find._id
						})
						resDataArr[findIndex].isLike = true
					})

				}


				this.dataList = resDataArr
				this.loading = false
				this.loadingState = 'no-more'
			},
			//子组件发出的删除请求
			Son_delEvent(delId) {
				//存放删除后的结果
				let finalArr = this.dataList.filter((val, index) => {
					if (val._id != delId) {
						return true
					}
				})
				this.dataList = finalArr
			}
		}
	}
</script>

<style lang="scss">
	.navbar {
		position: fixed;
		width: 100%;
		height: 100rpx;
		background-color: #ffffff;
		z-index: 9;
	}

	.navbarBox {
		width: 100%;
		height: 100rpx;
		background-color: #ffffff;
	}

	.res {
		.item {
			padding: 30rpx;
			border-bottom: #F7F7F7 10rpx solid;
		}
	}
</style>