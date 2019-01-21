const { i18nFactory } = require('./factories')

const timers = new Map()

function initTimer(duration, siteId, onExpiration, name) {
    const onTimeout = () => {
        timers.delete(name)
        onExpiration(name)
    }

    return {
        name,
        start: Date.now(),
        duration,
        timeout: setTimeout(onTimeout, duration),
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
            this.timeout = setTimeout(onTimeout, this.duration)
        }
    }
}

module.exports = {
    getTimer(name) {
        return timers.get(name)
    },
    getTimers() {
        return Array.from(timers).map(([, timer ]) => timer)
    },
    getPausedTimers() {
        return Array.from(timers).map(([, timer ]) => timer).filter(timer => timer.paused)
    },
    getActiveTimers() {
        return Array.from(timers).map(([, timer ]) => timer).filter(timer => !timer.paused)
    },
    createTimer(duration, siteId, onExpiration, name) {
        const i18n = i18nFactory.get()
        name = name || i18n('defaultName')

        let timerName = name
        if(timers.has(name)) {
            // Not super efficient, but at least concise.
            // Plus there should not be tons of timers with the same name.
            let i = 1
            timerName = name + i
            while(timers.has(timerName)) {
                i++
                timerName = name + i
            }
        }

        const timer = initTimer(duration, siteId, () => {
            onExpiration(timer)
        }, timerName)
        timers.set(timerName, timer)
        return timer
    },
    getRemainingTime (name) {
        const timer = name && timers.get(name)
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
    deleteTimer (name) {
        if(timers.has(name)) {
            const timer = timers.get(name)
            clearTimeout(timer.timeout)
            timers.delete(name)
            return true
        }
        return false
    },
    pauseTimer (name) {
        if(timers.has(name)) {
            const timer = timers.get(name)
            if(!timer.paused)
                timer.pause()
            return true
        }
        return false
    },
    resume (name) {
        if(timers.has(name)) {
            const timer = timers.get(name)
            if(timer.paused)
                timer.resume()
            return true
        }
        return false
    }
}