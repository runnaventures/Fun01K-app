export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Fun01K. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Privacy
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Terms
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}