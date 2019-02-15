const { handlerWrapper, dialogueRoundWrapper } = require('./wrappers')

// Add handlers here, and wrap them.
module.exports = {
    handlerWrapper,
    dialogueRoundWrapper,
    setTimer: handlerWrapper(require('./setTimer')),
    getRemainingTime: handlerWrapper(require('./getRemainingTime')),
    cancelTimer: handlerWrapper(require('./cancelTimer')),
    pauseTimer: handlerWrapper(require('./pauseTimer')),
    resumeTimer: handlerWrapper(require('./resumeTimer'))
}