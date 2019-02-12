const { message, logger, translation } = require('../utils')
const { i18nFactory } = require('../factories')
const { getTimer, getPausedTimers } = require('../timers')
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
            timer.resume()
            return i18n('resumeTimer.resumed', { name })
        }
    }

    const timers = getPausedTimers()

    if(timers.length < 1) {
       return createTimerFallback(flow)
    } else if(timers.length === 1) {
        if(!name) {
            flow.end()
            getTimer(timers[0].name).resume()
            return i18n('resumeTimer.resumed', { name: timers[0].name })
        }

        flow.continue('snips-assistant:No', (_, flow) => {
            flow.end()
        })
        flow.continue('snips-assistant:Yes', (_, flow) => {
            flow.end()
            getTimer(timers[0].name).resume()
            return i18n('resumeTimer.resumed', { name: timers[0].name })
        })

        return i18n('resumeTimer.singleTimer', {
            name: timers[0].name
        })
    } else {

        const timerNames = timers.map(timer => timer.name)
        flow.continue('snips-assistant:ResumeTimer', (msg, flow) => {
            const nameSlot = message.getSlotsByName(msg, 'timer_name', { onlyMostConfident: true })
            const timer = nameSlot && getTimer(nameSlot.value.value)
            flow.end()
            if(timer) {
                timer.resume()
                return i18n('resumeTimer.resumed')
            }
            return i18n('notFound')
        })

        return i18n('resumeTimer.multipleTimers', {
            count: timers.length,
            timerNamesAnd: translation.joinTerms(timerNames),
            timerNamesOr: translation.joinTerms(timerNames, 'or')
        })
    }
}