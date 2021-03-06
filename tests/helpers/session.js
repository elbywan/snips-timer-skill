const setup = require('./setup')
const uuid = require('uuid/v4')

class Session {
    constructor() {
        this.mqtt = setup.mqttClient
        this.sessionId = uuid()
    }

    reset() {
        this.sessionId = uuid()
    }

    subscribe (topic) {
        return new Promise((resolve, reject) => {
            this.mqtt.subscribe(topic, err => {
                err ? reject(err) : resolve()
            })
        })
    }

    unsubscribe (topic) {
        return new Promise((resolve, reject) => {
            this.mqtt.unsubscribe(topic, err => {
                err ? reject(err) : resolve()
            })
        })
    }

    async publishMessage ({ intentName, input, ...additionalFields }) {
        return new Promise(resolve => {
            this.mqtt.publish(`hermes/intent/${intentName}`, JSON.stringify({
                 sessionId: this.sessionId,
                 siteId: 'default',
                 intent: {
                     intentName,
                     probability: 0.5
                 },
                 asrTokens: [],
                 slots: [],
                 input,
                 ...additionalFields
             }), resolve)
        })
    }

    nextMessage() {
        return new Promise(resolve =>
            this.mqtt.once('message', (topic, message) => {
                resolve([ topic, JSON.parse(message.toString()) ])
            })
        )
    }

    async start({
        intentName,
        input,
        ...additionalFields
    }) {
        if(!input || !intentName) {
            throw new Error('input and intentName fields are required')
        }
        // Subscribe to the continueSession/endSession callbacks
        await this.subscribe('hermes/dialogueManager/continueSession')
        await this.subscribe('hermes/dialogueManager/endSession')
        // Publish an intent message
        this.publishMessage({ intentName, input, ...additionalFields })
    }

    async continue({
        intentName,
        input,
        ...additionalFields
    }) {
        if(!input || !intentName) {
            throw new Error('input and intentName fields are required')
        }
        // Wait for the continue session message
        const [ topic, message ] = await this.nextMessage()
        // Asserts
        expect(topic).toBe('hermes/dialogueManager/continueSession')
        expect(message.sessionId).toBe(this.sessionId)
        // Publish an intent message
        this.publishMessage({ intentName, input, ...additionalFields })
        return message
    }

    async end() {
        // Wait for the end session message
        const [ topic, message ] = await this.nextMessage()
        // Asserts
        expect(topic).toBe('hermes/dialogueManager/endSession')
        expect(message.sessionId).toBe(this.sessionId)
        await this.unsubscribe('hermes/dialogueManager/continueSession')
        await this.unsubscribe('hermes/dialogueManager/endSession')
        return message
    }
}

module.exports = Session