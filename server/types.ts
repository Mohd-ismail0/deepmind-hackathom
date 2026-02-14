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

export interface AutomationStep {
  id: string;
  action: 'visit' | 'fill' | 'click' | 'read' | 'verify' | 'upload' | 'prompt_user';
  target: string;
  value?: string;
  description: string;
  completed?: boolean;
  promptText?: string;
  responseKey?: string;
}

export interface AutomationTask {
  name: string;
  type: 'prerecorded' | 'ai-navigated';
  url: string;
  steps: AutomationStep[];
}

export interface Attachment {
  name: string;
  type: string;
  data: string;
}

export interface TemplateRecord {
  id: string;
  name: string;
  documentType: string;
  url: string;
  steps: string; // JSON string
  createdAt: string;
  updatedAt: string;
}
