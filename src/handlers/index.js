const { handlerWrapper, dialogueRoundWrapper } = require('./wrappers')

// Add handlers here, and wrap them.
module.exports = {
    handlerWrapper,
    dialogueRoundWrapper,
    setTimer: dialogueRoundWrapper(require('./setTimer')),
    getRemainingTime: dialogueRoundWrapper(require('./getRemainingTime')),
    cancelTimer: dialogueRoundWrapper(require('./cancelTimer')),
    pauseTimer: dialogueRoundWrapper(require('./pauseTimer')),
    resumeTimer: dialogueRoundWrapper(require('./resumeTimer'))
}