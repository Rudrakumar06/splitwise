import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => { logout(); navigate('/login'); };
  return <><header className="topbar"><Link className="brand" to="/dashboard">SplitShare</Link><nav>{user && <><span className="welcome">Hi, {user.name}</span><button className="link-button" onClick={signOut}>Logout</button></>}</nav></header><main className="page">{children}</main></>;
}
