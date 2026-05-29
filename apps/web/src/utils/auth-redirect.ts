const LOGIN_PATH = '/login';
const REDIRECT_PARAM = 'redirect';
const STORED_REDIRECT_KEY = 'auth:post-login-redirect';
const FALLBACK_REDIRECT = '/';
const LOGIN_ROUTE_PREFIX = '/login';

function getSafeWindowLocation() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.location;
}

function isLoginRoute(value: string): boolean {
  return value === LOGIN_PATH || value.startsWith(`${LOGIN_ROUTE_PREFIX}/`) || value.startsWith(`${LOGIN_ROUTE_PREFIX}?`);
}

export function isSafeRedirectTarget(value: string | null | undefined): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const normalizedValue = value.trim();
  if (normalizedValue === '') {
    return false;
  }

  if (!normalizedValue.startsWith('/')) {
    return false;
  }

  if (normalizedValue.startsWith('//')) {
    return false;
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(normalizedValue)) {
    return false;
  }

  for (const character of normalizedValue) {
    const charCode = character.charCodeAt(0);
    if (charCode <= 0x1f || character === '\\' || /\s/.test(character)) {
      return false;
    }
  }

  return true;
}

function isAllowedPostLoginTarget(value: string | null | undefined): value is string {
  if (!isSafeRedirectTarget(value)) {
    return false;
  }

  return !isLoginRoute(value);
}

export function getCurrentRelativePath(): string {
  const location = getSafeWindowLocation();
  if (!location) {
    return FALLBACK_REDIRECT;
  }

  return `${location.pathname}${location.search}${location.hash}`;
}

export function buildLoginRedirectUrl(currentPath = getCurrentRelativePath()): string {
  if (
    !isSafeRedirectTarget(currentPath) ||
    isLoginRoute(currentPath)
  ) {
    return LOGIN_PATH;
  }

  const params = new URLSearchParams({ [REDIRECT_PARAM]: currentPath });
  return `${LOGIN_PATH}?${params.toString()}`;
}

export function storePostLoginRedirect(target: string | null | undefined): void {
  if (!isAllowedPostLoginTarget(target)) {
    return;
  }

  if (target === FALLBACK_REDIRECT) {
    clearStoredPostLoginRedirect();
    return;
  }

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(STORED_REDIRECT_KEY, target);
  }
}

export function readStoredPostLoginRedirect(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedTarget = window.sessionStorage.getItem(STORED_REDIRECT_KEY);
  return isAllowedPostLoginTarget(storedTarget) ? storedTarget : null;
}

export function clearStoredPostLoginRedirect(): void {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(STORED_REDIRECT_KEY);
  }
}

export function resolvePostLoginRedirect(
  searchParams: URLSearchParams,
  options?: { useStored?: boolean },
): string {
  const redirectTarget = searchParams.get(REDIRECT_PARAM);
  if (isAllowedPostLoginTarget(redirectTarget)) {
    return redirectTarget;
  }

  if (options?.useStored) {
    return readStoredPostLoginRedirect() ?? FALLBACK_REDIRECT;
  }

  return FALLBACK_REDIRECT;
}
