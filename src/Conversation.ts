import type { Message } from "./Message";
import type { User } from "./User";

export class Conversation {
    private readonly id: string;
    private name: string;
    private participants: Set<User>;
    private messages: Message[];

    constructor(name: string) {
        this.id = Math.random().toString(36).substring(2, 15);
        this.name = name;
        this.participants = new Set<User>();
        this.messages = [];
    }

    public getId(): string {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public setName(name: string): void {
        this.name = name;
    }

    public addParticipant(user: User): void {
        this.participants.add(user);
    }

    public removeParticipant(user: User): void {
        this.participants.delete(user);
    }

    public getParticipantsCount(): number {
        return this.participants.size;
    }

    public getParticipants(): User[] {
        return Array.from(this.participants);
    }

    public addMessage(message: Message): void {
        this.messages.push(message);
    }

    public getMessages(): Message[] {
        return [...this.messages];
    }
}