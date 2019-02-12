const { translation, logger } = require('../utils')

// Wrap handlers to gracefully capture errors
const handlerWrapper = handler => (
    async (message, flow, ...args) => {
        logger.debug('message: %O', message)
        try {
            // Run handler until completion
            const tts = await handler(message, flow, ...args)
            // And make the TTS speak
            return tts
        } catch (error) {
            // If an error occurs, end the flow gracefully
            flow.end()
            // And make the TTS output the proper error message
            logger.error(error)
            return await translation.errorMessage(error)
        }
    }
)

// Bind intents that can stop dialogue rounds
const dialogueRoundWrapper = handler => (
    async (message, flow, ...args) => {
        flow.continue('snips-assistant:Stop', handlerWrapper(() => {
            flow.end()
        }))
        flow.continue('snips-assistant:Silence', handlerWrapper(() => {
            flow.end()
        }))
        flow.continue('snips-assistant:Cancel', handlerWrapper(() => {
            flow.end()
        }))
        return handlerWrapper(handler)(message, flow, ...args)
    }
)

module.exports = {
    handlerWrapper,
    dialogueRoundWrapper
}