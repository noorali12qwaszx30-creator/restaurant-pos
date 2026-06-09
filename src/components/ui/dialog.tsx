import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps { open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode; }
function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full sm:max-w-lg">{children}</div>
    </div>
  );
}

function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "bg-surface border border-border rounded-t-2xl sm:rounded-2xl shadow-elevated",
      "max-h-[90dvh] overflow-y-auto",
      className
    )}>
      {children}
    </div>
  );
}

function DialogHeader({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-surface z-10">
      <div className="flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="ms-3 p-1.5 rounded-lg hover:bg-surface-elevated text-text-muted transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-base font-semibold text-text-primary", className)}>{children}</h2>;
}

function DialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex gap-2 p-5 pt-0", className)}>{children}</div>;
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter };
