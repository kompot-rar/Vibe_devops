export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  tags: string[];
  readTime: string;
  imageUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum SkillLevel {
  Beginner = 'Początkujący',
  Intermediate = 'Średniozaawansowany',
  Advanced = 'Ekspert'
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  tools: string[];
  status: 'completed' | 'in-progress' | 'pending';
}