export type Role = 'client' | 'developer';

export interface FileAttachment {
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface Message {
  id: string;
  senderId: Role;
  clientId: string; // Neue Zuordnung zum spezifischen Kunden
  text: string;
  timestamp: Date;
  files?: FileAttachment[];
}

export interface ChatSession {
  clientId: string;
  messages: Message[];
  lastMessageAt: Date;
}