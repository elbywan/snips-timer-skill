const { message, logger, translation } = require('../utils')
const { i18nFactory } = require('../factories')
const { deleteTimer, getTimers } = require('../timers')
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

    const timers = getTimers()

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
                deleteTimer(timer.name, timer.duration)
            }
        })
        return i18n('cancelTimer.canceled', { context: 'all' })
    }

    if(deleteTimer(name, duration)) {
        flow.end()
        return i18n('cancelTimer.canceled', { name, context: name ? 'name' : null })
    }

    if(timers.length === 1) {
        if(!name) {
            flow.end()
            deleteTimer(timers[0].name, timers[0].duration)
            return i18n('cancelTimer.canceled', { name: timers[0].name, context: timers[0].name ? 'name' : null })
        }

        flow.continue('snips-assistant:No', (_, flow) => {
            flow.end()
        })
        flow.continue('snips-assistant:Yes', (_, flow) => {
            flow.end()
            deleteTimer(timers[0].name, timers[0].duration)
            return i18n('cancelTimer.canceled', { name: timers[0].name, context: timers[0].name ? 'name' : null })
        })

        return i18n('cancelTimer.singleTimer', {
            name: timers[0].name
        })
    } else {
        flow.continue('snips-assistant:CancelTimer', (msg, flow) => {
            const nameSlot = message.getSlotsByName(msg, 'timer_name', { onlyMostConfident: true })
            const name = nameSlot && nameSlot.value.value
            const durationSlot = message.getSlotsByName(msg, 'duration', { onlyMostConfident: true })
            const duration = durationSlot && message.getDurationSlotValueInMs(durationSlot)
            const success = (name || duration) && deleteTimer(name, duration)
            flow.end()
            if(success)
                return i18n('cancelTimer.canceled')
            return i18n('notFound')
        })

        return i18n('cancelTimer.multipleTimers', {
            count: timers.length,
            timerNamesAnd: translation.timerNamesToSpeech(timers),
            timerNamesOr: translation.timerNamesToSpeech(timers, 'or')
        })
    }
}