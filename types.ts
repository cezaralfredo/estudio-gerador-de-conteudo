import { Type, Schema } from "@google/genai";

export enum AppStage {
  AUTH = 'AUTH', // New stage for Login/Signup
  ADMIN = 'ADMIN', // New stage for User Management
  CALENDAR = 'CALENDAR',
  CONFIGURATION = 'CONFIGURATION',
  SUBTOPIC_SELECTION = 'SUBTOPIC_SELECTION',
  SPECIFICITY_AGENT = 'SPECIFICITY_AGENT',
  BRIEFING = 'BRIEFING',
  GENERATION = 'GENERATION',
}

export type ContentStatus = 'idea' | 'planned' | 'writing' | 'review' | 'published';
export type ComplexityLevel = 'basic' | 'intermediate' | 'advanced';
export type AuthMode = 'login' | 'signup';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, this would be hashed. For MVP local, we store strictly for comparison.
  role: 'admin' | 'user';
  createdAt: string;
}

export interface SubTopic {
  title: string;
  description: string;
}

export interface ContentStrategy {
  id?: string;      // Calendar ID link
  date?: string;    // Scheduled date
  status?: ContentStatus; // Workflow status
  audience: string;
  tone: string;
  format: string;
  goal: string;
  topic: string;
  detailedAgenda?: string; // New field for AI generated details
  subject: string;
  expertise: string;
  useSearch: boolean;
  selectedSubTopic?: string; // The specific angle chosen by user
  complexityLevel?: ComplexityLevel; // New field
  generatedApproach?: string; // The output of the specificity agent
  keywords?: string; // SEO Keywords
  brandVoice?: string; // Specific persona or voice instructions
}

export interface CalendarEntry {
  id: string;
  date: string;
  subject: string;
  topic: string;
  detailedAgenda?: string;
  expertise?: string;
  audience?: string;
  status: ContentStatus;
  keywords?: string;
  brandVoice?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const StrategySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isReadyToGenerate: {
      type: Type.BOOLEAN,
      description: "Set to true only when you have enough information to write a robust, detailed piece."
    },
    questionToUser: {
      type: Type.STRING,
      description: "The next interview question to ask the user. Keep it to one question."
    },
    summarySoFar: {
      type: Type.STRING,
      description: "A brief summary of what has been gathered."
    }
  },
  required: ["isReadyToGenerate", "questionToUser"]
};