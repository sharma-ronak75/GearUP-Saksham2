const DB_SERVER_ADDR = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}:4040`;
const ws = new WebSocket(DB_SERVER_ADDR);
const pendingRequests = new Map();
let requestSequence = 0;
let wsReady = false;

function serviceError(data)
{
    return new Error(data.reason || data.message || 'Request failed');
}

function requestService(type, payload = {})
{
    return new Promise((resolve, reject) =>
    {
        const requestId = `${Date.now()}-${++requestSequence}`;
        pendingRequests.set(requestId, { resolve, reject });
        const send = () => ws.send(JSON.stringify({ type, requestId, ...payload }));
        if (ws.readyState === WebSocket.OPEN) send();
        else
        {
            const onOpen = () =>
            {
                ws.removeEventListener('open', onOpen);
                if (ws.readyState === WebSocket.OPEN) send();
                else
                {
                    pendingRequests.delete(requestId);
                    reject(new Error('Backend connection is unavailable.'));
                }
            };
            ws.addEventListener('open', onOpen);
        }
    });
}

ws.addEventListener('open', () =>
{
    wsReady = true;
    relog();

    if (state.loggedIn)
    {
        init();
    }
    else
    {
        render();
    }
});

ws.addEventListener('close', () =>
{
    wsReady = false;
    if (!state.loggedIn) render();
    alert('Connection closed to the backend server, try refreshing the page.');
});

ws.addEventListener('error', () =>
{
    wsReady = false;
});

ws.addEventListener('message', event =>
{
    let message;
    try
    {
        message = JSON.parse(event.data);
    }
    catch
    {
        return;
    }

    if (message.requestId && pendingRequests.has(message.requestId))
    {
        const pending = pendingRequests.get(message.requestId);
        pendingRequests.delete(message.requestId);
        if (message.success === false) pending.reject(serviceError(message));
        else pending.resolve(message.data ?? message);
        return;
    }
});

async function init()
{
    try
    {
        if (!wsReady) return;
        const email = localStorage.getItem('email') || document.querySelector('#email')?.value || 'testificate@test.com';
        const session = localStorage.getItem('session');
        try
        {
            state.data = await requestService('get_app_data', { email, session });
        }catch(e)
        {
            logout();
            return;
        }
        state.assessmentsDone = Array.isArray(state.data.assessmentsDone) ? state.data.assessmentsDone : state.assessmentsDone;
        state.history = Array.isArray(state.data.assessmentHistory) ? state.data.assessmentHistory : state.history;
        if (state.loggedIn && state.role && state.data)
        {
            state.aiMessages[0].text = 'Hi ' + (state.data.employee?.name || localStorage.getItem('username') || 'there') + ' - I can help you understand your skill gaps, learning path, and assessment progress. Try one of the questions below, or type your own.';
        }
        render();
    }
    catch (e)
    {
        state.loggedIn = false;
        state.data = null;
        save();
        const root = document.querySelector('#app');
        root.innerHTML = `
            <div style="padding:40px;font-family:system-ui">
                <h2>${esc(t('ui.couldNotLoad') || 'Could not load Saksham')}</h2>
                <p>${esc(e.message)}</p>
            </div>`;
    }
}

function render()
{
    const root = document.querySelector('#app');
    root.innerHTML = state.loggedIn && state.data ? shell() : loginPage();
    if (state.aiOpen) scrollAiToBottom();
    if (typeof proctorAttachPreview === 'function') proctorAttachPreview();
}

async function relog()
{
    if(localStorage.session)
    {
        let data;
        try
        {
            data = await requestService("login", {email: localStorage.email, session: localStorage.session});
        }catch(e)
        {
            logout();
            return;
        }

        localStorage.setItem('email', data.email);
        localStorage.setItem('session', data.session);
        localStorage.setItem('username', data.username);
        state.role = data.role || 'employee';
        state.data = await requestService('get_app_data', { email: data.email, session: data.session });
        state.loggedIn = true;
        state.page = state.role === 'employee' ? 'dashboard' : state.role === 'trainer' ? 't-dashboard' : 'a-dashboard';
        state.aiMessages[0].text = 'Hi ' + data.username + ' - I can help you understand your skill gaps, learning path, and assessment progress. Try one of the questions below, or type your own.';
        save();
        render();
    }
    else
    {
        logout();
    }
}