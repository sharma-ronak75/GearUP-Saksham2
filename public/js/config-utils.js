const roleLabel = { employee: 'Employee', trainer: 'Trainer / ATI', admin: 'Admin / Organization' };
const roleName = { employee: state.data?.employee?.name || localStorage.username || 'Employee', trainer: 'Suman Bansal', admin: 'Dept. Administrator' };
const LOGO_HTML = '<img class="logo" src="/logo.png" alt="Saksham Logo">';

const nav = {
    employee: [
        ['dashboard', 'nav.dashboard', '▦'],
        ['profile', 'nav.profile', '◯'],
        ['role', 'nav.role', '▣'],
        ['competency', 'nav.competency', '◎'],
        ['gaps', 'nav.gaps', '!'],
        ['why', 'nav.why', '?'],
        ['learning', 'nav.learning', '▤'],
        ['assess', 'nav.assess', '✦'],
        ['progress', 'nav.progress', '↗'],
    ],
    trainer: [
        ['t-dashboard', 'nav.tDashboard', '▦'],
        ['t-content', 'nav.tContent', '▤'],
        ['t-generator', 'nav.tGenerator', '✦'],
        ['t-manage', 'nav.tManage', '☷'],
        ['t-planning', 'nav.tPlanning', '▣']
    ],
    admin: [
        ['a-dashboard', 'nav.aDashboard', '▦'],
        ['a-workforce', 'nav.aWorkforce', '◫'],
        ['a-gaps', 'nav.aGaps', '!'],
        ['a-effectiveness', 'nav.aEffectiveness', '▥'],
        ['a-emerging', 'nav.aEmerging', '✦'],
        ['a-planning', 'nav.aPlanning', '▣']
    ]
};

const pageLabelKey = {
    dashboard: 'nav.dashboard',
    profile: 'nav.profile',
    role: 'nav.role',
    competency: 'nav.competency',
    gaps: 'nav.gaps',
    why: 'nav.why',
    learning: 'nav.learning',
    assess: 'nav.assess',
    quiz: 'nav.assess',
    result: 'pages.resultTitle',
    progress: 'nav.progress',
    't-dashboard': 'nav.tDashboard',
    't-content': 'nav.tContent',
    't-generator': 'nav.tGenerator',
    't-manage': 'nav.tManage',
    't-planning': 'nav.tPlanning',
    'a-dashboard': 'nav.aDashboard',
    'a-workforce': 'nav.aWorkforce',
    'a-gaps': 'nav.aGaps',
    'a-effectiveness': 'nav.aEffectiveness',
    'a-emerging': 'nav.aEmerging',
    'a-planning': 'nav.aPlanning'
};

function t(path)
{
    return path.split('.').reduce((o, k) => o?.[k], I18N[state.language]) ?? path;
}

function statusForLevel(current, required)
{
    if (current >= required) return 'Strong';
    if (current === required - 1) return 'Adequate';
    if (current === required - 2) return 'Gap';
    return 'Critical Gap';
}

function esc(v)
{
    return String(v).replace(/[&<>"']/g, s => ({ 
        '&': '&amp;', 
        '<': '&lt;', 
        '>': '&gt;', 
        '"': '&quot;', 
        "'": '&#39;' 
    }[s]));
}

function save()
{
    // Never persist a mid-proctoring page across reloads - the camera stream
    // and fullscreen state cannot survive a refresh, so resuming here would
    // strand the user on a broken screen. Fall back to the assessments list.
    const pageToPersist = (state.page === 'quiz' || state.page === 'proctor-check') ? 'assess' : state.page;
    localStorage.setItem('saksham.loggedIn', state.loggedIn ? '1' : '0');
    localStorage.setItem('saksham.role', state.role);
    localStorage.setItem('saksham.page', pageToPersist);
    localStorage.setItem('saksham.trainingSubTab', state.trainingSubTab || 'igot');
    localStorage.setItem('saksham.language', state.language);
    localStorage.setItem('saksham.lastResult', JSON.stringify(state.lastResult));
    localStorage.setItem('saksham.assessmentsDone', JSON.stringify(state.assessmentsDone));
    localStorage.setItem('saksham.history', JSON.stringify(state.history));
}

function priorityForGap(gap)
{
    if (gap >= 2) return 'Critical'; 
    if (gap === 1) return 'High'; 
    if (gap === 0) return 'Medium'; 
    return 'Low';
}

function levelBar(current, required, compact = false)
{
    const p = v => Math.min(100, (v / 5) * 100);
    return `<div class="level-wrap">
        <div class="level-track">
            <div class="level-current" style="width:${p(current)}%"></div>
            <div class="level-required" style="left:calc(${p(required)}% - 1px)"></div>
        </div>
        ${compact ? '' : `<div class="level-labels">
            <span>${esc(t('common.current'))}: ${esc(state.data.levelNames[current])} (${current}/5)</span>
            <span>${esc(t('common.required'))}: ${esc(state.data.levelNames[required])} (${required}/5)</span>
        </div>`}
    </div>`;
}

const MAIN_SIZE = 336;

function badge(text, color, bg)
{
    return `<span class="badge" style="color:${color};background:${bg}">${esc(text)}</span>`;
}

function priorityBadge(priority)
{
    const s = state.data.priorityStyles[priority];
    const key = { Critical: 'priorityCritical', High: 'priorityHigh', Medium: 'priorityMedium', Low: 'priorityLow' }[priority];
    return badge(t(`common.${key}`), s.fg, s.bg);
}

function statusBadge(status)
{
    const colors = { 
        Strong: '#2F6F4F', 
        Adequate: '#0E7C7B', 
        Gap: '#C97A2C', 
        'Critical Gap': '#A63D2F' 
    };
    return badge(t(
        `common.${{ Strong: 'statusStrong', Adequate: 'statusAdequate', Gap: 'statusGap', 'Critical Gap': 'statusCriticalGap' }[status]}`
    ), colors[status], '#F3F4F1');
}

function kpi(label, value, sub, accent){
    return `<div class="card kpi" style="border-top-color:${accent}">
        <div class="kpi-top">
            <span class="kpi-label">${esc(label)}</span>
            <span style="color:${accent}">◈</span>
        </div>
        <div class="kpi-value">${esc(value)}</div>
        ${sub ? `<div class="kpi-sub">${esc(sub)}</div>` : ''}
    </div>`;
}

function pageHeader(title, subtitle, right = ''){
    return `<div class="page-header">
        <div>
            <h1 style="color: var(--navy-soft); font-family: monospace;">${esc(title)}</h1>
            ${subtitle ? `<div class="page-subtitle">${esc(subtitle)}</div>` : ''}
        </div>
        ${right}
    </div>`;
}

function empty(message)
{
    return `<div class="empty-state">
        <div style="font-size:24px;opacity:.55;margin-bottom:8px">□</div>
        <div>${esc(message)}</div>
    </div>`;
}

function crumbs()
{
    const arr = [t(`common.${state.role}`), t(pageLabelKey[state.page] || '')];
    return `<div class="breadcrumbs" style="font-size:20px;">
        ${arr.map((x, i) => `${i ? '> ' : ''}<span class="${i === arr.length - 1 ? 'breadcrumb-current' : ''}">${esc(x)}</span>`).join('')}
    </div>`;
}

function openPage(p, arg = null)
{
    // While a proctored assessment is active, the menu is locked - block any
    // navigation away from the quiz/proctor-check flow rather than silently
    // tearing down the exam session. The person must use the in-quiz Exit
    // button, which ends proctoring explicitly before navigating.
    if (typeof proctor !== 'undefined' && proctor.active && p !== 'quiz' && p !== 'proctor-check')
    {
        proctorShowToast(t('common.navLockedToast'));
        return;
    }
    if (typeof proctor !== 'undefined' && proctor.stream && p !== 'quiz' && p !== 'proctor-check')
    {
        proctorStopDevices();
    }

    state.page = p;
    if (p === 'why')
    {
        state.selectedGap = arg || state.selectedGap || 'SQL';
    }
    if (p === 'assess' && arg)
    {
        state.trainingSubTab = arg;
    }
    if (p === 'quiz'){
        state.quizAssessment = arg; 
        state.quizIndex = 0; 
        state.quizAnswers = [];
    }
    state.mobileOpen = false;
    save();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function logout()
{
    // Block logging out mid-exam for the same reason navigation is blocked -
    // the person must exit the proctored session explicitly first.
    if (typeof proctor !== 'undefined' && proctor.active)
    {
        proctorShowToast(t('common.navLockedToast'));
        return;
    }
    if (typeof proctor !== 'undefined' && proctor.stream)
    {
        proctorStopDevices();
    }
    state.loggedIn = false;
    state.page = 'dashboard';
    localStorage.session = "";
    save();
    render();
}

