// Enums
export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

// Types
export * from './types/api-response.types';
export * from './types/pagination.types';
