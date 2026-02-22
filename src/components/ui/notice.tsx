
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';

const noticeVariants = cva(
  "relative w-full rounded-lg border p-4",
  {
    variants: {
      variant: {
        info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300",
        success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-300",
        critical: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const icons = {
  info: <Info />,
  success: <CheckCircle />,
  critical: <AlertTriangle />,
};

const Notice = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof noticeVariants>
>(({ className, variant, children, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn("relative p-4 ps-10", noticeVariants({ variant }), className)}
    {...props}
  >
    <div className="absolute start-3 top-[18px] text-lg">
      {variant && icons[variant]}
    </div>
    <div className="flex flex-col">
        {children}
    </div>
  </div>
));
Notice.displayName = "Notice";

const NoticeTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-bold leading-none tracking-tight", className)}
    {...props}
  />
));
NoticeTitle.displayName = "NoticeTitle";

const NoticeDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
NoticeDescription.displayName = "NoticeDescription";

export { Notice, NoticeTitle, NoticeDescription };
