import { AutomationTask } from './types';

// Mock prerecorded flow for Passport Renewal
export const PRERECORDED_PASSPORT_FLOW: AutomationTask = {
  name: "Passport Renewal Application",
  type: "prerecorded",
  url: "https://portal.gov.mock/passport-services",
  steps: [
    { id: '1', action: 'visit', target: 'body', description: 'Navigate to Passport Services Portal' },
    { id: '2', action: 'click', target: '#login-btn', description: 'Click "Login" button' },
    { id: '3', action: 'fill', target: '#username', description: 'Enter User ID', value: '{email}' },
    { id: '4', action: 'fill', target: '#password', description: 'Enter Password', value: '********' },
    { id: '5', action: 'click', target: '#submit-login', description: 'Submit Login Credentials' },
    { id: '6', action: 'click', target: 'a[href="/renew"]', description: 'Select "Renew Passport" Service' },
    { id: '7', action: 'fill', target: '#full-name', description: 'Fill Full Name', value: '{fullName}' },
    { id: '8', action: 'fill', target: '#current-passport', description: 'Enter Current Passport Number', value: '{idNumber}' },
    { id: '9', action: 'click', target: '#verify-btn', description: 'Verify Eligibility' },
    { id: '10', action: 'click', target: '#submit-application', description: 'Submit Renewal Application' }
  ]
};

// System instruction for the Gemini Agent
export const SYSTEM_INSTRUCTION = `
You are "GovAuto", an advanced AI agent designed to assist users with government services.
Your primary capabilities are:
1. Understanding user intent regarding government documents (e.g., passports, licenses, permits).
2. Gathering necessary information from the user in a conversational manner.
3. Initiating browser automation tasks.

BEHAVIOR:
- Be professional, concise, and helpful.
- Support multiple languages. Detect the user's language and reply in the same language.
- If a user asks for "Passport Renewal", assume it is a known prerecorded flow.
- If a user asks for anything else (e.g., "Mars Colony Permit", "Fishing License"), assume it requires AI-navigated automation.
- When you have enough information to proceed with a task, output a JSON block in your response with the collected details.

FORMATTING:
- Use Markdown for responses.
- When ready to start automation, include a special block:
\`\`\`json
{
  "intent": "start_automation",
  "taskName": "string",
  "data": { ...collected fields... }
}
\`\`\`
`;
