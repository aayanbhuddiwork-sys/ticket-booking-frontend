import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import WakeUpBanner from './components/WakeUpBanner';
import ActivityFeed from './components/ActivityFeed';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import MyBookings from './pages/MyBookings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', height: '100vh' }}>
          {/* Left pane: the normal booking app */}
          <div style={{ flex: 2, overflowY: 'auto' }}>
            <WakeUpBanner />
            <nav style={{ display: 'flex', gap: 16, padding: 16 }}>
              <Link to="/">Events</Link>
              <Link to="/my-bookings">My Bookings</Link>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </nav>
            <Routes>
              <Route path="/" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </div>

          {/* Right pane: live system internals feed */}
          <div style={{ flex: 1, borderLeft: '1px solid #30363d' }}>
            <ActivityFeed />
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
