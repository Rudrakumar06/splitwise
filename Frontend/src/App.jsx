import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateGroup from './pages/CreateGroup';
import GroupDetails from './pages/GroupDetails';
import EditGroup from './pages/EditGroup';
import AddExpense from './pages/AddExpense';
import Balances from './pages/Balances';
import Settlements from './pages/Settlements';
import Profile from './pages/Profile';

const privatePage = Page => <ProtectedRoute><Page /></ProtectedRoute>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={privatePage(Dashboard)} />
      <Route path="/profile" element={privatePage(Profile)} />
      <Route path="/groups/new" element={privatePage(CreateGroup)} />
      <Route path="/groups/:groupId" element={privatePage(GroupDetails)} />
      <Route path="/groups/:groupId/edit" element={privatePage(EditGroup)} />
      <Route path="/groups/:groupId/expenses/new" element={privatePage(AddExpense)} />
      <Route path="/groups/:groupId/balances" element={privatePage(Balances)} />
      <Route path="/groups/:groupId/settlements" element={privatePage(Settlements)} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
