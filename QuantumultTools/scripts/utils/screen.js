module.exports.screenInfo = function () {
    let screenHeight = $device.info.screen.height
    const screenWidth = $device.info.screen.width

    const iPhoneX = screenWidth == 375 && screenHeight == 812
    if (iPhoneX) {
        screenHeight -= 48
    }

    const statusBarHeight = iPhoneX ? 44 : 20
    const navBarHeight = 45
    return {
        screenHeight: screenHeight,
        screenWidth: screenWidth,
        statusBarHeight: statusBarHeight,
        navBarHeight: navBarHeight,
        padding: 10
    }
}