import request from './request';

export type AuthUser = {
  username: string;
  name: string;
};

export type PasswordLoginPayload = {
  username: string;
  password: string;
};

export type PasswordLoginResponse = {
  accessToken: string;
  user?: Partial<AuthUser>;
};

export type DingtalkExchangeResponse = {
  accessToken: string;
  user: {
    id: number;
    username: string;
    name: string;
  };
};

export type AuthApiError = {
  code?: string;
  message?: string;
};

const DINGTALK_AUTH_ERROR_MESSAGES: Record<string, string> = {
  DINGTALK_ACCOUNT_UNBOUND: '当前钉钉账号尚未绑定 ERP 用户，请联系管理员完成绑定。',
  DINGTALK_ACCOUNT_DISABLED: '当前账号已停用，请联系管理员处理。',
  DINGTALK_TICKET_INVALID: '钉钉登录失败，请重试或改用账号密码登录。',
  DINGTALK_TICKET_EXPIRED: '本次钉钉登录已过期，请重新扫码登录。',
  DINGTALK_TICKET_USED: '本次钉钉登录已失效，请重新扫码登录。',
  DINGTALK_STATE_INVALID: '钉钉登录失败，请重试或改用账号密码登录。',
  DINGTALK_OAUTH_FAILED: '钉钉登录失败，请重试或改用账号密码登录。',
  DINGTALK_CONFIG_MISSING: '钉钉登录配置缺失，请联系管理员处理。',
};

const DEFAULT_AUTH_ERROR_MESSAGE = '钉钉登录失败，请重试或改用账号密码登录。';

export function loginWithPassword(payload: PasswordLoginPayload) {
  return request.post<PasswordLoginResponse, PasswordLoginResponse>('/auth/login', payload, {
    suppressErrorToast: true,
  });
}

export function exchangeDingtalkTicket(ticket: string) {
  return request.post<DingtalkExchangeResponse, DingtalkExchangeResponse>(
    '/auth/dingtalk/exchange',
    { ticket },
    {
      suppressAuthRedirect: true,
      suppressErrorToast: true,
    },
  );
}

export function getDingtalkAuthErrorMessage(errorCode: string | null | undefined): string {
  if (!errorCode) {
    return DEFAULT_AUTH_ERROR_MESSAGE;
  }

  return DINGTALK_AUTH_ERROR_MESSAGES[errorCode] ?? DEFAULT_AUTH_ERROR_MESSAGE;
}

export function isDingtalkUnboundError(errorCode: string | null | undefined): boolean {
  return errorCode === 'DINGTALK_ACCOUNT_UNBOUND';
}
