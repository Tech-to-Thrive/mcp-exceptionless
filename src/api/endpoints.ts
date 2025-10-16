export const ENDPOINTS = {
  // Events
  EVENTS: '/events',
  EVENT_BY_ID: (id: string) => `/events/${id}`,
  EVENT_BY_REF: (refId: string) => `/events/by-ref/${refId}`,
  EVENT_COUNT: '/events/count',
  SESSIONS: '/events/sessions',
  SESSION_BY_ID: (sessionId: string) => `/events/sessions/${sessionId}`,

  // Stacks
  STACKS: '/stacks',
  STACK_BY_ID: (id: string) => `/stacks/${id}`,
  STACK_EVENTS: (stackId: string) => `/stacks/${stackId}/events`,
} as const;
