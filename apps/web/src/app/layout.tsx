import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { FinanceProvider } from '../context/FinanceContext';
import { ProjectProvider } from '../context/ProjectContext';

export const metadata: Metadata = {
  title: 'FEKRA AI – Company Operating System',
  description: 'Enterprise operational platform managing company finances, projects, and partner governance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="bg-navy-950 text-slate-800 antialiased min-h-screen selection:bg-cyan selection:text-white">
        <LanguageProvider>
          <AuthProvider>
            <FinanceProvider>
              <ProjectProvider>
                {children}
              </ProjectProvider>
            </FinanceProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
