# Deferred Work

## Deferred from: code review of 1-3-用户认证 (2026-04-17)

- Migration にデフォルト admin パスワード `Admin@123` がハードコード — 仕様通りだが本番デプロイ時の変更強制メカニズムがない
- JwtStrategy.validate が DB を再クエリしない — トークン発行後にユーザーが削除/停用されても最大 8 時間有効なまま（ステートレス JWT の設計トレードオフ）
- ログインエンドポイントにレート制限なし — `@nestjs/throttler` 等のインフラ横断対応が必要
- JWT 失効メカニズムなし — jti + ブラックリストまたはリフレッシュトークン方式が必要（ステートレス JWT の設計トレードオフ）
- bigint ID の精度損失 — Story 1.1 の BaseEntity で `id: number` と定義されているが MySQL の bigint は 2^53 超で精度損失
- JWT_EXPIRES_IN の起動時バリデーションなし — 環境変数バリデーション（Joi/zod スキーマ）は横断関心事として別途対応
