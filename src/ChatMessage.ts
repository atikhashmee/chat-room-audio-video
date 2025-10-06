import type { Message } from "./Message";
import type { User } from "./User";

export class ChatMessage implements Message {
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

    constructor(id: string, content: string, sender: User, type: Message['type'], metadata?: Message['metadata']) {
        this.id = id;
        this.content = content;
        this.sender = sender;
        this.timestamp = new Date();
        this.isRead = false;
        this.type = type;
        if (metadata) {
            this.metadata = metadata;
        }
    }

    getFormattedTimestamp(): string {
        return this.timestamp.toLocaleTimeString();
    }

    public static create(id: string, content: string, sender: User, type: Message['type'], metadata?: Message['metadata']) 
    {
        return new ChatMessage(id, content, sender, type, metadata);
    }
}