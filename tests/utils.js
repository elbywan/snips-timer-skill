module.exports = {
    createTimerSlot(name) {
        return {
            slotName: 'timer_name',
            entity: 'timer_name',
            confidence: 1,
            rawValue: name,
            value: {
                kind: 'Custom',
                value: name
            }
        }
    },
    createAllTimersSlot() {
        return {
            slotName: 'all_timers',
            entity: 'all_timers',
            confidence: 1,
            rawValue: 'all',
            value: {
                kind: 'Custom',
                value: 'all'
            }
        }
    },
    createDurationSlot(value) {
        return {
            slotName: 'duration',
            entity: 'snips/duration',
            confidence: 1,
            rawValue: 'five minutes',
            value: {
                kind: 'Duration',
                years: 0,
                quarters: 0,
                months: 0,
                weeks: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                precision: 'Exact',
                ...value
            }
        }
    }
}