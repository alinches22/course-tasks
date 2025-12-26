export const ROUTES = {
  HOME: '/',
  APP: '/app',
  BATTLE: (id: string) => `/battle/${id}` as const,
  REPLAY: (id: string) => `/replay/${id}` as const,
} as const;

export const NAV_LINKS = [
  { href: ROUTES.HOME, label: 'Home' },
  { href: ROUTES.APP, label: 'Dashboard' },
] as const;
