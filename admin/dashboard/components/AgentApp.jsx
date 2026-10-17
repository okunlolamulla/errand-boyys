'use client';
import { useAuth } from '../lib/useAuth';
import LoginForm from './LoginForm';
import AgentDashboard from './AgentDashboard';

export default function AgentApp() {
  const { session, ready, login, logout, request } = useAuth('agent');
  if (!ready) return null;
  return session
    ? <AgentDashboard request={request} user={session.user} onLogout={logout} />
    : <LoginForm title="Errand Boys Agent" subtitle="Sign in with your agent account." onLogin={login} />;
}
