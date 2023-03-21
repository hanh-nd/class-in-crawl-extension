const moment = require('moment');
const { CronJob } = require('cron');

const CRON_TIME = '*/20 * * * *';

const DOMAIN = 'http://localhost:8000';
const STORE_DATA_URL = `${DOMAIN}/api/crawl-port/store-data-N4EiM5X8VZ`;

const CHAT_ID_TELEGRAM = '-606582597';
const TOKEN_TELEGRAM_CHATBOT = '6229371384:AAFJBbEjwt43nwigEZoZykvURpZTWWu8Wow';
const TELE_LOG_URL = `https://api.telegram.org/bot${TOKEN_TELEGRAM_CHATBOT}/sendMessage`;

const NUMBER_OF_RETRIES = 3;

new CronJob(CRON_TIME, () => {
    crawlWithRetries(NUMBER_OF_RETRIES);
}).start();

chrome.runtime.onStartup.addListener(function () {
    sendPopup('show-result', { state: 'Idle', msg: '' });
});

setInterval(() => {
    sendPopup('ping', { msg: 'ping' });
}, 10000);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.data.action === 'crawl') {
        crawl({
            startDate: request.data.startDate,
            endDate: request.data.endDate,
            isCheckDuplicated: request.data.isCheckDuplicated || false,
        });
    }

    if (request.data.action === 'ping') {
        //
    }

    sendResponse();
    return true;
});

async function sendPopup(action = '', extraData = {}) {
    try {
        await chrome.runtime.sendMessage({
            data: {
                action,
                ...extraData,
            },
        });
    } catch (error) {}
}

async function crawlWithRetries(times = 1, options = {}) {
    for (let i = 1; i <= times; i++) {
        const result = await crawl(options);
        if (result.code === 1) {
            return;
        }
        await sleep(times * 5000);
    }
}

async function crawl(options = {}) {
    sendPopup('show-result', {
        state: 'Running',
        msg: '',
    });
    await reload();
    await sleep(5000);
    const result = await crawlDataClassin(options);
    log(`${new Date()} ${result.message}`);
    sendPopup('show-result', {
        state: 'Idle',
        msg: result.message,
    });
    return result;
}

async function reload() {
    const [tab] = await chrome.tabs.query({
        url: 'https://console.classin.com/*',
    });
    await chrome.tabs.reload(tab?.id);
    console.log('reloaded');
}

async function log(data) {
    try {
        if (CHAT_ID_TELEGRAM && TOKEN_TELEGRAM_CHATBOT) {
            await fetch(TELE_LOG_URL, {
                headers: {
                    'Content-Type': 'application/json',
                    'cache-control': 'no-cache',
                },
                method: 'POST',
                body: JSON.stringify({
                    chat_id: CHAT_ID_TELEGRAM,
                    text: data,
                }),
            });
        }
    } catch (error) {
        console.log(error);
    }
    console.log(data);
}

async function crawlDataClassin(option = {}) {
    const { startTime, endTime } = getStartEndDateTime(option);
    const cookies = await getCookies('classin.com');
    const cookie = await generateClassinCookies(cookies);
    if (!cookie) {
        return {
            code: 3,
            message: 'FAILED: Cookie not found',
        };
    }

    const result = await cloneLesson({
        startTime,
        endTime,
        isCheckDuplicated: option.isCheckDuplicated,
        cookie,
    });
    return result;
}

function getStartEndDateTime({ startDate, endDate }) {
    if (startDate && endDate) {
        const startTime = moment(startDate, 'YYYY-MM-DD').startOf('day').unix();
        const endTime = moment(endDate, 'YYYY-MM-DD').endOf('day').unix();
        return { startTime, endTime };
    }
    const startTime = moment().startOf('day').unix();
    const endTime = moment().endOf('day').unix();
    return { startTime, endTime };
}

async function getCookies(domain) {
    return await chrome.cookies.getAll({ domain });
}

async function generateClassinCookies(cookies = []) {
    let HUBSPOTUTK,
        SENSORDATA2015JSSDKCROSS,
        GCLAU,
        LOCATIONARGUMENTLANG,
        GA,
        GID,
        HSTC,
        EEOSSID,
        EEOSUID,
        EEOSTRAFFIC,
        EEOSUSERACCOUNT,
        EEOSDOMAIN,
        EEOSNSID,
        EEOSREMEMBER,
        EEOSUSERLOGO,
        GA4W24MVKEBG,
        GA8D2QPYK283,
        PHPSESSID,
        TKID = '';
    for (const c of cookies) {
        switch (c.name) {
            case 'hubspotutk':
                HUBSPOTUTK = c?.value;
                break;
            case 'sensorsdata2015jssdkcross':
                SENSORDATA2015JSSDKCROSS = c?.value;
                break;
            case '_gcl_au':
                GCLAU = c?.value;
                break;
            case 'locationArgumentLang':
                LOCATIONARGUMENTLANG = c?.value;
                break;
            case '_ga':
                GA = c?.value;
                break;
            case '_gid':
                GID = c?.value;
                break;
            case '__hstc':
                HSTC = c?.value;
                break;
            case '_eeos_uid':
                EEOSUID = c?.value;
                break;
            case '_eeos_useraccount':
                EEOSUSERACCOUNT = c?.value;
                break;
            case '_eeos_userlogo':
                EEOSUSERLOGO = c?.value;
                break;
            case '_eeos_domain':
                EEOSDOMAIN = c?.value;
                break;
            case '_eeos_remember':
                EEOSREMEMBER = c?.value;
                break;
            case '_eeos_traffic':
                EEOSTRAFFIC = c?.value;
                break;
            case '_eeos_sid':
                EEOSSID = c?.value;
                break;
            case '_eeos_nsid':
                EEOSNSID = c?.value;
                break;
            case '_ga_4W24MVKEBG':
                GA4W24MVKEBG = c?.value;
                break;
            case '_ga_8D2QPYK283':
                GA8D2QPYK283 = c?.value;
                break;
            case 'PHPSESSID':
                PHPSESSID = c?.value;
                break;
            case '__tk_id':
                TKID = c?.value;
                break;
        }
    }

    if (!PHPSESSID || !TKID) return null;

    const template = `messagesUtk=20a740fd592d4368a3462a1d6dc950ee; _fbp=fb.1.1654584883847.610166762; hubspotutk=${HUBSPOTUTK}; sensorsdata2015jssdkcross=${SENSORDATA2015JSSDKCROSS}; _gcl_au=${GCLAU}; locationArgumentLang=${LOCATIONARGUMENTLANG}; _ga=${GA}; _gid=${GID}; __hstc=${HSTC}; __hssrc=1; _eeos_uid=${EEOSUID}; _eeos_useraccount=${EEOSUSERACCOUNT}; _eeos_userlogo=${EEOSUSERLOGO}; _eeos_domain=${EEOSDOMAIN}; _eeos_remember=${EEOSREMEMBER}; _eeos_traffic=${EEOSTRAFFIC}; _eeos_sid=${EEOSSID}; _eeos_nsid=${EEOSNSID}; _ga_4W24MVKEBG=${GA4W24MVKEBG}; _ga_8D2QPYK283=${GA8D2QPYK283}; PHPSESSID=${PHPSESSID}; __tk_id=${TKID}`;
    return template;
}

/**
 * clone lessons
 * @param {*} conditions
 */
async function cloneLesson({
    startTime,
    endTime,
    cookie,
    isCheckDuplicated = true,
}) {
    try {
        let page = 1,
            limit = 50;
        let collection = `lessons_${moment
            .unix(startTime)
            .format('YYYY_MM_DD')}`;
        let data = [];
        let dataCount = 0;
        let isTruncate = true;
        do {
            let body = {
                page: page,
                perpage: limit,
            };
            // let bodyStr = encodeURIComponent(JSON.stringify(body));
            console.log(
                `=========== Running cloneLesson page = ${page} ===========, body: ${JSON.stringify(
                    body
                )}`
            );

            let rs = await fetch(
                'https://console.classin.com/saasajax/course.ajax.php?action=getClassList',
                {
                    headers: {
                        accept: 'application/json, text/plain, */*',
                        'accept-language':
                            'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                        'cache-control': 'no-cache',
                        'content-type': 'application/x-www-form-urlencoded',
                        pragma: 'no-cache',
                        'sec-ch-ua':
                            '"Google Chrome";v="95", "Chromium";v="95", ";Not A Brand";v="99"',
                        'sec-ch-ua-mobile': '?0',
                        'sec-ch-ua-platform': '"Linux"',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        cookie: cookie,
                        Referer:
                            'https://console.classin.com/saas/school/index.html',
                        'Referrer-Policy': 'strict-origin-when-cross-origin',
                    },
                    body: `page=${page}&perpage=${limit}&sort=%7B%22sortName%22%3A%22classBtime%22%2C%22sortValue%22%3A1%7D&timeRange=%7B%22startTime%22%3A${startTime}%2C%22endTime%22%3A${endTime}%7D`,
                    method: 'POST',
                }
            );
            let statusCode = rs.status;
            if (statusCode == 200) {
                let responseData = await rs.json();
                console.log(responseData);
                data = responseData?.data?.classList || [];
                if (data.length > 0) {
                    dataCount += data.length;
                    await storeData(data, collection, isTruncate);
                    isTruncate = false;
                }
            } else {
                log(`${new Date()} ${rs.statusText}`);
            }
            console.log(
                `=========== Done cloneLesson page = ${page++} ===========`
            );
            await sleep(1000);
        } while (data.length);
        if (isCheckDuplicated) {
            await storeData([], collection, false, true);
        }
        return {
            code: 1,
            message: `DONE. Collection: ${collection}, data-length: ${dataCount}`,
        };
    } catch (e) {
        return {
            code: 2,
            message: `FAILED ${e.message}`,
        };
    }
}

async function sleep(time) {
    return await new Promise((resolve) => setTimeout(resolve, time));
}

async function storeData(data, collection, isTruncate, isDone = false) {
    const body = JSON.stringify({ collection, data, isTruncate, isDone });
    const response = await fetch(STORE_DATA_URL, {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body,
    });
    return response;
}
