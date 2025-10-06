import { User } from './User';

class Users {
    private users: Map<string, User>;
    constructor() {
        this.users = new Map<string, User>();
    }
    add(user: User): void {
        this.users.set(user.getId(), user);
    }

    get(userId: string): User | undefined {
        return this.users.get(userId);
    }

    remove(userId: string): boolean {
        return this.users.delete(userId);
    }

    getAll(): User[] {
        return Array.from(this.users.values());
    }

    size(): number {
        return this.users.size;
    }

    clear(): void {
        this.users.clear();
    }

    exists(userId: string): boolean {
        return this.users.has(userId);
    }
}

export { Users };