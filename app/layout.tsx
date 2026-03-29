import './globals.css'
import { Montserrat } from 'next/font/google'
import { ThemeProvider } from './components/ThemeProvider'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700']
})

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
      <body className={montserrat.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-sonance-white dark:bg-sonance-dark">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}