import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { FormField, PasswordInput, FormAlert } from '../components/common/FormField';
import AuthLayout from '../components/layout/AuthLayout';
import { useLogin } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { getErrorMessage } from '../lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');

  const sessionMessage = useAuthStore((state) => state.sessionMessage);
  const clearSessionMessage = useAuthStore((state) => state.clearSessionMessage);
  const login = useLogin();

  const validate = () => {
    const errors = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    clearSessionMessage();
    if (!validate()) return;

    try {
      await login.mutateAsync({ email: email.trim(), password });
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your Familia account"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormAlert type="error">{error || sessionMessage}</FormAlert>

        <FormField
          label="Email"
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          autoFocus
        />

        <FormField label="Password" id="password" error={fieldErrors.password}>
          <PasswordInput
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>

        <Button type="submit" size="lg" variant="brand" className="w-full" loading={login.isPending}>
          {login.isPending ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
