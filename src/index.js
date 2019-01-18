const { withHermes } = require('hermes-javascript')
const bootstrap = require('./bootstrap')
const handlers = require('./handlers')
const { translation, logger } = require('./utils')

// Initialize hermes
withHermes(async (hermes, done) => {
    try {
        // Bootstrap config, locale, i18n…
        await bootstrap()

        const dialog = hermes.dialog()

        dialog.flows([
            {
                intent: 'snips-assistant:SetTimerTmp',
                action: (msg, flow) => handlers.setTimer(msg, flow)
            },
            {
                intent: 'snips-assistant:GetRemainingTime',
                action: (msg, flow) => handlers.getRemainingTime(msg, flow)
            },
            {
                intent: 'snips-assistant:CancelTimer',
                action: (msg, flow) => handlers.cancelTimer(msg, flow)
            },
            {
                intent: 'snips-assistant:PauseTimer',
                action: (msg, flow) => handlers.pauseTimer(msg, flow)
            },
            {
                intent: 'snips-assistant:ResumeTimer',
                action: (msg, flow) => handlers.resumeTimer(msg, flow)
            }
        ])

    } catch (error) {
        // Output initialization errors to stderr and exit
        const message = await translation.errorMessage(error)
        logger.error(message)
        logger.error(error)
        // Exit
        done()
    }
})