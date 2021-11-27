'use strict';

// const puppeteer = require('puppeteer')
const puppeteer = require("puppeteer-core");
const chrome = require("chrome-aws-lambda");

const { PutObjectCommand, DeleteObjectCommand, S3Client } = require("@aws-sdk/client-s3")
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");


const config = require('./config.js')
const { readFile } = require('fs').promises

function delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms)
    });
}

async function deleteFile(client, bucket, key) {
    let command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
    })

    let response = await client.send(command)

    return response
}

async function putFile(client, bucket, key, body) {
    let command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body
    })

    let response = await client.send(command)

    return response
}

async function main() {
    try {
        let reports = [{
            name: 'StartToFrameReady',
            url: 'https://davideverson.quickbase.com/db/bqgj56f3v?a=q&qid=323',
            width: 5000,
            height: 3000
        }, {
            name: 'FrameRoughToMpeReady',
            url: 'https://davideverson.quickbase.com/db/bqgj56f3v?a=q&qid=326',
            width: 5000,
            height: 3000
        }, {
            name: 'MpeToInsulationReady',
            url: 'https://davideverson.quickbase.com/db/bqgj56f3v?a=q&qid=332',
            width: 5000,
            height: 3000
        }]

        let clientS3 = new S3Client({
            credentials: {
                accessKeyId: config.AMAZON_AWS_ACCESS_KEY_ID,
                secretAccessKey: config.AMAZON_AWS_SECRET_ACCESS_KEY
            },
            region: "us-west-1"
        });

        const clientSNS = new SNSClient({
            credentials: {
                accessKeyId: config.AMAZON_AWS_ACCESS_KEY_ID,
                secretAccessKey: config.AMAZON_AWS_SECRET_ACCESS_KEY
            },
            region: "us-west-1"
        })


        const plugin = (await readFile('./quickbase-colors.js')).toString()

        // const browser = await puppeteer.launch({ 
        //     args: [
        //         '--no-sandbox',
        //         '--disable-setuid-sandbox',
        //         '--disable-dev-shm-usage',
        //         '--single-process'
        //     ],      
        //     headless: true
        // })

        const browser = await puppeteer.launch({
            executablePath: await chrome.executablePath,
            args: chrome.args,
            headless: true
        });

        const page = await browser.newPage();

        await page.goto('https://davideverson.quickbase.com/db/main?a=SignIn');

        await page.waitForSelector('input[name=loginid]');
        await page.waitForSelector('input[name=password]');

        await page.$eval('input[name=loginid]', el => el.value = 'ed@mosaic.us');
        await page.$eval('input[name=password]', el => el.value = 'XL.!qc2RhRn64JZjqnqs');

        await delay(2000)

        page.click('button[name=SignIn]')
        page.waitForNavigation({ waitUntil: 'networkidle2' })

        await delay(2000)

        let date = new Date()
        let timestamp = date.toISOString()

        for (let report of reports) {
            console.log('Processing report ' + report.name)

            await page.setViewport({
                width: report.width,
                height: report.height
            });

            await page.goto(report.url, {
                waitUntil: 'networkidle2'
            });

            await page.evaluate(plugin)

            let buffer = await page.pdf({
                // path: `${report.name}.pdf`,
                width: `${report.width + 100}px`,
                height: `${report.height}px`,
                printBackground: true
            });

            console.log(config.S3_BUCKET, buffer.byteLength)

            await deleteFile(clientS3, config.S3_BUCKET, `latest/${report.name}.pdf`)
            await putFile(clientS3, config.S3_BUCKET, `latest/${report.name}.pdf`, buffer)
            await putFile(clientS3, config.S3_BUCKET, `archive/${report.name}-${timestamp}.pdf`, buffer)
        }

        await browser.close();

        let body = `
Hello! The latest versions of the Quickbase reports are available.

StartToFrameReady
https://mosaic-quickbase-exports.s3.us-west-1.amazonaws.com/latest/StartToFrameReady.pdf

FrameRoughToMpeReady
https://mosaic-quickbase-exports.s3.us-west-1.amazonaws.com/latest/FrameRoughToMpeReady.pdf

MpeToInsulationReady
https://mosaic-quickbase-exports.s3.us-west-1.amazonaws.com/latest/MpeToInsulationReady.pdf
`

        const command = new PublishCommand({
            Message: body,
            TopicArn: 'arn:aws:sns:us-west-1:809059647686:QuickbaseExportsMailer',
            Subject: 'Quickbase Exports'
        })

        // const command = new SendEmailCommand({
        //     Destination: {
        //         ToAddresses: [
        //             'salman@mosaic.us'
        //         ]
        //     },
        //     Content: {
        //         Simple: {
        //             Body: {
        //                 Text: {
        //                     Charset: "UTF-8",
        //                     Data: body
        //                 }
        //             },
        //             Subject: {
        //                 Charset: "UTF-8",
        //                 Data: 'Subject'
        //             }
        //         }
        //     }
        // });

        // const response = await clientSES.send(command);

        const response = await clientSNS.send(command);

    } catch (e) {
        console.log('Error!', e)
    }

}

let handler = async (event, context) => {



    const time = new Date();
    let body = await main()
    console.log(`Screenshot function ran at ${time}`);
    return {
        "statusCode": 200,
        "body": [
            "https://mosaic-quickbase-exports.s3.us-west-1.amazonaws.com/latest/StartToFrameReady.pdf",
            "https://mosaic-quickbase-exports.s3.us-west-1.amazonaws.com/latest/FrameRoughToMpeReady.pdf",
            "https://mosaic-quickbase-exports.s3.us-west-1.amazonaws.com/latest/MpeToInsulationReady.pdf"
        ]

    }
};

module.exports.run = handler
