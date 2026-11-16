import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api, { apiMessage } from '../services/api';
import Layout from '../components/Layout';
import { Alert, Empty, Loading } from '../components/Feedback';
import { idOf } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function EditGroup() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [email, setEmail] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(true);

  const load = async () => {
    setSaving(true);
    setError('');
    try {
      const [g, m] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/members`),
      ]);
      const groupData = g.data.data;
      setGroup(groupData);
      setMembers(m.data.data || []);
      setForm({ name: groupData.name, description: groupData.description || '' });
    } catch (err) {
      setError(apiMessage(err, 'Unable to load group.'));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { load(); }, [groupId]);

  const isCreator = group && idOf(group.createdBy) === idOf(user);

  const saveGroup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await api.put(`/groups/${groupId}`, form);
      setMessage('Group updated successfully.');
      load();
    } catch (err) {
      setError(apiMessage(err, 'Failed to update group.'));
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email.trim()) { setError('Member email is required.'); return; }
    setSaving(true);
    try {
      await api.post(`/groups/${groupId}/members`, { email });
      setEmail('');
      setShowAddMember(false);
      setMessage('Member added successfully.');
      load();
    } catch (err) {
      setError(apiMessage(err, 'Failed to add member.'));
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (id) => {
    if (!window.confirm('Remove this member from the group?')) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/groups/${groupId}/members/${id}`);
      setMessage('Member removed successfully.');
      load();
    } catch (err) {
      setError(apiMessage(err, 'Failed to remove member.'));
    }
  };

  if (saving && !group) {
    return <Layout><Loading label="Loading group..." /></Layout>;
  }

  if (!group) {
    return <Layout><Alert>{error || 'Group not found.'}</Alert></Layout>;
  }

  if (!isCreator) {
    return (
      <Layout>
        <Link className="back" to={`/groups/${groupId}`}>← Back to group</Link>
        <Alert>Only the group creator can edit this group.</Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <Link className="back" to={`/groups/${groupId}`}>← Back to group</Link>
      <div className="page-heading">
        <div><h1>Edit group</h1><p>Update your group details and manage members.</p></div>
      </div>

      <Alert type="success">{message}</Alert>
      <Alert>{error}</Alert>

      <section className="section">
        <h2>Group details</h2>
        <form className="form-card" onSubmit={saveGroup}>
          <label>
            Group name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <button disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
        </form>
      </section>

      <section className="section">
        <h2>Members ({members.length})</h2>
        <div className="member-list">
          {members.map((member) => (
            <div className="member" key={member._id}>
              <span>
                <strong>{member.name}</strong>
                <small>{member.email}</small>
              </span>
              {idOf(member) !== idOf(group.createdBy) && (
                <button className="danger text-button" onClick={() => removeMember(member._id)}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        {showAddMember ? (
          <form className="inline-form" onSubmit={addMember}>
            <input
              type="email"
              placeholder="Member email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <button disabled={saving}>Add member</button>
            <button type="button" className="text-button" onClick={() => { setShowAddMember(false); setEmail(''); }}>
              Cancel
            </button>
          </form>
        ) : (
          <button className="text-button" onClick={() => setShowAddMember(true)}>
            + Add member
          </button>
        )}
      </section>
    </Layout>
  );
}