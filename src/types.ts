/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  searchGroundingEnabled: boolean;
}

export interface FileAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // base64 string
  text?: string;
}

export interface Citation {
  title: string;
  url: string;
  snippet?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  role: "user" | "model";
  text: string;
  createdAt: number;
  tokensUsed?: number;
  files?: FileAttachment[];
  citations?: Citation[];
  reactions?: Record<string, number>;
}

export interface Memory {
  id: string;
  userId: string;
  type: "short" | "long" | "profile" | "semantic";
  content: string;
  createdAt: number;
  importance: number; // 1 to 5
}

export interface ChatSettings {
  model: string;
  systemInstruction: string;
  searchGroundingEnabled: boolean;
  temperature: number;
}
