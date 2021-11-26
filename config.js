const dotenv = require('dotenv')

const result = dotenv.config();

function die(message) {
    throw new Error(message)
}

let config = {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || die(`Missing AWS_ACCESS_KEY_ID`),
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || die(`Missing AWS_SECRET_ACCESS_KEY`),
    S3_BUCKET: process.env.S3_BUCKET || die(`Missing S3_BUCKET`)
}

module.exports = config