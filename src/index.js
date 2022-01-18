const env = require('./env')
const core = require('./core');

(async () => {
  const instance = new core({ ...env, debug: false })
  await instance.connect()
  await instance.swipeBadge()
  const weeklyStats = await instance.weeklyStatistics()
  console.log(JSON.stringify(weeklyStats))
  await instance.close()
})()

