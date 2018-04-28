function getCurVersion() {
    return $addin.current.version + ''
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

function getUpdateLog() {
    let url = ''
}

module.exports = {
    getCurVersion: getCurVersion,
    getLatestVersion: getLatestVersion,
    updateScript: updateScript
}