import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardLayout } from './components/DashboardLayout'
import { DashboardPage } from './pages/DashboardPage'
import { SettingsPage } from './pages/SettingsPage'
import { DailyQuotesPage } from './pages/DailyQuotesPage'
import { NaamJapUsersPage } from './pages/NaamJapUsersPage'
import { HomeContentPage } from './pages/HomeContentPage'
import { PushNotificationsPage } from './pages/PushNotificationsPage'
import { PresetImagesPage } from './pages/PresetImagesPage'
import { TermsConditionsPage } from './pages/TermsConditionsPage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import { DeleteAccountPage } from './pages/DeleteAccountPage'

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/terms-conditions" element={<TermsConditionsPage />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                    <Route path="/delete-account" element={<DeleteAccountPage />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<DashboardPage />} />
                        <Route path="home-content" element={<HomeContentPage />} />
                        <Route path="daily-quotes" element={<DailyQuotesPage />} />
                        <Route path="naam-jap-users" element={<NaamJapUsersPage />} />
                        <Route path="push-notifications" element={<PushNotificationsPage />} />
                        <Route path="preset-images" element={<PresetImagesPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App
