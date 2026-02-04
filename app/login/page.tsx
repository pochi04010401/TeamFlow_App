import { LoginForm } from '@/components/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ログイン - TeamFlow',
};

export default function LoginPage() {
  return <LoginForm />;
}
