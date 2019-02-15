const fs = require('fs')
const path = require('path')
const uuid = require('uuid/v4')
const { Dialog } = require('hermes-javascript')
const { message, logger } = require('../utils')
const { createTimer } = require('../timers')
const { i18nFactory } = require('../factories')
const { durationToSpeech } = require('../utils/translation')
const { dialogueRoundWrapper } = require('./wrappers')

const alarmWav = fs.readFileSync(path.resolve(__dirname, '../../assets/alarm.wav'))

const playAlarmSound = (audio, siteId) => {
    audio.publish('play_audio', {
        id: '0',
        site_id: siteId,
        wav_bytes: alarmWav,
        wav_bytes_len:  alarmWav.length
    })
}

module.exports = async function (msg, flow, hermes, { providedName = null } = {}) {
    const i18n = i18nFactory.get()
    const dialog = hermes.dialog()
    const audio = hermes.audio()

    const siteId = msg.site_id

    const nameSlot = message.getSlotsByName(msg, 'timer_name', { onlyMostConfident: true })
    const durationSlot = message.getSlotsByName(msg, 'duration', { onlyMostConfident: true })

    const name = providedName || nameSlot && nameSlot.value.value
    const duration = durationSlot && message.getDurationSlotValueInMs(durationSlot)

    logger.debug('name %s', name)
    logger.debug('duration %d', duration)

    if(!duration) {
        // Duration slot was not provided - loop once to get it
        flow.continue('snips-assistant:SetTimer', dialogueRoundWrapper((msg, flow) =>
            module.exports(msg, flow, hermes, { providedName: name })
        ))
        return i18n('setTimer.askDuration')
    }

    // On timer expiration
    const onTimerExpiration = timer => {
        logger.debug('timer ' + timer.name + ' expired. (duration: ' + timer.duration + ')')

        const messageId = uuid()

        // Start a session with filters on intents 'Stop / Silence and AddTime'
        dialog.publish('start_session', {
            session_init: {
                init_type: Dialog.enums.initType.action,
                value: {
                    text: i18n('timerIsUp.announce', { name: timer.name, context: timer.name ? 'name' : null }),
                    intent_filter: [
                        'snips-assistant:Stop',
                        'snips-assistant:Silence',
                        'snips-assistant:AddTime'
                    ],
                    can_be_enqueued: true,
                    send_intent_not_recognized: true
                }
            },
            custom_data: messageId,
            can_be_enqueued: true,
            site_id: siteId
        })

        const sessionHandler = dialogueRoundWrapper((msg, flow) => {
            // Play the alarm sound
            playAlarmSound(audio, siteId)

            flow.continue('snips-assistant:AddTime', (msg, flow) => {
                // Create the timer again with the updated duration
                const durationSlot = message.getSlotsByName(msg, 'duration', { onlyMostConfident: true })
                const duration = message.getDurationSlotValueInMs(durationSlot)
                logger.debug('duration %d', duration)
                createTimer(duration, siteId, onTimerExpiration, name)
                flow.end()
                return i18n('timerIsUp.addTime', {
                    time: durationToSpeech(duration)
                })
            })

            // Loop on intentNotRecognized
            flow.notRecognized(sessionHandler)

            // Speak
            return i18n('timerIsUp.announce', { name: timer.name, context: timer.name ? 'name' : null })
        })
        dialog.sessionFlow(messageId, sessionHandler)
    }

    // Create the timer
    const timer = createTimer(duration, siteId, onTimerExpiration, name)

    // End the flow
    flow.end()

    // Return speech
    return i18n('setTimer.created', {
        duration: durationToSpeech(duration),
        name: timer.name,
        context: name ? 'name' : null
    })
}