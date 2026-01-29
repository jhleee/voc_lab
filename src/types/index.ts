export interface Project {
  id: string;
  name: string;
  description?: string;
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
