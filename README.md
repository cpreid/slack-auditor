# audit-logs-pubsub
Simple pub/sub solution for the Slack Audit Logs API

## Install
`npm install slack-auditor`

## Usage

```javascript
const SlackAuditor = require('slack-auditor')

const auditorClient = new SlackAuditor(token='YOUR-SLACK-ORG-AUDIT-TOKEN', interval=5)

/**
* Optionally supply filter in the requests to the source
* This is handy in a huge grid where thousands of events per second may exceed the API return limit (unlikely with filter)
* const auditorClient = new SlackAuditor(token='YOUR-SLACK-ORG-AUDIT-TOKEN', interval=5, sourceFilters={action: 'user_channel_join'})
*/

auditorClient.on('*', evt => {
  console.log("Catch-all:", evt)
})

auditorClient.on({
  action: 'user_channel_join',
}, evt => {
  console.log("User joined channel", evt)
})

auditorClient.on({
  action: 'user_channel_leave',
}, 'http://webhook-destination.com/example')
```

## Methods

### Constructor
Creates new instance and attaches several properties prior to audit API polling. 

```
new SlackAuditor({string} token, {integer} interval, [{object} sourceFilters])
```
**Returns** ```SlackAuditor``` instance.

| argument | type   | details                                            | required | default |
|-----------|--------|----------------------------------------------------|----------|---------|
| token       | string | Slack Org-level token with `audit:read` permission scope | yes      |     null    |
| interval      | integer   | Number of seconds between each API poll                     | no      |    5    |
| sourceFilters      | object   | Provide a filter for the Audit Log API request. Supports any filter parameters documented [here](https://api.slack.com/admins/audit-logs#monitoring-workspace-events-with-the-audit-logs-api__how-to-call-the-audit-logs-api__audit-logs-endpoints).                     | no      |    {}    |

### on
Binds an audit event listener that allows you to process the event in a callback function or forward the event to a webhook url.
```
.on({object} criteria, [{fcn|string} callbackOrWebhookUrl])
```
**Returns** ```SlackAuditor``` instance.

| argument | type   | details                                            | required | default |
|-----------|--------|----------------------------------------------------|----------|---------|
| criteria       | object | Event type to query for. Must be one of the following (click, pageview, custom) | no      |     {} (All audit events)    |
| callbackOrWebhookUrl      | fcn or string   | Either a function that gets called when slack event is detected, or a webhook url string that receives a `post` request                     | no      |    null    |

### stop
Disables all current listeners
```
.stop()
```
**Returns** ```SlackAuditor``` instance

> No arguments
