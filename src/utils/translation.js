const i18nFactory = require('../factories/i18nFactory')

module.exports = {
    // Outputs an error message based on the error object, or a default message if not found.
    errorMessage: async error => {
        let i18n = i18nFactory.get()

        if(!i18n) {
            await i18nFactory.init()
            i18n = i18nFactory.get()
        }

        if(i18n) {
            return i18n([`error.${error.message}`, 'error.unspecific'])
        } else {
            return 'Oops, something went wrong.'
        }
    },
    // Joins a list of strings with comma separators and the last element with an 'and'.
    joinTerms (list, keyword = 'and') {
        if(!list || list.length < 2)
            return list && list[0] || ''

        const i18n = i18nFactory.get()
        let joinedString = ''
        for (let i = 0; i < list.length; i++) {
            const element = list[i]

            if(i === (list.length - 1)) {
                joinedString += ' ' + i18n('joins.' + keyword + 'Something', { something: element }) + ' '
                continue
            } else if(i > 0) {
                joinedString += ', '
            }

            joinedString += element
        }
        return joinedString
    },
    // Takes an array from the i18n and returns a random item.
    randomTranslation (key, opts) {
        const i18n = i18nFactory.get()
        const possibleValues = i18n(key, { returnObjects: true, ...opts })
        const randomIndex = Math.floor(Math.random() * possibleValues.length)
        return possibleValues[randomIndex]
    },
    // Milliseconds to proper speech
    durationToSpeech (duration) {
        const i18n = i18nFactory.get()

        if(duration < 1000) {
            // ms
            return duration + ' ' + i18n('time.millisecond', { count: duration })
        } else if(duration < 1000 * 60) {
            // s
            const seconds = Math.floor(duration / 1000)
            return seconds + ' ' + i18n('time.second', { count: seconds })
        } else if(duration < 1000 * 60 * 60) {
            // min
            const minutes = Math.floor(duration / (1000 * 60))
            const seconds = Math.floor((duration % (1000 * 60)) / 1000)
            return (
                minutes + ' ' + i18n('time.minute', { count: minutes }) +
                (seconds > 0 ? ` ${seconds} ${i18n('time.second', { count: seconds })}` : '')
            )
        } else if(duration < 1000 * 60 * 60 * 24) {
            // hours
            const hours = Math.floor(duration / (1000 * 60 * 60))
            const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((duration % (1000 * 60)) / 1000)
            return (
                hours + ' ' + i18n('time.hour', { count: hours }) +
                (minutes > 0 ? ` ${minutes} ${i18n('time.minute', { count: minutes })}` : '') +
                (seconds > 0 ? ` ${seconds} ${i18n('time.second', { count: seconds })}` : '')
            )
        } else {
            // days
            const days = Math.floor(duration / (1000 * 60 * 60 * 24))
            const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((duration % (1000 * 60)) / 1000)
            return (
                days + ' ' + i18n('time.day', { count: days }) +
                (hours > 0 ? ` ${hours} ${i18n('time.hour', { count: hours })}` : '') +
                (minutes > 0 ? ` ${minutes} ${i18n('time.minute', { count: minutes })}` : '') +
                (seconds > 0 ? ` ${seconds} ${i18n('time.second', { count: seconds })}` : '')
            )
        }
    },
    timerNamesToSpeech(timers, keyword = 'and') {
        const { durationToSpeech, joinTerms } = module.exports
        const i18n = i18nFactory.get()
        const timersMap = new Map()
        timers.forEach(timer => {
            if(!timersMap.has(timer.name)) {
                timersMap.set(timer.name, [])
            }
            timersMap.get(timer.name).push(timer)
        })
        const timerDescriptions = Array.from(timersMap).reduce((descs, [ name, timers ]) => {
            const useDefaultDescription = (name === i18n('defaultName'));
            if(timers.length === 1) {
                return [
                    ...descs,
                    useDefaultDescription ?
                        i18n('defaultTimerDescription', { duration: durationToSpeech(timers[0].duration) }) :
                    i18n('namedTimerDescription', { duration: durationToSpeech(timers[0].duration), name: timers[0].name })
                ]
            }
            return [
                ...descs,
                ...timers.map(timer => (
                    useDefaultDescription ?
                        i18n('defaultTimerDescription', { duration: durationToSpeech(timer.duration) }) :
                    i18n('namedTimerDescription', { duration: durationToSpeech(timer.duration), name: timer.name })
                ))
            ]
        }, [])
        return joinTerms(timerDescriptions, keyword)
    },
    hasDefaultName(timerName) {
        const i18n = i18nFactory.get()
        return timerName === i18n('defaultName')
    }
}