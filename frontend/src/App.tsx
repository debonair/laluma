import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { GroupProvider } from './context/GroupContext';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Welcome from './pages/Welcome';
import Onboarding from './pages/Onboarding';
import LookingFor from './pages/LookingFor';
import LocationSettings from './pages/LocationSettings';
import Profile from './pages/Profile';
import AdminRoute from './components/AdminRoute';

import Groups from './pages/Groups';
import CreateGroup from './pages/CreateGroup';
import GroupDetail from './pages/GroupDetail';
import MyLuma from './pages/MyLuma';
import MyBookmarks from './pages/MyBookmarks';
import Notifications from './pages/Notifications';
import SubscriptionPage from './pages/SubscriptionPage';
import ContentDetail from './pages/ContentDetail';
import AdminContent from './pages/AdminContent';
import ContentForm from './pages/ContentForm';
import Messages from './pages/Messages';
import ConversationDetail from './pages/ConversationDetail';
import Search from './pages/Search';
import Discover from './pages/Discover';
import PublicProfile from './pages/PublicProfile';
import Marketplace from './pages/Marketplace';
import Directory from './pages/Directory';
import SubmitContent from './pages/SubmitContent';
import AdminSubmissions from './pages/AdminSubmissions';
import AdminDashboard from './pages/AdminDashboard';

import { ToastProvider } from './context/ToastContext';
import Skeleton from './components/Skeleton';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem', gap: '1rem' }}>
        <Skeleton height={60} borderRadius="8px" />
        <Skeleton height={200} borderRadius="12px" />
        <Skeleton height={200} borderRadius="12px" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <GroupProvider>
              <Routes>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route
                  path="/welcome"
                  element={
                    <ProtectedRoute>
                      <Welcome />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/looking-for"
                  element={
                    <ProtectedRoute>
                      <LookingFor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/location-settings"
                  element={
                    <ProtectedRoute>
                      <LocationSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                {/* Groups Routes */}
                <Route
                  path="/groups"
                  element={
                    <ProtectedRoute>
                      <Groups />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups/create"
                  element={
                    <ProtectedRoute>
                      <CreateGroup />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups/:id"
                  element={
                    <ProtectedRoute>
                      <GroupDetail />
                    </ProtectedRoute>
                  }
                />
                {/* My Luma Routes */}
                <Route
                  path="/my-luma"
                  element={
                    <ProtectedRoute>
                      <MyLuma />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-luma/bookmarks"
                  element={
                    <ProtectedRoute>
                      <MyBookmarks />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/messages/:id"
                  element={
                    <ProtectedRoute>
                      <ConversationDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <Search />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/marketplace"
                  element={
                    <ProtectedRoute>
                      <Marketplace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/directory"
                  element={
                    <ProtectedRoute>
                      <Directory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/discover"
                  element={
                    <ProtectedRoute>
                      <Discover />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/:id"
                  element={
                    <ProtectedRoute>
                      <PublicProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-luma/:id"
                  element={
                    <ProtectedRoute>
                      <ContentDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/content"
                  element={
                    <AdminRoute>
                      <AdminContent />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/content/new"
                  element={
                    <AdminRoute>
                      <ContentForm />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/content/edit/:id"
                  element={
                    <AdminRoute>
                      <ContentForm />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/subscription"
                  element={
                    <ProtectedRoute>
                      <SubscriptionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/submit-content"
                  element={
                    <ProtectedRoute>
                      <SubmitContent />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/submissions"
                  element={
                    <AdminRoute>
                      <AdminSubmissions />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
              </Routes>
            </GroupProvider>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
