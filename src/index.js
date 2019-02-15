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
                    action: (msg, flow) => handlers.getRemainingTime(msg, flow, hermes)
                },
                {
                    intent: 'snips-assistant:CancelTimer',
                    action: (msg, flow) => handlers.cancelTimer(msg, flow, hermes)
                },
                {
                    intent: 'snips-assistant:PauseTimer',
                    action: (msg, flow) => handlers.pauseTimer(msg, flow, hermes)
                },
                {
                    intent: 'snips-assistant:ResumeTimer',
                    action: (msg, flow) => handlers.resumeTimer(msg, flow, hermes)
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