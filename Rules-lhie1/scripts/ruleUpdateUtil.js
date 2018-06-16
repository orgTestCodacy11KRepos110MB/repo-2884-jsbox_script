let githubRawReg = /^https:\/\/raw\.githubusercontent\.com\/(.*?)\/(.*?)\/master\/(.*?)$/

const FILE = 'data.js'

function getRulesReplacement(content = '') {
    let advanceSettings = content ? content : JSON.parse($file.read(FILE).string)
    if (advanceSettings.customSettings) {
        let cs = advanceSettings.customSettings;
        let pat = cs.match(/\/\/\s*replacement\s*:\s*(.*?)[\n\r]/);
        if (pat && pat[1]) {
            return pat[1];
        }
    }
    return null;
}

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
    let { owner, repoName, filePath } = getRepoInfo();
    $http.get({
        url: `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
        handler: function (resp) {
            if (resp.response.statusCode === 200) {
                let res = {}
                let respData = Array.isArray(resp.data) ? resp.data: [resp.data]
                respData.forEach(i => {
                    res[i.name] = i.sha
                })
                params.handler(res)
            } else {
                params.handler({})
            }
        }
    })
}

function getRepoInfo() {
    let owner = 'lhie1';
    let repoName = 'Rules';
    let filePath = 'Auto';
    let rulesRep = getRulesReplacement();
    if (rulesRep) {
        let reg = rulesRep.match(githubRawReg);
        if (reg && reg.length === 4) {
            owner = reg[1];
            repoName = reg[2];
            filePath = reg[3];
        }
    }
    return { owner, repoName, filePath };
}

function getLatestCommitMessage(params) {
    let { owner, repoName, filePath } = getRepoInfo()
    $http.get({
        url: `https://api.github.com/repos/${owner}/${repoName}/commits?path=${filePath}&sha=master`,
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
    getLatestCommitMessage: getLatestCommitMessage,
    getRepoInfo: getRepoInfo
}