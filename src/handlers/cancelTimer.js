const { message, logger, translation } = require('../utils')
const { i18nFactory } = require('../factories')
const { deleteTimer, getTimers } = require('../timers')
const createTimerFallback = require('./createTimerFallback')

module.exports = async function (msg, flow) {
    const i18n = i18nFactory.get()

    const nameSlot = message.getSlotsByName(msg, 'timer_name', { onlyMostConfident: true })
    const name = nameSlot && nameSlot.value.value

    logger.debug('name %s', name)

    if(name) {
        if(deleteTimer(name)) {
            flow.end()
            return i18n('cancelTimer.canceled', { name })
        }
    }

    const timers = getTimers()

    if(timers.length < 1) {
       return createTimerFallback(flow)
    } else if(timers.length === 1) {
        flow.continue('snips-assistant:No', (_, flow) => {
            flow.end()
        })
        flow.continue('snips-assistant:Yes', (_, flow) => {
            flow.end()
            deleteTimer(timers[0].name)
            return i18n('cancelTimer.canceled', { name: timers[0].name })
        })

        return i18n('cancelTimer.singleTimer', {
            name: timers[0].name
        })
    } else {

        const timerNames = timers.map(timer => timer.name)
        flow.continue('snips-assistant:CancelTimer', (msg, flow) => {
            const nameSlot = message.getSlotsByName(msg, 'timerName', { onlyMostConfident: true })
            const success = deleteTimer(nameSlot.value.value)
            flow.end()
            if(success)
                return i18n('cancelTimer.canceled')
            return i18n('notFound')
        })

        return i18n('cancelTimer.multipleTimers', {
            count: timers.length,
            timerNames: translation.joinTerms(timerNames)
        })
    }
}