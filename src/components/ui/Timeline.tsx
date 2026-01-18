import { cn } from "@/lib/utils";

interface TimelineStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  details?: string[];
  highlight?: boolean;
}

interface TimelineProps {
  steps: TimelineStep[];
}

export function Timeline({ steps }: TimelineProps) {
  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <div 
          key={index} 
          className={cn(
            "relative flex gap-4 pb-6",
            index !== steps.length - 1 && "border-l-2 border-dashed border-muted-foreground/20 ml-6"
          )}
        >
          <div className={cn(
            "absolute -left-6 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2",
            step.highlight 
              ? "border-primary bg-primary/10 text-primary" 
              : "border-muted-foreground/20 text-muted-foreground"
          )}>
            {step.icon}
          </div>
          <div className="ml-10 flex-1">
            <h3 className={cn(
              "text-lg font-bold mb-1",
              step.highlight && "text-primary"
            )}>
              {step.title}
            </h3>
            <p className="text-muted-foreground mb-3">{step.description}</p>
            {step.details && (
              <ul className="space-y-2 text-sm">
                {step.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
