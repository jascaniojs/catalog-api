import { UserRole } from './user-role.enum';

export class User {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: UserRole,
    public readonly token: string,
    public readonly createdAt: Date = new Date(),
  ) {}

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isRegular(): boolean {
    return this.role === UserRole.REGULAR;
  }
}
