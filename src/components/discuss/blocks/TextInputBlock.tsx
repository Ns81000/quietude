import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { renderMarkdown } from './TextBlock';
import { Send } from 'lucide-react';

interface TextInputBlockProps {
  question: string;
  onAnswer: (answer: string) => void;
  answered?: boolean;
  userAnswer?: string;
}

export function TextInputBlock({ question, onAnswer, answered, userAnswer }: TextInputBlockProps) {
  const [value, setValue] = useState(answered && userAnswer ? String(userAnswer) : '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!answered) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [answered]);

  const handleSubmit = () => {
    if (value.trim().length < 3 || answered) return;
    onAnswer(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="py-4"
    >
      <p className="text-text font-medium text-base md:text-lg mb-4">{renderMarkdown(question)}</p>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={answered}
          placeholder="Type your thoughts..."
          rows={2}
          className="w-full bg-surface border-2 border-border rounded-xl px-4 py-3 text-base text-text
                     placeholder:text-text-muted/50 resize-none transition-all duration-300
                     focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10
                     disabled:opacity-60 disabled:cursor-default"
          style={{ minHeight: '64px' }}
        />
        {!answered && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: value.trim().length >= 3 ? 1 : 0.3 }}
            onClick={handleSubmit}
            disabled={value.trim().length < 3}
            className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-text
                       text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed
                       hover:opacity-90 active:scale-[0.97] transition-all duration-200"
          >
            <Send size={15} />
            Submit
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
