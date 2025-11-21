import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import Welcome from './pages/Welcome/Welcome'
import Login from './pages/Login/Login'
import Signup from './pages/Signup/Signup'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import Home from './pages/Home/Home'
import MyFiles from './pages/MyFiles/MyFiles'
import AboutUs from './pages/AboutUs/AboutUs'
import SearchResults from './pages/SearchResults/SearchResults'
import Settings from './pages/Settings/Settings'

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
                <Route 
                    path="/files" 
                    element={
                        <ProtectedRoute requireAuth={true}>
                            <MyFiles />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/search" 
                    element={
                        <ProtectedRoute requireAuth={true}>
                            <SearchResults />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/settings" 
                    element={
                        <ProtectedRoute requireAuth={true}>
                            <Settings />
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
