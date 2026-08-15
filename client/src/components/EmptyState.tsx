export function EmptyState() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center pointer-events-none">
      <div className="rounded-lg border border-dashed border-border bg-muted/5 px-6 py-8 max-w-md">
        <p className="text-sm font-medium">Start creating</p>
        <p className="text-xs text-muted-foreground mt-1">
          Draw something, add text, or choose an element.
        </p>
      </div>
    </div>
  );
}
