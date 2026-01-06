/**
 * User Builder - Test Data Factory
 * Fluent API for creating test users with realistic defaults
 */

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  active: boolean;
  credits: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class UserBuilder {
  private data: Partial<User>;
  private static idCounter = 1;

  constructor() {
    this.data = {
      id: `user-${UserBuilder.idCounter++}`,
      username: `testuser${UserBuilder.idCounter}`,
      email: `test${UserBuilder.idCounter}@example.com`,
      role: 'user',
      active: true,
      credits: 1000,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Set user ID
   */
  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  /**
   * Set username
   */
  withUsername(username: string): this {
    this.data.username = username;
    return this;
  }

  /**
   * Set email address
   */
  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  /**
   * Set user role
   */
  withRole(role: User['role']): this {
    this.data.role = role;
    return this;
  }

  /**
   * Set user as admin
   */
  asAdmin(): this {
    this.data.role = 'admin';
    this.data.credits = 100000;
    return this;
  }

  /**
   * Set user as guest
   */
  asGuest(): this {
    this.data.role = 'guest';
    this.data.credits = 100;
    return this;
  }

  /**
   * Set user active status
   */
  withActiveStatus(active: boolean): this {
    this.data.active = active;
    return this;
  }

  /**
   * Set user credits
   */
  withCredits(credits: number): this {
    this.data.credits = credits;
    return this;
  }

  /**
   * Add metadata
   */
  withMetadata(key: string, value: any): this {
    this.data.metadata = { ...this.data.metadata, [key]: value };
    return this;
  }

  /**
   * Set creation date
   */
  withCreatedAt(date: Date): this {
    this.data.createdAt = date;
    return this;
  }

  /**
   * Create inactive user
   */
  asInactive(): this {
    this.data.active = false;
    return this;
  }

  /**
   * Create user with no credits
   */
  withNoCredits(): this {
    this.data.credits = 0;
    return this;
  }

  /**
   * Build the user object
   */
  build(): User {
    return this.data as User;
  }

  /**
   * Create multiple users
   */
  buildMany(count: number): User[] {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      users.push(new UserBuilder().build());
    }
    return users;
  }

  /**
   * Reset the ID counter
   */
  static resetCounter(): void {
    UserBuilder.idCounter = 1;
  }
}

/**
 * Factory function for creating a user builder
 */
export function aUser(): UserBuilder {
  return new UserBuilder();
}

/**
 * Quick builder functions
 */
export const userBuilders = {
  admin: () => aUser().asAdmin().build(),
  guest: () => aUser().asGuest().build(),
  inactive: () => aUser().asInactive().build(),
  noCredits: () => aUser().withNoCredits().build(),
  default: () => aUser().build(),
};
