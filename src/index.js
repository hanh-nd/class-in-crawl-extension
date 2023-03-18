const port = chrome.runtime.connect({ name: 'class-in-extension' });

port.onMessage.addListener(function (request) {
    if (request.data.action === 'show-result') {
        const state = document.getElementById('state');
        const result = document.getElementById('result');
        state.innerText = `State: ${request.data.state}`;
        result.innerText = `Result: ${request.data.msg}`;
    }

    if (request.data.action === 'ping') {
        port.postMessage({
            data: {
                action: 'ping',
                msg: 'pong',
            },
        });
    }
});

async function crawl() {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');

    port.postMessage({
        data: {
            action: 'crawl',
            startDate: startDate.value,
            endDate: endDate.value,
        },
    });
}

document.getElementById('do-btn').addEventListener('click', crawl);
