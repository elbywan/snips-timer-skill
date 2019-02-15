const { message, logger, translation } = require('../utils')
const { i18nFactory } = require('../factories')
const { getPausedTimers, resumeTimer } = require('../timers')
const createTimerFallback = require('./createTimerFallback')

module.exports = async function (msg, flow) {
    const i18n = i18nFactory.get()

    const nameSlot = message.getSlotsByName(msg, 'timer_name', { onlyMostConfident: true })
    const name = nameSlot && nameSlot.value.value
    const durationSlot = message.getSlotsByName(msg, 'duration', { onlyMostConfident: true })
    const duration = durationSlot && message.getDurationSlotValueInMs(durationSlot)
    const allTimersSlot = message.getSlotsByName(msg, 'all_timers', { onlyMostConfident: true })

    logger.debug('name %s', name)
    logger.debug('duration %d', duration)

    const timers = getPausedTimers()

    if(timers.length < 1) {
        return createTimerFallback(flow)
    }

    if(allTimersSlot) {
        flow.end()
        timers.forEach(timer => {
            if(
                (!name || timer.name === name) &&
                (!duration || timer.duration === duration)
            ) {
                resumeTimer(timer.name, timer.duration)
            }
        })
        return i18n('resumeTimer.resumed', { context: 'all' })
    }

    if(resumeTimer(name, duration)) {
        flow.end()
        return i18n('resumeTimer.resumed', { name, context: name ? 'name' : null })
    }

    if(timers.length === 1) {
        if(!name) {
            flow.end()
            timers[0].resume()
            return i18n('resumeTimer.resumed', { name: timers[0].name, context: timers[0].name ? 'name' : null })
        }

        flow.continue('snips-assistant:No', (_, flow) => {
            flow.end()
        })
        flow.continue('snips-assistant:Yes', (_, flow) => {
            flow.end()
            timers[0].resume()
            return i18n('resumeTimer.resumed', { name: timers[0].name, context: timers[0].name ? 'name' : null })
        })

        return i18n('resumeTimer.singleTimer', {
            name: timers[0].name
        })
    } else {
        flow.continue('snips-assistant:ResumeTimer', (msg, flow) => {
            const nameSlot = message.getSlotsByName(msg, 'timer_name', { onlyMostConfident: true })
            const name = nameSlot && nameSlot.value.value
            const durationSlot = message.getSlotsByName(msg, 'duration', { onlyMostConfident: true })
            const duration = durationSlot && message.getDurationSlotValueInMs(durationSlot)
            const success = (name || duration) && resumeTimer(name, duration)
            flow.end()
            if(success) {
                return i18n('resumeTimer.resumed')
            }
            return i18n('notFound')
        })

        return i18n('resumeTimer.multipleTimers', {
            count: timers.length,
            timerNamesAnd: translation.timerNamesToSpeech(timers),
            timerNamesOr: translation.timerNamesToSpeech(timers, 'or')
        })
    }
}