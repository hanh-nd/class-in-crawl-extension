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

document.getElementById('do-btn').addEventListener('click', getCookie);
