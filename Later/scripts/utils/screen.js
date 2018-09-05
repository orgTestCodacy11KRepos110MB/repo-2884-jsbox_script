function getScreenInfo() {
    let deviceInfo = $device.info
    let isIphoneX = $device.isIphoneX
    return {
        width: deviceInfo.screen.width,
        height: deviceInfo.screen.height - (isIphoneX ? 44 : 0),
        statusHieght: isIphoneX ? 44 : 20
    }
}

module.exports = {
    getScreenInfo: getScreenInfo
}