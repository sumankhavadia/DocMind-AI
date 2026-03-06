import './App.css'
import { Routes, Route } from 'react-router-dom'
import Home from './components/home.jsx'
import Login from './components/auth/login.jsx'
import Signup from './components/auth/signup.jsx'
import Dashboard from './components/dashboard/dashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
    <div className="font-sans">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
