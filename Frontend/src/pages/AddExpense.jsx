import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'; import { useEffect, useState } from 'react'; import api, { apiMessage } from '../services/api'; import Layout from '../components/Layout'; import { Alert, Loading } from '../components/Feedback'; import { idOf, money } from '../utils/format';

const blank = {
  description: '',
  totalAmount: '',
  paidBy: '',
  participants: [],
  splitType: 'EQUAL',
  category: 'Other',
  receiptImage: '',
  customAmounts: {},
};

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Groceries',
  'Utilities',
  'Entertainment',
  'Travel',
  'Healthcare',
  'Rent',
  'Shopping',
  'Education',
  'Gifts',
  'Other',
];
export default function AddExpense() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const editId = new URLSearchParams(useLocation().search).get('edit');
  const [form, setForm] = useState(blank);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/upload/receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setForm((prev) => ({
        ...prev,
        receiptImage: response.data.data.url,
      }));
    } catch (err) {
      setUploadError(apiMessage(err, 'Failed to upload receipt image to ImageKit.'));
    } finally {
      setUploading(false);
    }
  };
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/groups/${groupId}/members`);
        setMembers(data.data);
        if (editId) {
          const expense = (await api.get(`/groups/${groupId}/expenses/${editId}`)).data.data;
          setForm({
            description: expense.description,
            totalAmount: expense.totalAmount,
            paidBy: idOf(expense.paidBy),
            participants: expense.participants.map(p => idOf(p.user)),
            splitType: expense.splitType,
            category: expense.category || 'Other',
            receiptImage: expense.receiptImage || '',
            customAmounts: Object.fromEntries(
              expense.participants
                .filter(p => p.isCustomAmount)
                .map(p => [idOf(p.user), p.shareAmount])
            )
          });
        }
      } catch (err) {
        setError(apiMessage(err, 'Unable to load expense form.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId, editId]);

  const toggle = id =>
    setForm(prev => ({
      ...prev,
      participants: prev.participants.includes(id)
        ? prev.participants.filter(item => item !== id)
        : [...prev.participants, id]
    }));

  const submit = async e => {
    e.preventDefault();
    setError('');
    setResult(null);
    const customAmounts = Object.entries(form.customAmounts)
      .filter(([, amount]) => amount !== '')
      .map(([user, amount]) => ({ user, amount: Number(amount) }));
    const payload = {
      description: form.description,
      totalAmount: Number(form.totalAmount),
      paidBy: form.paidBy,
      participants: form.participants,
      splitType: form.splitType,
      category: form.category,
      receiptImage: form.receiptImage,
      ...(form.splitType === 'CUSTOM' ? { customAmounts } : {})
    };
    setSaving(true);
    try {
      const response = editId
        ? await api.put(`/groups/${groupId}/expenses/${editId}`, payload)
        : await api.post(`/groups/${groupId}/expenses`, payload);
      setResult(response.data.data);
      setTimeout(
        () =>
          navigate(`/groups/${groupId}`, {
            state: { message: editId ? 'Expense updated successfully.' : 'Expense created successfully.' }
          }),
        900
      );
    } catch (err) {
      setError(apiMessage(err, 'Failed to save expense.'));
    } finally {
      setSaving(false);
    }
  };
  if (loading) return <Layout><Loading label="Loading expense form..." /></Layout>;
  return <Layout><Link className="back" to={`/groups/${groupId}`}>← Back to group</Link><section className="form-card wide"><h1>{editId ? 'Edit expense' : 'Add expense'}</h1><p>Split calculations are handled by the backend after submission.</p><Alert>{error}</Alert><Alert type="success">{result && `Expense ${editId ? 'updated' : 'created'} successfully.`}</Alert>      <form onSubmit={submit}>
        <label>
          Description
          <input
            required
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </label>

        <label>
          Category
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        <label>
          Total amount
          <input
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.totalAmount}
            onChange={e => setForm({ ...form, totalAmount: e.target.value })}
          />
        </label>

        <label>
          Paid by
          <select
            required
            value={form.paidBy}
            onChange={e => setForm({ ...form, paidBy: e.target.value })}
          >
            <option value="">Select payer</option>
            {members.map(m => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Upload Receipt Image (ImageKit.io)
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading && <small style={{ color: '#2563eb' }}>Uploading receipt to ImageKit...</small>}
          {uploadError && <small style={{ color: '#dc2626' }}>{uploadError}</small>}
        </label>

        {form.receiptImage && (
          <div className="receipt-preview" style={{ marginBottom: '16px' }}>
            <p style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 600 }}>Receipt Preview / URL:</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={form.receiptImage}
                alt="Receipt Preview"
                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
              <input
                type="url"
                value={form.receiptImage}
                onChange={(e) => setForm({ ...form, receiptImage: e.target.value })}
                placeholder="Image URL"
              />
            </div>
          </div>
        )}

        <fieldset>
          <legend>Participants</legend>
          {members.map(m => (
            <label className="checkbox" key={m._id}>
              <input
                type="checkbox"
                checked={form.participants.includes(m._id)}
                onChange={() => toggle(m._id)}
              />
              {m.name}
            </label>
          ))}
        </fieldset><label>Split type<select value={form.splitType} onChange={e => setForm({ ...form, splitType: e.target.value })}><option value="EQUAL">Equal</option><option value="CUSTOM">Custom / partial</option></select></label>{form.splitType === 'CUSTOM' && <div className="custom-splits"><p>Enter amounts only for people with a custom share. Blank fields are calculated by the backend.</p>{members.filter(m => form.participants.includes(m._id)).map(m => <label key={m._id}>{m.name}<input type="number" min="0" step="0.01" placeholder="Auto" value={form.customAmounts[m._id] ?? ''} onChange={e => setForm({ ...form, customAmounts: { ...form.customAmounts, [m._id]: e.target.value } })} /></label>)}</div>}<button disabled={saving}>{saving ? 'Saving...' : editId ? 'Update expense' : 'Create expense'}</button></form>{result && <div className="final-shares"><h2>Final shares from backend</h2>{result.participants.map(p => <p key={idOf(p.user)}>{p.user?.name || members.find(member => idOf(member) === idOf(p.user))?.name || idOf(p.user)}: {money(p.shareAmount)}</p>)}</div>}</section></Layout>;
}
