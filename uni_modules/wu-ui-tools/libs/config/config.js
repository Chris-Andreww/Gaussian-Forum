// 此版本发布于2023-09-01
const version = '1.0.6'

// 开发环境才提示，生产环境不会提示
if (process.env.NODE_ENV === 'development') {
	console.log(`\n %c wuui V${version} https://wuui.geeks.ink/ \n\n`, 'color: #ffffff; background: #3c9cff; padding:5px 0; border-radius: 5px;');
}

export default {
    v: version,
    version,
    // 主题名称
    type: [
        'primary',
        'success',
        'info',
        'error',
        'warning'
    ],
    // 颜色部分，本来可以通过scss的:export导出供js使用，但是奈何nvue不支持
    color: {
        'wu-primary': '#2979ff',
        'wu-warning': '#ff9900',
        'wu-success': '#19be6b',
        'wu-error': '#fa3534',
        'wu-info': '#909399',
        'wu-main-color': '#303133',
        'wu-content-color': '#606266',
        'wu-tips-color': '#909399',
        'wu-light-color': '#c0c4cc'
    },
	// 默认单位，可以通过配置为rpx，那么在用于传入组件大小参数为数值时，就默认为rpx
	unit: 'px'
}
