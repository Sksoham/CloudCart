// src/pages/Profile.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService, authService } from '../services';
import toast from 'react-hot-toast';

const TABS = ['Profile', 'Change Password'];

export default function Profile() {
  const { user, updateUserState } = useAuth();
  const [activeTab, setActiveTab] = useState('Profile');

  /* ── Profile form ── */
  const [profile, setProfile]   = useState({
    name:    user?.name || '',
    phone:   user?.phone || '',
    street:  user?.address?.street || '',
    city:    user?.address?.city || '',
    state:   user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const handleProfileChange = (field) => (e) =>
    setProfile((p) => ({ ...p, [field]: e.target.value }));

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) { toast.error('Name is required'); return; }
    setSavingProfile(true);
    try {
      const { data } = await userService.updateProfile({
        name:    profile.name,
        phone:   profile.phone,
        address: {
          street:     profile.street,
          city:       profile.city,
          state:      profile.state,
          postalCode: profile.postalCode,
          country:    profile.country,
        },
      });
      updateUserState(data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Password form ── */
  const [pwdForm, setPwdForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [savingPwd, setSavingPwd] = useState(false);

  const handlePwdChange = (field) => (e) => {
    setPwdForm((f) => ({ ...f, [field]: e.target.value }));
    if (pwdErrors[field]) setPwdErrors((er) => ({ ...er, [field]: '' }));
  };

  const validatePwd = () => {
    const e = {};
    if (!pwdForm.currentPassword) e.currentPassword = 'Current password is required';
    if (!pwdForm.newPassword)     e.newPassword     = 'New password is required';
    else if (pwdForm.newPassword.length < 6) e.newPassword = 'Must be at least 6 characters';
    if (!pwdForm.confirmPassword) e.confirmPassword = 'Please confirm new password';
    else if (pwdForm.newPassword !== pwdForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setPwdErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePwdSave = async (e) => {
    e.preventDefault();
    if (!validatePwd()) return;
    setSavingPwd(true);
    try {
      await authService.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword:     pwdForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  const inputField = (label, value, onChange, type = 'text', placeholder = '') => (
    <div>
      <label className="label">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="input"/>
    </div>
  );

  return (
    <div className="container-custom py-10 max-w-3xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <h1 className="page-title">{user?.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          <span className={`badge mt-1 ${user?.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>
            {user?.role === 'admin' ? '👑 Admin' : '👤 Customer'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'Profile' && (
        <div className="card p-6 animate-fade-in">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Personal Information</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inputField('Full Name *', profile.name, handleProfileChange('name'), 'text', 'Your name')}
              {inputField('Phone Number', profile.phone, handleProfileChange('phone'), 'tel', '+91 98765 43210')}
            </div>

            <h3 className="font-medium text-gray-800 dark:text-gray-200 pt-2">Delivery Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                {inputField('Street Address', profile.street, handleProfileChange('street'), 'text', '123, MG Road')}
              </div>
              {inputField('City', profile.city, handleProfileChange('city'), 'text', 'Mumbai')}
              {inputField('State', profile.state, handleProfileChange('state'), 'text', 'Maharashtra')}
              {inputField('Postal Code', profile.postalCode, handleProfileChange('postalCode'), 'text', '400001')}
              {inputField('Country', profile.country, handleProfileChange('country'), 'text', 'India')}
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={savingProfile} className="btn-primary">
                {savingProfile ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Saving…
                  </span>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password tab */}
      {activeTab === 'Change Password' && (
        <div className="card p-6 animate-fade-in">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Change Password</h2>
          <form onSubmit={handlePwdSave} className="space-y-4 max-w-sm">
            {[
              { label: 'Current Password', field: 'currentPassword' },
              { label: 'New Password',     field: 'newPassword' },
              { label: 'Confirm New Password', field: 'confirmPassword' },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="label">{label}</label>
                <input
                  type="password"
                  value={pwdForm[field]}
                  onChange={handlePwdChange(field)}
                  className={`input ${pwdErrors[field] ? 'input-error' : ''}`}
                  placeholder="••••••"
                />
                {pwdErrors[field] && <p className="mt-1 text-xs text-red-500">{pwdErrors[field]}</p>}
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={savingPwd} className="btn-primary">
                {savingPwd ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Updating…
                  </span>
                ) : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
