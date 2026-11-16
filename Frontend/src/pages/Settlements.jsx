import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api, { apiMessage } from '../services/api';
import Layout from '../components/Layout';
import { Alert, Empty, Loading } from '../components/Feedback';
import { date, idOf, money } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function Settlements() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [owedExpenses, setOwedExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [userBalance, setUserBalance] = useState(0);
  const [selectedExpenseId, setSelectedExpenseId] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [owedRes, s, b] = await Promise.all([
        api.get(`/groups/${groupId}/expenses/owed`),
        api.get(`/groups/${groupId}/settlements`),
        api.get(`/groups/${groupId}/balances`),
      ]);
      setOwedExpenses(owedRes.data.data || []);
      setSettlements(s.data.data || []);
      const balData = b.data.data || [];
      const myBal = balData.find((item) => idOf(item.user) === idOf(user));
      setUserBalance(myBal ? Number(myBal.balance) : 0);
    } catch (e) {
      setError(apiMessage(e, 'Unable to load settlements.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [groupId]);

  const selectedExpense = owedExpenses.find(
    (e) => String(e._id) === String(selectedExpenseId),
  );

  const handleExpenseChange = (expenseId) => {
    setSelectedExpenseId(expenseId);
    const exp = owedExpenses.find((e) => String(e._id) === String(expenseId));
    if (exp) {
      setCustomAmount(String(exp.amountOwed));
    } else {
      setCustomAmount('');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!selectedExpense) {
      setError('Please select an expense to settle.');
      return;
    }

    const payAmount = Number(customAmount);
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    if (payAmount > selectedExpense.amountOwed) {
      setError(
        `Payment amount (${money(payAmount)}) cannot exceed the remaining amount owed on this expense (${money(selectedExpense.amountOwed)}).`,
      );
      return;
    }

    setSaving(true);
    try {
      await api.post(`/groups/${groupId}/settlements`, {
        fromUser: user.id || user._id,
        toUser: selectedExpense.paidBy._id || selectedExpense.paidBy.id,
        amount: payAmount,
        expenseId: selectedExpense._id,
      });
      setSelectedExpenseId('');
      setCustomAmount('');
      setMessage(`Settlement recorded for "${selectedExpense.description}".`);
      load();
    } catch (err) {
      setError(apiMessage(err, 'Failed to record settlement.'));
    } finally {
      setSaving(false);
    }
  };

  const hasOwedExpenses = owedExpenses.length > 0;
  const owesMoney = userBalance < 0;
  const totalOwed = Math.abs(userBalance);

  return (
    <Layout>
      <Link className="back" to={`/groups/${groupId}`}>
        ← Back to group
      </Link>
      <div className="two-column">
        <section className="form-card">
          <h1>Settle an expense</h1>
          <p>Select a specific expense you owe money on to pay it back.</p>

          {loading ? (
            <Loading />
          ) : hasOwedExpenses ? (
            <Alert type="success">
              You have <strong>{owedExpenses.length}</strong> unsettled {owedExpenses.length === 1 ? 'expense' : 'expenses'} in this group. Select one below to settle.
            </Alert>
          ) : (
            <Alert type="error">
              You do not have any unsettled expenses in this group. All your shares are paid up!
            </Alert>
          )}

          <Alert>{error}</Alert>
          <Alert type="success">{message}</Alert>

          <form onSubmit={submit}>
            <label>
              Select expense to settle
              <select
                required
                disabled={!hasOwedExpenses || loading || saving}
                value={selectedExpenseId}
                onChange={(e) => handleExpenseChange(e.target.value)}
              >
                <option value="">
                  {owedExpenses.length
                    ? 'Select an expense you owe on...'
                    : 'No unsettled expenses'}
                </option>
                {owedExpenses.map((exp) => (
                  <option key={exp._id} value={exp._id}>
                    {exp.description} — owe {money(exp.amountOwed)} to {exp.paidBy?.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedExpense && (
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', margin: '10px 0' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#4b5563' }}>
                  <strong>Expense:</strong> {selectedExpense.description} ({money(selectedExpense.totalAmount)})
                </p>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#4b5563' }}>
                  <strong>Payer:</strong> {selectedExpense.paidBy?.name} ({selectedExpense.paidBy?.email})
                </p>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#4b5563' }}>
                  <strong>Your total share:</strong> {money(selectedExpense.shareAmount)}
                </p>
                {selectedExpense.settledAmount > 0 && (
                  <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#16a34a' }}>
                    <strong>Already settled:</strong> {money(selectedExpense.settledAmount)}
                  </p>
                )}
                <p style={{ margin: '0', fontSize: '0.95rem', color: '#dc2626', fontWeight: 600 }}>
                  <strong>Remaining to pay:</strong> {money(selectedExpense.amountOwed)}
                </p>
              </div>
            )}

            <label>
              Amount to pay
              <input
                type="number"
                min="0.01"
                max={selectedExpense ? selectedExpense.amountOwed : 0}
                step="0.01"
                required
                disabled={!selectedExpense || saving}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
            </label>

            <button disabled={!selectedExpense || saving}>
              {saving ? 'Saving...' : 'Record settlement'}
            </button>
          </form>
        </section>

        <section className="section">
          <h2>Settlement history</h2>
          {loading ? (
            <Loading />
          ) : settlements.length ? (
            <div className="expense-list">
              {settlements.map((s) => (
                <article className="expense" key={s._id}>
                  <div>
                    <strong>
                      {s.fromUser?.name} paid {s.toUser?.name}
                    </strong>
                    <p>
                      {money(s.amount)} · {date(s.createdAt)}
                      {s.expense?.description && (
                        <span> for <em>"{s.expense.description}"</em></span>
                      )}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty>No settlements recorded yet.</Empty>
          )}
        </section>
      </div>
    </Layout>
  );
}