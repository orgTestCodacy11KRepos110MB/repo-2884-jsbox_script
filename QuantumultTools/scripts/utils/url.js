
function withTS(url) {
    let ts = new Date().getTime()
    if (/\?/.test(url)) {
        return `${url}&t=${ts}`
    } else {
        return `${url}?t=${ts}`
    }
}

module.exports = {
    withTS: withTS
}