import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { FormField, PasswordInput, FormAlert, getPasswordIssues } from '../components/common/FormField';
import AuthLayout from '../components/layout/AuthLayout';
import { useRegister } from '../api/auth';
import { cn, getErrorMessage } from '../lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains a letter', test: (p) => /[A-Za-z]/.test(p) },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
];

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');

  const register = useRegister();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    const name = formData.name.trim();
    if (!name) errors.name = 'Name is required';
    else if (name.length < 2 || name.length > 50) errors.name = 'Name must be between 2 and 50 characters';

    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!EMAIL_RE.test(formData.email.trim())) errors.email = 'Enter a valid email address';

    const issues = getPasswordIssues(formData.password);
    if (!formData.password) errors.password = 'Password is required';
    else if (issues.length) errors.password = `Password needs ${issues.join(', ')}`;

    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    try {
      await register.mutateAsync({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It's quick and easy."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormAlert type="error">{error}</FormAlert>

        <FormField
          label="Full name"
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          value={formData.name}
          onChange={handleChange}
          maxLength={50}
          error={fieldErrors.name}
          autoFocus
        />

        <FormField
          label="Email"
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />

        <FormField label="Password" id="password" error={fieldErrors.password}>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            maxLength={72}
          />
        </FormField>

        {formData.password && (
          <ul className="grid gap-1 text-xs sm:grid-cols-3" aria-label="Password requirements">
            {RULES.map((rule) => {
              const ok = rule.test(formData.password);
              return (
                <li key={rule.label} className={cn('flex items-center gap-1', ok ? 'text-success' : 'text-muted-foreground')}>
                  {ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
                  <span>{rule.label}</span>
                  <span className="sr-only">{ok ? '(met)' : '(not met)'}</span>
                </li>
              );
            })}
          </ul>
        )}

        <FormField label="Confirm password" id="confirmPassword" error={fieldErrors.confirmPassword}>
          <PasswordInput
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            maxLength={72}
          />
        </FormField>

        <Button type="submit" size="lg" variant="brand" className="w-full" loading={register.isPending}>
          {register.isPending ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>
    </AuthLayout>
  );
}
