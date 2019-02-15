const { message, logger, translation } = require('../utils')
const { i18nFactory } = require('../factories')
const { getRemainingTime } = require('../timers')
const createTimerFallback = require('./createTimerFallback')

module.exports = async function (msg, flow, hermes) {
    const i18n = i18nFactory.get()

    const nameSlot = message.getSlotsByName(msg, 'timer_name', { onlyMostConfident: true })
    const name = nameSlot && nameSlot.value.value
    const durationSlot = message.getSlotsByName(msg, 'duration', { onlyMostConfident: true })
    const duration = durationSlot && message.getDurationSlotValueInMs(durationSlot)

    logger.debug('name %s', name)
    logger.debug('duration %d', duration)

    const activeTimers = name ? getRemainingTime(name, duration) : getRemainingTime()

    if(name && !(activeTimers instanceof Array)) {
        flow.end()
        return i18n('getRemainingTime.found', {
            name,
            duration: translation.durationToSpeech(activeTimers),
            context: name ? 'name' : null
        })
    }

    if(activeTimers.length < 1) {
       return createTimerFallback(flow, hermes)
    } else if(activeTimers.length === 1) {
        // Found a single timer
        flow.end()
        return i18n('getRemainingTime.singleTimer', {
            name: activeTimers[0].name,
            duration: translation.durationToSpeech(activeTimers[0].remaining),
            context: activeTimers[0].name ? name : null
        })
    } else {
        // Found multiple timers
        const timersRecap = activeTimers.map(timer => (
            i18n('getRemainingTime.timerRecap', {
                name: timer.name,
                duration: translation.durationToSpeech(timer.remaining),
                ontext: timer.name ? name : null
            })
        ))

        flow.end()
        return i18n('getRemainingTime.multipleTimers', {
            count: activeTimers.length,
            timersRecap: translation.joinTerms(timersRecap)
        })
    }
}