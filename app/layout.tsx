import './globals.css'
import { Inter } from 'next/font/google'
import { ThemeProvider } from './components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Asana Technology & Innovation Dashboard',
  description: 'Project management dashboard for Technology & Innovation team',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-sonance-white dark:bg-sonance-dark">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}