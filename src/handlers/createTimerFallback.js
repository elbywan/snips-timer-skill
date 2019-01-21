const { i18nFactory } = require('../factories')
const setTimerHandler = require('./setTimer')

module.exports = function(flow) {
    const i18n = i18nFactory.get()

    flow.continue('snips-assistant:No', (_, flow) => {
        flow.end()
    })
    flow.continue('snips-assistant:Yes', (_, flow) => {
        flow.continue('snips-assistant:SetTimer', setTimerHandler)
        return i18n('setTimer.ask')
    })

    return i18n('noTimers')
}