import { useState, useEffect } from 'react';
import api, { apiMessage } from '../services/api';
import Layout from '../components/Layout';
import { Alert, Loading } from '../components/Feedback';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, saveSession } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    bio: '',
    avatar: '',
  });

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    api.get('/profile')
      .then(({ data }) => {
        setProfile(data.data);
        setForm({
          name: data.data.name || '',
          phone: data.data.phone || '',
          bio: data.data.bio || '',
          avatar: data.data.avatar || '',
        });
      })
      .catch((err) => setProfileErr(apiMessage(err, 'Failed to load profile.')))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErr('');
    setProfileMsg('');
    setSavingProfile(true);
    try {
      const { data } = await api.put('/profile', form);
      setProfile(data.data);
      // Update local storage session if name changed
      const currentToken = localStorage.getItem('expense_token');
      saveSession({ user: { id: data.data._id, name: data.data.name, email: data.data.email }, token: currentToken });
      setProfileMsg('Profile updated successfully!');
    } catch (err) {
      setProfileErr(apiMessage(err, 'Failed to update profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassErr('');
    setPassMsg('');
    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassErr('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/profile/password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      setPassMsg('Password changed successfully!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassErr(apiMessage(err, 'Failed to change password.'));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <Layout><Loading label="Loading profile..." /></Layout>;

  return (
    <Layout>
      <div className="page-heading">
        <div>
          <h1>User Profile & Settings</h1>
          <p>Manage your personal info, preferences, and security settings.</p>
        </div>
      </div>

      <div className="two-column">
        <section className="form-card">
          <h2>Personal Details</h2>
          <Alert type="success">{profileMsg}</Alert>
          <Alert>{profileErr}</Alert>
          <form onSubmit={handleProfileSubmit}>
            <label>
              Full Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            <label>
              Email (Cannot be changed)
              <input disabled value={profile?.email || ''} />
            </label>

            <label>
              Phone Number
              <input
                type="tel"
                placeholder="+1 234 567 890"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>

            <label>
              Bio / Note
              <textarea
                placeholder="Short bio about yourself..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </label>

            <button disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </section>

        <section className="form-card">
          <h2>Security & Password</h2>
          <Alert type="success">{passMsg}</Alert>
          <Alert>{passErr}</Alert>
          <form onSubmit={handlePasswordSubmit}>
            <label>
              Current Password
              <input
                type="password"
                name="current-password"
                autocomplete="current-password"
                required
                value={passForm.currentPassword}
                onChange={(e) =>
                  setPassForm({ ...passForm, currentPassword: e.target.value })
                }
              />
            </label>

            <label>
              New Password
              <input
                type="password"
                name="new-password"
                autocomplete="new-password"
                required
                minLength="6"
                value={passForm.newPassword}
                onChange={(e) =>
                  setPassForm({ ...passForm, newPassword: e.target.value })
                }
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                name="new-password"
                autocomplete="new-password"
                required
                value={passForm.confirmPassword}
                onChange={(e) =>
                  setPassForm({ ...passForm, confirmPassword: e.target.value })
                }
              />
            </label>

            <button disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </section>
      </div>
    </Layout>
  );
}