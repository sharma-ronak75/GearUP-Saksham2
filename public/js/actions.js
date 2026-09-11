async function handleLogin()
{
    const btn = document.querySelector('#login-submit');
    if (!btn) return;
    btn.disabled = true;
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const remember = document.getElementById('rememberme')?.checked;
    const error = document.querySelector('#login-error');
    if (!email || !password)
    {
        if (error) error.textContent = t('login.errorEmpty');
        btn.disabled = false;
        return;
    }
    try
    {
        const data = await requestService('login', { email, password });
        
        if(remember)
        {
            alert();
            localStorage.setItem('email', data.email);
            localStorage.setItem('session', data.session);
            localStorage.setItem('username', data.username);
        }

        state.role = data.role || 'employee';
        state.data = await requestService('get_app_data', { email: data.email, session: data.session });
        state.loggedIn = true;
        state.page = state.role === 'employee' ? 'dashboard' : state.role === 'trainer' ? 't-dashboard' : 'a-dashboard';
        state.aiMessages[0].text = 'Hi ' + data.username + ' - I can help you understand your skill gaps, learning path, and assessment progress. Try one of the questions below, or type your own.';
        save();
        render();
    }
    catch (e)
    {
        if (error)
        {
            error.textContent = e.message;
            error.style.color = '#A63D2F';
        }
        btn.disabled = false;
    }
}

async function handleDemoEmployee()
{
    const email = "testificate@test.com";
    const password = "12345678";
    const data = await requestService('login', { email, password });
    state.role = data.role || 'employee';
    state.data = await requestService('get_app_data', { email: data.email, session: data.session });
    state.loggedIn = true;
    state.page = state.role === 'employee' ? 'dashboard' : state.role === 'trainer' ? 't-dashboard' : 'a-dashboard';
    state.aiMessages[0].text = 'Hi ' + data.username + ' - I can help you understand your skill gaps, learning path, and assessment progress. Try one of the questions below, or type your own.';
    save();
    render();
}

async function handleDemoAdmin()
{
    const email = "admin@test.com";
    const password = "admin";
    const data = await requestService('login', { email, password });
    state.role = data.role || 'employee';
    state.data = await requestService('get_app_data', { email: data.email, session: data.session });
    state.loggedIn = true;
    state.page = state.role === 'employee' ? 'dashboard' : state.role === 'trainer' ? 't-dashboard' : 'a-dashboard';
    state.aiMessages[0].text = 'Hi ' + data.username + ' - I can help you understand your skill gaps, learning path, and assessment progress. Try one of the questions below, or type your own.';
    save();
    render();
}

async function handleQuizSubmit()
{
    const isExam = state.quizKind === 'exam';
    const bank = isExam ? state.data.examQuestionBank : state.data.questionBank;
    const questions = bank[state.quizAssessment] || [];
    const answers = questions.map((_, i) => state.quizAnswers[i] !== undefined ? state.quizAnswers[i] : -1);

    try
    {
        const result = await requestService('submit_assessment', {
            email: localStorage.getItem('email'),
            session: localStorage.getItem('session'),
            assessmentId: state.quizAssessment,
            kind: isExam ? 'exam' : 'assessment',
            answers
        });
        state.data.competencies = result.competencies;
        state.lastResult = result;
        const historyEntry = {
            assessment: result.assessment,
            score: result.score,
            correct: result.correct,
            wrong: result.wrong,
            skipped: result.skipped,
            prevLevel: result.prevLevel,
            newLevel: result.newLevel
        };
        if (isExam)
        {
            state.examsDone = [...new Set([...state.examsDone, state.quizAssessment])];
            state.examHistory.push(historyEntry);
        }
        else
        {
            state.assessmentsDone = [...new Set([...state.assessmentsDone, state.quizAssessment])];
            state.history.push(historyEntry);
        }
        state.lastProctorSummary = {
            violations: [...proctor.violations],
            terminatedReason: state.quizTerminatedReason || null
        };
        proctorEndExam();
        state.page = 'result';
        save();
        render();
    }
    catch (e)
    {
        proctorEndExam();
        alert(e.message);
    }
}

async function askAi(text)
{
    state.aiOpen = true;
    state.aiMessages.push({ from: 'user', text });
    render();
    try
    {
        const r = await requestService('ai_respond', {
            email: localStorage.getItem('email'),
            session: localStorage.getItem('session'),
            text
        });
        console.log(r);
        state.aiMessages.push({ from: 'ai', text: r.answer });
        render();
    }
    catch (e)
    {
        state.aiMessages.push({ from: 'ai', text: e.message });
        render();
    }
}


function toggleAiChat()
{
    state.aiOpen = !state.aiOpen;
    render();
}

function scrollAiToBottom(focusInput = false)
{
    requestAnimationFrame(() => {
        const messages = document.getElementById('ai-messages');
        if (messages) messages.scrollTop = messages.scrollHeight;

        const anchor = document.getElementById('ai-scroll-anchor');
        if (anchor) anchor.scrollIntoView({ block: 'nearest' });

        if (focusInput)
        {
            const input = document.getElementById('ai-input');
            if (input && document.activeElement !== input) input.focus({ preventScroll: true });
        }
    });
}

function sendAi()
{ 
    const input = document.querySelector('#ai-input'); 
    const text = input?.value.trim(); 
    if (text) askAi(text); 
}

async function generateAssessment()
{ 
    state.generating = true; 
    render(); 
    await new Promise(r => setTimeout(r, 800)); 
    const source = state.data.questionBank['a-sql']; 
    state.generatedQuestions = source.slice(0, Math.min(Number(state.generator.numQ) || 4, source.length)); 
    state.generating = false; 
    render(); 
}

