export class CurrentJwtUser {
  constructor(userId = null, authenticated = false) {
    this.userId = userId;
    this.authenticated = Boolean(authenticated);
  }

  isAuthenticated() {
    return this.authenticated;
  }

  getUserId() {
    return this.userId;
  }
}

export function resolveCurrentJwtUser(request) {
  const candidate = request?.currentJwtUser ?? request?.user ?? null;
  if (candidate instanceof CurrentJwtUser) {
    return candidate;
  }
  if (
    candidate
    && typeof candidate.isAuthenticated === 'function'
    && typeof candidate.getUserId === 'function'
  ) {
    return candidate;
  }
  if (candidate && typeof candidate === 'object') {
    const userId = candidate.userId ?? candidate.id ?? candidate.sub ?? null;
    const authenticated = typeof candidate.authenticated === 'boolean'
      ? candidate.authenticated
      : typeof candidate.isAuthenticated === 'boolean'
        ? candidate.isAuthenticated
        : userId != null;
    return new CurrentJwtUser(userId, authenticated);
  }
  return new CurrentJwtUser(null, false);
}
