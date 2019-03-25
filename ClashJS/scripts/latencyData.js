module.exports.getHistory = async (address, name, callback) => {
  let resp = await $http.get(`http://${address}/proxies/${encodeURIComponent(name)}`)
  callback(resp.data)
}