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

async function crawl() {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const isCheckDuplicated = document.getElementById('checkDuplicated');

    chrome.runtime.sendMessage({
        data: {
            action: 'crawl',
            startDate: startDate.value,
            endDate: endDate.value,
            isCheckDuplicated: isCheckDuplicated.checked,
        },
    });
}

document.getElementById('do-btn').addEventListener('click', crawl);
