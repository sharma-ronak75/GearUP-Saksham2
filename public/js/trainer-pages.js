function trainerDashboard()
{ 
    const total = state.data.trainingPrograms.reduce((s, p) => s + p.participants, 0); 
    const active = state.data.trainingPrograms.filter(p => p.status === 'Active').length; 
    
    return pageHeader(t('pages.tDashboardTitle'), 'Suman Bansal · ATI Punjab') + `
        <div class="kpi-grid">
            ${kpi(t('common.activePrograms'), active, '', '#16232F')}
            ${kpi(t('common.participants'), total, '', '#0E7C7B')}
            ${kpi(t('common.competencyGapsAddressed'), 4, '', '#C97A2C')}
            ${kpi(t('common.avgAssessmentScore'), '76%', '', '#2F6F4F')}
        </div>
        <div class="card">
            <div class="section-title">
                <h3 class="hr-title">${esc(t('common.trainingParticipation'))}</h3>
            </div>
            ${barChart(state.data.trainingPrograms.map(p => ({ label: p.title, value: p.participants })))}
        </div>`; 
}

function trainingContent()
{ 
    return pageHeader(t('pages.tContentTitle'), t('pages.tContentSubtitle')) + `
        <div class="grid-auto">
            ${state.data.trainingPrograms.map(p => `
                <div class="card">
                    <div class="card-row">
                        <div style="font-weight:700">${esc(p.title)}</div>
                        ${badge(p.status, p.status === 'Active' ? 'var(--good)' : 'var(--high)', p.status === 'Active' ? 'var(--good-soft)' : 'var(--high-soft)')}
                    </div>
                    <div class="small" style="color:var(--ink-soft);margin:6px 0">
                        ${esc(p.competency)} · ${esc(t('common.target'))}: ${esc(p.targetLevel)}
                    </div>
                    <div class="tiny" style="color:var(--ink-soft)">
                        ${esc(t('common.for'))}: ${esc(p.targetRole)}
                    </div>
                    <div class="tiny" style="display:flex;gap:12px;color:var(--ink-soft);margin:8px 0">
                        <span>${esc(p.duration)}</span>
                        <span>${esc(p.mode)}</span>
                        <span>${p.participants} ${esc(t('common.participants'))}</span>
                    </div>
                    <div class="tiny" style="color:var(--ink-soft)">
                        ${esc(t('common.trainerLabel'))}: ${esc(p.trainer)}
                    </div>
                </div>`).join('')}
        </div>`; 
}

function assessmentGenerator()
{ 
    const g = state.generator; 
    return pageHeader(t('pages.tGeneratorTitle'), t('pages.tGeneratorSubtitle')) + `
        <div class="card" style="max-width:520px;margin-bottom:20px">
            <label class="field-label">Training title</label>
            <input class="input-field" oninput="state.generator.title=this.value" value="${esc(g.title)}" style="margin-bottom:14px">
            <label class="field-label">Competency</label>
            <select class="input-field" onchange="state.generator.competency=this.value" style="margin-bottom:14px">
                ${['SQL', 'Data Quality Frameworks', 'Survey Design', 'Communication'].map(x => `
                    <option ${x === g.competency ? 'selected' : ''}>${x}</option>`).join('')}
            </select>
            <label class="field-label">Number of questions</label>
            <input class="input-field" type="number" min="2" max="4" oninput="state.generator.numQ=Number(this.value)" value="${g.numQ}" style="margin-bottom:16px">
            <button class="btn-teal btn-block" onclick="generateAssessment()" ${state.generating ? 'disabled' : ''}>
                ${state.generating ? 'Generating…' : '✦ Generate assessment'}
            </button>
        </div>
        ${state.generatedQuestions ? `
            <div>
                <div class="section-title">
                    <h3 class="hr-title">Generated questions - ${esc(g.competency)}</h3>
                </div>
                <div class="flex" style="flex-direction:column;gap:10px;max-width:620px">
                    ${state.generatedQuestions.map((q, i) => `
                        <div class="card">
                            <div style="font-weight:700;margin-bottom:8px">${i + 1}. ${esc(q.q)}</div>
                            ${q.options.map((o, oi) => `
                                <div class="small" style="color:${oi === q.answer ? 'var(--good)' : 'var(--ink-soft)'};padding:3px 0">
                                    ${oi === q.answer ? '◉' : '○'} ${esc(o)}
                                </div>`).join('')}
                            <div class="flex gap-8" style="margin-top:8px">
                                <button class="btn-secondary tiny">Edit</button>
                                <button class="btn-secondary tiny" onclick="generateAssessment()">Regenerate</button>
                            </div>
                        </div>`).join('')}
                </div>
                <div class="flex gap-10" style="margin-top:16px">
                    <button class="btn-secondary">Save as draft</button>
                    <button class="btn-primary">Publish assessment</button>
                </div>
            </div>` : ''}`; 
}

function assessmentManagement()
{ 
    const rows = [
        ['SQL Skill Assessment', 'Published', '74%', 34], 
        ['Data Quality & Validation Frameworks - checkpoint', 'Published', '81%', 21], 
        ['Advanced SQL for Government Data - checkpoint', 'Draft', '-', 0], 
        ['Digital Governance Assessment', 'Completed', '88%', 112]
    ]; 
    
    return pageHeader(t('pages.tManageTitle'), t('pages.tManageSubtitle')) + `
        <div class="card desktop-table">
            <div class="table-scroll">
                <table class="matrix">
                    <thead>
                        <tr>
                            <th>Assessment</th>
                            <th>Status</th>
                            <th>Avg. score</th>
                            <th>Participants</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(r => `
                            <tr>
                                <td>${esc(r[0])}</td>
                                <td>${badge(r[1], r[1] === 'Published' ? 'var(--teal)' : r[1] === 'Draft' ? 'var(--high)' : 'var(--good)', r[1] === 'Published' ? 'var(--teal-soft)' : r[1] === 'Draft' ? 'var(--high-soft)' : 'var(--good-soft)')}</td>
                                <td>${r[2]}</td>
                                <td>${r[3]}</td>
                                <td>
                                    <span class="muted-link">${esc(t('common.view'))}</span> · <span class="muted-link">${esc(t('common.edit'))}</span>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="mobile-only" style="flex-direction:column;gap:10px">
            ${rows.map(r => `
                <div class="card">
                    <div class="card-row">
                        <div style="font-weight:700">${esc(r[0])}</div>
                        ${badge(r[1], r[1] === 'Published' ? 'var(--teal)' : r[1] === 'Draft' ? 'var(--high)' : 'var(--good)', r[1] === 'Published' ? 'var(--teal-soft)' : r[1] === 'Draft' ? 'var(--high-soft)' : 'var(--good-soft)')}
                    </div>
                    <div class="tiny" style="display:flex;gap:16px;color:var(--ink-soft);margin:8px 0">
                        <span>Avg. score: ${r[2]}</span>
                        <span>${r[3]} participants</span>
                    </div>
                    <div class="small">
                        <span class="muted-link">${esc(t('common.view'))}</span> · <span class="muted-link">${esc(t('common.edit'))}</span>
                    </div>
                </div>`).join('')}
        </div>`; 
}

function trainingPlanning()
{ 
    return pageHeader(t('pages.tPlanningTitle'), t('pages.tPlanningSubtitle')) + `
        <div class="card mb-16">
            <div class="eyebrow">Department</div>
            <div style="font-weight:700;font-size:16px;margin-bottom:12px">Department of Statistics</div>
            <div class="section-title">
                <h4 style="font-size:16.5px">High-demand competencies</h4>
            </div>
            <div class="chip-row">
                ${['Data Quality', 'SQL', 'AI/ML', 'Survey Design'].map((c, i) => badge(`${i + 1}. ${c}`, 'var(--navy)', '#E9ECEF')).join('')}
            </div>
        </div>
        <div class="card">
            <div class="section-title">
                <h3 class="hr-title">Competency gap → Training demand → Training plan</h3>
            </div>
            <div class="flex" style="flex-direction:column;gap:10px">
                ${state.data.orgGaps.slice(0, 4).map(g => `
                    <div class="list-row">
                        <span style="min-width:170px;font-weight:700">${esc(g.competency)}</span>
                        <span>${g.affected} employees affected</span>
                        <span>→</span>
                        ${priorityBadge(g.priority === 'High' ? 'High' : 'Medium')}
                        <span>→</span>
                        <span style="color:var(--teal);font-weight:600">Planned: Q3 2026 cohort</span>
                    </div>`).join('')}
            </div>
        </div>`; 
}

