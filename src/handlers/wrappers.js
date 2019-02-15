const {
    INTENT_THRESHOLD,
    INTENT_FILTER_THRESHOLD,
    ASR_THRESHOLD
} = require('../constants')
const { translation, logger, message: { getAsrConfidence } } = require('../utils')

// Wrap handlers to gracefully capture errors
const handlerWrapper = (handler, { nested = false } = {}) => (
    async (message, flow, ...args) => {
        logger.debug('message: %O', message)
        try {
            // Check the message thresholds
            if(
                message.intent.probability < (nested ? INTENT_FILTER_THRESHOLD: INTENT_THRESHOLD) ||
                getAsrConfidence(message) < ASR_THRESHOLD
            ) {
                throw new Error('intentNotRecognized')
            }

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
        return handlerWrapper(handler, { nested: true })(message, flow, ...args)
    }
)

module.exports = {
    handlerWrapper,
    dialogueRoundWrapper
}