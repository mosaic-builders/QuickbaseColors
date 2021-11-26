
const puppeteer = require('puppeteer')
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3")

const config = require('./config.js')
const { readFile } = require('fs/promises')

function delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms)
    });
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

(async () => {
    try {
        let clientS3 = new S3Client({
            credentials: {
                accessKeyId: config.AWS_ACCESS_KEY_ID,
                secretAccessKey: config.AWS_SECRET_ACCESS_KEY
            },
            region: "us-west-1"
        });
    
        const plugin = (await readFile('./quickbase-colors.js')).toString()

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto('https://davideverson.quickbase.com/db/main?a=SignIn');
    
        await page.waitForSelector('input[name=loginid]');
        await page.waitForSelector('input[name=password]');
    
        await page.$eval('input[name=loginid]', el => el.value = 'ed@mosaic.us');
        await page.$eval('input[name=password]', el => el.value = 'XL.!qc2RhRn64JZjqnqs');
    
        await delay(2000)
    
        page.click('button[name=SignIn]')
        page.waitForNavigation({waitUntil: 'networkidle2'})
    
        await delay(2000)

        let date = new Date()
        let timestamp = date.toISOString()

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

        for(let report of reports) {

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

            await putFile(clientS3, config.S3_BUCKET, `latest/${report.name}.pdf`, buffer)
            await putFile(clientS3, config.S3_BUCKET, `archive/${report.name}-${timestamp}.pdf`, buffer)
        }

        await browser.close();
    } catch (e) {
        console.log('Error!', e)
    }
    
})();


