const dayjs = require('dayjs')
const {
    SLOT_THRESHOLD
} = require('../constants')

function geometricMean(dataSet) {
    return Math.pow(dataSet.reduce((accumulator, element) => accumulator * element, 1), 1/dataSet.length)
}

module.exports = {
    // Helper to filter slots given their name, and potentially a lower threshold for the confidence level.
    // You can also use the onlyMostConfident boolean to return only a single slot with the highest confidence.
    // If no slot match the criterias, then returns null.
    getSlotsByName: (message, slotName, {
        threshold = SLOT_THRESHOLD,
        onlyMostConfident = false
    } = {}) => {
        if(onlyMostConfident) {
            return message.slots.reduce((acc, slot) => {
                if(slot.slot_name === slotName && (!threshold || slot.confidence > threshold)) {
                    if(!acc || acc.confidence < slot.confidence)
                        return slot
                }
                return acc
            }, null)
        }
        return message.slots.filter(slot => slot.slot_name === slotName && slot.confidence > threshold)
    },
    getAsrConfidence(message) {
        return geometricMean(message.asr_tokens.map(token => token.confidence))
    },
    // Get a duration slot value in milliseconds
    getDurationSlotValueInMs(slot) {
        if(!slot)
            return null

        const duration = slot.value.value
        const baseTime = dayjs().valueOf()
        return (
            dayjs(baseTime)
                .add(duration['years'], 'year')
                .add(duration['quarters'] * 3, 'month')
                .add(duration['weeks'] * 7, 'day')
                .add(duration['days'], 'day')
                .add(duration['hours'], 'hour')
                .add(duration['minutes'], 'minute')
                .add(duration['seconds'], 'seconds')
                .valueOf() - baseTime
        )
    }

}