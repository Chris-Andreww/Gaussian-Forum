<template>
	<view class="home">
		<view class="navbar">
			<uni-search-bar radius="100" placeholder="搜索内容" v-model="searchInput" @confirm="search"></uni-search-bar>
			<view>
				<u-tabs :list="navlist" :activeStyle="{
					color:'#333',
					fontWeight:'bold',
					transform:'scale(1.05)'
				}" :inactiveStyle="{
					color:'#888',
					transform:'scale(1)'
				}" @change="clickNav"></u-tabs>
			</view>
		</view>
		<!-- 该元素用来解决上面元素使用fixed绝对定位后影响下方盒子的情况 -->
		<view class="navbarBox"></view>
		
		<view>
			<u-skeleton rows="3" title :loading="loading"></u-skeleton>
		</view>

		<view class="content">
			<view class="item" v-for="item in dataList" :key="item._id">
				<blog-item :item="item" @delEvent="Son_delEvent" 
				:isLike.sync="item.isLike"
				:like_count.sync="item.like_count"
				></blog-item>
			</view>
		</view>

		<!-- 当没有数据时显示 -->
		<view v-if="!loading&&!dataList.length">
			<u-empty text="发点什么吧!" mode="search"></u-empty>
		</view>

		<view>
			<uni-load-more :status="loadingState" v-if="!loading" />
		</view>

		<view class="edit" @click="goEdit">
			<text class="iconfont icon-a-21-xiugai"></text>
		</view>

	</view>
</template>

<script>
	import {
		store
	} from '@/uni_modules/uni-id-pages/common/store.js'

	import {
		data
	} from '../../uni_modules/uview-ui/libs/mixin/mixin'

	import {
		throttleFun
	} from '../../utils/tools.js'
	const db = uniCloud.database()
	const dbCmd = db.command
	export default {
		data() {
			return {
				searchInput:'',
				loadingState: "more",
				navlist: [{
						name: "最新",
						type: 'publish_date'
					},
					{
						name: "热门",
						type: 'view_count'
					}
				],
				//骨架屏显示
				loading: true,
				//记录标签点击到了哪个，默认是0（最新排序）
				navAction: 0,
				dataList: [],
				//记录刷新时间
				refreshTime: ""
			}
		},
		onLoad() {
			this.getData()
		},
		//下拉刷新
		onPullDownRefresh() {
			this.dataList = []
			this.getData()
		},
		methods: {
			search(e){
				uni.navigateTo({
					url: '/pages/search/search?search=' + this.searchInput
				})
			},
			clickNav(e) {
				this.loading = true
				this.dataList = []
				this.navAction = e.index
				this.getData()
				this.loadingState = 'more'
			},
			//跳转到编辑页面
			goEdit() {
				if (!store.hasLogin) {
					uni.showModal({
						title: "登录后才能发布文章，是否登录？",
						success: res => {
							if (res.confirm) {
								uni.navigateTo({
									url: "/pages/edit/edit?id=0"
								})
							}
						}
					})
					return
				}
				uni.navigateTo({
					url: "/pages/edit/edit?id=0"
				})
			},
			//触底时的操作
			onReachBottom() {
				this.loadingState = 'loading'
				this.getData()
			},
			//从数据库获取数据
			getData() {
				//节流操作，防止重复请求数据库
				let isTrigger = throttleFun(this.refreshTime)
				if (!isTrigger) {
					return
				} else {
					this.refreshTime = isTrigger
				}


				let artTemp = db.collection("article").where('delState!=true').field(
					"title,user_id,description,picurls,comment_count,like_count,view_count,publish_date").getTemp()
				let userTemp = db.collection("uni-id-users").field("_id,username,nickname,avatar_file").getTemp()

				//获取所有文章数组，以及获取用户点赞信息
				db.collection(artTemp, userTemp).orderBy(this.navlist[this.navAction].type +
					' desc').skip(this.dataList.length).limit(5).get().then(async res => {
					let ArtArr = []

					if (res.result.data.length == 0) {
						this.loadingState = 'no-more'
						this.loading = false
						uni.stopPullDownRefresh()
						return
					}
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
					//关闭下拉动画
					uni.stopPullDownRefresh()
				})
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

<style lang="scss" scoped>
	.home {
		.navbar {
			position: fixed;
			width: 100%;
			background-color: #ffffff;
			margin-bottom: 100rpx;
			z-index: 9;
		}
		.navbarBox{
			width: 100%;
			height: 80rpx;
			background-color: #ffffff;
			margin-bottom: 100rpx;
		}

		.content {
			.item {
				padding: 30rpx;
				border-bottom: #F7F7F7 10rpx solid;
			}
		}

		.edit {
			width: 120rpx;
			height: 120rpx;
			background: #0199FE;
			border-radius: 50%;
			color: #fff;
			position: fixed;
			z-index: 100;
			bottom: 150rpx;
			right: 50rpx;
			display: flex;
			justify-content: center;
			align-items: center;
			box-shadow: 0 0 20rpx rgba(1, 153, 254, 0.8);

			.iconfont {
				font-size: 50rpx;
			}
		}
	}
</style>