import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DialogProps { open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode; }
function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className="relative z-10 w-full sm:max-w-lg"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "bg-surface rounded-t-3xl sm:rounded-2xl shadow-dialog border border-border/50",
      "max-h-[92dvh] overflow-y-auto",
      className
    )}>
      {/* drag pill */}
      <div className="sm:hidden flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-border" />
      </div>
      {children}
    </div>
  );
}

function DialogHeader({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-surface/95 backdrop-blur-sm z-10 rounded-t-3xl sm:rounded-t-2xl">
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="ms-3 w-8 h-8 rounded-xl flex items-center justify-center bg-surface-elevated hover:bg-border text-text-muted transition-all hover:text-text-primary"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-base font-bold text-text-primary tracking-tight", className)}>{children}</h2>;
}

function DialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex gap-2.5 p-5 pt-0", className)}>{children}</div>;
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter };
