import { getMetadataArgsStorage } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserStatus } from '@infitek/shared';

describe('User Entity - DingTalk fields', () => {
  it('should instantiate with all DingTalk fields null (default state)', () => {
    const user = new User();
    user.id = 1;
    user.username = 'testuser';
    user.name = 'Test User';
    user.password = 'hashed';
    user.status = UserStatus.ACTIVE;
    user.createdAt = new Date();
    user.updatedAt = new Date();
    user.createdBy = 'system';
    user.updatedBy = null;
    user.deletedAt = null;
    user.dingtalkUnionId = null;
    user.dingtalkUserId = null;
    user.dingtalkOpenId = null;
    user.dingtalkNick = null;
    user.dingtalkAvatar = null;
    user.dingtalkBoundAt = null;

    expect(user.dingtalkUnionId).toBeNull();
    expect(user.dingtalkUserId).toBeNull();
    expect(user.dingtalkOpenId).toBeNull();
    expect(user.dingtalkNick).toBeNull();
    expect(user.dingtalkAvatar).toBeNull();
    expect(user.dingtalkBoundAt).toBeNull();
  });

  it('should accept valid DingTalk field values', () => {
    const user = new User();
    const boundAt = new Date('2024-06-01T10:00:00Z');
    user.dingtalkUnionId = 'union_abc123';
    user.dingtalkUserId = 'user_xyz789';
    user.dingtalkOpenId = 'open_def456';
    user.dingtalkNick = 'Zhang San';
    user.dingtalkAvatar = 'https://example.com/avatar.png';
    user.dingtalkBoundAt = boundAt;

    expect(user.dingtalkUnionId).toBe('union_abc123');
    expect(user.dingtalkUserId).toBe('user_xyz789');
    expect(user.dingtalkOpenId).toBe('open_def456');
    expect(user.dingtalkNick).toBe('Zhang San');
    expect(user.dingtalkAvatar).toBe('https://example.com/avatar.png');
    expect(user.dingtalkBoundAt).toBe(boundAt);
  });

  describe('TypeORM column metadata', () => {
    it('should define all DingTalk columns as nullable', () => {
      const columns = getMetadataArgsStorage().columns.filter(
        (col) => col.target === User && col.propertyName.startsWith('dingtalk'),
      );

      const dingtalkFields = [
        'dingtalkUnionId',
        'dingtalkUserId',
        'dingtalkOpenId',
        'dingtalkNick',
        'dingtalkAvatar',
        'dingtalkBoundAt',
      ];

      expect(columns).toHaveLength(dingtalkFields.length);
      columns.forEach((col) => {
        expect(col.options.nullable).toBe(true);
      });
    });

    it('should have a unique index on dingtalk_union_id', () => {
      const indices = getMetadataArgsStorage().indices.filter(
        (idx) => idx.target === User,
      );
      const unionIdIndex = indices.find(
        (idx) =>
          idx.columns &&
          (idx.columns as string[]).includes('dingtalkUnionId'),
      );

      expect(unionIdIndex).toBeDefined();
      expect(unionIdIndex.unique).toBe(true);
    });

    it('should map dingtalk_union_id column name correctly', () => {
      const col = getMetadataArgsStorage().columns.find(
        (c) =>
          c.target === User && c.propertyName === 'dingtalkUnionId',
      );

      expect(col).toBeDefined();
      expect(col.options.name).toBe('dingtalk_union_id');
      expect(col.options.type).toBe('varchar');
      expect(col.options.length).toBe(128);
    });
  });
});
