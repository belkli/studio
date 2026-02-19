"use client";

import { cn } from "@/lib/utils";
import { Check, type LucideIcon } from "lucide-react";

interface Step {
  id: string;
  title: string;
  icon: LucideIcon;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.id}
            className={cn("relative", stepIdx !== steps.length - 1 ? "flex-1" : "")}
          >
            {stepIdx < currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary"
                >
                  <Check className="h-5 w-5 text-white" aria-hidden="true" />
                  <span className="sr-only">{step.title}</span>
                </div>
              </>
            ) : stepIdx === currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background"
                  aria-current="step"
                >
                    <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="sr-only">{step.title}</span>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-background hover:border-gray-400"
                >
                    <step.icon className="h-5 w-5 text-gray-500 group-hover:text-gray-900" aria-hidden="true" />
                  <span className="sr-only">{step.title}</span>
                </div>
              </>
            )}
             <p className="absolute -bottom-6 w-max right-1/2 translate-x-1/2 text-center text-xs mt-2 font-medium text-muted-foreground">{step.title}</p>
          </li>
        ))}
      </ol>
    </nav>
  );
}
