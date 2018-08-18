const ruleUpdateUtil = require('scripts/ruleUpdateUtil');

function siriRun() {
    let { owner, repoName, filePath } = ruleUpdateUtil.getRepoInfo()
    $intents.finish(`${owner}的${repoName}仓库有更新`)
}

module.exports = {
    siriRun: siriRun
}