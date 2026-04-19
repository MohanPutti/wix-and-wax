export interface SessionIdentity {
  tokenPrefix: string;
}

const identities = new Map<string, SessionIdentity>();

export function setIdentity(sessionId: string, identity: SessionIdentity) {
  identities.set(sessionId, identity);
}

export function getIdentity(sessionId: string | undefined): SessionIdentity | undefined {
  return sessionId ? identities.get(sessionId) : undefined;
}

export function clearIdentity(sessionId: string | undefined) {
  if (sessionId) identities.delete(sessionId);
}
