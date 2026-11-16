import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api, { apiMessage } from '../services/api';
import Layout from '../components/Layout';
import { Alert, Empty, Loading } from '../components/Feedback';
import { date, idOf, money } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [g, m, e] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/members`),
        api.get(`/groups/${groupId}/expenses`),
      ]);
      setGroup(g.data.data);
      setMembers(m.data.data || []);
      setExpenses(e.data.data?.expenses || e.data.data || []);
    } catch (err) {
      setError(apiMessage(err, 'Unable to load group.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [groupId]);

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    setError('');
    try {
      await api.delete(`/groups/${groupId}/expenses/${id}`);
      setMessage('Expense deleted successfully.');
      load();
    } catch (err) {
      setError(apiMessage(err, 'Failed to delete expense.'));
    }
  };

  if (loading) return <Layout><Loading label="Loading group..." /></Layout>;
  if (!group) return <Layout><Alert>{error || 'Group not found.'}</Alert></Layout>;

  const isCreator = idOf(group.createdBy) === idOf(user);
  const canEditExpense = (expense) => isCreator || idOf(expense.createdBy) === idOf(user);

  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/groups/${groupId}/export?format=csv`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `group-${group.name.replace(/\s+/g, '_')}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(apiMessage(err, 'Failed to export CSV.'));
    }
  };

  return (
    <Layout>
      <Link className="back" to="/dashboard">← Back to groups</Link>

      <div className="page-heading">
        <div>
          <h1>{group.name}</h1>
          <p>{group.description || 'No description provided.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isCreator && (
            <Link className="button secondary" to={`/groups/${groupId}/edit`}>
              Edit group
            </Link>
          )}
          <Link className="button" to={`/groups/${groupId}/expenses/new`}>
            Add expense
          </Link>
        </div>
      </div>

      <Alert type="success">{message}</Alert>
      <Alert>{error}</Alert>

      <div className="quick-links">
        <Link to={`/groups/${groupId}/balances`}>View balances</Link>
        <Link to={`/groups/${groupId}/settlements`}>Settlements</Link>
        <button className="button secondary" onClick={handleExportCSV}>Export Report (CSV)</button>
      </div>

      <section className="section">
        <h2>Expenses</h2>
        {expenses.length ? (
          <div className="expense-list">
            {expenses.map((expense) => (
              <article className="expense" key={expense._id}>
                <div>
                  <h3>
                    {expense.description} <span className="badge">{expense.category || 'Other'}</span>
                  </h3>
                  <p>
                    {money(expense.totalAmount)} paid by {expense.paidBy?.name} · {expense.splitType} · {date(expense.createdAt)}
                  </p>
                  {expense.receiptImage && (
                    <p>
                      <a href={expense.receiptImage} target="_blank" rel="noopener noreferrer" className="link-button">
                        📷 View Receipt
                      </a>
                    </p>
                  )}
                  <details>
                    <summary>View participant shares</summary>
                    <ul>
                      {expense.participants.map((p) => (
                        <li key={idOf(p.user)}>
                          {p.user?.name}: {money(p.shareAmount)}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
                {canEditExpense(expense) && (
                  <div className="actions">
                    <button className="text-button" onClick={() => navigate(`/groups/${groupId}/expenses/new?edit=${expense._id}`)}>
                      Edit
                    </button>
                    <button className="danger text-button" onClick={() => deleteExpense(expense._id)}>
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <Empty>No expenses have been added yet.</Empty>
        )}
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
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}