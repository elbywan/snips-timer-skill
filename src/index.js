const { withHermes } = require('hermes-javascript')
const bootstrap = require('./bootstrap')
const handlers = require('./handlers')
const { translation, logger } = require('./utils')

module.exports = function ({
    hermesOptions = {},
    bootstrapOptions = {}
} = {}) {
    // Initialize hermes
    withHermes(async (hermes, done) => {
        try {
            // Bootstrap config, locale, i18n…
            await bootstrap(bootstrapOptions)

            const dialog = hermes.dialog()

            dialog.flows([
                {
                    intent: 'snips-assistant:SetTimer',
                    action: (msg, flow) => handlers.setTimer(msg, flow, hermes)
                },
                {
                    intent: 'snips-assistant:GetRemainingTime',
                    action: handlers.getRemainingTime
                },
                {
                    intent: 'snips-assistant:CancelTimer',
                    action: handlers.cancelTimer
                },
                {
                    intent: 'snips-assistant:PauseTimer',
                    action: handlers.pauseTimer
                },
                {
                    intent: 'snips-assistant:ResumeTimer',
                    action: handlers.resumeTimer
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
    }, hermesOptions)
}