function barChart(data)
{ 
    const max = Math.max(...data.map(x => x.value), 1); 
    return `
        <div class="bars">
            ${data.map(d => `
                <div class="bar-col">
                    <div class="bar-value">${d.value}</div>
                    <div class="bar-fill" style="height:${Math.max(4, (d.value / max) * 150)}px"></div>
                    <div class="bar-label">${esc(String(d.label).slice(0, 18))}</div>
                </div>`).join('')}
        </div>`; 
}

function svgRadar(data)
{ 
    const w = 620, h = 280, cx = 310, cy = 138, r = 94; 
    const pts = (radius, values) => values.map((v, i) => { 
        const a = (-Math.PI / 2) + (i * 2 * Math.PI / values.length); 
        const rr = radius * v / 5; 
        return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}` 
    }).join(' '); 
    
    const current = data.map(d => d.current);
    const req = data.map(d => d.required); 
    
    const axes = data.map((d, i) => { 
        const a = (-Math.PI / 2) + (i * 2 * Math.PI / data.length); 
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; 
        return `
            <line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#DFE0DA"/>
            <text x="${cx + Math.cos(a) * (r + 26)}" y="${cy + Math.sin(a) * (r + 26)}" text-anchor="middle" font-size="16" fill="#4B5563">
                ${esc(d.label.split(' ')[0])}
            </text>` 
    }).join(''); 
    
    return `
        <svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Competency overview">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#DFE0DA"/>
            <circle cx="${cx}" cy="${cy}" r="${r * .6}" fill="none" stroke="#DFE0DA"/>s
            <circle cx="${cx}" cy="${cy}" r="${r * .3}" fill="none" stroke="#DFE0DA"/>
            ${axes}
            <polygon points="${pts(r, current)}" fill="#0E7C7B" fill-opacity=".25" stroke="#0E7C7B" stroke-width="2"/>
            <polygon points="${pts(r, req)}" fill="none" stroke="#16232F" stroke-width="2" stroke-dasharray="5 4"/>
            <text x="16" y="22" font-size="16" fill="#4B5563">Current</text>
            <line x1="120" y1="18" x2="150" y2="18" stroke="#0E7C7B" stroke-width="3"/>
            <text x="16" y="52" font-size="16" fill="#4B5563">Required</text>
            <line x1="120" y1="48" x2="150" y2="48" stroke="#16232F" stroke-width="2" stroke-dasharray="5 4"/>
        </svg>`; 
}

function svgLine(values, labels = ['Q1', 'Q2', 'Q3', 'Q4'])
{ 
    const w = 620, h = 180, p = 24, min = 0, max = 5; 
    const sx = i => p + i * ((w - 2 * p) / Math.max(1, values.length - 1)); 
    const sy = v => h - p - (v - min) / (max - min) * (h - 2 * p); 
    const pts = values.map((v, i) => `${sx(i)},${sy(v)}`).join(' '); 
    
    return `
        <svg class="line-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Growth trend">
            <line x1="${p}" y1="${h - p}" x2="${w - p}" y2="${h - p}" stroke="#DFE0DA"/>
            <polyline points="${pts}" fill="none" stroke="#0E7C7B" stroke-width="3"/>
            ${values.map((v, i) => `
                <circle cx="${sx(i)}" cy="${sy(v)}" r="4" fill="#0E7C7B"/>
                <text x="${sx(i)}" y="${h - 8}" text-anchor="middle" font-size="16" fill="#4B5563">${esc(labels[i] || '')}</text>`
            ).join('')}
        </svg>`; 
}

function svgPie(segments)
{
    const w = 320, h = 220, cx = 110, cy = 110, r = 90;
    const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

    let angle = -Math.PI / 2;
    const arcs = segments.filter(seg => seg.value > 0).map(seg =>
    {
        const slice = (seg.value / total) * 2 * Math.PI;
        const start = angle;
        const end = angle + slice;
        angle = end;
        const x1 = cx + Math.cos(start) * r, y1 = cy + Math.sin(start) * r;
        const x2 = cx + Math.cos(end) * r, y2 = cy + Math.sin(end) * r;
        const largeArc = slice > Math.PI ? 1 : 0;
        const isFullCircle = seg.value === total;
        const d = isFullCircle
            ? `M ${cx - r},${cy} A ${r},${r} 0 1 1 ${cx + r},${cy} A ${r},${r} 0 1 1 ${cx - r},${cy} Z`
            : `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
        const pct = Math.round((seg.value / total) * 100);
        return { d, color: seg.color, label: seg.label, value: seg.value, pct };
    });

    return `
        <div class="flex" style="gap:24px;flex-wrap:wrap;align-items:center">
            <svg viewBox="0 0 ${w} ${h}" style="width:220px;height:220px;flex-shrink:0" role="img" aria-label="Question breakdown">
                ${arcs.map(a => `<path d="${a.d}" fill="${a.color}" stroke="#fff" stroke-width="2"/>`).join('')}
            </svg>
            <div class="flex" style="flex-direction:column;gap:8px">
                ${arcs.map(a => `
                    <div class="flex" style="align-items:center;gap:8px">
                        <span style="width:12px;height:12px;border-radius:3px;background:${a.color};display:inline-block"></span>
                        <span style="font-weight:600">${esc(a.label)}</span>
                        <span style="color:var(--ink-soft)">${a.value} (${a.pct}%)</span>
                    </div>`).join('')}
            </div>
        </div>`;
}

function loginPage()
{ 
    return `
        <div class="login-shell">
            <section class="login-hero">
                <div>
                    <div class="brand-row">
                        <div class="brand-mark" style="font-size: 24px;">${LOGO_HTML}</div>
                        <div>
                            <div style="font-family:monospace,serif;font-weight:700;font-size:24px;">${esc(t('login.brand'))}</div>
                            <div style="font-size:16.5px;color:#8FA0AE;">Skill Intelligence</div>
                        </div>
                    </div>
                    <div class="login-hero-copy">
                        <h1>${esc(t('login.heroHeadline'))}</h1>
                        <p style="color:#C7CFD8;max-width:420px;text-shadow: 0px 0px 5px black;">${esc(t('login.heroSubtext'))}</p>
                    </div>
                </div>
                <div style="text-align: center">
                    <!--<img style="width:60vh; margin-top:-250vh;opacity:1;" src="igot-nobg.png" alt="IGot Karamyogi Logo">-->
                    </div>
                    <div style='left:20vh; top:40vh; width:50vh; height:50vh; position:fixed; background-image: url("igot-nobg.png");background-size:contain;'></div>
                <div class="login-hero-steps">
                    <span>About Saksham</span><span>Privacy Policy</span><span>Terms & Conditions</span>
                </div>
            </section>
            <section class="login-form-panel">
                <div class="login-card">
                    <div class="notice mb-16">${esc(t('login.prototypeNotice'))}</div>
                    <div class="section-title">
                        <div>
                            <h2 style="font-size:34px">${esc(t('login.signIn'))}</h2>
                        </div>
                    </div>
                    <form id="login-form" onsubmit="event.preventDefault();handleLogin()">
                        <div class="login-stack">
                            <div>
                                <label class="field-label" style="font-size: 20px;">${esc(t('login.idLabel'))}</label>
                                <input id="email" value="testificate@test.com" class="input-field" autocomplete="username" placeholder='&#9993; example@gov.in'>
                            </div>
                            <div>
                                <label class="field-label" style="font-size: 20px;">${esc(t('login.passwordLabel'))}</label>
                                <input id="password" value="12345678" class="input-field" type="password" autocomplete="current-password" placeholder="• • • • • •">
                            </div>
                            <div class="check-row">
                                <label style="font-size: 16px;"><input type="checkbox" id="rememberme" checked> ${esc(t('login.rememberMe'))}</label>
                                <span class="muted-link" style="font-size: 16px;">${esc(t('login.forgotPassword'))}</span>
                            </div>
                            <div class="error-text" id="login-error"></div>
                            <button class="btn-primary btn-block" id="login-submit" style="font-size: 20px;">${esc(t('login.signIn'))}</button>
                        </div>
                    </form>
                    <div style="display:flex;align-items:center;gap:10px;margin:22px 0">
                        <div style="flex:1;height:1px;background:var(--line)"></div>
                        <span class="tiny" style="color:var(--ink-soft); font-size: 16px;">${esc(t('login.orDemo'))}</span>
                        <div style="flex:1;height:1px;background:var(--line)"></div>
                    </div>
                    <div class="login-stack">
                        <button class="btn-secondary demo-btn" onclick="handleDemoEmployee()">
                            <span style="font-size: 16px;">${esc(t('login.employeeDemo'))}</span>
                            <span>></span>
                        </button>
                        <button class="btn-secondary demo-btn" onclick="alert('not done yet')">
                            <span style="font-size: 16px;">${esc(t('login.trainerDemo'))}</span>
                            <span>></span>
                        </button>
                        <button class="btn-secondary demo-btn" onclick="handleDemoAdmin()">
                            <span style="font-size: 16px;">${esc(t('login.adminDemo'))}</span>
                            <span>></span>
                        </button>
                    </div>

                </div>
            </section>
            <div style="margin-top:18px" class="lang-select">
                <select class="input-field" onchange="state.language=this.value;save();render()">
                    <option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option>
                    <option value="hi" ${state.language === 'hi' ? 'selected' : ''}>हिन्दी</option>
                </select>
            </div>
        </div>`; 
}