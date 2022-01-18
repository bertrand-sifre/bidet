const puppeteer = require('puppeteer')
const { minToHourStr, getWorkTime, sumWorkTime } = require('./dayUtils')

/**
 * @param {Object} option
 * @param {string} option.url
 * @param {string} option.login
 * @param {string} option.password
 * @param {boolean} [option.debug]
 */
const core = function (option) {
  /** @type {string} */
  this.url = option.url
  /** @type {string} */
  this.login = option.login
  /** @type {string} */
  this.password = option.password
  /** @type {boolean} */
  this.debug = option.debug || false
  /** @type {import('puppeteer').Browser} */
  this.browser = undefined
  /** @type {import('puppeteer').Page} */
  this.page = undefined
}

/**
 * Connect to your Bodet interface
 */
core.prototype.connect = async function () {
  if (this.browser) {
    console.log('You are already logged !')
  } else {
    this.browser = await puppeteer.launch({ headless: !this.debug })
    this.page = await this.browser.newPage()
    await this.page.goto(this.url)
    await this.page.waitForSelector('#userNameInput')
    await this.page.type('#userNameInput', this.login)
    await this.page.type('#passwordInput', this.password)
    await this.page.click('#submitButton')
    await this.page.waitForNavigation()
  }
}

/**
 * Swipe your badge
 * @returns {Promise<string>} the message of Bodet
 */
core.prototype.swipeBadge = async function () {
  await this.page.goto(`${this.url}/open/homepage?ACTION=intranet&asked=1&header=0`)
  const btn = await this.page.waitForSelector('a.boutonAction.defaultActionBouton')
  btn.click()
  const response = await this.page.waitForSelector('ul.badgeuseVirtuelle')
  return (await response.evaluate(el => el.textContent)).trim()
}

/**
 * Close your connection
 */
core.prototype.close = async function () {
  await this.browser.close()
  this.browser = undefined
  this.page = undefined
}

/**
 * Wekly statistics
 * @returns {Promise<{days:{day: string, badges:string[], workTime: string}[], workTime: string}>}
 */
core.prototype.weeklyStatistics = async function () {
  await this.page.goto(`${this.url}/open/homepage?ACTION=intranet&asked=7&header=0`)
  const table = await this.page.waitForSelector('.presenceBordered')
  // const el = document.querySelector('.presenceBordered')
  await waitTillHTMLRendered(this.page)
  /** @type {{day: string, badges:string[], workTime: string}[]} */
  const days = await table.evaluate(el => Array.from(el.querySelectorAll('tr[align=center]'))
    .reduce((acc, tr) => {
      const badges = Array.from(tr.querySelectorAll('td[valign]')).reduce((acc, td) => {
        const input = td.querySelector('input')
        if (input.value) {
          acc.push(input.value)
        }
        return acc
      }, [])
      acc.push({
        day: tr.cells[2].textContent.trim(),
        badges,
      })
      return acc
    }, [])
  )
  // outer the evaluate because document cannot acces to function
  days.forEach(day => {
    day.workTime = minToHourStr(day.badges.reduce(getWorkTime, 0))
  })
  return {
    days,
    workTime: sumWorkTime(days.map(a => a.workTime))
  }
}


const waitTillHTMLRendered = async (page, timeout = 30000) => {
  const checkDurationMsecs = 200
  const maxChecks = timeout / checkDurationMsecs
  let lastHTMLSize = 0
  let checkCounts = 1
  let countStableSizeIterations = 0
  const minStableSizeIterations = 2

  while (checkCounts++ <= maxChecks) {
    let html = await page.content()
    let currentHTMLSize = html.length

    let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length)

    console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, " body html size: ", bodyHTMLSize)

    if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize)
      countStableSizeIterations++
    else
      countStableSizeIterations = 0 //reset the counter

    if (countStableSizeIterations >= minStableSizeIterations) {
      console.log("Page rendered fully..")
      break
    }

    lastHTMLSize = currentHTMLSize
    await page.waitFor(checkDurationMsecs)
  }
}

module.exports = core
