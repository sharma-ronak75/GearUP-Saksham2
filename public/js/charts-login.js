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
                        <p style="color:#C7CFD8;max-width:420px">${esc(t('login.heroSubtext'))}</p>
                    </div>
                </div>
                <div style="text-align: center">
                    <img style="width:500px; margin-top:-120px;" src="igot-nobg.png" alt="IGot Karamyogi Logo">
                </div>
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

