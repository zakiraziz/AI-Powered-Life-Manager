import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";

interface GradientButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
  className?: string;
}

export function GradientButton({
  children,
  variant = "primary",
  isLoading,
  className,
  disabled,
  ...props
}: GradientButtonProps) {
  const baseStyles = "relative px-6 py-3 rounded-xl font-semibold inline-flex items-center justify-center gap-2 overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] border border-white/20",
    secondary: "bg-white/10 text-white hover:bg-white/20 border border-white/10 backdrop-blur-md",
    danger: "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)] border border-white/20",
    ghost: "bg-transparent text-muted-foreground hover:text-white hover:bg-white/5",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </motion.button>
  );
}
