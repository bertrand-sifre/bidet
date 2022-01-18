/**
 * @param {string} str
 * @returns {number}
 */
const hourStrToMin = function (str) {
  const [hour, minutes] = str.split(':').map(a => +a)
  return hour * 60 + minutes
}

/**
 * @param {string} start 
 * @param {string} end 
 * @returns {number}
 */
const diffBetween = function (start, end) {
  return hourStrToMin(end) - hourStrToMin(start)
}

/**
 * @param {number} acc 
 * @param {string} badge 
 * @param {number} index 
 * @param {string[]} array 
 * @returns 
 */
const getWorkTime = function (acc, badge, index, array) {
  if (index % 2 === 1) {
    return acc + diffBetween(array[index - 1], badge)
  }
  return acc
}

/**
 * @param {number} minutes 
 * @returns {string}
 */
const minToHourStr = function (minutes) {
  return (minutes / 60 | 0) + ':' + minutes % 60
}

/**
 * @param {string[]} workTimes
 * @returns {string}
 */
const sumWorkTime = function (workTimes) {
  return minToHourStr(workTimes.map(hourStrToMin).reduce((a, c) => a + c, 0))
}

module.exports = {
  minToHourStr,
  getWorkTime,
  sumWorkTime
}