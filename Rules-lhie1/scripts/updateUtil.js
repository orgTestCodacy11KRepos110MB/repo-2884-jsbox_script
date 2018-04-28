function getCurVersion() {
    let version = $file.read("version.fndroid").string
    return version
}

function getLatestVersion(params) {
    $http.get({
        url: 'https://raw.githubusercontent.com/Fndroid/jsbox_script/master/Rules-lhie1/version.fndroid',
        handler: res => {
            params.handler(res.data)
        }
    })
}

function updateScript(version) {
    let url = 'https://github.com/Fndroid/jsbox_script/blob/master/Rules-lhie1/.output/Rules-lhie1.box?raw=true'
    let installURL = `jsbox://install?name=${"Rules-lhie1"}&url=${encodeURIComponent(url)}&version=${encodeURIComponent(version)}`
    $app.openURL(installURL)
}


module.exports = {
    getCurVersion: getCurVersion,
    getLatestVersion: getLatestVersion,
    updateScript: updateScript
}