import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const sections = [
    { title: '1. Introduction', content: 'The Shree Jee app ("App") respects your privacy. This privacy policy explains how we collect, use, store, and protect your personal information. By using this App, you agree to this policy.' },
    { title: '2. Information Collected', content: 'We may collect the following information:\n\n• Name and email address (during onboarding)\n• Device information (operating system, device model)\n• App usage data (Naam Jap counter, Mala count)\n• Location data (only with your permission)\n\nWe do not collect any sensitive financial or health data.' },
    { title: '3. Use of Information', content: 'Your information is used to:\n\n• Personalize the app experience\n• Improve app functionality\n• Provide technical support\n• Analyze app performance\n\nWe do not sell your information to any third party.' },
    { title: '4. Data Storage', content: 'Your data is stored locally on your device. We use industry-standard security measures. Data is kept in encrypted storage.' },
    { title: '5. Third Party Services', content: 'The App may use the following third-party services:\n\n• Expo (app development and updates)\n• AsyncStorage (local data storage)\n\nThese services have their own privacy policies.' },
    { title: '6. Your Rights', content: 'You have the following rights:\n\n• Right to view your information\n• Right to correct your information\n• Right to delete your information\n• Right to opt-out of data collection\n\nUninstalling the app will delete all local data.' },
    { title: '7. Children\'s Privacy', content: 'This App does not knowingly collect information from children under the age of 13. If you believe a child has provided us with information, please contact us.' },
    { title: '8. Changes to Policy', content: 'We may update this privacy policy from time to time. Any changes will be communicated through the App. Last update of this policy: February 2026.' },
    { title: '9. Contact', content: 'For any privacy-related questions, please contact us through the App.' },
]

export function PrivacyPolicyPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-10 bg-card border-b border-border">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-lg font-bold text-foreground">Privacy Policy — Shree Jee</h1>
                </div>
            </header>
            <main className="max-w-3xl mx-auto px-4 py-6">
                <p className="text-muted-foreground text-sm text-center mb-6">Last updated: February 2026</p>
                <div className="space-y-4">
                    {sections.map((section, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-5">
                            <h2 className="text-base font-semibold text-foreground mb-2">{section.title}</h2>
                            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{section.content}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}
