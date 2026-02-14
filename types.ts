export enum Sender {
  User = 'user',
  Agent = 'agent',
  System = 'system'
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 string including metadata (e.g., "data:image/png;base64,...")
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isVoice?: boolean;
  attachments?: Attachment[];
  isReview?: boolean; // New flag for review cards
  reviewData?: UserDetails; // The data to review
}

export interface UserDetails {
  fullName?: string;
  dob?: string;
  address?: string;
  idNumber?: string;
  email?: string;
  phone?: string;
  expiryDate?: string;
  documentType?: string;
  [key: string]: string | undefined;
}

export enum AutomationStatus {
  Idle = 'idle',
  Planning = 'planning',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed'
}

export interface AutomationStep {
  id: string;
  action: 'visit' | 'fill' | 'click' | 'read' | 'verify' | 'upload';
  target: string; // DOM selector or description
  value?: string;
  description: string;
  completed?: boolean;
}

export interface AutomationTask {
  name: string;
  type: 'prerecorded' | 'ai-navigated';
  url: string;
  steps: AutomationStep[];
}

export interface AgentContext {
  language: string;
  currentTask?: AutomationTask;
  collectedData: UserDetails;
}