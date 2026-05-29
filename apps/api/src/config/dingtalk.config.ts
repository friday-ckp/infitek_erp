import { registerAs } from '@nestjs/config';
import { Logger } from '@nestjs/common';

export interface DingtalkConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  frontendCallbackUri: string;
}

export default registerAs('dingtalk', (): DingtalkConfig => {
  const logger = new Logger('DingtalkConfig');
  const clientId = process.env.DINGTALK_CLIENT_ID || '';
  const clientSecret = process.env.DINGTALK_CLIENT_SECRET || '';

  if (process.env.NODE_ENV === 'production' && (!clientId || !clientSecret)) {
    logger.error(
      'DINGTALK_CLIENT_ID and DINGTALK_CLIENT_SECRET must be set in production',
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri: process.env.DINGTALK_REDIRECT_URI || '',
    frontendCallbackUri: process.env.DINGTALK_FRONTEND_CALLBACK_URI || '',
  };
});
