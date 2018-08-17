function asyncInitialize() {
    updateSpecialReg()
}

function updateSpecialReg() {
    $http.download({
        url: "https://raw.githubusercontent.com/Fndroid/specialReg/master/specialReg.js?t=" + new Date().getTime()
    }).then(resp => {
        let success = $file.write({
            data: resp.data,
            path: "scripts/videoReg.js"
        });
        console.log(`特殊代理列表更新${success ? '成功' : '失败'}`)
    })
}

module.exports = {
    asyncInitialize: asyncInitialize
}