import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import Welcome from './pages/Welcome/Welcome'
import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import Home from './pages/Home/Home'
import AboutUs from './pages/AboutUs/AboutUs'

const App = function () {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Welcome />} />
                <Route 
                    path="/login" 
                    element={
                        <ProtectedRoute requireAuth={false}>
                            <Login />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/signup" 
                    element={
                        <ProtectedRoute requireAuth={false}>
                            <Signup />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/forgot-password" 
                    element={
                        <ProtectedRoute requireAuth={false}>
                            <ForgotPassword />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/home" 
                    element={
                        <ProtectedRoute requireAuth={true}>
                            <Home />
                        </ProtectedRoute>
                    } 
                />
                <Route path="/about-us" element={<AboutUs />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
