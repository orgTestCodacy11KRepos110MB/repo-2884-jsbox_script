const repo = 'https://api.github.com/repos/lhie1/Rules/contents/Auto'
const commits = 'https://api.github.com/repos/lhie1/Rules/commits?path=Auto&sha=master'

const FILE = 'data.js'

function checkUpdate(oldSha, newSha) {
    return Object.keys(newSha).some(i => oldSha[i] !== newSha[i])
}

function setFilesSha(sha) {
    let file = JSON.parse($file.read(FILE).string)
    file['repoSha'] = sha
    $file.write({
        data: $data({ "string": JSON.stringify(file) }),
        path: FILE
    })
}

function getFilesSha() {
    let file = JSON.parse($file.read(FILE).string)
    return file['repoSha'] || {}
}

function getGitHubFilesSha(params) {
    $http.get({
        url: repo,
        handler: function (resp) {
            if (resp.response.statusCode === 200) {
                let res = {}
                resp.data.forEach(i => {
                    res[i.name] = i.sha
                })
                params.handler(res)
            } else {
                params.handler({})
            }
        }
    })
}

function getLatestCommitMessage(params) {
    $http.get({
        url: commits,
        handler: function(resp) {
            if (resp.response.statusCode === 200 && resp.data.length > 0) {
                params.handler(resp.data[0])
            } else {
                params.handler(null)
            }
        }
    })
}

module.exports = {
    checkUpdate: checkUpdate,
    getGitHubFilesSha: getGitHubFilesSha,
    setFilesSha: setFilesSha,
    getFilesSha: getFilesSha,
    getLatestCommitMessage: getLatestCommitMessage
}