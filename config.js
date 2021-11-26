const dotenv = require('dotenv')

const result = dotenv.config();

function die(message) {
    throw new Error(message)
}

let config = {
    AMAZON_AWS_ACCESS_KEY_ID: process.env.AMAZON_AWS_ACCESS_KEY_ID || die(`Missing AMAZON_AWS_ACCESS_KEY_ID`),
    AMAZON_AWS_SECRET_ACCESS_KEY: process.env.AMAZON_AWS_SECRET_ACCESS_KEY || die(`Missing AMAZON_AWS_SECRET_ACCESS_KEY`),
    S3_BUCKET: process.env.S3_BUCKET || die(`Missing S3_BUCKET`)
}

module.exports = config