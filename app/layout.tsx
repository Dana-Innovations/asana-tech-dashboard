import './globals.css'
import { Montserrat } from 'next/font/google'
import { ThemeProvider } from './components/ThemeProvider'
import { AutoRefresh } from './components/AutoRefresh'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700']
})

export const metadata = {
  title: 'Asana Dashboard',
  description: 'Multi-tenant project management dashboards powered by Asana',
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
          <div className="min-h-screen bg-gray-50 dark:bg-sonance-dark">
            {children}
            <AutoRefresh />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}