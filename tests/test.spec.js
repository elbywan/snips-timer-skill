require('./helpers/setup').bootstrap()
const Session = require('./helpers/session')
const { getMessageKey } = require('./helpers/tools')
const {
    createTimerSlot,
    createDurationSlot
} = require('./utils')
const timers = require('../src/timers')

// i18n output is mocked when running the tests.
const DEFAULT_NAME = '{"key":"defaultName"}'

it('should set a new Timer (Pizza, 5 minutes)', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:SetTimer',
        input: 'Start a timer called Pizza for five minutes',
        slots: [
            createTimerSlot('Pizza'),
            createDurationSlot({ minutes: 5 })
        ]
    })
    await session.end()

    const timer = timers.getTimer('Pizza')
    expect(timer.name).toBe('Pizza')
    expect(timer.duration).toBe(1000 * 60 * 5)
})

it('should set a new Timer (10 minutes)', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:SetTimer',
        input: 'Start a timer for 10 minutes',
        slots: [
            createDurationSlot({ minutes: 10 })
        ]
    })
    await session.end()

    const timer = timers.getTimer(DEFAULT_NAME)
    expect(timer.name).toBe(DEFAULT_NAME)
    expect(timer.duration).toBe(1000 * 60 * 10)
})

it('should get the 2 timers status', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:GetRemainingTime',
        input: 'What is the status of my timers?'
    })
    const message = await session.end()
    const { key, options } = JSON.parse(message.text)
    expect(key).toBe('getRemainingTime.multipleTimers')
    expect(options.count).toBe(2)
})

it('should pause the Pizza timer', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:PauseTimer',
        input: 'Pause the timer called Pizza',
        slots: [
            createTimerSlot('Pizza')
        ]
    })
    const message = await session.end()
    expect(getMessageKey(message)).toBe('pauseTimer.paused')

    const timer = timers.getTimer('Pizza')
    expect(timer.paused).toBe(true)
})

it('should resume the Pizza timer', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:ResumeTimer',
        input: 'Pause the timer called Pizza',
        slots: [
            createTimerSlot('Pizza')
        ]
    })
    const message = await session.end()
    expect(getMessageKey(message)).toBe('resumeTimer.resumed')

    const timer = timers.getTimer('Pizza')
    expect(timer.paused).toBe(false)
})

it('should prompt for which timer to pause, then pause the timer called Timer', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:PauseTimer',
        input: 'Pause my timer'
    })
    const whichTimerMsg = await session.continue({
        intentName: 'snips-assistant:PauseTimer',
        input: DEFAULT_NAME,
        slots: [
            createTimerSlot(DEFAULT_NAME)
        ]
    })
    expect(getMessageKey(whichTimerMsg)).toBe('pauseTimer.multipleTimers')
    const endMsg = await session.end()
    expect(getMessageKey(endMsg)).toBe('pauseTimer.paused')

    const timer = timers.getTimer(DEFAULT_NAME)
    expect(timer.paused).toBe(true)
})

it('should prompt for resuming the timer called Timer (no slots)', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:ResumeTimer',
        input: 'Resume my timer'
    })
    const whichTimerMsg = await session.continue({
        intentName: 'snips-assistant:Yes',
        input: 'Yes'
    })
    expect(getMessageKey(whichTimerMsg)).toBe('resumeTimer.singleTimer')
    const endMsg = await session.end()
    expect(getMessageKey(endMsg)).toBe('resumeTimer.resumed')

    const timer = timers.getTimer(DEFAULT_NAME)
    expect(timer.paused).toBe(false)
})

it('should prompt for which timer to Cancel (no slots), wrong match', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:CancelTimer',
        input: 'Cancel my timer'
    })
    const whichTimerMsg = await session.continue({
        intentName: 'snips-assistant:CancelTimer',
        input: 'My timer called Toto',
        slots: [
            createTimerSlot('Toto')
        ]
    })
    expect(getMessageKey(whichTimerMsg)).toBe('cancelTimer.multipleTimers')
    const endMsg = await session.end()
    expect(getMessageKey(endMsg)).toBe('notFound')

    expect(timers.getTimer('Pizza')).toBeDefined()
    expect(timers.getTimer(DEFAULT_NAME)).toBeDefined()
})

it('should prompt for which timer to Cancel (no slots), then cancel the Pizza timer', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:CancelTimer',
        input: 'Cancel my timer'
    })
    const whichTimerMsg = await session.continue({
        intentName: 'snips-assistant:CancelTimer',
        input: 'My timer called Pizza',
        slots: [
            createTimerSlot('Pizza')
        ]
    })
    expect(getMessageKey(whichTimerMsg)).toBe('cancelTimer.multipleTimers')
    const endMsg = await session.end()
    expect(getMessageKey(endMsg)).toBe('cancelTimer.canceled')

    const timer = timers.getTimer('Pizza')
    expect(timer).toBeUndefined()
})