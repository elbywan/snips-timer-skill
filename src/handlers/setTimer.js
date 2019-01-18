const { message, logger } = require('../utils')
const { createTimer } = require('../timers')
const { i18nFactory } = require('../factories')
const { durationToSpeech } = require('../utils/translation')

module.exports = async function (msg, flow) {
    const i18n = i18nFactory.get()

    const nameSlot = message.getSlotsByName(msg, 'timer_name', { onlyMostConfident: true })
    const durationSlot = message.getSlotsByName(msg, 'duration', { onlyMostConfident: true })

    const name = nameSlot && nameSlot.value.value
    const duration = message.getDurationSlotValueInMs(durationSlot)

    logger.debug('name %s', name)
    logger.debug('duration %d', duration)

    // TODO: ringer callback
    const timerName = createTimer(duration, msg.site_id, name => {
        console.log('timer ' + name + ' expired!')
    }, name)

    flow.end()

    return i18n('setTimer.created', {
        duration: durationToSpeech(duration),
        name: timerName,
        context: name ? 'name' : null
    })
}