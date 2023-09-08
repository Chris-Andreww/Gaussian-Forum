//获取富文本内的图片url地址
export function getImgSrc(richtext, num = 3) {
	let imgList = [];
	richtext.replace(/<img [^>]*src=['"]([^'"]+)[^>]*>/g, (match, capture) => {
		imgList.push(capture);
	});
	imgList = imgList.slice(0, num)
	return imgList;
}

//向外导出省份
export function getProvince() {
	return new Promise((resolve, reject) => {
		let historyProvince = uni.getStorageSync("historyProvince");
		if (historyProvince) {
			//判断获取ip的时间是否超过1小时，超过就重新获取客户端的ip地址
			if ((Date.now() - historyProvince.time) > 1000 * 60 * 60) {
				getIp().then(res => {
					resolve(res)
				}).catch(err => {
					reject(err)
				})
			} else {
				resolve(historyProvince.province);
			}
		} else {
			getIp().then(res => {
				resolve(res)
			}).catch(err => {
				reject(err)
			})
		}
	})
}

//获取所在省市
function getIp() {
	return new Promise((resolve, reject) => {
		uni.request({
			url: "https://restapi.amap.com/v3/ip?key=500251e5c412688bbe20258f022f92d4",
			success: res => {
				let str = ""
				typeof(res.data.province) == "string" ? str = res.data.province: str = "火星"
				resolve(str)
				let obj = {
					province: str,
					time: Date.now()
				}
				uni.setStorageSync("historyProvince", obj);
			},
			fail: err => {
				reject(err)
			}
		})
	})
}



//获取昵称
export function giveName(item) {
	return item.user_id[0].nickname || item.user_id[0].username || item.user_id[0].mobile || "请设置昵称"
}

//获取默认头像
export function giveAvatar(item) {
	return item.user_id[0]?.avatar_file?.url ?? '../../static/images/user-default.jpg'
}


const db = uniCloud.database();
const utilsObj = uniCloud.importObject("utilsObj", {
	customUI: true
});

//点赞操作数据库的方法
export async function likeFun(artid) {
	let count = await db.collection("article_like")
		.where(`article_id=="${artid}" && user_id==$cloudEnv_uid`).count()
	if (count.result.total) {
		db.collection("article_like").where(`article_id=="${artid}" && user_id==$cloudEnv_uid`)
			.remove();
		utilsObj.operation("article", "like_count", artid, -1)

	} else {
		db.collection("article_like").add({
			article_id: artid
		})
		utilsObj.operation("article", "like_count", artid, 1)
	}
}

//获取用户名称
export function getUserName(item) {
	return item.user_id[0].nickname || item.user_id[0].username || '请设置名称'
}

//获取默认头像
export function getUserAvatar(item) {
	return item.user_id[0].avatar_file?.url ?? "../../static/images/user-default.jpg"
}

//节流方法，event是触发的时间，如果成功执行，则返回当前的时间戳
export function throttleFun(event) {
	//添加节流判断，防止按钮恶意点击，2秒只能触发一次
	let time = Date.now()
	if (time - event < 1000) {
		uni.showToast({
			title: "操作太频繁，请稍后再试...",
			icon: "error"
		})
		return false
	}
	return time
}

//接收需要跳转的文章id数组，并接收调用的组件类型
export function viewArtFun(checkboxValue, listType) {
	if (listType.includes('comment') || listType.includes('like')) {
		uni.navigateTo({
			url: '/pages/detail/detail?id=' + checkboxValue[0].article_id[0]._id
		})
	}
	if (listType.includes('article') || listType.includes('del')) {
		uni.navigateTo({
			url: '/pages/detail/detail?id=' + checkboxValue[0]._id
		})
	}
}

//接收需要恢复的文章id数组
export function recArtFun(checkboxValue) {
	//存放promise数组，用于promise.all方法一起执行并返回执行结果
	const promisesArr = checkboxValue.map(val => {
		return new Promise((resolve, reject) => {
			db.collection('article').doc(val._id).update({
				delState: false
			}).then(res => {
				resolve(true);
			}).catch(err => {
				reject(err);
			});
		});
	});

	return Promise.all(promisesArr);
}

//接收需要暂时删除的文章id数组
export function delArtTempFun(checkboxValue) {
	uni.showLoading({
		title: "正在删除"
	})
	//存放promise数组，用于promise.all方法一起执行并返回执行结果
	const promisesArr = checkboxValue.map(val => {
		return new Promise((resolve, reject) => {
			db.collection('article').doc(val._id).update({
				delState: true,
				Del_date: Date.now()
			}).then(res => {
				resolve(true)
			})
		});
	});

	return Promise.all(promisesArr);
}

//接收需要彻底删除的文章id数组
export function delArtFun(checkboxValue) {
	uni.showLoading({
		title: "正在删除"
	})
	//存放promise数组，用于promise.all方法一起执行并返回执行结果
	const ArtArr = checkboxValue.map(val => {
		return new Promise((resolve, reject) => {
			db.collection('article').doc(val._id).remove()
				.then(res => {
					resolve(true);
				})
		});
	});
	const ComArr = checkboxValue.map(val => {
		return new Promise((resolve, reject) => {
			db.collection('article_comment').where(`article_id=="${val._id}"`).remove()
				.then(res => {
					resolve(true);
				})
		});
	});
	const LikeArr = checkboxValue.map(val => {
		return new Promise((resolve, reject) => {
			db.collection('article_like').where(`article_id=="${val._id}"`).remove()
				.then(res => {
					resolve(true);
				})
		});
	});
	return Promise.all([...ArtArr, ...ComArr, ...LikeArr]);
}

//接收需要删除点赞的文章记录
export function delLikeFun(checkboxValue) {
	uni.showLoading({
		title: "正在删除"
	})
	//存放promise数组，用于promise.all方法一起执行并返回执行结果
	const promisesArr = checkboxValue.map(val => {
		return new Promise((resolve, reject) => {
			db.collection('article_like').where(`_id=="${val._id}"`).remove()
				.then(res => {
					resolve(true)
				})
		});
	});
	checkboxValue.forEach(val => {
		utilsObj.operation("article", "like_count", val.article_id[0]._id, -1)
	})

	return Promise.all(promisesArr);
}

//用于删除图片文件
export function delImage(imgArr) {
	return utilsObj.deleteFile(imgArr)
}