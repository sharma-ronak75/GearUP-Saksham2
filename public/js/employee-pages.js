function employeeDashboard()
{
    const cs = state.data.competencies;
    const gaps = cs.map(c => ({ 
        ...c, 
        gap: c.required - c.current, 
        priority: priorityForGap(c.required - c.current) 
    })).filter(c => c.gap > 0).sort((a, b) => b.gap - a.gap); 
    
    const critical = gaps.filter(x => x.priority === 'Critical' || x.priority === 'High').slice(0, 4); 
    const avg = (cs.reduce((s, c) => s + c.current, 0) / cs.length).toFixed(1); 
    const barData = cs.slice(0, 7).map(c => ({ 
        label: c.name, 
        current: c.current, 
        required: c.required 
    }));

    return pageHeader(`${t('pages.welcome')}, ${state.data.employee.name}`, `${state.data.employee.designation} · ${state.data.employee.department} · ${state.data.employee.organization}`) + `
        <div class="kpi-grid">
            ${kpi(t('common.overallCompetency'), `${avg} / 5`, 'Across 11 tracked competencies', '#16232F')}
            ${kpi(t('common.criticalHighGaps'), gaps.filter(g => g.priority === 'Critical' || g.priority === 'High').length, 'Need priority attention', '#A63D2F')}
            ${kpi(t('common.learningProgressLabel'), '1 of 4 phases', 'SQL learning path', '#0E7C7B')}
            ${kpi(t('common.assessmentsCompletedLabel'), state.assessmentsDone.length, `of ${state.data.assessments.length} available`, '#2F6F4F')}
            ${kpi(t('common.competenciesImproved'), state.assessmentsDone.length, 'via completed assessments', '#9C8B3C')}
        </div>
        <div class="grid-2 mb-16">
            <div class="card">
                <div class="section-title">
                <h3 class="hr-title">${esc(t('ui.competencyOverview'))}</h3> <span class="eyebrow">${esc(t('ui.currentVsRequired'))}</span>
                </div>
                ${svgRadar(barData)}
            </div>
            <div class="card">
                <div class="section-title">
                    <h3 class="hr-title">Upcoming assessment</h3>
                </div>
                <div style="font-weight:700;font-size:16px">Advanced SQL for Government Data - checkpoint</div>
                <div class="small" style="color:var(--ink-soft);margin-top:4px">Linked to your current learning phase</div>
                <div class="small" style="display:flex;gap:14px;color:var(--ink-soft);margin-top:12px">
                    <span>◷ 12 min</span>
                    <span>☷ 4 questions</span>
                </div>
                <button class="btn-teal btn-block mt-12" style="font-size: 20px;" onclick="openPage('assess','assess');">Go to assessments</button>
                <!--<div style="font-weight:700;margin-bottom:8px;font-size:16px">Competency growth</div>
                ${svgLine([2.4, 2.6, 2.8, Number(avg)])} -->
            </div>
        </div>
        <div class="card mb-16">
            <div class="section-title">
                <h3 class="hr-title">${esc(t('pages.dashboardPriorityGaps'))}</h3>
                <a class="muted-link" onclick="openPage('gaps')">${esc(t('common.viewAll'))} →</a>
            </div>
            ${critical.length ? `<div class="grid-auto">${critical.map(g => `
                <div class="priority-card" style="border-left-color:${state.data.priorityStyles[g.priority].fg}">
                    <div class="card-row">
                        <div style="font-weight:700">${esc(g.name)}</div>
                        ${priorityBadge(g.priority)}
                    </div>
                    <div class="small" style="color:var(--ink-soft);margin:6px 0">
                        ${esc(t('common.current'))}: ${esc(state.data.levelNames[g.current])} · ${esc(t('common.required'))}: ${esc(state.data.levelNames[g.required])}
                    </div>
                    ${levelBar(g.current, g.required, true)}
                    <button class="btn-secondary btn-block mt-10" onclick="openPage('why', ${esc(JSON.stringify(g.name))})">${esc(t('common.viewGap'))}</button>
                </div>`).join('')}</div>` : empty(t('pages.noGapsRemaining'))}
        </div>
        <div class="card">
            <div class="section-title">
                <h3 class="hr-title">${esc(t('pages.dashboardRecommendedLearning'))}</h3>
                <a class="muted-link" onclick="openPage('assess','igot')">${esc(t('common.viewAll'))} →</a>
            </div>
            <div class="grid-auto">
                ${state.data.courses.filter(c => gaps.some(g => g.name === c.competency)).slice(0, 3).map(c => `
                    <div class="card">
                        <div class="tiny" style="color:var(--teal);font-weight:700">${esc(c.provider)}</div>
                        <div style="font-weight:700;font-size:16.5px;margin:3px 0">${esc(c.title)}</div>
                        <div class="small" style="color:var(--ink-soft)">${esc(c.competency)} · ${esc(c.duration)}</div>
                    </div>`).join('')}
            </div>
        </div>`;
}

function profilePage()
{ 
    const e = state.data.employee; 
    const fields = [
        ['Employee ID', e.id], 
        ['Name', e.name], 
        ['Department', e.department], 
        ['Organization', e.organization], 
        ['Designation', e.designation], 
        ['Group', e.group], 
        ['Location', e.location], 
        ['Years of service', e.yearsOfService], 
        ['Current role', e.role], 
        ['Reports to', e.reportsTo]
    ]; 
    return pageHeader(t('pages.profileTitle'), t('pages.profileSubtitle')) + `
        <div class="card" style="max-width:720px">
            <div class="card-row" style="align-items:center;margin-bottom:18px">
                <div class="flex gap-12" style="align-items:center">
                    <div style="width:54px;height:54px;border-radius:50%;background:var(--teal-soft);color:var(--teal);display:grid;place-items:center;font-weight:700;font-size:18px">T</div>
                    <div>
                        <div style="font-weight:700;font-size:16px">${esc(e.name)}</div>
                        <div style="color:var(--ink-soft);font-size:16px">${esc(e.designation)}</div>
                    </div>
                </div>
                <div class="right">
                    <div class="tiny" style="color:var(--ink-soft)">Profile completion</div>
                    <div style="font-weight:700;color:var(--good)">92%</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 24px" class="responsive-two">
                ${fields.map(([k, v]) => `
                    <div>
                        <div class="eyebrow">${esc(k)}</div>
                        <div style="font-weight:600;margin-top:2px">${esc(v)}</div>
                    </div>`).join('')}
            </div>
        </div>`; 
}

function rolePage()
{ 
    const e = state.data.employee; 
    return pageHeader(t('pages.roleTitle'), t('pages.roleSubtitle')) + `
        <div class="card mb-16">
            <div class="flex gap-16" style="flex-wrap:wrap">
                <div>
                    <div class="eyebrow">Department</div>
                    <div style="font-weight:700">${esc(e.department)}</div>
                </div>
                <div>
                    <div class="eyebrow">Designation</div>
                    <div style="font-weight:700">${esc(e.designation)}</div>
                </div>
                <div>
                    <div class="eyebrow">Role</div>
                    <div style="font-weight:700">${esc(e.role)}</div>
                </div>
            </div>
        </div>
        <div class="section-title">
            <h3 class="hr-title">Roles, Actions and Required Competencies</h3>
        </div>
        <div class="flex" style="flex-direction:column;gap:10px">
            ${state.data.activities.map((a, i) => `
                <div class="card list-row">
                    <div style="min-width:230px;font-weight:700;font-size:16.5px;">
                        <span style="margin-right:8px;font-size: 16px;"><b>${i + 1}.</b></span>${esc(a.name)}
                    </div>
                    <span style="color:var(--ink-soft);font-size:30px;">&rArr;</span>
                    <div class="chip-row" style="margin-left: auto;">
                        ${a.competencies.map(c => badge(c, 'var(--teal)', 'var(--teal-soft)')).join('')}
                    </div>
                </div>`).join('')}
        </div>`; 
}

function competencyPage()
{ 
    return pageHeader(t('pages.competencyTitle'), t('pages.competencySubtitle')) + 
        Object.entries(state.data.competencyCategories).map(([cat, names]) => `
            <div class="mb-20">
                <div class="section-title">
                    <h3 class="hr-title">${esc(cat)}</h3>
                </div>
                <div class="grid-auto">
                    ${names.map(n => { 
                        const c = state.data.competencies.find(x => x.name === n); 
                        if (!c) return ''; 
                        const gap = c.required - c.current; 
                        const p = priorityForGap(gap); 
                        return `
                            <div class="card">
                                <div class="card-row">
                                    <div style="font-weight:700">${esc(n)}</div>
                                    ${badge(gap <= 0 ? 'On target' : `${p} gap`, gap <= 0 ? 'var(--good)' : state.data.priorityStyles[p].fg, gap <= 0 ? 'var(--good-soft)' : state.data.priorityStyles[p].bg)}
                                </div>
                                <div style="margin:10px 0">${levelBar(c.current, c.required)}</div>
                                <div class="tiny" style="color:var(--ink-soft)">Evidence: ${esc(c.evidence)}</div>
                                <div class="tiny" style="color:var(--ink-soft)">Last assessed: ${esc(c.lastAssessed)}</div>
                            </div>` 
                    }).join('')}
                </div>
            </div>`).join(''); 
}

function gapPage()
{ 
    const gaps = state.data.competencies.map(c => ({ 
        ...c, 
        gap: c.required - c.current, 
        priority: priorityForGap(c.required - c.current) 
    })).filter(c => c.gap > 0).sort((a, b) => b.gap - a.gap); 
    
    const filter = state.gapFilter || 'All'; 
    const list = filter === 'All' ? gaps : gaps.filter(g => g.priority === filter); 
    const activityFor = n => state.data.activities.find(a => a.competencies.includes(n))?.name || t('pages.generalRoleRequirement'); 
    
    return pageHeader(t('pages.gapsTitle'), t('pages.gapsSubtitle')) + `
        <div class="pill-nav">
            ${['All', 'Critical', 'High', 'Medium', 'Low'].map(p => `
                <button class="${filter === p ? 'btn-primary' : 'btn-secondary'}" onclick="state.gapFilter=${esc(JSON.stringify(p))};render()">
                    ${p === 'All' ? t('common.priorityAll') : t(`common.priority${p}`)}
                </button>`).join('')}
        </div>
        <div class="grid-auto">
            ${list.length ? list.map(g => `
                <div class="card" style="border-left:4px solid ${state.data.priorityStyles[g.priority].fg}">
                    <div class="card-row">
                        <div style="font-weight:700;font-size:16px">${esc(g.name)}</div>
                        ${priorityBadge(g.priority)}
                    </div>
                    <div style="margin:10px 0">${levelBar(g.current, g.required)}</div>
                    <div class="small" style="color:var(--ink-soft)">${esc(t('common.gap'))}: ${g.gap} level${g.gap > 1 ? 's' : ''}</div>
                    <div class="small" style="color:var(--ink-soft)">${esc(t('pages.relatedActivity'))}: ${esc(activityFor(g.name))}</div>
                    <div class="small" style="color:var(--ink-soft);margin-top:4px">${esc(state.data.impactText[g.name] || t('pages.affectsPerformance'))}</div>
                    <button class="btn-secondary btn-block mt-12" onclick="openPage('why', ${esc(JSON.stringify(g.name))})">${esc(t('nav.why'))} &rArr;</button>
                </div>`).join('') : empty(t('pages.noGapsFound'))}
        </div>`; 
}

function whyPage()
{ 
    const gapName = state.selectedGap || 'SQL'; 
    const c = state.data.competencies.find(x => x.name === gapName) || state.data.competencies.find(x => x.required > x.current); 
    
    if (!c)
    {
        return pageHeader(t('pages.whyTitle')) + empty(t('pages.noGapsFound'));
    }
    
    const activity = state.data.activities.find(a => a.competencies.includes(c.name)); 
    const gap = c.required - c.current; 
    const priority = priorityForGap(gap); 
    const steps = [
        [t('pages.whyYourRole'), state.data.employee.role], 
        [t('pages.whyYourActivity'), activity?.name || t('pages.generalRoleRequirement')], 
        [t('pages.whyRequiredCompetency'), c.name], 
        [t('pages.whyRequiredLevel'), `${state.data.levelNames[c.required]} (${c.required}/5)`], 
        [t('pages.whyCurrentLevel'), `${state.data.levelNames[c.current]} (${c.current}/5)`], 
        [t('pages.whyGap'), `${gap} level${gap > 1 ? 's' : ''}`], 
        [t('pages.whyImpact'), state.data.impactText[c.name] || t('pages.affectsPerformance')]
    ]; 
    
    return pageHeader(t('pages.whyTitle'), `Information for the Skill: ${c.name}`) + `
        <div class="card" style="max-width:640px;margin-bottom:20px">
            <div class="card-row">
                <div class="eyebrow">Recommendation</div>
                ${priorityBadge(priority)}
            </div>
            <h2 style="font-size:19px;margin-top:4px">Improve your ${esc(c.name)} competency</h2>
        </div>
        <div style="max-width:640px" class="step-list">
            ${steps.map((s, i) => `
                <div class="step-row">
                    <div class="step-marker-col">
                        <div class="step-marker ${i === 0 ? 'done' : ''}">${i + 1}</div>
                        ${i < steps.length - 1 ? '<div class="step-line"></div>' : ''}
                    </div>
                    <div class="card mb-10" style="flex:1">
                        <div class="why-step">
                            <span class="eyebrow">${esc(s[0])}</span>
                            <span class="why-step-value">${esc(s[1])}</span>
                        </div>
                    </div>
                </div>`).join('')}
        </div>
        <div class="flex gap-10" style="margin-top:20px">
            <button class="btn-teal" onclick="openPage('learning')">View personalized learning path</button>
            <button class="btn-secondary" onclick="openPage('assess','igot')">See course recommendations</button>
        </div>`; 
}

function learningPage()
{ 
    const statusColor = { 
        Completed: 'var(--good)', 
        'In Progress': 'var(--teal)', 
        Recommended: 'var(--high)', 
        Upcoming: 'var(--ink-soft)' 
    }; 
    return pageHeader(t('pages.learningTitle'), t('pages.learningSubtitle')) + `
        <div class="step-list">
            ${state.data.learningPathSql.map((p, i) => `
                <div class="step-row">
                    <div class="step-marker-col">
                        <div class="step-marker ${p.status === 'Completed' ? 'done' : ''}">${p.status === 'Completed' ? '✓' : p.phase}</div>
                        ${i < state.data.learningPathSql.length - 1 ? '<div class="step-line"></div>' : ''}
                    </div>
                    <div class="card mb-16" style="flex:1">
                        <div class="card-row">
                            <div>
                                <div class="eyebrow">Phase ${p.phase}</div>
                                <div style="font-weight:700;font-size:16.5px">${esc(p.title)}</div>
                            </div>
                            ${badge(p.status, statusColor[p.status], '#F3F4F1')}
                        </div>
                        <div class="small" style="display:flex;gap:16px;flex-wrap:wrap;color:var(--ink-soft);margin-top:10px">
                            <span>Source: ${esc(p.source)}</span>
                            <span>Duration: ${esc(p.duration)}</span>
                            <span>Difficulty: ${esc(p.difficulty)}</span>
                        </div>
                        <div class="small" style="margin-top:8px">
                            Expected improvement: <strong>${esc(p.expected)}</strong>
                        </div>
                    </div>
                </div>`).join('')}
        </div>
        <button class="btn-teal" onclick="openPage('assess','igot')">View recommendations</button>`; 
}

function recommendPageBody()
{ 
    const gaps = state.data.competencies.filter(c => c.required > c.current).map(c => c.name); 
    const groups = [
        ['iGOT Courses', 'iGOT'], 
        ['ATI Training', 'ATI Punjab'], 
        ['NSSTA / Specialized Training', 'NSSTA']
    ]; 
    
    return groups.map(([label, provider]) => { 
            const cs = state.data.courses.filter(c => c.provider === provider); 
            return `
                <div class="mb-20">
                    <div class="section-title">
                        <h3 class="hr-title">${label}</h3>
                    </div>
                    <div class="grid-auto">
                        ${cs.map(c => `
                            <div class="card">
                                <div class="card-row">
                                    <div style="font-weight:700">${esc(c.title)}</div>
                                    ${gaps.includes(c.competency) ? badge('Closes a gap', 'var(--teal)', 'var(--teal-soft)') : ''}
                                </div>
                                <div class="small" style="color:var(--ink-soft);margin:6px 0">
                                    ${esc(c.competency)} · ${esc(c.duration)} · ${esc(c.mode)}
                                </div>
                                <div class="tiny" style="color:var(--ink-soft)">Difficulty: ${esc(c.difficulty)}</div>
                                <button class="btn-secondary btn-block mt-10" onclick="openPage('learning')">View in learning path</button>
                            </div>`).join('')}
                    </div>
                </div>`; 
        }).join(''); 
}

function assessmentsPageBody()
{ 
    return `
        <div class="grid-auto">
            ${state.data.assessments.map(a => { 
                const c = state.data.competencies.find(x => x.name === a.competency); 
                const done = state.assessmentsDone.includes(a.id); 
                return `
                    <div class="card">
                        <div class="card-row">
                            <div style="font-weight:700;font-size:16px">${esc(a.title)}</div>
                            ${done ? badge('Completed', 'var(--good)', 'var(--good-soft)') : ''}
                        </div>
                        <div class="small" style="color:var(--ink-soft);margin:8px 0">${esc(a.competency)}</div>
                        <div class="small" style="color:var(--ink-soft);display:flex;gap:14px;margin-bottom:8px">
                            <span>☷ ${a.questions} questions</span>
                            <span>◷ ${a.minutes} min</span>
                        </div>
                        ${c ? `<div class="tiny" style="color:var(--ink-soft);margin-bottom:10px">
                            ${esc(t('common.current'))}: ${esc(state.data.levelNames[c.current])} → ${esc(t('common.target'))}: ${esc(state.data.levelNames[c.required])}
                        </div>` : ''}
                        <button class="${done ? 'btn-secondary' : 'btn-teal'} btn-block" onclick="proctorBeginCheck(${esc(JSON.stringify(a.id))})">
                            ${esc(done ? t('common.retakeAssessment') : t('common.startAssessment'))}
                        </button>
                    </div>`; 
            }).join('')}
        </div>`; 
}

function trainingAssessPage()
{
    // iGOT/Training and Assessments used to be two separate sidebar tabs;
    // they're merged here into one page with an internal pill-switcher so
    // there's a single nav entry, with a fade so switching feels seamless.
    const tab = state.trainingSubTab === 'assess' ? 'assess' : 'igot';
    return pageHeader(t('pages.assessTitle'), t('pages.assessSubtitle')) + `
        <div class="pill-nav">
            <button class="${tab === 'igot' ? 'btn-primary' : 'btn-secondary'}" onclick="state.trainingSubTab='igot';save();render()">
                ${esc(t('common.tabIgotTraining'))}
            </button>
            <button class="${tab === 'assess' ? 'btn-primary' : 'btn-secondary'}" onclick="state.trainingSubTab='assess';save();render()">
                ${esc(t('common.tabAssessments'))}
            </button>
        </div>
        <div class="tab-fade" data-tab="${tab}">
            ${tab === 'igot' ? recommendPageBody() : assessmentsPageBody()}
        </div>`;
}

function quizPage()
{ 
    const a = state.data.assessments.find(x => x.id === state.quizAssessment); 
    const questions = state.data.questionBank[state.quizAssessment] || []; 
    
    if (!a) return empty(t('pages.assessmentNotFound')); 
    
    const idx = state.quizIndex; 
    const q = questions[idx]; 
    const selected = state.quizAnswers[idx]; 
    const pct = ((idx + 1) / questions.length) * 100; 
    
    return proctorBar() + pageHeader(a.title, `Question ${idx + 1} of ${questions.length}`, `<button class="btn-secondary" onclick="proctorExitQuiz()">${esc(t('common.exit'))}</button>`) + `
        <div class="progress-bar" style="max-width:640px;margin-bottom:22px">
            <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="card" style="max-width:1040px;">
            <div style="font-weight:700;font-size:15px;margin-bottom:16px">${esc(q.q)}</div>
            <div class="flex" style="flex-direction:column;gap:8px">
                ${q.options.map((o, i) => `
                    <div class="quiz-option ${selected === i ? 'selected' : ''}" onclick="state.quizAnswers[state.quizIndex]=${i};render()">
                        <span>${selected === i ? '◉' : '○'}</span>
                        <span>${esc(o)}</span>
                    </div>`).join('')}
            </div>
            <div class="quiz-controls">
                <button class="btn-secondary" ${idx === 0 ? 'disabled' : ''} onclick="state.quizIndex--;render()">${esc(t('common.back'))}</button>
                ${idx === questions.length - 1 ? `
                    <button class="btn-primary" ${selected === undefined ? 'disabled' : ''} onclick="handleQuizSubmit()">${esc(t('common.submit'))}</button>` : `
                    <button class="btn-primary" ${selected === undefined ? 'disabled' : ''} onclick="state.quizIndex++;render()">${esc(t('common.next'))}</button>`}
            </div>
        </div>`; 
}

function resultPage()
{
    const r = state.lastResult;
    if (!r) return pageHeader(t('pages.resultTitle')) + empty(t('pages.noResultFound'));
    
    const c = state.data.competencies.find(x => x.name === r.assessment.competency);
    const remaining = c ? Math.max(0, c.required - r.newLevel) : 0;
    const scoreColor = r.score >= 70 ? 'var(--good)' : r.score >= 50 ? 'var(--high)' : 'var(--critical)';
    const gapBadge = badge(remaining > 0 ? `Remaining gap: ${remaining}` : 'Gap closed', remaining > 0 ? 'var(--high)' : 'var(--good)', remaining > 0 ? 'var(--high-soft)' : 'var(--good-soft)');
    const improvement = remaining > 0 ? `Continue building toward ${esc(state.data.levelNames[c?.required])} level ${esc(r.assessment.competency)}.` : 'No major gaps remaining for this competency.';
    if(document.fullscreenElement)document.exitFullscreen();
    return pageHeader(t('pages.resultTitle'), r.assessment.title) + `
        ${proctorSummaryCard()}
        <div class="grid-2 mb-20">
            <div class="card right">
                <div class="eyebrow">Assessment score</div>
                <div class="score-big" style="color:${scoreColor}">${r.score}%</div>
                <div class="small" style="color:var(--ink-soft)">${r.correct} of ${r.total} correct</div>
            </div>
            <div class="card">
                <div class="eyebrow mb-10">Competency level</div>
                <div class="card-row" style="font-size:16px">
                    <span>Previous: <strong>${esc(state.data.levelNames[r.prevLevel])}</strong></span>
                    <span>→</span>
                    <span>Updated: <strong style="color:var(--teal)">${esc(state.data.levelNames[r.newLevel])}</strong></span>
                </div>
                <div class="mt-12">${levelBar(r.newLevel, c ? c.required : r.newLevel)}</div>
            </div>
        </div>
        <div class="card mb-20">
            <div class="section-title">
                <h3 class="hr-title">Evidence update loop</h3>
            </div>
            <div class="chip-row">
                ${badge('Before assessment', 'var(--ink-soft)', '#EFEFEA')}<span>→</span>
                ${badge('Assessment', 'var(--navy)', '#E9ECEF')}<span>→</span>
                ${badge('Evidence update', 'var(--teal)', 'var(--teal-soft)')}<span>→</span>
                ${gapBadge}<span>→</span>
                ${badge('Next recommendation', 'var(--medium)', 'var(--medium-soft)')}
            </div>
        </div>
        <div class="grid-2">
            <div class="card">
                <div style="font-weight:700;color:var(--good);margin-bottom:6px">Areas of strength</div>
                <div class="small" style="color:var(--ink-soft)">Solid grasp of core ${esc(r.assessment.competency)} concepts covered in the earlier questions.</div>
            </div>
            <div class="card">
                <div style="font-weight:700;color:var(--high);margin-bottom:6px">Areas needing improvement</div>
                <div class="small" style="color:var(--ink-soft)">${improvement}</div>
            </div>
        </div>
        <div class="flex gap-10" style="margin-top:20px">
            <button class="btn-teal" onclick="openPage('progress')">View progress</button>
            <button class="btn-secondary" onclick="openPage('learning')">Next recommendation</button>
        </div>`;
}

function progressPage()
{ 
    const improved = state.history.length; 
    const hours = 24 + improved * 6; 
    return pageHeader(t('pages.progressTitle'), t('pages.progressSubtitle')) + `
        <div class="kpi-grid">
            ${kpi('Courses completed', 1 + improved, '', '#0E7C7B')}
            ${kpi(t('common.assessmentsCompletedLabel'), state.history.length, '', '#16232F')}
            ${kpi(t('common.competenciesImproved'), improved, '', '#2F6F4F')}
            ${kpi('Learning hours', hours, '', '#9C8B3C')}
        </div>
        <div class="card mb-20">
            <div class="section-title">
                <h3 class="hr-title">Competency growth over time</h3>
            </div>
            ${svgLine([2.3, 2.4, 2.5, 2.6, 2.6 + improved * .15, 2.7 + improved * .2], ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'])}
        </div>
        ${state.history.length ? `
            <div class="card">
                <div class="section-title">
                    <h3 class="hr-title">Gap reduction by assessment</h3>
                </div>
                <div class="flex" style="flex-direction:column;gap:10px">
                    ${state.history.map(h => `
                        <div class="list-row">
                            <span style="min-width:160px;font-weight:600">${esc(h.assessment.competency)}</span>
                            <span>Before: ${esc(state.data.levelNames[h.prevLevel])}</span>
                            <span>→</span>
                            <span style="color:var(--good);font-weight:700">After: ${esc(state.data.levelNames[h.newLevel])}</span>
                        </div>`).join('')}
                </div>
            </div>` : ''
        }`;
}

