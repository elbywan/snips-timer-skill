const { message, logger, translation } = require('../utils')
const { i18nFactory } = require('../factories')
const { getTimer, getActiveTimers } = require('../timers')
const createTimerFallback = require('./createTimerFallback')

module.exports = async function (msg, flow) {
    const i18n = i18nFactory.get()

    const nameSlot = message.getSlotsByName(msg, 'timer_name', { onlyMostConfident: true })
    const name = nameSlot && nameSlot.value.value

    logger.debug('name %s', name)

    if(name) {
        const timer = getTimer(name)
        if(timer) {
            flow.end()
            timer.pause()
            return i18n('pauseTimer.paused', { name })
        }
    }

    const timers = getActiveTimers()

    if(timers.length < 1) {
       return createTimerFallback(flow)
    } else if(timers.length === 1) {
        flow.continue('snips-assistant:No', (_, flow) => {
            flow.end()
        })
        flow.continue('snips-assistant:Yes', (_, flow) => {
            flow.end()
            getTimer(timers[0].name).pause()
            return i18n('pauseTimer.paused', { name: timers[0].name })
        })

        return i18n('pauseTimer.singleTimer', {
            name: timers[0].name
        })
    } else {

        const timerNames = timers.map(timer => timer.name)
        flow.continue('snips-assistant:PauseTimer', (msg, flow) => {
            const nameSlot = message.getSlotsByName(msg, 'timerName', { onlyMostConfident: true })
            const timer = nameSlot && getTimer(nameSlot.value.value)
            flow.end()
            if(timer) {
                timer.pause()
                return i18n('pauseTimer.paused')
            }
            return i18n('notFound')
        })

        return i18n('pauseTimer.multipleTimers', {
            count: timers.length,
            timerNamesAnd: translation.joinTerms(timerNames),
            timerNamesOr: translation.joinTerms(timerNames, 'or')
        })
    }
}