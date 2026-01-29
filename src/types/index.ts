export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Flow {
  id: string;
  name: string;
  projectId: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  fileType: 'pdf' | 'doc' | 'txt' | 'md';
  fileSize: number;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface FlowNode {
  id: string;
  type: 'start' | 'message' | 'condition' | 'action';
  position: { x: number; y: number };
  data: {
    label: string;
    content?: string;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface PromptCategory {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  projectId: string;
  prompts?: Prompt[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Prompt {
  id: string;
  name: string;
  isActive: boolean;
  categoryId: string;
  category?: PromptCategory;
  versions?: PromptVersion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptVersion {
  id: string;
  version: number;
  content: string;
  promptId: string;
  createdAt: Date;
}
