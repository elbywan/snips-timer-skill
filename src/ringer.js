const fs = require('fs')
const alarm = fs.readFileSync('./assets/alarm.wav')

const ringingSiteIds = new Set()

module.exports = {
    ring(audio, siteId) {
        if(ringingSiteIds.has(siteId)) {
            // Already ringing. Ignore
            return
        }
        ringingSiteIds.add(siteId)
        audio.publish('play_audio', {
            id: '0',
            site_id: siteId,
            wav_bytes: alarm,
            wav_bytes_len:  alarm.length
        })
    },
    stopRinging (siteId) {
        ringingSiteIds.delete(siteId)
    }
}