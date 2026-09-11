import { WebSocketServer } from 'ws';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OpenAI } from 'openai'
import { OpenRouter } from '@openrouter/sdk';


function trimWord(str, word) {
  const regex = new RegExp(`^(${word})+|(${word})+$`, 'g');
  return str.replace(regex, '');
}

const client = new OpenRouter({
  apiKey: readFileSync('OPENROUTER','utf8')
});

async function sendLLMRequest(prompt, onres) {
  const completion = await client.chat.send({
        chatRequest: {
        model: "inclusionai/ling-3.0-flash-vl:free",
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
        stream: true
    },
  });
  let res = "";
   
  for await (const chunk of completion) {
        // const reasoning = chunk.choices[0]?.delta?.reasoning_content;
        // if (reasoning) process.stdout.write(reasoning);
        process.stdout.write(chunk.choices[0]?.delta?.content || '')
        res += chunk.choices[0]?.delta?.content || '';
    
  }
res = trimWord(res, "true");
 
  onres(res);
}

// main(
//   "2 + 2 (answer in 1 sentence)",
//   function(response, error) {
//     if (error) {
//       console.error(error);
//       return;
//     }

//     console.log(response);
//   }
// );

// exports.sendLLMRequest = main;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATABASE_DIR = path.join(__dirname, 'database');
const USERS_FILE = path.join(DATABASE_DIR, 'users.json');
const CATALOG_FILE = path.join(DATABASE_DIR, 'catalog.json');
const ASSESSMENTS_FILE = path.join(DATABASE_DIR, 'assessments.json');
const TRAINING_FILE = path.join(DATABASE_DIR, 'training.json');
const AI_FILE = path.join(DATABASE_DIR, 'ai.json');
const PORT = 4040;

mkdirSync(DATABASE_DIR, { recursive: true });

const readJson = file =>
{
    try
    {
        return JSON.parse(readFileSync(file, 'utf8'));
    }
    catch
    {
        return {};
    }
};

let db = readJson(USERS_FILE);
const catalog = readJson(CATALOG_FILE);
const assessmentsData = readJson(ASSESSMENTS_FILE);
const trainingData = readJson(TRAINING_FILE);
const aiData = readJson(AI_FILE);

function saveDb()
{
    writeFileSync(USERS_FILE, JSON.stringify(db, null, 4));
}

function randomString(length)
{
    const chars = 'qwertyuiopasdfghjklzxcvbnm1234567890';
    let result = '';
    for (let i = 0; i < length; i += 1)
    {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

function send(socket, data)
{
    socket.send(JSON.stringify(data));
}

function fail(socket, requestId, reason)
{
    send(socket, { type: 'response', requestId, success: false, reason });
}

function getUser(email)
{
    return email ? db[email] : null;
}

function authenticatedUser(email, session)
{
    const user = getUser(email);
    return user && (!session || user.session === session) ? user : null;
}

function getAppData(email, session)
{
    const user = authenticatedUser(email, session) || db['testificate@test.com'];
    if (!user) throw new Error('User account not found.');

    return {
        employee: {
            id: user.id,
            name: user.username,
            designation: user.designation,
            department: user.department,
            organization: user.organization,
            group: user.group,
            location: user.location,
            yearsOfService: user.yearsOfService,
            role: user.role,
            reportsTo: user.reportsTo
        },
        activities: catalog.activities,
        competencyCategories: catalog.competencyCategories,
        competencies: user.competencies || [],
        impactText: catalog.impactText,
        courses: catalog.courses,
        learningPathSql: catalog.learningPathSql,
        assessments: assessmentsData.assessments,
        questionBank: assessmentsData.questionBank,
        trainingPrograms: trainingData.trainingPrograms,
        departments: catalog.departments,
        workforce: catalog.workforce,
        orgGaps: catalog.orgGaps,
        trainingEffectiveness: catalog.trainingEffectiveness,
        aiQa: aiData.aiQa,
        levelNames: catalog.levelNames,
        priorityStyles: catalog.priorityStyles,
        requiredByRole: catalog.requiredByRole,
        assessmentsDone: user.assessmentsDone || [],
        assessmentHistory: user.assessmentHistory || []
    };
}


function handleLogin(socket, requestId, message)
{
    const email = String(message.email || '').trim();
    const password = String(message.password || '');
    const oldSession = String(message.session || '');
    const user = getUser(email);

    if (!user)
    {
        fail(socket, requestId, 'That email is not associated with any account, considering creating one instead.');
        return;
    }

    if(oldSession && user.session != oldSession)
    {
        fail(socket, requestId, "Invalid session!");
        return;
    }
    else if (!oldSession && user.password !== password)
    {
        fail(socket, requestId, 'Incorrect password!');
        return;
    }

    const session = randomString(64);
    user.session = session;
    saveDb();

    send(socket, {
        type: 'response',
        requestId,
        success: true,
        data: {
            session,
            username: user.username,
            email,
            role: user.appRole || 'employee'
        }
    });
}

function handleAppData(socket, requestId, message)
{
    try
    {
        send(socket, {
            type: 'response',
            requestId,
            success: true,
            data: getAppData(message.email, message.session)
        });
    }
    catch (error)
    {
        fail(socket, requestId, error.message);
    }
}

function handleAssessmentSubmit(socket, requestId, message)
{
    const user = authenticatedUser(message.email, message.session);
    if (!user)
    {
        fail(socket, requestId, 'Your session is no longer valid. Please sign in again.');
        return;
    }

    const assessment = assessmentsData.assessments.find(item => item.id === message.assessmentId);
    if (!assessment)
    {
        fail(socket, requestId, 'Assessment not found.');
        return;
    }

    const answers = Array.isArray(message.answers) ? message.answers : [];
    const questions = assessmentsData.questionBank[assessment.id] || [];

    if (answers.length !== questions.length)
    {
        fail(socket, requestId, 'Please answer every question.');
        return;
    }

    let correct = 0;
    questions.forEach((question, index) =>
    {
        if (Number(answers[index]) === question.answer) correct += 1;
    });

    const score = Math.round((correct / questions.length) * 100);
    user.competencies = Array.isArray(user.competencies) ? user.competencies : [];
    const competency = user.competencies.find(item => item.name === assessment.competency);
    const prevLevel = competency ? competency.current : 2;

    if (competency && score >= 70 && competency.current < 5)
    {
        competency.current += 1;
    }

    if (competency)
    {
        competency.lastAssessed = 'Just now';
    }

    user.assessmentsDone = Array.isArray(user.assessmentsDone) ? user.assessmentsDone : [];
    user.assessmentHistory = Array.isArray(user.assessmentHistory) ? user.assessmentHistory : [];
    if (!user.assessmentsDone.includes(assessment.id)) user.assessmentsDone.push(assessment.id);

    const result = {
        assessment,
        score,
        correct,
        total: questions.length,
        prevLevel,
        newLevel: competency?.current ?? prevLevel,
        competencies: user.competencies
    };

    user.assessmentHistory.push({
        assessment,
        score,
        prevLevel,
        newLevel: result.newLevel
    });

    saveDb();
    send(socket, { type: 'response', requestId, success: true, data: result });
}

function handleAi(socket, requestId, message)
{
    const user = authenticatedUser(message.email, message.session);
    if (!user)
    {
        fail(socket, requestId, 'Your session is no longer valid. Please sign in again.');
        return;
    }

    const prompt = `
The following text is sent by a user on our website Saksham which is integrated with iGot Karamyogi, you're a chatbot.
Keep your answers short (no more than max 2 sentences) and on point.
here is the user data in JSON: ${JSON.stringify(user)}

user's text/query/prompt:
${message.text}
`;
// console.log(prompt)

    sendLLMRequest(prompt, (res,e)=>{
        res=res.replaceAll('**','');
        if(e) console.error(e);
        console.log("AI: " + res);
        send(socket, { type: 'response', requestId, success: true, data: { answer: String(res) } });
    });

}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', socket =>
{
    socket.on('message', rawMessage =>
    {
        let message;
        try
        {
            message = JSON.parse(Buffer.from(rawMessage).toString('utf8'));
        }
        catch
        {
            fail(socket, null, 'Error parsing JSON');
            return;
        }

        const requestId = message.requestId || null;

        switch (message.type)
        {
            case 'login':
                handleLogin(socket, requestId, message);
                break;
            case 'get_app_data':
                handleAppData(socket, requestId, message);
                break;
            case 'submit_assessment':
                handleAssessmentSubmit(socket, requestId, message);
                break;
            case 'ai_respond':
                handleAi(socket, requestId, message);
                break;
            default:
                fail(socket, requestId, 'Unknown request type.');
        }
    });
});

console.log(`Saksham data service running at ws://localhost:${PORT}`);
