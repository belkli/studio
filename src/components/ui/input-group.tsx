
'use client';
import * as React from "react"
import { cn } from "@/lib/utils"

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("relative flex items-center", className)} {...props} />
))
InputGroup.displayName = "InputGroup"

const InputGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "flex h-10 items-center justify-center rounded-e-md border border-s-0 border-input bg-muted px-3 text-sm text-muted-foreground",
      "[&:has(+*:dir(ltr))]:rounded-e-none [&:has(+*:dir(ltr))]:rounded-s-md [&:has(+*:dir(ltr))]:border-s [&:has(+*:dir(ltr))]:border-e-0",
      className
    )}
    {...props}
  />
))
InputGroupText.displayName = "InputGroupText"

export { InputGroup, InputGroupText }
