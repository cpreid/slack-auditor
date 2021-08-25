const axios = require('axios')
const qs = require('qs')

/**
 * 
 * Some util methods
 */
const sleep = sec => {
  return new Promise((resolve) => {
    setTimeout(resolve, sec * 1000);
  });
}

const unixSec = unixMs => {
  return Math.floor(Number(unixMs) / 1000)
}

module.exports = class SlackAuditor {  

  constructor(token=null, interval=5, sourceFilters={}) {
    if(!token) {
      throw new Error(`SlackAuditor: no token provided to constructor`)
    }

    this.AUDIT_TOKEN = token
    this.INTERVAL_SEC = interval
    this.subscribers = []
    this.sourceFilters = sourceFilters
    this.lastRun = null
  }

  setLoop() {
    this.loop = async () => {      
      // On n > 1 runs, look back for entries newer than previous run
      // On n = 1 run, don't hit the API, just set the lastRun timestamp in order to poll for only future events
      if (this.lastRun) {
        let oldest = unixSec(this.lastRun),
          entries = [],
          qsArgs = qs.stringify(Object.assign({ oldest }, this.sourceFilters))
        try {
          const requestUrl = `https://api.slack.com/audit/v1/logs?${qsArgs}`
          entries = (await axios.get(requestUrl, {
            headers: { 'Authorization': `Bearer ${this.AUDIT_TOKEN}` }
          })).data.entries
        } catch (err) {
          if (typeof err.response === 'object') {
            throw new Error(`Slack API Response - code: ${err.response.status}, msg: ${err.response.statusText}`)
          }
          else {
            throw new Error(`Slack API Response - Unknown error: ${JSON.stringify(err)}`)
          }
        }
        // publish events to all subcribers
        entries.map(entry => this.subscribers.map(sub => sub(entry)))
      }
  
      // mark last run as now
      this.lastRun = new Date()
  
      // wait a specific interval to re-poll API
      await sleep(this.INTERVAL_SEC)
      this.loop()
    }
    this.loop()
  }

  stop() {
    this.loop = null
    return this
  }

  /**
   * Bind a listener for Audit Log events that fit some criteria
   * 
   * @param {Object} criteria 
   * @param {String | Function} callbackOrWebhookUrl
   * 
   * Criteria is a JS object with the various Event properties you'd like to target
   * Examples: https://api.slack.com/admins/audit-logs#monitoring-workspace-events-with-the-audit-logs-api__the-audit-event
   */
  on(criteria = {}, callbackOrWebhookUrl) {
    if(!this.loop) this.setLoop()
    if(criteria === '*' || criteria === null || typeof criteria === 'undefined') criteria = {}

    this.subscribers.push(entry => {
      // Clever way to measure diffs to determine if subscriber qualifies by criteria
      let merged = Object.assign({}, entry, criteria)
      
      // The incoming event payload matches the criteria  
      if (JSON.stringify(merged) === JSON.stringify(entry)) {      
        if (typeof callbackOrWebhookUrl === 'function') callbackOrWebhookUrl(entry)
        else if (typeof callbackOrWebhookUrl === 'string') axios.post(callbackOrWebhookUrl, entry)
        else { } // no valid handler provided
      }      
      
    })
    return this
  }
}

  