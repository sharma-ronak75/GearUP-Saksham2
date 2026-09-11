function shell()
{
    const links = nav[state.role] || [];
    const locked = typeof proctor !== 'undefined' && proctor.active;
    const lockedAttr = locked ? `aria-disabled="true" title="${esc(t('common.navLockedTooltip'))}"` : '';

    return `<div class="app-shell">
        <div class="sidebar-overlay ${state.mobileOpen ? 'show' : ''}" onclick="${locked ? '' : 'state.mobileOpen=false;render()'}"></div>
        <aside class="app-sidebar-panel ${state.mobileOpen ? 'open' : ''} ${locked ? 'nav-locked' : ''}">
            <div class="sidebar-head">
                <div class="brand-mark">${LOGO_HTML}</div>
                <div style="min-width:0">
                    <div class="sidebar-title">${esc(t('login.brand'))}</div>
                    <div class="sidebar-subtitle">${esc(t(`common.${state.role}`))}</div>
                </div>
                <button class="close-sidebar" ${locked ? 'disabled' : 'onclick="state.mobileOpen=false;render()"'}>×</button>
            </div>
            ${locked ? `<div class="nav-lock-banner">${esc(t('common.navLockedBanner'))}</div>` : ''}
            <div class="sidebar-nav">
                ${links.map(([key, label, icon]) => `
                    <div class="sidebar-link ${state.page === key ? 'active' : ''}" ${locked ? lockedAttr : `onclick="openPage(${esc(JSON.stringify(key))})"`}>
                        <span style="width:18px;text-align:center">${icon}</span>
                        <span>${esc(t(label))}</span>
                    </div>`).join('')}
            </div>
            
            <div class="sidebar-footer">
                <div class="sidebar-link" ${locked ? lockedAttr : 'onclick="logout()"'}>
                    <span>↪</span>
                    <span>${esc(t('common.logOut'))}</span>
                </div>
            </div>
        </aside>
        <main class="app-main">
            <header class="topbar ${locked ? 'nav-locked' : ''}">
                <div class="topbar-left">
                    <button class="mobile-menu" ${locked ? 'disabled' : 'onclick="state.mobileOpen=true;render()"'}>☰</button>
                    ${crumbs()}
                </div>
                <div class="topbar-right">
                    <select class="input-field language-select" style="width:auto;padding:6px 8px" ${locked ? 'disabled' : ''} onchange="state.language=this.value;save();render()">
                        <option value="en" ${state.language === 'en' ? 'selected' : ''}>EN</option>
                        <option value="hi" ${state.language === 'hi' ? 'selected' : ''}>हिन्दी</option>
                    </select>
                    <div class="flex gap-8">
                        <div ${locked ? lockedAttr : `onclick="openPage('profile')" style='cursor:pointer;'`} class="avatar">${esc(roleName[state.role].split(' ').map(w => w[0]).join(''))}</div>
                        <!--<span class="topbar-name" style="margin-top:0.5vh;">${esc(roleName[state.role])}</span>-->
                    </div>
                </div>
            </header>
            <div class="content-area">${renderPage()}</div>
        </main>
        ${locked ? '' : aiAssistantWidget()}
    </div>`;
}

function renderPage()
{
    if (state.role === 'employee')
    {
        switch (state.page)
        {
            case 'dashboard': return employeeDashboard();
            case 'profile': return profilePage();
            case 'role': return rolePage();
            case 'competency': return competencyPage();
            case 'gaps': return gapPage();
            case 'why': return whyPage();
            case 'learning': return learningPage();
            case 'assess': return trainingAssessPage();
            case 'proctor-check': return proctorCheckPage();
            case 'quiz': return quizPage();
            case 'result': return resultPage();
            case 'progress': return progressPage();
        }
    }
    else if (state.role === 'trainer')
    {
        switch (state.page)
        {
            case 't-dashboard': return trainerDashboard();
            case 't-content': return trainingContent();
            case 't-generator': return assessmentGenerator();
            case 't-manage': return assessmentManagement();
            case 't-planning': return trainingPlanning();
        }
    }
    else
    {
        switch (state.page)
        {
            case 'a-dashboard': return adminDashboard();
            case 'a-workforce': return workforcePage();
            case 'a-gaps': return orgGapsPage();
            case 'a-effectiveness': return effectivenessPage();
            case 'a-emerging': return emergingPage();
            case 'a-planning': return trainingPlanning();
        }
    }
    return empty('Page not found.');
}

