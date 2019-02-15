const i18nFactory = require('./factories/i18nFactory')
const timers = []

function initTimer(duration, siteId, onExpiration, name) {
    const onTimeout = duration => () => {
        const index = timers.findIndex(timer => timer.name === name && timer.duration === duration)
        if(index >= 0)
            timers.splice(index, 1)
        onExpiration(name, duration)
    }

    return {
        name,
        start: Date.now(),
        duration,
        timeout: setTimeout(onTimeout(duration), duration),
        pause() {
            clearTimeout(this.timeout)
            this.paused = true
            this.duration = (this.start + this.duration) - Date.now()
        },
        resume() {
            if(!this.paused)
                return
            this.paused = false
            this.state = Date.now()
            this.timeout = setTimeout(onTimeout(this.duration), this.duration)
        }
    }
}

function getTimer(name, duration) {
    const filteredTimers =  timers.filter(timer =>
        (name || duration) &&
        (!name || timer.name === name) &&
        (!duration || timer.duration === duration)
    )
    if((duration && filteredTimers.length >= 1) || filteredTimers.length === 1)
        return filteredTimers[0]
    return null
}

module.exports = {
    getTimer,
    getTimers() {
        return [...timers]
    },
    getPausedTimers() {
        return timers.filter(timer => timer.paused)
    },
    getActiveTimers() {
        return timers.filter(timer => !timer.paused)
    },
    createTimer(duration, siteId, onExpiration, name) {
        const i18n = i18nFactory.get()
        name = name || i18n('defaultName')

        const timer = initTimer(duration, siteId, () => {
            onExpiration(timer)
        }, name)
        timers.push(timer)
        return timer
    },
    getRemainingTime (name, duration) {
        const timer = (name || duration) && getTimer(name, duration)
        if(!timer || timer.paused) {
            return module.exports.getActiveTimers().map(timer => ({
                ...timer,
                remaining: (timer.start + timer.duration) - Date.now()
            }))
        } else {
            return {
                ...timer,
                remaining: (timer.start + timer.duration) - Date.now()
            }
        }
    },
    deleteTimer (name, duration) {
        const timer = getTimer(name, duration)
        if(timer) {
            clearTimeout(timer.timeout)
            timers.splice(timers.indexOf(timer), 1)
            return true
        }
        return false
    },
    pauseTimer (name, duration) {
        const timer = getTimer(name, duration)
        if(timer) {
            if(!timer.paused)
                timer.pause()
            return true
        }
        return false
    },
    resumeTimer (name, duration) {
        const timer = getTimer(name, duration)
        if(timer) {
            if(timer.paused)
                timer.resume()
            return true
        }
        return false
    }
}