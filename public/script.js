const SAKSHAM_SCRIPTS = [
    'js/state-i18n.js',
    'js/config-utils.js',
    'js/shell.js',
    'js/employee-pages.js',
    'js/ai-page.js',
    'js/trainer-pages.js',
    'js/admin-pages.js',
    'js/charts-login.js',
    'js/actions.js',
    'js/websocket.js'
];

(async function loadSakshamScripts() {
    for (const src of SAKSHAM_SCRIPTS) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }
})().catch(console.error);