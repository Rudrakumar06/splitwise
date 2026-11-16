import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    title: 'Split expenses with groups',
    body: 'Create groups with friends, roommates, or coworkers. Add expenses in seconds and see who owes what.',
  },
  {
    title: 'Custom expense splits',
    body: 'Not every bill splits evenly. Set custom shares per person, or divide it equally with one click.',
  },
  {
    title: 'Live balances',
    body: 'Balances update as people pay. Always clear who owes whom, with no mental math.',
  },
  {
    title: 'Settle up easily',
    body: 'Track settlements as people pay each other back. Everything stays balanced and auditable.',
  },
  {
    title: 'Attach receipts',
    body: 'Upload photos of receipts and bills directly to an expense so the details are never lost.',
  },
  {
    title: 'Export your data',
    body: 'Download your group expenses and balances as a CSV whenever you need a spreadsheet or a report.',
  },
];

const steps = [
  { n: '01', title: 'Create an account', body: 'Sign up with your name and email.' },
  { n: '02', title: 'Start a group', body: 'Invite the people you share expenses with.' },
  { n: '03', title: 'Log expenses', body: 'Add each bill and pick who it applies to.' },
  { n: '04', title: 'Split and settle', body: 'Watch balances update and settle up with confidence.' },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const goDashboard = e => { e.preventDefault(); navigate('/dashboard'); };

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-inner">
          <p className="landing-eyebrow">SplitShare</p>
          <h1 className="landing-title">
            Split expenses. Settle up. Stop chasing people for money.
          </h1>
          <p className="landing-sub">
            The simplest way to share bills with friends, roommates, and coworkers.
            Add expenses, track who owes what, and settle up — all in one place.
          </p>
          <div className="landing-cta">
            {user ? (
              <>
                <button className="button" onClick={goDashboard}>Go to dashboard</button>
                <span className="landing-welcome">Hi, {user.name}</span>
              </>
            ) : (
              <>
                <Link className="button" to="/register">Get started free</Link>
                <Link className="text-button" to="/login">Sign in</Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-inner">
          <div className="section-head">
            <h2>Everything you need to split the bill</h2>
            <p>From a dinner bill to a shared trip, SplitShare keeps your finances clear.</p>
          </div>
          <div className="landing-grid">
            {features.map(f => (
              <article className="landing-card" key={f.title}>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-alt">
        <div className="landing-inner">
          <div className="section-head">
            <h2>Up and running in four steps</h2>
            <p>No setup friction. You will be splitting bills within minutes.</p>
          </div>
          <div className="landing-steps">
            {steps.map(s => (
              <div className="landing-step" key={s.n}>
                <span className="landing-step-num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-cta-section">
        <div className="landing-inner landing-cta-card">
          {user ? (
            <>
              <h2>Your groups are waiting</h2>
              <p>Pick up where you left off.</p>
              <button className="button" onClick={goDashboard}>Go to dashboard</button>
            </>
          ) : (
            <>
              <h2>Ready to stop chasing people for money?</h2>
              <p>Create your free account today.</p>
              <Link className="button" to="/register">
                Create your account
              </Link>
            </>
          )}
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-inner landing-footer-row">
          <span className="brand">SplitShare</span>
          <nav className="landing-footer-links">
            {user ? (
              <Link to="/dashboard">Dashboard</Link>
            ) : (
              <>
                <Link to="/register">Create account</Link>
                <Link to="/login">Sign in</Link>
              </>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}