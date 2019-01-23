require('./helpers/setup').bootstrap()
const Session = require('./helpers/session')
const {
    createTimerSlot,
    createDurationSlot
} = require('./utils')
const timers = require('../src/timers')

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
    const timer = timers.getTimer('Timer')
    expect(timer.name).toBe('Timer')
    expect(timer.duration).toBe(1000 * 60 * 10)
})

it('should get the 2 timers status', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:GetRemainingTime',
        input: 'What is the status of my timers?'
    })
    const message = await session.end()
    expect(message.text.indexOf('Timer')).toBeGreaterThan(-1)
    expect(message.text.indexOf('Pizza')).toBeGreaterThan(-1)
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
    await session.end()
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
    await session.end()
    const timer = timers.getTimer('Pizza')
    expect(timer.paused).toBe(false)
})

it('should prompt for which timer to pause, then pause the timer called Timer', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:PauseTimer',
        input: 'Pause my timer'
    })
    await session.continue({
        intentName: 'snips-assistant:PauseTimer',
        input: 'Timer',
        slots: [
            createTimerSlot('Timer')
        ]
    })
    await session.end()
    const timer = timers.getTimer('Timer')
    expect(timer.paused).toBe(true)
})

it('should prompt for resuming the timer called Timer (no slots)', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:ResumeTimer',
        input: 'Resume my timer'
    })
    await session.continue({
        intentName: 'snips-assistant:Yes',
        input: 'Yes'
    })
    await session.end()
    const timer = timers.getTimer('Timer')
    expect(timer.paused).toBe(false)
})

it('should prompt for which timer to Cancel (no slots), wrong match', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:CancelTimer',
        input: 'Cancel my timer'
    })
    await session.continue({
        intentName: 'snips-assistant:CancelTimer',
        input: 'My timer called Toto',
        slots: [
            createTimerSlot('Toto')
        ]
    })
    await session.end()
    expect(timers.getTimer('Pizza')).toBeDefined()
    expect(timers.getTimer('Timer')).toBeDefined()
})

it('should prompt for which timer to Cancel (no slots), then cancel the Pizza timer', async () => {
    const session = new Session()
    await session.start({
        intentName: 'snips-assistant:CancelTimer',
        input: 'Cancel my timer'
    })
    await session.continue({
        intentName: 'snips-assistant:CancelTimer',
        input: 'My timer called Pizza',
        slots: [
            createTimerSlot('Pizza')
        ]
    })
    await session.end()
    const timer = timers.getTimer('Pizza')
    expect(timer).toBeUndefined()
})