const { message, logger, translation } = require('../utils')
const { i18nFactory } = require('../factories')
const { getActiveTimers, pauseTimer } = require('../timers')
const createTimerFallback = require('./createTimerFallback')

module.exports = async function (msg, flow, hermes) {
    const i18n = i18nFactory.get()

    const nameSlot = message.getSlotsByName(msg, 'timer_name', { onlyMostConfident: true })
    const name = nameSlot && nameSlot.value.value
    const durationSlot = message.getSlotsByName(msg, 'duration', { onlyMostConfident: true })
    const duration = durationSlot && message.getDurationSlotValueInMs(durationSlot)
    const allTimersSlot = message.getSlotsByName(msg, 'all_timers', { onlyMostConfident: true })

    logger.debug('name %s', name)
    logger.debug('duration %d', duration)

    const timers = getActiveTimers()

    if(timers.length < 1) {
        return createTimerFallback(flow, hermes)
    }

    if(allTimersSlot) {
        flow.end()
        timers.forEach(timer => {
            if(
                (!name || timer.name === name) &&
                (!duration || timer.duration === duration)
            ) {
                pauseTimer(timer.name, timer.duration)
            }
        })
        return i18n('pauseTimer.paused', { context: 'all' })
    }

    if(pauseTimer(name, duration)) {
        flow.end()
        return i18n('pauseTimer.paused', { name, context: name ? 'name' : null })
    }

    if(timers.length === 1) {
        if(!name) {
            flow.end()
            timers[0].pause()
            return i18n('pauseTimer.paused', { name: timers[0].name, context: translation.hasDefaultName(timers[0].name) ? null : 'name' })
        }

        flow.continue('snips-assistant:No', (_, flow) => {
            flow.end()
        })
        flow.continue('snips-assistant:Yes', (_, flow) => {
            flow.end()
            timers[0].pause()
            return i18n('pauseTimer.paused', { name: timers[0].name, context: translation.hasDefaultName(timers[0].name) ? null : 'name' })
        })

        return i18n('pauseTimer.singleTimer', {
            name: timers[0].name
        })
    } else {
        flow.continue('snips-assistant:PauseTimer', (msg, flow) => {
            const nameSlot = message.getSlotsByName(msg, 'timer_name', { onlyMostConfident: true })
            const name = nameSlot && nameSlot.value.value
            const durationSlot = message.getSlotsByName(msg, 'duration', { onlyMostConfident: true })
            const duration = durationSlot && message.getDurationSlotValueInMs(durationSlot)
            const success = (name || duration) && pauseTimer(name, duration)
            flow.end()
            if(success) {
                return i18n('pauseTimer.paused')
            }
            return i18n('notFound')
        })

        return i18n('pauseTimer.multipleTimers', {
            count: timers.length,
            timerNamesAnd: translation.timerNamesToSpeech(timers),
            timerNamesOr: translation.timerNamesToSpeech(timers, 'or')
        })
    }
}