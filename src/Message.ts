import type { User } from "./User";

export interface Message {
    id: string;
    content: string;
    sender: User;
    timestamp: Date;
    isRead: boolean;
    type: 'text' | 'image' | 'file';
    metadata?: {
        fileName?: string;
        fileSize?: number;
        mimeType?: string;
    };
    getFormattedTimestamp():string
}