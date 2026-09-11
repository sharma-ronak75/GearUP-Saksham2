function adminDashboard()
{ 
    const depts = state.data.departments.map(d => { 
        const emps = state.data.workforce.filter(e => e.dept === d); 
        const avg = emps.reduce((s, e) => s + ['SQL', 'Data Quality', 'Survey Design', 'Data Visualization'].reduce((x, c) => x + e[c], 0) / 4, 0) / emps.length; 
        return { label: d.replace('Department of ', ''), value: Number(avg.toFixed(2)) }; 
    }); 
    
    return pageHeader(t('pages.aDashboardTitle'), t('pages.aDashboardSubtitle')) + `
        <div class="kpi-grid">
            ${kpi(t('common.totalEmployees'), state.data.workforce.length + 240, '', '#16232F')}
            ${kpi(t('common.employeesAssessed'), '68%', '', '#0E7C7B')}
            ${kpi(t('common.criticalSkillGaps'), state.data.orgGaps.filter(g => g.priority === 'High').length, '', '#A63D2F')}
            ${kpi(t('common.averageCompetency'), '2.8 / 5', '', '#9C8B3C')}
            ${kpi(t('common.gapReductionYoy'), '+0.4', '', '#2F6F4F')}
        </div>
        <div class="grid-2">
            <div class="card">
                <div class="section-title">
                    <h3 class="hr-title">${esc(t('common.departmentComparison'))}</h3>
                </div>
                ${barChart(depts)}
            </div>
            <div class="card">
                <div class="section-title">
                    <h3 class="hr-title">${esc(t('common.criticalSkillGaps'))}</h3>
                </div>
                <div class="flex" style="flex-direction:column;gap:8px">
                    ${state.data.orgGaps.map(g => `
                        <div class="card-row small">
                            <span>${esc(g.competency)}</span>
                            <span class="flex gap-8">
                                <span style="color:var(--ink-soft)">${g.affected} ${esc(t('common.employeesAffected'))}</span>
                                ${priorityBadge(g.priority)}
                            </span>
                        </div>`).join('')}
                </div>
            </div>
        </div>`; 
}

function workforcePage()
{ 
    const rows = state.data.workforce.filter(e => state.workforceDept === 'All' || e.dept === state.workforceDept); 
    
    return pageHeader(t('pages.aWorkforceTitle'), t('pages.aWorkforceSubtitle')) + `
        <div class="mb-16">
            <select class="input-field" style="max-width:260px" onchange="state.workforceDept=this.value;render()">
                <option>All</option>
                ${state.data.departments.map(d => `<option ${state.workforceDept === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}
            </select>
        </div>
        <div class="card desktop-table">
            <div class="table-scroll">
                <table class="matrix">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Role</th>
                            ${['SQL', 'Data Quality', 'Survey Design', 'Data Visualization'].map(c => `<th>${c}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(e => `
                            <tr>
                                <td>${esc(e.name)}</td>
                                <td>${esc(e.role)}</td>
                                ${['SQL', 'Data Quality', 'Survey Design', 'Data Visualization'].map(c => { 
                                    const req = state.data.requiredByRole[e.role] || 3; 
                                    const st = statusForLevel(e[c], req); 
                                    return `
                                        <td>
                                            <b style="color:${({ 'Strong': 'var(--good)', Adequate: 'var(--teal)', Gap: 'var(--high)', 'Critical Gap': 'var(--critical)' }[st])}">${e[c]}/5</b> · 
                                            <span style="color:var(--ink-soft)">${esc(st)}</span>
                                        </td>` 
                                }).join('')}
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="mobile-only" style="flex-direction:column;gap:10px">
            ${rows.map(e => `
                <div class="card">
                    <div style="font-weight:700">${esc(e.name)}</div>
                    <div class="tiny" style="color:var(--ink-soft);margin-bottom:8px">${esc(e.role)} · ${esc(e.dept.replace('Department of ', ''))}</div>
                    <div class="flex" style="flex-direction:column;gap:6px">
                        ${['SQL', 'Data Quality', 'Survey Design', 'Data Visualization'].map(c => { 
                            const req = state.data.requiredByRole[e.role] || 3; 
                            const st = statusForLevel(e[c], req); 
                            return `
                                <div class="card-row tiny">
                                    <span>${c}</span>
                                    <span>
                                        <b style="color:${({ 'Strong': 'var(--good)', Adequate: 'var(--teal)', Gap: 'var(--high)', 'Critical Gap': 'var(--critical)' }[st])}">${e[c]}/5</b> 
                                        ${statusBadge(st)}
                                    </span>
                                </div>` 
                        }).join('')}
                    </div>
                </div>`).join('')}
        </div>`; 
}

function orgGapsPage()
{ 
    return pageHeader(t('pages.aGapsTitle'), t('pages.aGapsSubtitle')) + `
        <div class="card desktop-table mb-16">
            <div class="section-title">
                <h3 class="hr-title">Top organizational competency gaps</h3>
            </div>
            <div class="table-scroll">
                <table class="matrix">
                    <thead>
                        <tr>
                            <th>Competency</th>
                            <th>Employees affected</th>
                            <th>Avg. current</th>
                            <th>Required</th>
                            <th>Gap</th>
                            <th>Priority</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.data.orgGaps.map(g => `
                            <tr>
                                <td>${esc(g.competency)}</td>
                                <td>${g.affected}</td>
                                <td>${g.avgCurrent.toFixed(1)}</td>
                                <td>${g.required.toFixed(1)}</td>
                                <td>${(g.required - g.avgCurrent).toFixed(1)}</td>
                                <td>${priorityBadge(g.priority)}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="mobile-only" style="flex-direction:column;gap:10px;margin-bottom:16px">
            ${state.data.orgGaps.map(g => `
                <div class="card">
                    <div class="card-row">
                        <div style="font-weight:700">${esc(g.competency)}</div>
                        ${priorityBadge(g.priority)}
                    </div>
                    <div class="tiny" style="color:var(--ink-soft);margin-top:6px">${g.affected} employees affected</div>
                    <div class="tiny" style="display:flex;gap:16px;color:var(--ink-soft);margin-top:4px">
                        <span>Avg. current: ${g.avgCurrent.toFixed(1)}</span>
                        <span>Required: ${g.required.toFixed(1)}</span>
                        <span>Gap: ${(g.required - g.avgCurrent).toFixed(1)}</span>
                    </div>
                </div>`).join('')}
        </div>
        <div class="card">
            <div class="section-title">
                <h3 class="hr-title">Gap size by competency</h3>
            </div>
            ${barChart(state.data.orgGaps.map(g => ({ label: g.competency, value: Number((g.required - g.avgCurrent).toFixed(1)) })))}
        </div>`; 
}

function effectivenessPage()
{ 
    return pageHeader(t('pages.aEffectivenessTitle'), t('pages.aEffectivenessSubtitle')) + `
        <div class="card desktop-table">
            <div class="table-scroll">
                <table class="matrix">
                    <thead>
                        <tr>
                            <th>${esc(t('pages.program'))}</th>
                            <th>${esc(t('pages.before'))}</th>
                            <th>${esc(t('pages.after'))}</th>
                            <th>${esc(t('pages.improvement'))}</th>
                            <th>${esc(t('pages.completion'))}</th>
                            <th>${esc(t('common.participants'))}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.data.trainingEffectiveness.map(r => `
                            <tr>
                                <td>${esc(r.program)}</td>
                                <td>${r.before.toFixed(1)}</td>
                                <td>${r.after.toFixed(1)}</td>
                                <td style="color:var(--good);font-weight:700">+${(r.after - r.before).toFixed(1)}</td>
                                <td>${r.completion}%</td>
                                <td>${r.participants}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="mobile-only" style="flex-direction:column;gap:10px">
            ${state.data.trainingEffectiveness.map(r => `
                <div class="card">
                    <div style="font-weight:700;margin-bottom:6px">${esc(r.program)}</div>
                    <div class="tiny" style="display:flex;gap:14px;color:var(--ink-soft);flex-wrap:wrap">
                        <span>Before: ${r.before.toFixed(1)}</span>
                        <span>After: ${r.after.toFixed(1)}</span>
                        <span style="color:var(--good);font-weight:700">+${(r.after - r.before).toFixed(1)}</span>
                        <span>Completion: ${r.completion}%</span>
                        <span>${r.participants} participants</span>
                    </div>
                </div>`).join('')}
        </div>`; 
}

function emergingPage()
{ 
    const skills = [
        ['Generative AI', 1.4, 4.5, 'High'], 
        ['Data Governance', 2, 4, 'High'], 
        ['Cybersecurity', 2.2, 4.2, 'High'], 
        ['Cloud', 1.8, 3.6, 'Medium'], 
        ['Digital Public Infrastructure', 1.6, 3.8, 'Medium']
    ]; 
    
    return pageHeader(t('pages.aEmergingTitle'), t('pages.aEmergingSubtitle')) + `
        <div class="grid-auto">
            ${skills.map(s => `
                <div class="card">
                    <div class="card-row">
                        <div style="font-weight:700">${esc(s[0])}</div>
                        ${priorityBadge(s[3])}
                    </div>
                    <div class="tiny" style="color:var(--ink-soft);margin:10px 0 4px">Current capability vs. future importance</div>
                    ${levelBar(Math.round(s[1]), Math.round(s[2]), true)}
                    <div class="tiny" style="color:var(--ink-soft);margin-top:8px">Recommended: AI Fundamentals for Public Servants (iGOT)</div>
                </div>`).join('')}
        </div>`; 
}

