'use client';
import { useAuth } from '../lib/useAuth';
import LoginForm from './LoginForm';
import AdminShell from './AdminShell';
import ChangePassword from './ChangePassword';

export default function AdminApp() {
  const { session, ready, login, logout, request, updateUser } = useAuth('admin');
  if (!ready) return null;
  if (!session) return <LoginForm onLogin={login} />;
  // The default admin account has to pick its own password before anything else.
  if (session.user.must_change_password) {
    return <ChangePassword forced request={request} onLogout={logout} onDone={() => updateUser({ must_change_password: false })} />;
  }
  return <AdminShell request={request} user={session.user} onLogout={logout} />;
}
