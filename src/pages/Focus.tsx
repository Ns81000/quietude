import { useEffect } from 'react';
import { useFocusStore } from '@/store/focus';
import { TimeSelector } from '@/components/focus/TimeSelector';
import { AudioSelector } from '@/components/focus/AudioSelector';
import { FocusSession } from '@/components/focus/FocusSession';

export default function Focus() {
  const currentStep = useFocusStore(state => state.currentStep);
  const setStep = useFocusStore(state => state.setStep);
  
  // Reset to time selector when component mounts
  useEffect(() => {
    setStep('time');
  }, [setStep]);
  
  return (
    <div className="min-h-screen bg-bg text-text">
      {currentStep === 'time' && <TimeSelector />}
      {currentStep === 'audio' && <AudioSelector />}
      {currentStep === 'session' && <FocusSession />}
    </div>
  );
}
