const db = uniCloud.database()
const dbCmd = db.command
module.exports = {

	/**
	 * @param {Object} table 需要修改的表
	 * @param {Object} attr 增加点赞还是阅读量
	 * @param {Object} id 具体修改哪一条数据
	 * @param {Object} num 增加或减少的次数
	 */
	async operation(table, attr, id, num) {
		let obj = {}
		obj[attr] = dbCmd.inc(num) //将需要修改的属性名和属性值包装到一个对象中，因为在update中不能用动态的属性名
		return await db.collection(table).doc(id).update(obj)
	},

	deleteFile(delArr) {
		return uniCloud.deleteFile({
			fileList: delArr
		})
	}
}