"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { Check, CircleDot, type LucideIcon } from "lucide-react";

interface Step {
  id: string;
  title: string;
  icon?: LucideIcon;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  const locale = useLocale();
  const isRtl = locale === "he" || locale === "ar";

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-start" dir={isRtl ? "rtl" : "ltr"}>
        {steps.map((step, stepIdx) => (
          <li key={step.id} className={cn("relative min-w-0", stepIdx !== steps.length - 1 ? "flex-1" : "")}>
            {stepIdx < currentStep ? (
              <>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute inset-x-4 top-4 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-primary" />
                  </div>
                )}
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary"
                >
                  <Check className="h-5 w-5 text-white" aria-hidden="true" />
                  <span className="sr-only">{step.title}</span>
                </div>
              </>
            ) : stepIdx === currentStep ? (
              <>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute inset-x-4 top-4 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                )}
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background"
                  aria-current="step"
                >
                  {step.icon ? <step.icon className="h-5 w-5 text-primary" aria-hidden="true" /> : <CircleDot className="h-5 w-5 text-primary" aria-hidden="true" />}
                  <span className="sr-only">{step.title}</span>
                </div>
              </>
            ) : (
              <>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute inset-x-4 top-4 flex items-center" aria-hidden="true">
                    <div className="h-0.5 w-full bg-gray-200" />
                  </div>
                )}
                <div
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-background hover:border-gray-400"
                >
                  {step.icon ? <step.icon className="h-5 w-5 text-gray-500 group-hover:text-gray-900" aria-hidden="true" /> : <CircleDot className="h-5 w-5 text-gray-500 group-hover:text-gray-900" aria-hidden="true" />}
                  <span className="sr-only">{step.title}</span>
                </div>
              </>
            )}
            <p className="mt-2 max-w-full truncate text-center text-xs font-medium text-muted-foreground">{step.title}</p>
          </li>
        ))}
      </ol>
    </nav>
  );
}
