import { Bug, Heart, Github, Coffee } from 'lucide-react'
import { Button } from '../components/ui/button'
import mascotImg from '@/assets/marbas-mascot.png'

const APP_VERSION = '1.1.0'

export function AboutPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo + name */}
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-xl bg-primary/10">
            <Bug className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">CVEase</h1>
          <p className="text-sm text-muted-foreground">v{APP_VERSION}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          A desktop tool for managing CVE disclosure workflows. Track vulnerabilities from discovery through coordinated disclosure with a Kanban board, follow-up reminders, checklists, and more.
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
