import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout       from './components/Layout';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Properties   from './pages/Properties';
import Users        from './pages/Users';
import KYC          from './pages/KYC';
import Complaints   from './pages/Complaints';
import Transactions from './pages/Transactions';
import Settings     from './pages/Settings';
import AuditLogs    from './pages/AuditLogs';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <RequireAuth>
            <Layout>
              <Routes>
                <Route path="/"             element={<Dashboard />}    />
                <Route path="/properties"   element={<Properties />}   />
                <Route path="/users"        element={<Users />}        />
                <Route path="/kyc"          element={<KYC />}          />
                <Route path="/complaints"   element={<Complaints />}   />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/settings"     element={<Settings />}     />
                <Route path="/audit"        element={<AuditLogs />}    />
              </Routes>
            </Layout>
          </RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  );
}
