/* ===== Proctoring module =====
   Adds a camera/mic pre-check screen before an assessment, then a live
   monitored quiz environment (visible camera preview, fullscreen lock,
   tab-switch / window-blur detection). Nothing is uploaded or recorded to
   a server - the camera stream stays local in the browser and is only used
   to show the candidate their own live preview and to flag when they leave
   the tab or exit fullscreen. All of this is stored in-session only.
*/

const proctor = {
    stream: null,
    active: false,
    violations: [],
    maxWarnings: 3,
    warningCount: 0,
    cameraOk: false,
    micOk: false,
    checking: false,
    deviceError: null,
    terminated: false,
    toast: null,
    toastTimer: null
};

function proctorReset()
{
    proctor.violations = [];
    proctor.warningCount = 0;
    proctor.terminated = false;
    proctor.toast = null;
}

async function proctorRequestDevices()
{
    proctor.checking = true;
    proctor.deviceError = null;
    render();
    try
    {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        proctor.stream = stream;
        proctor.cameraOk = stream.getVideoTracks().length > 0;
        proctor.micOk = stream.getAudioTracks().length > 0;

        stream.getVideoTracks().forEach(track => track.addEventListener('ended', proctorHandleDeviceLost));
        stream.getAudioTracks().forEach(track => track.addEventListener('ended', proctorHandleDeviceLost));
    }
    catch (e)
    {
        proctor.cameraOk = false;
        proctor.micOk = false;
        proctor.deviceError = e && e.name === 'NotAllowedError'
            ? 'Camera/microphone permission was denied. Please allow access to continue.'
            : 'Could not access your camera or microphone. Check that no other app is using them.';
    }
    finally
    {
        proctor.checking = false;
        render();
        proctorAttachPreview();
    }
}

function proctorHandleDeviceLost()
{
    proctor.cameraOk = false;
    proctor.micOk = false;
    if (proctor.active) proctorRecordViolation('Camera or microphone was disconnected.');
    render();
}

function proctorAttachPreview()
{
    requestAnimationFrame(() =>
    {
        const els = document.querySelectorAll('.js-proctor-video');
        els.forEach(el =>
        {
            if (proctor.stream && el.srcObject !== proctor.stream) el.srcObject = proctor.stream;
        });
    });
}

function proctorStopDevices()
{
    if (proctor.stream)
    {
        proctor.stream.getTracks().forEach(track => track.stop());
        proctor.stream = null;
    }
    proctor.cameraOk = false;
    proctor.micOk = false;
}

async function proctorEnterFullscreen()
{
    try
    {
        const el = document.documentElement;
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    }
    catch (e)
    {
        // Fullscreen can be denied/unsupported (e.g. some mobile browsers) -
        // proctoring still works via tab-visibility detection alone.
    }
}

function proctorExitFullscreen()
{
    try
    {
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
    catch (e) { /* ignore */ }
}

function proctorIsFullscreen()
{
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function proctorShowToast(text)
{
    proctor.toast = text;
    render();
    clearTimeout(proctor.toastTimer);
    proctor.toastTimer = setTimeout(() =>
    {
        proctor.toast = null;
        render();
    }, 3500);
}

function proctorRecordViolation(reason)
{
    if (!proctor.active || proctor.terminated) return;
    proctor.violations.push({ reason, at: new Date().toLocaleTimeString() });
    proctor.warningCount += 1;
    proctorShowToast(`⚠ ${reason} (${proctor.warningCount}/${proctor.maxWarnings} warnings)`);

    if (proctor.warningCount >= proctor.maxWarnings)
    {
        proctorTerminate('Too many proctoring violations.');
    }
}

function proctorTerminate(reason)
{
    proctor.terminated = true;
    proctor.active = false;
    proctorShowToast(`Assessment ended: ${reason}`);
    autoSubmitOnTermination(reason);
}

function autoSubmitOnTermination(reason)
{
    // Submit whatever answers exist so far, flagged as proctoring-terminated.
    state.quizTerminatedReason = reason;
    handleQuizSubmit();
}

function proctorOnVisibilityChange()
{
    if (!proctor.active) return;
    if (document.hidden) proctorRecordViolation('You switched away from the assessment tab.');
}

function proctorOnBlur()
{
    if (!proctor.active) return;
    if (document.hidden) return; // avoid double-count with visibilitychange
    proctorRecordViolation('The assessment window lost focus.');
}

function proctorOnFullscreenChange()
{
    if (!proctor.active) return;
    if (!proctorIsFullscreen()) proctorRecordViolation('You exited fullscreen mode.');
}

function proctorOnCopyPaste(e)
{
    if (!proctor.active) return;
    proctorRecordViolation(`${e.type === 'copy' ? 'Copying' : e.type === 'paste' ? 'Pasting' : 'Right-click menu'} is not allowed during the assessment.`);
    e.preventDefault();
}

let proctorListenersAttached = false;

function proctorAttachListeners()
{
    if (proctorListenersAttached) return;
    proctorListenersAttached = true;
    document.addEventListener('visibilitychange', proctorOnVisibilityChange);
    window.addEventListener('blur', proctorOnBlur);
    document.addEventListener('fullscreenchange', proctorOnFullscreenChange);
    document.addEventListener('webkitfullscreenchange', proctorOnFullscreenChange);
    document.addEventListener('copy', proctorOnCopyPaste);
    document.addEventListener('paste', proctorOnCopyPaste);
    document.addEventListener('contextmenu', proctorOnCopyPaste);
}

function proctorDetachListeners()
{
    proctorListenersAttached = false;
    document.removeEventListener('visibilitychange', proctorOnVisibilityChange);
    window.removeEventListener('blur', proctorOnBlur);
    document.removeEventListener('fullscreenchange', proctorOnFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', proctorOnFullscreenChange);
    document.removeEventListener('copy', proctorOnCopyPaste);
    document.removeEventListener('paste', proctorOnCopyPaste);
    document.removeEventListener('contextmenu', proctorOnCopyPaste);
}

async function proctorStartExam()
{
    proctorReset();
    await proctorEnterFullscreen();
    proctor.active = true;
    proctorAttachListeners();
    state.page = 'quiz';
    save();
    render();
}

function proctorEndExam()
{
    proctor.active = false;
    proctorDetachListeners();
    proctorExitFullscreen();
    proctorStopDevices();
}

function proctorBeginCheck(assessmentId)
{
    state.quizAssessment = assessmentId;
    state.quizIndex = 0;
    state.quizAnswers = [];
    state.quizTerminatedReason = null;
    state.page = 'proctor-check';
    proctorReset();
    save();
    render();
    proctorRequestDevices();
}

function proctorCancelCheck()
{
    proctorStopDevices();
    state.page = 'assess';
    state.trainingSubTab = 'assess';
    save();
    render();
}

function proctorExitQuiz()
{
    proctorEndExam();
    state.page = 'assess';
    state.trainingSubTab = 'assess';
    save();
    render();
}

/* ---- UI pieces ---- */

function proctorCheckPage()
{
    const a = state.data.assessments.find(x => x.id === state.quizAssessment);
    if (!a) return empty(t('pages.assessmentNotFound'));

    const camItem = proctor.checking
        ? { cls: 'pending', label: 'Requesting camera access…' }
        : proctor.cameraOk
            ? { cls: 'ok', label: 'Camera detected' }
            : { cls: 'fail', label: 'Camera not available' };

    const micItem = proctor.checking
        ? { cls: 'pending', label: 'Requesting microphone access…' }
        : proctor.micOk
            ? { cls: 'ok', label: 'Microphone detected' }
            : { cls: 'fail', label: 'Microphone not available' };

    const canStart = proctor.cameraOk && proctor.micOk && !proctor.checking;

    return pageHeader('Proctored assessment check', a.title) + `
        <div class="proctor-check-wrap card">
            <div class="proctor-preview-box">
                ${proctor.stream ? `<video class="js-proctor-video" autoplay playsinline muted></video>` :
                    `<div class="proctor-placeholder">${esc(proctor.deviceError || 'Camera preview will appear here once access is granted.')}</div>`}
            </div>
            <div class="proctor-check-list">
                <div class="proctor-check-item ${camItem.cls}"><span class="dot"></span>${esc(camItem.label)}</div>
                <div class="proctor-check-item ${micItem.cls}"><span class="dot"></span>${esc(micItem.label)}</div>
            </div>
            ${proctor.deviceError ? `<div class="error-text" style="max-width:480px;margin:0 auto 12px">${esc(proctor.deviceError)}</div>` : ''}
            <div class="proctor-rules">
                <strong>Before you begin:</strong>
                <ul>
                    <li>This assessment is proctored. Your camera and microphone stay on and visible to you for the full duration.</li>
                    <li>The assessment will run in fullscreen. Leaving fullscreen, switching tabs, or losing window focus will be flagged.</li>
                    <li>Copy, paste, and right-click are disabled during the assessment.</li>
                    <li>After ${proctor.maxWarnings} warnings, the assessment will auto-submit with your current answers.</li>
                    <li>Nothing is recorded or uploaded   the camera preview is local to your browser.</li>
                </ul>
            </div>
            <div class="flex gap-10" style="justify-content:center;flex-wrap:wrap">
                <button class="btn-secondary" onclick="proctorCancelCheck()">${esc(t('common.exit') || 'Cancel')}</button>
                ${canStart
                    ? `<button class="btn-teal" onclick="proctorStartExam()">Enter fullscreen &amp; start</button>`
                    : `<button class="btn-teal" onclick="proctorRequestDevices()" ${proctor.checking ? 'disabled' : ''}>${proctor.checking ? 'Checking…' : 'Grant camera & microphone access'}</button>`}
            </div>
        </div>`;
}

function proctorBar()
{
    if (!proctor.active) return '';
    const fsWarn = !proctorIsFullscreen();
    return `
        <div class="proctor-bar">
            <span class="rec-dot"></span>
            <div class="proctor-bar-cam">
                ${proctor.stream ? `<video class="js-proctor-video" autoplay playsinline muted></video>` : ''}
            </div>
            <div class="proctor-bar-status">
                Proctored session active · ${proctor.warningCount}/${proctor.maxWarnings} warnings
            </div>
            ${fsWarn ? `<span class="proctor-bar-warn">Not in fullscreen</span>` : ''}
        </div>
        ${proctor.toast ? `<div class="proctor-toast">${esc(proctor.toast)}</div>` : ''}`;
}

function proctorSummaryCard()
{
    const summary = state.lastProctorSummary;
    if (!summary) return '';

    if (!summary.violations.length && !summary.terminatedReason)
    {
        return `<div class="card mb-20">
            <div class="section-title"><h3 class="hr-title">Proctoring summary</h3></div>
            <div class="proctor-check-item ok" style="max-width:320px"><span class="dot"></span>No violations detected</div>
        </div>`;
    }
    return `<div class="card mb-20">
        <div class="section-title"><h3 class="hr-title">Proctoring summary</h3></div>
        ${summary.terminatedReason ? `<div class="proctor-check-item fail" style="max-width:480px;margin-bottom:10px"><span class="dot"></span>Auto-submitted: ${esc(summary.terminatedReason)}</div>` : ''}
        <div class="proctor-summary-list">
            ${summary.violations.map(v => `
                <div class="proctor-summary-row">
                    <span>${esc(v.reason)}</span>
                    <span style="color:var(--ink-soft)">${esc(v.at)}</span>
                </div>`).join('')}
        </div>
    </div>`;
}
