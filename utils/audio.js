const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');

/**
 * Calculates the duration of an audio file buffer using ffmpeg.
 * @param {Buffer} buffer - The audio file buffer.
 * @returns {Promise<number>} - The duration of the audio in seconds.
 */
const calculateDuration = (buffer) => {
    return new Promise((resolve, reject) => {
        // Create a readable stream from the buffer
        const stream = new PassThrough();
        stream.end(buffer);

        // Use ffmpeg to read the duration
        ffmpeg(stream)
            .format('mp3') // or 'wav' depending on the input
            .on('format', (data) => {
                resolve(data.duration);
            })
            .on('error', (err) => {
                console.error('Error calculating duration:', err);
                reject(err);
            })
            .run();
    });
};

module.exports = { calculateDuration };