function aiPage()
{
    return aiAssistantPanel();
}

function aiAssistantWidget()
{
    if (!state.loggedIn || !state.data) return '';

    return `
        <button
            class="ai-fab"
            type="button"
            onclick="toggleAiChat()"
            aria-label="${state.aiOpen ? 'Close AI Assistant' : 'Open AI Assistant'}"
            title="AI Assistant"
            style="position:fixed;right:24px;bottom:24px;width:58px;height:58px;border:0;border-radius:50%;background:var(--teal);color:#fff;display:grid;place-items:center;font-size:25px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,.18);cursor:pointer;z-index:1200;">
            ${state.aiOpen ? '×' : '✦'}
        </button>
        ${state.aiOpen ? aiAssistantPanel() : ''}
    `;
}

function aiAssistantPanel()
{
    return `
        <div
            class="card ai-assistant-panel"
            style="position:fixed;right:24px;bottom:94px;width:min(420px,calc(100vw - 32px));height:min(620px,calc(100vh - 120px));display:flex;flex-direction:column;padding:0;overflow:hidden;z-index:1199;box-shadow:0 16px 50px rgba(0,0,0,.22);">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--border,#e4e7e5);flex:0 0 auto;">
                <div>
                    <div style="font-weight:700;font-size:17px;">${esc(t('pages.aiTitle'))}</div>
                    <div class="tiny" style="color:var(--ink-soft)">${esc(t('pages.aiSubtitle'))}</div>
                </div>
                <button class="btn-secondary" type="button" onclick="toggleAiChat()" aria-label="Close AI Assistant" style="padding:6px 10px;border-radius:32px;font-size:18px;line-height:1;height:50px;width:50px;">×</button>
            </div>
            <div id="ai-messages" class="message-list" style="flex:1;min-height:0;overflow-y:auto;padding:14px 16px;scroll-behavior:smooth;">
                ${state.aiMessages.map(m => `
                    <div class="message ${m.from}">${esc(m.text)}</div>`).join('')}
                <div id="ai-scroll-anchor" style="height:1px;width:100%;"></div>
            </div>
            <div class="ai-input-row" style="padding:0 16px 16px;flex:0 0 auto;">
                <input style='font-size:16px;border-radius:32px;' class="input-field" id="ai-input" onfocus="scrollAiToBottom(true)" oninput="scrollAiToBottom(true)" onkeydown="if(event.key==='Enter'){event.preventDefault();sendAi()}" placeholder="Ask about your skills, gaps or learning…">
                <button class="btn-teal" style='border-radius:32px;' type="button" onclick="sendAi()" aria-label="Send message">↗</button>
            </div>
        </div>`;
}
