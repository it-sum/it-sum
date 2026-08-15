'use client';

export type DemoRole = 'student' | 'admin';

export interface DemoSession {
  role: DemoRole;
  email: string;
  name: string;
}

export const DEMO_ACCOUNTS: Record<DemoRole, { email: string; password: string; name: string }> = {
  student: { email: 'student@demo.itsum.test', password: 'IT-SUM-Demo-2026!', name: 'Demo Student' },
  admin: { email: 'admin@demo.itsum.test', password: 'IT-SUM-Demo-2026!', name: 'Demo Administrator' },
};

const SESSION_COOKIE = 'it_sum_session';
const SESSION_STORAGE_KEY = 'it_sum_demo_session';

export function authenticateDemo(email: string, password: string): DemoSession | null {
  const role = (Object.keys(DEMO_ACCOUNTS) as DemoRole[]).find((candidate) => DEMO_ACCOUNTS[candidate].email === email && DEMO_ACCOUNTS[candidate].password === password);
  return role ? { role, email: DEMO_ACCOUNTS[role].email, name: DEMO_ACCOUNTS[role].name } : null;
}

export function setDemoSession(session: DemoSession) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  document.cookie = `${SESSION_COOKIE}=demo-${session.role}; Path=/; Max-Age=86400; SameSite=Lax`;
  window.dispatchEvent(new Event('it_sum_session_change'));
}

export function getDemoSession(): DemoSession | null {
  try {
    const value = localStorage.getItem(SESSION_STORAGE_KEY);
    return value ? JSON.parse(value) as DemoSession : null;
  } catch {
    return null;
  }
}

export function clearDemoSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new Event('it_sum_session_change'));
}
