function parse(str) {
  let tcpSec = getSec('TCP', str)
  let filters = seperateLine(tcpSec)
  
  let serverSec = getSec('SERVER', str)
  let servers = seperateLine(serverSec)

  let policySec = getSec('POLICY', str)
  let policies = seperateLine(policySec).map(p => $text.base64Decode(p))
  
  return {
    filters,
    servers,
    policies
  }
}

function seperateLine(str) {
  return str.split(/[\n\r]/).filter(i => i)
}

function getSec(name, content) {
  let regStr = `\\[${name}\\]([\\S\\s]*?)(?:\n\\[|$)`
  let reg = new RegExp(regStr)
  if (reg.test(content)) {
    return RegExp.$1
  }
}

module.exports = {
  parse
}