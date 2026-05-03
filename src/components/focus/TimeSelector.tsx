import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { useFocusStore } from '@/store/focus';
import { StepIndicator } from './StepIndicator';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function TimeSelector() {
  const navigate = useNavigate();
  const { duration, setDuration, nextStep } = useFocusStore();
  
  // Convert seconds to minutes for display
  const minutes = Math.floor(duration / 60);
  
  const handleNext = useCallback(() => {
    if (duration > 0) {
      nextStep();
    }
  }, [duration, nextStep]);
  
  const handleClose = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);
  
  const handleDurationChange = useCallback((value: number) => {
    setDuration(value * 60);
  }, [setDuration]);
  
  const presetTimes = [
    { label: '15 min', value: 15 * 60 },
    { label: '25 min', value: 25 * 60 },
    { label: '45 min', value: 45 * 60 },
    { label: '60 min', value: 60 * 60 },
  ];
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative">
      {/* Close Button - Improved Styling */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 md:top-8 md:right-8 z-10 group touch-manipulation"
        style={{ touchAction: 'manipulation' }}
        title="Close"
        aria-label="Close"
      >
        <div className="relative p-2.5 rounded-full bg-surface/80 backdrop-blur-md border border-border/50 shadow-lg transition-all duration-200 group-hover:bg-surface group-hover:border-border group-hover:shadow-xl group-active:scale-95">
          <X size={20} className="text-text-soft group-hover:text-text transition-colors" />
        </div>
      </button>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl space-y-6"
      >
        {/* Step Indicator */}
        <StepIndicator />
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl md:text-4xl text-text">
            Set Your Focus Time
          </h1>
          <p className="text-text-soft">
            Choose how long you want to focus
          </p>
        </div>
        
        {/* Time Display */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="space-y-4 w-full max-w-md">
            {/* Circular Progress Ring with Digital Display */}
            <div className="relative flex items-center justify-center">
              {/* SVG Progress Ring */}
              <svg className="w-56 h-56 md:w-64 md:h-64 -rotate-90" viewBox="0 0 200 200">
                {/* Background circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="hsl(var(--bg-2))"
                  strokeWidth="8"
                  strokeLinecap="butt"
                  className="opacity-30"
                />
                
                {/* Progress circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="8"
                  strokeLinecap="butt"
                  strokeDasharray={`${2 * Math.PI * 85}`}
                  strokeDashoffset={2 * Math.PI * 85 * (1 - minutes / 120)}
                  style={{
                    transition: 'stroke-dashoffset 0.3s ease-out',
                  }}
                />
              </svg>
              
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl md:text-6xl font-display text-accent font-bold tracking-tight">
                    {minutes}
                  </div>
                  <div className="text-text-soft text-xs font-medium mt-1 tracking-wide uppercase">
                    minutes
                  </div>
                </div>
              </div>
            </div>
            
            {/* Slider */}
            <div className="relative px-2">
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={minutes}
                onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all"
                style={{
                  background: `linear-gradient(to right, hsl(var(--accent)) 0%, hsl(var(--accent)) ${((minutes - 5) / 115) * 100}%, hsl(var(--bg-2)) ${((minutes - 5) / 115) * 100}%, hsl(var(--bg-2)) 100%)`,
                }}
              />
              
              {/* Time markers */}
              <div className="flex justify-between mt-2 px-1">
                <span className="text-xs text-text-muted">5m</span>
                <span className="text-xs text-text-muted">30m</span>
                <span className="text-xs text-text-muted">60m</span>
                <span className="text-xs text-text-muted">90m</span>
                <span className="text-xs text-text-muted">120m</span>
              </div>
            </div>
            
            {/* Preset Buttons */}
            <div className="grid grid-cols-4 gap-3">
              {presetTimes.map((preset) => {
                const isActive = duration === preset.value;
                return (
                  <button
                    key={preset.value}
                    onClick={() => setDuration(preset.value)}
                    className={`px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 touch-manipulation active:scale-95 ${
                      isActive
                        ? 'bg-accent text-accent-text shadow-md'
                        : 'bg-surface border-2 border-border text-text-soft hover:text-text hover:border-accent/30 active:border-accent/50'
                    }`}
                    style={{ touchAction: 'manipulation' }}
                    aria-label={`Set duration to ${preset.label}`}
                    aria-pressed={isActive}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Next Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleNext}
            disabled={duration === 0}
            size="lg"
            className="gap-2 px-8 touch-manipulation active:scale-95 shadow-lg hover:shadow-xl"
            style={{ touchAction: 'manipulation' }}
            aria-label="Continue to sound selection"
          >
            Next
            <ArrowRight size={18} />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
