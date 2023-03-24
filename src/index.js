chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.data.action === 'show-result') {
        const state = document.getElementById('state');
        const result = document.getElementById('result');
        state.innerText = `State: ${request.data.state}`;
        result.innerText = `Result: ${request.data.msg}`;
    }

    if (request.data.action === 'ping') {
        chrome.runtime.sendMessage({
            data: {
                action: 'ping',
                msg: 'pong',
            },
        });
    }

    sendResponse();
    return true;
});

async function getCookie() {
    chrome.runtime.sendMessage({
        data: {
            action: 'crawl',
        },
    });
}

async function requestCrawlLessons() {
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;

    chrome.runtime.sendMessage({
        data: {
            action: 'request-crawl-lessons',
            payload: {
                startDate,
                endDate,
            },
        },
    });
}

document.getElementById('do-btn').addEventListener('click', getCookie);
document
    .getElementById('do-crawl-lessons')
    .addEventListener('click', requestCrawlLessons);

window.onload = () => {
    chrome.runtime.sendMessage({
        data: {
            action: 'initialize',
        },
    });
};
