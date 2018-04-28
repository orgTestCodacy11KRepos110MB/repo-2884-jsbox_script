function getCurVersion() {
    let config = JSON.parse($file.read("config.json").string)
    return config.info.version
}

function getLatestVersion(params) {
    $http.get({
        url: 'https://raw.githubusercontent.com/Fndroid/jsbox_script/master/Rules-lhie1/config.json',
        handler: res => {
            params.handler(res.data.info.version)
        }
    })
}

function updateScript(version) {
    let url = 'https://github.com/Fndroid/jsbox_script/blob/master/Rules-lhie1/.output/Rules-lhie1.box?raw=true'
    let installURL = `jsbox://install?name=${"Rules-lhie1"}&url=${encodeURI(url)}`
    $app.openURL(installURL)
}


module.exports = {
    getCurVersion: getCurVersion,
    getLatestVersion: getLatestVersion,
    updateScript: updateScript
}