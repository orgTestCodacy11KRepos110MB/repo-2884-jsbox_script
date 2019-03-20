async function test() {
  return $http.get({
    url: "https://www.baidu.com?t=" + new Date().getTime()
  })
}

async function main() {
  let start = new Date().getTime()
  let loop = 20
  for (var i = 0; i < loop; i++) {
    await test()
  }
  console.log(`${loop}个请求共计耗时：${(new Date().getTime() - start) / 1000}s`)
}

main().then(_ => { })
