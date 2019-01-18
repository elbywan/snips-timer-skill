const { message, logger, translation } = require('../utils')
const { i18nFactory } = require('../factories')
const { getRemainingTime } = require('../timers')
const createTimerFallback = require('./createTimerFallback')

module.exports = async function (msg, flow) {
    const i18n = i18nFactory.get()

    const nameSlot = message.getSlotsByName(msg, 'timer_name', { onlyMostConfident: true })
    const name = nameSlot && nameSlot.value.value

    logger.debug('name %s', name)

    const activeTimers = name ? getRemainingTime(name) : getRemainingTime()

    if(name && !(activeTimers instanceof Array)) {
        flow.end()
        return i18n('getRemainingTime.found', {
            name,
            duration: translation.durationToSpeech(activeTimers)
        })
    }

    if(activeTimers.length < 1) {
       return createTimerFallback(flow)
    } else if(activeTimers.length === 1) {
        // Found a single timer
        flow.end()
        return i18n('getRemainingTime.singleTimer', {
            name: activeTimers[0].name,
            duration: translation.durationToSpeech(activeTimers[0].remaining)
        })
    } else {
        // Found multiple timers
        const timersRecap = activeTimers.map(timer => (
            i18n('getRemainingTime.timerRecap', {
                name: timer.name,
                duration: translation.durationToSpeech(timer.remaining)
            })
        ))

        flow.end()
        return i18n('getRemainingTime.multipleTimers', {
            count: activeTimers.length,
            timersRecap: translation.joinTerms(timersRecap)
        })
    }
}