import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { DashboardLayout } from './components/DashboardLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { UsersPage } from './pages/UsersPage'
import { TasksPage } from './pages/TasksPage'
import { MilestonesPage } from './pages/MilestonesPage'
import { SettingsPage } from './pages/SettingsPage'
import { ActivityLogsPage } from './pages/ActivityLogsPage'
import { ChatPage } from './pages/ChatPage'

function RoleRedirect() {
    const { user } = useAuth()
    if (user?.role === 'admin') return <DashboardPage />
    return <Navigate to="/projects" replace />
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<RoleRedirect />} />
                        <Route path="projects" element={<ProjectsPage />} />
                        <Route path="projects/:id" element={<ProjectDetailPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="tasks" element={<TasksPage />} />
                        <Route path="milestones" element={<MilestonesPage />} />
                        <Route path="chat" element={<ChatPage />} />
                        <Route path="activity" element={<ActivityLogsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App
