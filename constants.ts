import { AutomationTask } from './types';

// Mock prerecorded flow for Passport Renewal (Admin Set)
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

CAPABILITIES:
1. **Understand Intent**: Identify which government document or service the user needs.
2. **Document-First Collection**: 
   - **DO NOT** ask users to type their details (Name, ID, DOB, etc.) manually. Users often make mistakes.
   - **INSTEAD**, ask the user to **upload** the relevant official documents (e.g., "Please upload a photo of your Old Passport", "Please upload your ID card").
   - Once a document is uploaded, the system will extract the data for verification.
3. **Execution**:
   - Only proceed to automation once the user has confirmed the extracted data from the documents.
   - If "Passport Renewal" -> Admin Flow.
   - If other -> Search & Live AI Flow.

MULTILINGUAL BEHAVIOR:
- **Detect & Adapt**: Automatically detect the language of the user's latest message and respond in that EXACT same language.
- **Context Preservation**: Maintain full context of the user's data, intent, and progress even if they switch languages mid-conversation.
- **Fluency**: Ensure technical terms (like "Passport", "Application") are translated appropriately or kept in English if that is the norm for the specific government portal, but explain in the user's language.

BEHAVIOR:
- Be professional, concise, and helpful.
- If the user sends a file, acknowledge it and wait for the system to process the extraction.

FORMATTING:
- Use Markdown.
- When you have the *Confirmed* data and are ready to start:
\`\`\`json
{
  "intent": "start_automation",
  "taskName": "string",
  "data": { ...collected fields... }
}
\`\`\`
`;