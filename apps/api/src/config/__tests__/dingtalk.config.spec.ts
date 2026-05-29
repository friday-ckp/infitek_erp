describe('dingtalk.config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should register under the dingtalk namespace', () => {
    const dingtalkConfig = require('../dingtalk.config').default;
    expect(dingtalkConfig.KEY).toBe('CONFIGURATION(dingtalk)');
  });

  it('should return env var values when set', () => {
    process.env.DINGTALK_CLIENT_ID = 'test_client_id';
    process.env.DINGTALK_CLIENT_SECRET = 'test_client_secret';
    process.env.DINGTALK_REDIRECT_URI = 'http://localhost:3000/callback';
    process.env.DINGTALK_FRONTEND_CALLBACK_URI = 'http://localhost:5173/login';

    const dingtalkConfig = require('../dingtalk.config').default;
    const config = dingtalkConfig();

    expect(config.clientId).toBe('test_client_id');
    expect(config.clientSecret).toBe('test_client_secret');
    expect(config.redirectUri).toBe('http://localhost:3000/callback');
    expect(config.frontendCallbackUri).toBe('http://localhost:5173/login');
  });

  it('should return empty strings when env vars are missing', () => {
    delete process.env.DINGTALK_CLIENT_ID;
    delete process.env.DINGTALK_CLIENT_SECRET;
    delete process.env.DINGTALK_REDIRECT_URI;
    delete process.env.DINGTALK_FRONTEND_CALLBACK_URI;

    const dingtalkConfig = require('../dingtalk.config').default;
    const config = dingtalkConfig();

    expect(config.clientId).toBe('');
    expect(config.clientSecret).toBe('');
    expect(config.redirectUri).toBe('');
    expect(config.frontendCallbackUri).toBe('');
  });
});
