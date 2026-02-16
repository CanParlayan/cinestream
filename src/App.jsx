/**
 * Main App Component
 * Handles routing and authentication flow
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Home from './pages/Home';
import Player from './pages/Player';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isAuthenticated, isLoading, userInfo, login, logout } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cinema-darker flex items-center justify-center">
        <LoadingSpinner size="xl" message="Initializing..." />
      </div>
    );
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLogin={login} />
            )
          }
        />

        {/* Home Route */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Home onLogout={logout} userInfo={userInfo} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Player Route */}
        <Route
          path="/player/:contentType/:streamId"
          element={
            isAuthenticated ? (
              <Player />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/player/:streamId"
          element={
            isAuthenticated ? (
              <Player />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
