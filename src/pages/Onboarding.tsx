import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/user';
import { useAuthStore } from '@/store/auth';
import { 
  setKnownUserWithBackup, 
  getKnownUserSync as getKnownUser 
} from '@/components/auth/AuthProvider';
import { updateUserProfile } from '@/lib/firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase/client';

const STUDY_FIELDS = ['Science', 'Arts', 'Commerce', 'Engineering', 'Medicine', 'Law', 'Other'];
const STUDY_TIMES = [
  { value: 'morning', label: 'Morning', desc: '05:00 – 11:00' },
  { value: 'afternoon', label: 'Afternoon', desc: '11:00 – 16:00' },
  { value: 'evening', label: 'Evening', desc: '16:00 – 22:00' },
  { value: 'night', label: 'Late Night', desc: '22:00 – 05:00' },
];
const LEARN_STYLES = [
  { value: 'reading', label: 'By Reading', desc: 'Notes, textbooks, articles' },
  { value: 'practice', label: 'By Practising', desc: 'Problems, exercises, quizzes' },
  { value: 'visual', label: 'By Visualising', desc: 'Diagrams, charts, maps' },
  { value: 'mixed', label: 'Mixed', desc: 'A bit of everything' },
];

const TOTAL_STEPS = 5;

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [field, setField] = useState('');
  const [customField, setCustomField] = useState('');
  const [studyTime, setStudyTime] = useState('');
  const [learnStyle, setLearnStyle] = useState('');
  const navigate = useNavigate();
  const setProfile = useUserStore((s) => s.setProfile);

  const advance = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) advance();
  };

  const handleFieldSelect = (f: string) => {
    setField(f);
    if (f !== 'Other') {
      setTimeout(advance, 200);
    }
  };

  const handleCustomFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customField.trim()) {
      setField(customField.trim());
      advance();
    }
  };

  const handleTimeSelect = (t: string) => {
    setStudyTime(t);
    setTimeout(advance, 200);
  };

  const handleStyleSelect = async (s: string) => {
    setLearnStyle(s);
    
    const profileData = {
      name: name.trim(),
      studyField: field,
      studyTime,
      learnStyle: s,
      isOnboarded: true,
    };
    
    // Save locally first
    setProfile(profileData);
    
    // Update known_user to mark as onboarded (multi-layer storage)
    const { userId, email } = useAuthStore.getState();
    if (userId && email) {
      setKnownUserWithBackup(email, {
        email,
        name: profileData.name,
        lastLogin: new Date().toISOString(),
      });
      
      // CRITICAL: Explicitly sync to server - don't rely on subscription
      // The subscription may not be active yet or may fail silently
      if (isFirebaseConfigured()) {
        try {
          await updateUserProfile(userId, {
            name: profileData.name,
            studyField: profileData.studyField,
            learnStyle: profileData.learnStyle,
            studyTime: profileData.studyTime,
            isOnboarded: true,
          });
          console.log('[Onboarding] Profile synced to server');
        } catch (err) {
          console.warn('[Onboarding] Failed to sync profile to server:', err);
          // Local known_user will serve as fallback
        }
      }
    }
    
    setTimeout(advance, 200);
  };

  // Welcome screen auto-transitions
  const handleWelcomeMount = () => {
    setTimeout(() => navigate('/dashboard'), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="name"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <h1 className="font-display text-3xl text-text mb-8 tracking-tight">
                What should we call you?
              </h1>
              <form onSubmit={handleNameSubmit}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                  className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-text
                             placeholder:text-text-muted text-lg
                             focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                             transition-all duration-150"
                />
                <p className="text-xs text-text-muted mt-3">Press Enter to continue</p>
              </form>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="field"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <h1 className="font-display text-3xl text-text mb-8 tracking-tight">
                What do you study?
              </h1>
              <div className="grid grid-cols-2 gap-3">
                {STUDY_FIELDS.map((f) => (
                  <button
                    key={f}
                    onClick={() => handleFieldSelect(f)}
                    className={`px-4 py-3 rounded-lg border text-sm text-left transition-all duration-150
                      ${field === f
                        ? 'border-accent bg-accent-soft text-text'
                        : 'border-border bg-surface text-text-soft hover:border-text-muted'
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {field === 'Other' && (
                <form onSubmit={handleCustomFieldSubmit} className="mt-4">
                  <input
                    type="text"
                    value={customField}
                    onChange={(e) => setCustomField(e.target.value)}
                    placeholder="Type your field of study"
                    autoFocus
                    className="w-full px-4 py-3 rounded-lg bg-surface border border-border text-text
                               placeholder:text-text-muted text-base
                               focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                               transition-all duration-150"
                  />
                </form>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="time"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <h1 className="font-display text-3xl text-text mb-8 tracking-tight">
                When do you usually sit down to study?
              </h1>
              <div className="grid grid-cols-2 gap-3">
                {STUDY_TIMES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => handleTimeSelect(t.value)}
                    className={`p-4 rounded-lg border text-left transition-all duration-150
                      ${studyTime === t.value
                        ? 'border-accent bg-accent-soft'
                        : 'border-border bg-surface hover:border-text-muted'
                      }`}
                  >
                    <span className="block text-sm font-medium text-text">{t.label}</span>
                    <span className="block text-xs text-text-muted mt-1">{t.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="style"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            >
              <h1 className="font-display text-3xl text-text mb-8 tracking-tight">
                How do you learn best?
              </h1>
              <div className="grid grid-cols-2 gap-3">
                {LEARN_STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStyleSelect(s.value)}
                    className={`p-4 rounded-lg border text-left transition-all duration-150
                      ${learnStyle === s.value
                        ? 'border-accent bg-accent-soft'
                        : 'border-border bg-surface hover:border-text-muted'
                      }`}
                  >
                    <span className="block text-sm font-medium text-text">{s.label}</span>
                    <span className="block text-xs text-text-muted mt-1">{s.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="welcome"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              onAnimationComplete={handleWelcomeMount}
            >
              <h1 className="font-display text-4xl text-text tracking-tight">
                Welcome, {name}.
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress dots */}
        {step < 4 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300
                  ${i === step ? 'bg-accent w-4' : i < step ? 'bg-accent' : 'bg-border'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
