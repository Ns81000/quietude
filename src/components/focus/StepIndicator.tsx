import { Check } from 'lucide-react';
import { useFocusStore, FocusStep } from '@/store/focus';

const steps: { id: FocusStep; label: string }[] = [
  { id: 'time', label: 'Time' },
  { id: 'audio', label: 'Sounds' },
  { id: 'session', label: 'Session' },
];

export function StepIndicator() {
  const { currentStep } = useFocusStore();
  
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isFuture = index > currentIndex;
        
        return (
          <div key={step.id} className="flex items-center gap-2 md:gap-4">
            {/* Step Circle */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                  isActive
                    ? 'border-accent bg-accent text-accent-text'
                    : isCompleted
                    ? 'border-accent bg-accent text-accent-text'
                    : 'border-border bg-bg text-text-muted'
                }`}
              >
                {isCompleted ? (
                  <Check size={16} />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              
              {/* Step Label */}
              <span
                className={`text-sm font-medium hidden md:inline ${
                  isActive
                    ? 'text-text'
                    : isCompleted
                    ? 'text-text-soft'
                    : 'text-text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 md:w-16 transition-colors ${
                  index < currentIndex ? 'bg-accent' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
