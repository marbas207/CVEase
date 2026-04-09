import { Heart, Github, Coffee } from 'lucide-react'
import { Button } from '../components/ui/button'
import logoLight from '@/assets/cvease-logo-light.svg'
import logoDark from '@/assets/cvease-logo-dark.svg'
import mascotImg from '@/assets/marbas-mascot.png'

const APP_VERSION = '1.2.6'

export function AboutPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo — swap light/dark variant by Tailwind dark: class on <html> */}
        <div className="flex flex-col items-center gap-2">
          <img src={logoLight} alt="CVEase" className="block dark:hidden w-72" />
          <img src={logoDark} alt="CVEase" className="hidden dark:block w-72" />
          <p className="text-sm text-muted-foreground">v{APP_VERSION}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          A desktop tool for tracking coordinated vulnerability disclosure. Manage findings from discovery through publication with a Kanban board, follow-up reminders, checklists, and more.
        </p>

        {/* Author */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">Created by</p>
          <img src={mascotImg} alt="marba$ mascot" className="w-20 h-20 rounded-xl" />
          <p className="text-lg font-bold">marba$</p>
        </div>

        {/* Donate */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Heart className="w-4 h-4 text-red-400" />
            Support the project
          </div>
          <p className="text-xs text-muted-foreground">
            If CVEase has been useful for your security research, consider buying me a coffee.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open('https://buymeacoffee.com/marbas', '_blank')}
            >
              <Coffee className="w-4 h-4" />
              Buy Me a Coffee
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open('https://github.com/marbas207/CVEase', '_blank')}
            >
              <Github className="w-4 h-4" />
              GitHub
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground/50 space-y-1">
          <p>Built with Electron, React, SQLite, and Tailwind CSS</p>
          <p>&copy; {new Date().getFullYear()} marba$. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
