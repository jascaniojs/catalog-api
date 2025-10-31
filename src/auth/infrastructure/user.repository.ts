import { Injectable, Inject } from '@nestjs/common';
import { DynamoDbService } from '@/shared/infrastructure/database/dynamodb.service';
import { User } from '../domain/user.entity';
import { UserRole } from '../domain/user-role.enum';

interface UserDynamoRecord {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  EntityType: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
  createdAt: string;
}

export const USERS_DB_SERVICE = 'USERS_DB_SERVICE';

@Injectable()
export class UserRepository {
  constructor(
    @Inject(USERS_DB_SERVICE)
    private readonly usersDb: DynamoDbService,
  ) {}

  async findById(userId: string): Promise<User | null> {
    const record = await this.usersDb.get<UserDynamoRecord>({
      PK: `USER#${userId}`,
      SK: 'PROFILE',
    });

    if (!record) {
      return null;
    }

    return this.fromDynamoRecord(record);
  }

  async findByEmail(email: string): Promise<User | null> {
    const records = await this.usersDb.scan<UserDynamoRecord>(
      'email = :email',
      { ':email': email },
    );

    if (records.length === 0) {
      return null;
    }

    return this.fromDynamoRecord(records[0]);
  }

  private fromDynamoRecord(record: UserDynamoRecord): User {
    return new User(
      record.userId,
      record.email,
      record.name,
      record.role,
      record.token,
      new Date(record.createdAt),
    );
  }
}
