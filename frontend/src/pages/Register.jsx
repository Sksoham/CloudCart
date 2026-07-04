
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const strengthLabel = (pwd) => {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { label: 'Weak',   color: 'bg-red-500',    width: 'w-1/4' };
  if (score === 2) return { label: 'Fair',   color: 'bg-yellow-500', width: 'w-2/4' };
  if (score === 3) return { label: 'Good',   color: 'bg-blue-500',   width: 'w-3/4' };
  return              { label: 'Strong', color: 'bg-green-500',  width: 'w-full' };
};

export default function Register() {
  const { register } = useAuth();
  const navigate      = useNavigate();

  const [form, setForm]     = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState('');

  const strength = strengthLabel(form.password);

  const validate = () => {
    const e = {};
    if (!form.name.trim())           e.name    = 'Name is required';
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email)                  e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)               e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!form.confirmPassword)        e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: form.name.trim(), email: form.email, password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">CC</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Cloud<span className="text-primary-600">Cart</span></span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create your account</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Start shopping on CloudCart today</p>
          </div>

          {apiError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm animate-fade-in flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label className="label" htmlFor="name">Full Name</label>
              <input id="name" type="text" autoComplete="name" value={form.name}
                onChange={handleChange('name')} className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="John Doe"/>
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input id="email" type="email" autoComplete="email" value={form.email}
                onChange={handleChange('email')} className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"/>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" type={showPwd ? 'text' : 'password'} autoComplete="new-password"
                  value={form.password} onChange={handleChange('password')}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="At least 6 characters"/>
                <button type="button" onClick={() => setShowPwd((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={showPwd ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"}/>
                  </svg>
                </button>
              </div>
              {/* Strength bar */}
              {form.password && strength && (
                <div className="mt-2">
                  <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300 rounded-full`}/>
                  </div>
                  <p className="text-xs mt-1 text-gray-500">Password strength: <span className="font-medium">{strength.label}</span></p>
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label" htmlFor="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" type={showPwd ? 'text' : 'password'} autoComplete="new-password"
                value={form.confirmPassword} onChange={handleChange('confirmPassword')}
                className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Repeat your password"/>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
