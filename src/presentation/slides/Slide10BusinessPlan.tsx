import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
  IndianRupee,
  Target,
  Award,
  Zap,
  BookOpen,
  Building2,
  Code2,
  BarChart3,
  PieChart,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SlideProps {
  isPlaying?: boolean;
  onComplete?: () => void;
  registerNavHandler?: (handler: (direction: 'prev' | 'next') => boolean) => void;
}

// Counter animation component
function CounterNumber({ target, duration = 2, suffix = '' }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      countRef.current += increment;
      if (countRef.current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(countRef.current));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <span>
      {count.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

// Revenue pillar card component
function RevenuePillar({
  icon: Icon,
  title,
  percentage,
  color,
  delay,
  amount,
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  percentage: number;
  color: string;
  delay: number;
  amount: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className="flex flex-col items-center"
    >
      {/* Pillar */}
      <div className="relative w-24 mb-4">
        {/* Background bar */}
        <div className="h-40 bg-surface border border-border rounded-t-2xl overflow-hidden">
          {/* Animated fill */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${percentage}%` }}
            transition={{ delay: delay + 0.4, duration: 1.2, ease: 'easeOut' }}
            className={`w-full rounded-t-2xl`}
            style={{ backgroundColor: color }}
          />
        </div>
        {/* Base */}
        <div className="h-3 bg-border rounded-b-2xl" />
      </div>

      {/* Icon */}
      <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
        <div style={{ color }}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {/* Labels */}
      <h4 className="font-semibold text-text text-center text-sm">{title}</h4>
      <p className="text-xs text-text-muted mt-1">{percentage}% of revenue</p>
      <p className="text-xs font-semibold text-accent mt-2">{amount}</p>
    </motion.div>
  );
}

// Market funnel component
function MarketFunnel() {
  const stages = [
    { label: 'Total Students', value: 450, unit: 'M', color: '#e2e8f0' },
    { label: 'In Digital Learning', value: 80, unit: 'M', color: '#cbd5e1' },
    { label: 'Need AI Quizzes', value: 30, unit: 'M', color: '#94a3b8' },
    { label: 'Our Target (TAM)', value: 10, unit: 'M', color: '#64748b' },
    { label: 'Realistic SAM', value: 3, unit: 'M', color: '#475569' },
    { label: 'Year 1 Goal', value: 0.1, unit: 'M', color: '#1e293b' },
  ];

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => (
        <motion.div
          key={stage.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + i * 0.1 }}
        >
          <div className="flex items-center gap-4">
            {/* Funnel segment */}
            <div
              style={{
                width: `${(stage.value / 450) * 100}%`,
                backgroundColor: stage.color,
              }}
              className="h-10 rounded-lg flex items-center justify-center relative overflow-hidden group hover:shadow-lg transition-shadow"
            >
              {/* Hover shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-xs font-bold text-white relative">
                {stage.value}
                {stage.unit}
              </span>
            </div>

            {/* Label */}
            <div className="min-w-fit">
              <p className="text-xs font-medium text-text">{stage.label}</p>
              <p className="text-xs text-text-muted">
                {stage.value}
                {stage.unit} students
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Pricing tier card
function PricingCard({
  name,
  price,
  period,
  description,
  features,
  highlighted,
  index,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.4 + index * 0.1 }}
      className={`relative rounded-2xl p-6 ${
        highlighted
          ? 'bg-gradient-to-br from-accent/20 to-accent/5 border-2 border-accent shadow-lg'
          : 'bg-surface border border-border hover:border-accent/50 transition-colors'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-xs font-semibold">
          Student Favorite
        </div>
      )}

      <h3 className="text-lg font-semibold text-text mb-2">{name}</h3>
      <p className="text-xs text-text-muted mb-3">{description}</p>

      <div className="mb-4">
        <span className="text-3xl font-bold text-accent">{price}</span>
        <span className="text-xs text-text-muted ml-2">{period}</span>
      </div>

      <ul className="space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="text-accent mt-1">✓</span>
            <span className="text-sm text-text-soft">{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// Revenue growth chart
function RevenueChart() {
  const data = [
    { month: 'M1', users: 10, revenue: 0 },
    { month: 'M6', users: 50, revenue: 0.5 },
    { month: 'M12', users: 100, revenue: 1.5 },
    { month: 'M24', users: 500, revenue: 8 },
    { month: 'M36', users: 1000, revenue: 20 },
    { month: 'M60', users: 3000, revenue: 50 },
  ];

  const maxUsers = 3000;
  const maxRevenue = 50;

  return (
    <div className="flex items-end justify-center gap-4 h-32">
      {data.map((point, i) => (
        <motion.div
          key={point.month}
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
          className="flex-1 flex flex-col items-center"
        >
          {/* Bar container */}
          <div className="w-full flex gap-1 items-end h-full">
            {/* Users bar (blue) */}
            <motion.div
              className="flex-1 bg-blue-500 rounded-t-lg relative group"
              style={{
                height: `${(point.users / maxUsers) * 100}%`,
              }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-text opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {point.users}K users
              </div>
            </motion.div>

            {/* Revenue bar (green) */}
            <motion.div
              className="flex-1 bg-green-500 rounded-t-lg relative group"
              style={{
                height: `${(point.revenue / maxRevenue) * 100}%`,
              }}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-text opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                ₹{point.revenue}L
              </div>
            </motion.div>
          </div>

          {/* Label */}
          <p className="text-xs text-text-muted font-medium mt-2">{point.month}</p>
        </motion.div>
      ))}
    </div>
  );
}

export default function Slide10BusinessPlan({ registerNavHandler }: SlideProps) {
  const [activeView, setActiveView] = useState<'opportunity' | 'model' | 'pillars' | 'askClose'>('opportunity');

  // Handle internal navigation - returns true if handled internally, false to pass to parent
  const handleInternalNav = useCallback((direction: 'prev' | 'next'): boolean => {
    if (direction === 'next') {
      if (activeView === 'opportunity') {
        setActiveView('model');
        return true;
      }
      if (activeView === 'model') {
        setActiveView('pillars');
        return true;
      }
      if (activeView === 'pillars') {
        setActiveView('askClose');
        return true;
      }
      // At askClose, let parent handle (go to next slide)
    }
    if (direction === 'prev') {
      if (activeView === 'askClose') {
        setActiveView('pillars');
        return true;
      }
      if (activeView === 'pillars') {
        setActiveView('model');
        return true;
      }
      if (activeView === 'model') {
        setActiveView('opportunity');
        return true;
      }
      // At opportunity, let parent handle (go to previous slide)
    }
    return false; // Not handled, let parent navigate
  }, [activeView]);

  // Register the navigation handler with parent
  useEffect(() => {
    if (registerNavHandler) {
      registerNavHandler(handleInternalNav);
    }
  }, [registerNavHandler, handleInternalNav]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-br from-[#f8f9fa] via-[#ffffff] to-[#f0f4f8]">
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="business-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#4a6fa5" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#business-grid)" />
        </svg>
      </div>

      {/* Floating gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              background: i % 2 === 0 
                ? 'radial-gradient(circle, rgba(74, 111, 165, 0.15), transparent 70%)'
                : 'radial-gradient(circle, rgba(184, 134, 11, 0.12), transparent 70%)',
              width: 400 + i * 100,
              height: 400 + i * 100,
              left: `${20 + i * 20}%`,
              top: `${10 + i * 15}%`,
              filter: 'blur(60px)',
            }}
            animate={{
              x: [0, 40, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {[
          { id: 'opportunity', label: 'Opportunity', icon: Target },
          { id: 'model', label: 'Model', icon: IndianRupee },
          { id: 'pillars', label: 'Pillars', icon: BarChart3 },
          { id: 'askClose', label: 'The Ask', icon: TrendingUp },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveView(id as typeof activeView)}
            className={`h-2 rounded-full transition-all duration-300 ${
              activeView === id ? 'w-12 bg-[#4a6fa5]' : 'w-2 bg-[#cbd5e1] hover:bg-[#4a6fa5]/50'
            }`}
            aria-label={`Go to ${label}`}
          />
        ))}
      </div>

      {/* Content Views */}
      <AnimatePresence mode="wait">
        {/* 1. THE OPPORTUNITY */}
        {activeView === 'opportunity' && (
          <motion.div
            key="opportunity"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            {/* Content - Centered */}
            <div className="relative z-10 w-full h-full flex items-center justify-center px-12">
              <div className="w-full max-w-5xl flex flex-col items-center justify-center gap-10">
                
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Target className="w-10 h-10 text-[#4a6fa5]" />
                    <h2 className="font-display text-5xl text-slate-900">The Opportunity</h2>
                  </div>
                  <p className="text-xl text-slate-600">
                    A ₹40,000 Cr market waiting to be transformed
                  </p>
                </motion.div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-3 gap-5 w-full">
                  {[
                    { icon: Users, label: 'Students', stat: '450M+', color: 'blue' },
                    { icon: BookOpen, label: 'Aspirants', stat: '70M+', color: 'green' },
                    { icon: IndianRupee, label: 'Market', stat: '₹40K Cr', color: 'purple' },
                  ].map(({ icon: Icon, label, stat, color }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center mx-auto mb-3`}>
                        <Icon className={`w-6 h-6 text-${color}-600`} />
                      </div>
                      <p className="text-4xl font-bold text-slate-900 mb-2">{stat}</p>
                      <p className="text-sm text-slate-600">{label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Market Funnel Visualization */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="w-full bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-8 shadow-lg"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">Market Funnel Analysis</h3>
                    <p className="text-sm text-slate-600">
                      TAM (Total Addressable Market) → SAM (Serviceable Available Market) → SOM (Serviceable Obtainable Market)
                    </p>
                  </div>
                  
                  {/* Redesigned Funnel */}
                  <div className="space-y-3">
                    {[
                      { label: 'Total Students (TAM)', value: 450, unit: 'M', color: '#94a3b8', width: 100 },
                      { label: 'In Digital Learning', value: 80, unit: 'M', color: '#64748b', width: 85 },
                      { label: 'Need AI Quizzes (SAM)', value: 30, unit: 'M', color: '#475569', width: 65 },
                      { label: 'Our Target Market', value: 10, unit: 'M', color: '#334155', width: 45 },
                      { label: 'Realistic Reach', value: 3, unit: 'M', color: '#1e293b', width: 30 },
                      { label: 'Year 1 Goal (SOM)', value: 0.1, unit: 'M', color: '#4a6fa5', width: 15 },
                    ].map((stage, i) => (
                      <motion.div
                        key={stage.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="flex items-center gap-4"
                      >
                        {/* Funnel bar */}
                        <div className="flex-1 flex justify-center">
                          <div
                            style={{
                              width: `${stage.width}%`,
                              backgroundColor: stage.color,
                            }}
                            className="h-12 rounded-lg flex items-center justify-center relative overflow-hidden group hover:shadow-md transition-all"
                          >
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-sm font-bold text-white relative z-10">
                              {stage.value}{stage.unit}
                            </span>
                          </div>
                        </div>

                        {/* Label */}
                        <div className="w-48 text-right">
                          <p className="text-sm font-medium text-slate-900">{stage.label}</p>
                          <p className="text-xs text-slate-500">{stage.value}{stage.unit} students</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

              </div>
            </div>
          </motion.div>
        )}

        {/* 2. THE MODEL */}
        {activeView === 'model' && (
          <motion.div
            key="model"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            {/* Content - Centered */}
            <div className="relative z-10 w-full h-full flex items-center justify-center px-12">
              <div className="w-full max-w-5xl flex flex-col items-center justify-center gap-10">
                
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <IndianRupee className="w-10 h-10 text-[#4a6fa5]" />
                    <h2 className="font-display text-5xl text-slate-900">Freemium Strategy</h2>
                  </div>
                  <p className="text-xl text-slate-600">
                    Free adoption → Paid conversion → Network effects
                  </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-3 gap-6 w-full">
                  <PricingCard
                    name="Free"
                    price="₹0"
                    period="Always"
                    description="For casual learners"
                    features={['20 quizzes/month', 'Basic uploads', 'Limited sync']}
                    highlighted={false}
                    index={0}
                  />
                  <PricingCard
                    name="Student"
                    price="₹79"
                    period="/month"
                    description="For active learners"
                    features={['Unlimited quizzes', 'All uploads', 'Full sync', 'All themes']}
                    highlighted={true}
                    index={1}
                  />
                  <PricingCard
                    name="Premium"
                    price="₹199"
                    period="/month"
                    description="For power users"
                    features={['Everything', 'Mobile apps', 'SRS algorithm', 'Priority support']}
                    highlighted={false}
                    index={2}
                  />
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-4 gap-6 w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200 rounded-2xl p-6 text-center shadow-lg"
                  >
                    <p className="text-sm text-green-700 mb-2 font-medium">Annual Plan</p>
                    <p className="text-3xl font-bold text-green-600 mb-1">₹699</p>
                    <p className="text-xs text-green-600">Save 36%</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 text-center shadow-lg"
                  >
                    <p className="text-sm text-slate-600 mb-2">Free → Paid</p>
                    <p className="text-4xl font-bold text-blue-600 mb-1">5%</p>
                    <p className="text-xs text-slate-500">Conversion</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 text-center shadow-lg"
                  >
                    <p className="text-sm text-slate-600 mb-2">Avg. LTV</p>
                    <p className="text-4xl font-bold text-[#4a6fa5] mb-1">₹2.4K</p>
                    <p className="text-xs text-slate-500">Per user</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-6 text-center shadow-lg"
                  >
                    <p className="text-sm text-amber-700 mb-2 font-medium">LTV:CAC</p>
                    <p className="text-4xl font-bold text-amber-600 mb-1">4:1</p>
                    <p className="text-xs text-amber-600">Healthy</p>
                  </motion.div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* 3. REVENUE PILLARS */}
        {activeView === 'pillars' && (
          <motion.div
            key="pillars"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            {/* Content - Centered */}
            <div className="relative z-10 w-full h-full flex items-center justify-center px-12">
              <div className="w-full max-w-6xl flex flex-col items-center justify-center gap-8">
                
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <BarChart3 className="w-10 h-10 text-[#4a6fa5]" />
                    <h2 className="font-display text-5xl text-slate-900">Revenue Pillars</h2>
                  </div>
                  <p className="text-xl text-slate-600">
                    Diversified streams for sustainable growth
                  </p>
                </motion.div>

                {/* Pillar Cards - Horizontal Layout */}
                <div className="grid grid-cols-3 gap-6 w-full">
                  {[
                    { icon: Users, title: 'Subscriptions', percentage: 60, color: '#4a6fa5', amount: '₹60L', desc: 'Individual student plans' },
                    { icon: Building2, title: 'B2B Schools', percentage: 25, color: '#b8860b', amount: '₹25L', desc: 'Institutional licenses' },
                    { icon: Code2, title: 'API/Enterprise', percentage: 15, color: '#22c55e', amount: '₹15L', desc: 'White-label solutions' },
                  ].map((pillar, i) => (
                    <motion.div
                      key={pillar.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all group"
                    >
                      {/* Icon and Title */}
                      <div className="flex items-center gap-3 mb-4">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${pillar.color}20` }}
                        >
                          <pillar.icon className="w-6 h-6" style={{ color: pillar.color }} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{pillar.title}</h3>
                          <p className="text-xs text-slate-500">{pillar.desc}</p>
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-600">Revenue Share</span>
                          <span className="text-2xl font-bold" style={{ color: pillar.color }}>{pillar.percentage}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pillar.percentage}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full relative overflow-hidden"
                            style={{ backgroundColor: pillar.color }}
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                              animate={{ x: ['-100%', '200%'] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            />
                          </motion.div>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-center pt-3 border-t border-slate-200">
                        <p className="text-3xl font-bold" style={{ color: pillar.color }}>{pillar.amount}</p>
                        <p className="text-xs text-slate-500 mt-1">Annual target</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* 5-Year Projection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="w-full bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-8 shadow-lg"
                >
                  <h3 className="text-xl font-semibold text-slate-900 mb-6 text-center">5-Year Growth Trajectory</h3>
                  
                  {/* Chart */}
                  <div className="mb-6">
                    <RevenueChart />
                  </div>

                  {/* Milestones - Redesigned */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
                    {[
                      { year: 'Year 1', users: '100K', revenue: '₹1L', color: 'blue' },
                      { year: 'Year 3', users: '1M', revenue: '₹20L', color: 'indigo' },
                      { year: 'Year 5', users: '30M', revenue: '₹50L', color: 'purple', highlight: true },
                    ].map((milestone, i) => (
                      <motion.div
                        key={milestone.year}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className={`text-center p-4 rounded-xl ${
                          milestone.highlight 
                            ? 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-300' 
                            : 'bg-slate-50'
                        }`}
                      >
                        <p className={`text-xs font-semibold uppercase mb-2 ${
                          milestone.highlight ? 'text-purple-700' : 'text-slate-600'
                        }`}>
                          {milestone.year} {milestone.highlight && '🎯'}
                        </p>
                        <p className={`text-2xl font-bold mb-1 ${
                          milestone.highlight ? 'text-purple-900' : 'text-slate-900'
                        }`}>
                          {milestone.users}
                        </p>
                        <p className="text-xs text-slate-500 mb-2">users</p>
                        <p className={`text-xl font-bold ${
                          milestone.highlight ? 'text-purple-700' : 'text-[#4a6fa5]'
                        }`}>
                          {milestone.revenue}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

              </div>
            </div>
          </motion.div>
        )}

        {/* 4. THE ASK & CLOSING */}
        {activeView === 'askClose' && (
          <motion.div
            key="askClose"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            {/* Radial gradient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full 
                            bg-gradient-radial from-[#4a6fa5]/20 via-[#4a6fa5]/5 to-transparent blur-3xl pointer-events-none" />

            {/* Content - Centered */}
            <div className="relative z-10 w-full h-full flex items-center justify-center px-12">
              <div className="w-full max-w-5xl flex flex-col items-center justify-center gap-10">
                
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <TrendingUp className="w-10 h-10 text-[#4a6fa5]" />
                    <h2 className="font-display text-5xl text-[#4a6fa5]">The Ask</h2>
                  </div>
                  <p className="text-xl text-slate-700 font-medium">
                    Join us in building India's most loved learning platform
                  </p>
                </motion.div>

                {/* Three Box Ask */}
                <div className="grid grid-cols-3 gap-8 w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-2 border-blue-500/40 rounded-2xl p-6 text-center shadow-xl"
                  >
                    <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Funding</p>
                    <p className="text-5xl font-bold text-blue-600 mb-2">₹10L</p>
                    <p className="text-sm text-blue-700 font-medium">Seed Round</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/40 rounded-2xl p-6 text-center shadow-xl"
                  >
                    <p className="text-xs font-semibold text-green-700 uppercase mb-2">Use of Funds</p>
                    <div className="text-sm text-green-700 space-y-1 font-medium">
                      <div>40% Product</div>
                      <div>40% Marketing</div>
                      <div>20% Team</div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-500/40 rounded-2xl p-6 text-center shadow-xl"
                  >
                    <p className="text-xs font-semibold text-purple-700 uppercase mb-2">Milestone</p>
                    <p className="text-5xl font-bold text-purple-600 mb-2">100K</p>
                    <p className="text-sm text-purple-700 font-medium">users in 12mo</p>
                  </motion.div>
                </div>

                {/* Call to Action */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: 'spring' }}
                  className="bg-gradient-to-r from-[#4a6fa5] to-[#5a7fb5] rounded-2xl p-8 text-center text-white shadow-2xl w-full"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-blue-100">Let's Build Together</p>
                  <p className="text-3xl font-bold mb-4">Turn Learning Into a Calm Revolution</p>
                  <p className="text-blue-100 text-base max-w-2xl mx-auto leading-relaxed">
                    Quietude isn't just software—it's a movement to make learning calmer, smarter, and more accessible to every student in India.
                  </p>
                </motion.div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
