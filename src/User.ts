class User {
    private id: string;
    private name : string;
    private username : string;
    private isOnline : boolean;
    private numberOfMessages: number;
    private totalMessages: string[];
    private avatarUrl: string;

    constructor(id : string, name : string, username: string) {
        this.id = id;
        this.name = name
        this.username = username
        this.isOnline = false
        this.numberOfMessages = 0;
        this.totalMessages = [];
        this.avatarUrl = `https://placehold.co/40x40/${id === '1' ? '4F46E5' : 'EF4444'}/${id === '1' ? 'ffffff' : 'ffffff'}?text=U${id}`;
    }

    public getId() :string {
        return this.id
    }
    public getName() :string {
        return this.name; 
    }
    public getUsername() :string {
        return this.username; 
    }
    public getIsonline() :boolean {
        return this.isOnline; 
    }

    public getNumberOfMessages(): number {
        return this.numberOfMessages;
    }

    public getTotalMessages(): string[] {
        return this.totalMessages;
    }

    public setOnlineStatus(status: boolean): void {
        this.isOnline = status;
    }

    public addMessage(message: string): void {
        this.totalMessages.push(message);
        this.numberOfMessages++;
    }
    getAvatarUrl(): string {
        return this.avatarUrl;
    }
}

export {User}