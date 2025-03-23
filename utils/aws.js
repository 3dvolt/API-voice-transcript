const AWS = require('aws-sdk');
const { S3Client } = require('@aws-sdk/client-s3')

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,         // Your AWS Access Key ID
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Your AWS Secret Access Key
    region: process.env.AWS_REGION,                     // Your AWS region (e.g., 'us-west-2')
});

const s3Uploader = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function uploadAudioToS3(audioBuffer, key, contentType = 'audio/mpeg') {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME, // Your S3 bucket name
        Key: key,                            // The unique key for the uploaded file
        Body: audioBuffer,
        ContentType: contentType,
    };

    try {
        const data = await s3.upload(params).promise();
        return data; // data.Location contains the file URL
    } catch (error) {
        throw new Error(`Failed to upload audio file to S3: ${error.message}`);
    }
}

function getSignedUrlForAudio(key, expiresIn = 3600) {
    // 'expiresIn' is in seconds (3600 seconds = 1 hour)
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Expires: expiresIn,
    };
    return s3.getSignedUrl('getObject', params);
}

module.exports = { uploadAudioToS3, getSignedUrlForAudio,s3Uploader };
