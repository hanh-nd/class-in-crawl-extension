const moment = require('moment');
const { CronJob } = require('cron');

const CRON_TIME = '*/20 * * * *';

const DOMAIN = 'http://localhost:8000';
const STORE_DATA_URL = `${DOMAIN}/api/crawl-port/store-data-N4EiM5X8VZ`;
const REQUEST_CRAWL_LESSONS_URL = `${DOMAIN}/api/crawl-port/crawl-lessons-Ei9vKxHAQa`;

const NUMBER_OF_RETRIES = 3;

let lastState = 'Idle';
let lastResult = '';

new CronJob(CRON_TIME, () => {
    generateWithRetries(NUMBER_OF_RETRIES);
}).start();

setInterval(() => {
    sendPopup('ping', { msg: 'ping' });
}, 10000);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.data.action === 'crawl') {
        generate();
    }

    if (request.data.action === 'ping') {
        //
    }

    if (request.data.action === 'request-crawl-lessons') {
        requestCrawlLessons(request.data.payload);
    }

    if (request.data.action === 'initialize') {
        sendPopup('show-result', {
            state: lastState,
            msg: lastResult,
        });
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

function setStateResult(state = 'Idle', result = '') {
    lastState = state;
    lastResult = result;
}

async function generateWithRetries(times = NUMBER_OF_RETRIES) {
    for (let i = 1; i <= times; i++) {
        const result = await generate();
        if (result.code === 1) {
            return;
        }
        await sleep(times * 5000);
    }
}

async function generate(options = {}) {
    setStateResult('Running');
    sendPopup('show-result', {
        state: 'Running',
        msg: '',
    });
    await reload();
    await sleep(5000);
    const result = await generateClassinCookie(options);
    console.log('ec', result);
    setStateResult('Idle', result.message);
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

async function generateClassinCookie() {
    const { startTime, endTime } = getStartEndDateTime();
    const cookies = await getCookies('classin.com');
    const cookie = await generateClassinCookies(cookies);
    if (!cookie) {
        return {
            code: 3,
            message: 'FAILED: Cookie not found',
        };
    }

    const result = await testCookie({
        startTime,
        endTime,
        cookie,
    });
    return result;
}

function getStartEndDateTime() {
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

async function testCookie({ startTime, endTime, cookie }) {
    try {
        let page = 1,
            limit = 50;

        await fetch(
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

        await storeData({
            cookie,
        });
        return {
            code: 1,
            message: `DONE.`,
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

async function storeData(data) {
    const body = JSON.stringify({ data });
    const response = await fetch(STORE_DATA_URL, {
        headers: {
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body,
    });
    return response;
}

async function requestCrawlLessons({
    startDate,
    endDate,
    crawlMembers = false,
} = {}) {
    try {
        setStateResult('Running');
        sendPopup('show-result', {
            state: 'Running',
            msg: '',
        });
        const body = JSON.stringify({
            startDate: startDate
                ? moment(startDate).format('YYYY_MM_DD')
                : undefined,
            endDate: endDate ? moment(endDate).format('YYYY_MM_DD') : undefined,
            crawlMembers,
        });
        const response = await fetch(REQUEST_CRAWL_LESSONS_URL, {
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
            body,
        });
        const message = await response.text();
        setStateResult('Idle', `DONE: ${message}`);
        sendPopup('show-result', {
            state: 'Idle',
            msg: `DONE: ${message}`,
        });
        return response;
    } catch (error) {
        setStateResult('Idle', `FAILED: ${error.message}`);
        sendPopup('show-result', {
            state: 'Idle',
            msg: `FAILED: ${error.message}`,
        });
    }
}
