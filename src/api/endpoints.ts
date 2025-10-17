export const ENDPOINTS = {
  // Events - Organization level
  EVENTS: '/events',
  EVENT_BY_ID: (id: string) => `/events/${id}`,
  EVENT_BY_REF: (refId: string) => `/events/by-ref/${refId}`,
  EVENT_COUNT: '/events/count',
  SESSIONS: '/events/sessions',
  SESSION_BY_ID: (sessionId: string) => `/events/sessions/${sessionId}`,

  // Events - Project level
  PROJECT_EVENTS: (projectId: string) => `/projects/${projectId}/events`,
  PROJECT_EVENT_BY_REF: (projectId: string, refId: string) =>
    `/projects/${projectId}/events/by-ref/${refId}`,
  PROJECT_EVENT_COUNT: (projectId: string) => `/projects/${projectId}/events/count`,
  PROJECT_SESSIONS: (projectId: string) => `/projects/${projectId}/events/sessions`,
  PROJECT_SESSION_BY_ID: (projectId: string, sessionId: string) =>
    `/projects/${projectId}/events/sessions/${sessionId}`,

  // Stacks - Organization level
  STACKS: '/stacks',
  STACK_BY_ID: (id: string) => `/stacks/${id}`,
  STACK_EVENTS: (stackId: string) => `/stacks/${stackId}/events`,

  // Stacks - Project level
  PROJECT_STACKS: (projectId: string) => `/projects/${projectId}/stacks`,

  // Projects
  PROJECTS: '/projects',
  PROJECT_BY_ID: (id: string) => `/projects/${id}`,

  // Organizations
  ORGANIZATIONS: '/organizations',
  ORGANIZATION_BY_ID: (id: string) => `/organizations/${id}`,
} as const;
