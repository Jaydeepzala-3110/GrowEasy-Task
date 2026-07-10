import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="border-b border-hairline bg-canvas">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-dark text-on-dark"
            aria-hidden
          >
            <span className="text-sm font-medium">G</span>
          </div>
          <div>
            <p className="font-display text-xl font-medium tracking-tight text-ink">GrowEasy</p>
            <p className="text-xs text-muted">CSV Importer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href="https://groweasy.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:text-primary-active"
          >
            groweasy.ai
          </a>
        </div>
      </div>
    </header>
  );
}
