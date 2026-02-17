import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const sections = [
    { title: '1. Acceptance', content: 'By downloading, installing, or using the Shree Jee app ("App"), you agree to be bound by these terms and conditions. If you do not agree to these terms, please do not use the App.' },
    { title: '2. Service Description', content: 'Shree Jee is a spiritual app that provides the following services:\n\n• Naam Jap Counter (Mala counting)\n• Spiritual content (in Hindi and English)\n• Daily Sadhana tracking\n• Personal themes and settings' },
    { title: '3. User Responsibilities', content: 'As a user, you agree that:\n\n• You will provide accurate information\n• You will not misuse the App\n• You will not copy or distribute App content without permission\n• You will use the App only for lawful purposes' },
    { title: '4. Intellectual Property', content: 'All content, designs, logos, graphics, and text in the App are the property of Shree Jee and are protected by copyright laws. Reproduction of any content without prior written permission is prohibited.' },
    { title: '5. Content Disclaimer', content: 'The spiritual content provided in the App is for educational and devotional purposes only. We do not guarantee the accuracy or completeness of the content. Users should use their own discretion.' },
    { title: '6. Service Availability', content: 'We strive to keep the App continuously available, but:\n\n• Service may be interrupted due to technical issues\n• We may update or modify the App without notice\n• We reserve the right to discontinue the service at any time' },
    { title: '7. Limitation of Liability', content: 'The Shree Jee App shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use the App.' },
    { title: '8. Changes to Terms', content: 'We reserve the right to modify these terms at any time. Changes will be effective immediately upon publication in the App. Continued use means you agree to the revised terms.' },
    { title: '9. Governing Law', content: 'These terms and conditions shall be governed and construed in accordance with the laws of India. Any disputes shall be settled under the jurisdiction of Indian courts.' },
    { title: '10. Contact', content: 'For any questions about these terms, please contact us through the App.' },
]

export function TermsConditionsPage() {
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
                    <h1 className="text-lg font-bold text-foreground">Terms & Conditions — Shree Jee</h1>
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
