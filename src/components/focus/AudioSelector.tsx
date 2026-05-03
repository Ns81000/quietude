import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import { useFocusStore } from '@/store/focus';
import { categories, getAllSounds, getSoundById } from '@/lib/focus/audioData';
import { collections } from '@/lib/focus/collections';
import { AudioCard } from './AudioCard';
import { StepIndicator } from './StepIndicator';
import { SelectedSoundsSidebar } from './SelectedSoundsSidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

export function AudioSelector() {
  const navigate = useNavigate();
  const {
    selectedSounds,
    selectedCategory,
    setCategory,
    toggleSound,
    setSoundVolume,
    clearSounds,
    nextStep,
    previousStep
  } = useFocusStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllSounds, setShowAllSounds] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  
  const currentCategory = categories.find(c => c.id === selectedCategory) || categories[0];
  
  // Filter sounds based on search query
  const filteredSounds = searchQuery
    ? currentCategory.sounds.filter(sound =>
        sound.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentCategory.sounds;
  
  // Show only first 8 sounds initially, unless searching or "Show More" is clicked
  const INITIAL_SOUND_COUNT = 8;
  const displayedSounds = searchQuery || showAllSounds 
    ? filteredSounds 
    : filteredSounds.slice(0, INITIAL_SOUND_COUNT);
  const hasMoreSounds = filteredSounds.length > INITIAL_SOUND_COUNT;
  const hiddenSoundsCount = filteredSounds.length - INITIAL_SOUND_COUNT;
  
  // Get all selected sounds (including from other categories) to keep them mounted
  const selectedSoundObjects = selectedSounds
    .map(id => getSoundById(id))
    .filter(Boolean);
  
  // Combine displayed sounds with selected sounds from other categories
  // This ensures selected sounds stay mounted even when switching categories
  const allSoundsToRender = [
    ...displayedSounds,
    ...selectedSoundObjects.filter(sound => 
      sound && !displayedSounds.find(s => s.id === sound.id)
    )
  ];
  
  // Check if any hidden sounds are selected
  const hasHiddenSelection = !showAllSounds && selectedSounds.some(soundId => {
    const sound = getSoundById(soundId);
    return sound && !displayedSounds.find(s => s.id === soundId);
  });
  
  // Reset showAll when category changes - memoized for performance
  const handleCategoryChange = useCallback((categoryId: string) => {
    setCategory(categoryId);
    setSearchQuery('');
    setShowAllSounds(false);
  }, [setCategory]);
  
  const handleLoadCollection = useCallback((collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      clearSounds();
      // First set all volumes, then toggle sounds
      collection.sounds.forEach(({ id, volume }) => {
        setSoundVolume(id, volume);
      });
      // Small delay to ensure volumes are set before toggling
      setTimeout(() => {
        collection.sounds.forEach(({ id }) => {
          toggleSound(id);
        });
      }, 0);
    }
  }, [clearSounds, setSoundVolume, toggleSound]);
  
  const handleNext = useCallback(() => {
    if (selectedSounds.length > 0) {
      nextStep();
    }
  }, [selectedSounds.length, nextStep]);
  
  const handleRemoveSound = useCallback((soundId: string) => {
    toggleSound(soundId);
  }, [toggleSound]);
  
  const handleClose = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);
  
  const handleToggleMobileSheet = useCallback(() => {
    setShowMobileSheet(prev => !prev);
  }, []);
  
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);
  
  const handlePreviousStep = useCallback(() => {
    previousStep();
  }, [previousStep]);
  
  // Memoize selected sounds set for faster lookups
  const selectedSoundsSet = useMemo(() => new Set(selectedSounds), [selectedSounds]);
  
  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      {/* Close Button - Improved Styling */}
      <button
        onClick={handleClose}
        className="fixed top-4 right-4 md:top-8 md:right-8 lg:right-[340px] z-30 group touch-manipulation"
        style={{ touchAction: 'manipulation' }}
        title="Close"
        aria-label="Close"
      >
        <div className="relative p-2.5 rounded-full bg-surface/80 backdrop-blur-md border border-border/50 shadow-lg transition-all duration-200 group-hover:bg-surface group-hover:border-border group-hover:shadow-xl group-active:scale-95">
          <X size={20} className="text-text-soft group-hover:text-text transition-colors" />
        </div>
      </button>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto pb-24 lg:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-6"
        >
          {/* Step Indicator */}
          <StepIndicator />
          
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-2xl md:text-4xl text-text">
              Choose Your Sounds
            </h1>
            <p className="text-sm md:text-base text-text-soft">
              Select sounds to create your perfect focus environment
            </p>
            {/* Total Sounds Badge - Subtle */}
            <div className="flex justify-center pt-1">
              <span className="text-xs text-text-muted">
                {getAllSounds().length} sounds
              </span>
            </div>
          </div>
          
          {/* Quick Presets Shelf - Always Visible */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-text-soft uppercase tracking-wide">
              Quick Presets
            </h2>
            <div className="relative">
              {/* Native horizontal scroll container with smooth scrolling */}
              <div 
                className="overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth md:overflow-x-visible"
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                <div className="flex gap-3 pb-2 md:flex-wrap">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => handleLoadCollection(collection.id)}
                      className="flex-shrink-0 px-4 py-3 rounded-xl border-2 border-border hover:border-accent bg-surface hover:bg-accent/5 active:bg-accent/10 transition-all duration-200 group w-[160px] touch-manipulation active:scale-[0.98]"
                      style={{ touchAction: 'manipulation' }}
                      aria-label={`Load ${collection.name} preset`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-xl text-accent transition-transform duration-200 group-hover:scale-110">{collection.icon}</div>
                        <div className="text-left">
                          <h3 className="text-sm font-semibold text-text group-hover:text-accent transition-colors line-clamp-1">
                            {collection.name}
                          </h3>
                          <p className="text-xs text-text-muted line-clamp-1">
                            {collection.sounds.length} sounds
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Category Tabs with Fade */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-soft uppercase tracking-wide">
                Browse by Category
              </h2>
              {selectedSounds.length > 0 && (
                <Button
                  onClick={clearSounds}
                  variant="ghost"
                  size="sm"
                  className="text-incorrect hover:text-incorrect h-8 lg:hidden"
                >
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="relative">
              {/* Native horizontal scroll container with smooth scrolling */}
              <div 
                className="overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth md:overflow-x-visible"
                style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                <div className="flex gap-2 pb-2 md:flex-wrap">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 touch-manipulation active:scale-[0.98] ${
                        selectedCategory === category.id
                          ? 'bg-accent text-accent-text shadow-md'
                          : 'bg-bg-2 text-text-soft hover:text-text hover:bg-accent/10 active:bg-accent/15'
                      }`}
                      style={{ touchAction: 'manipulation' }}
                      title={category.title}
                      aria-label={`Filter by ${category.title}`}
                      aria-pressed={selectedCategory === category.id}
                    >
                      <span className="text-base md:text-lg">{category.icon}</span>
                      <span className="md:inline">{category.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              type="text"
              placeholder={`Search in ${currentCategory.title}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Sounds Grid */}
          {filteredSounds.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                {/* Render all sounds - visible ones in grid, hidden ones off-screen */}
                {displayedSounds.map((sound) => (
                  <AudioCard
                    key={sound.id}
                    sound={sound}
                    isSelected={selectedSoundsSet.has(sound.id)}
                  />
                ))}
              </div>
              
              {/* Keep selected sounds from other categories mounted but hidden */}
              <div className="hidden" aria-hidden="true">
                {selectedSoundObjects
                  .filter(sound => sound && !displayedSounds.find(s => s.id === sound.id))
                  .map((sound) => (
                    <AudioCard
                      key={sound.id}
                      sound={sound}
                      isSelected={true}
                    />
                  ))}
              </div>
              
              {/* Show More/Less Button */}
              {hasMoreSounds && !searchQuery && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setShowAllSounds(!showAllSounds)}
                    className="relative px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 bg-surface text-text border-2 border-border hover:border-accent hover:text-accent hover:bg-accent/5 active:bg-accent/10 active:scale-[0.98] touch-manipulation"
                    style={{ touchAction: 'manipulation' }}
                    aria-label={showAllSounds ? 'Show less sounds' : `Show ${hiddenSoundsCount} more sounds`}
                  >
                    {/* Top gradient line */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    
                    <span>
                      {showAllSounds 
                        ? 'Show Less' 
                        : `Show ${hiddenSoundsCount} More`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-text-soft">No sounds found matching "{searchQuery}"</p>
              <Button
                onClick={handleClearSearch}
                variant="ghost"
                className="mt-2 touch-manipulation"
                style={{ touchAction: 'manipulation' }}
              >
                Clear search
              </Button>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Right Sidebar - Desktop Only */}
      <div className="hidden lg:block lg:w-80 border-l border-border bg-surface/50 backdrop-blur-sm">
        <div className="sticky top-0 h-screen">
          <SelectedSoundsSidebar
            onBack={handlePreviousStep}
            onNext={handleNext}
            onRemoveSound={handleRemoveSound}
            onClearAll={clearSounds}
          />
        </div>
      </div>
      
      {/* Mobile Bottom Tray - Enhanced with Expandable Sheet */}
      <AnimatePresence>
        {selectedSounds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-30"
          >
            {/* Compact Bottom Bar */}
            <div className="bg-surface/95 backdrop-blur-md border-t border-border shadow-2xl">
              <div className="w-full max-w-6xl mx-auto px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Back Button */}
                  <Button
                    onClick={handlePreviousStep}
                    variant="outline"
                    size="sm"
                    className="gap-2 flex-shrink-0 h-10 touch-manipulation active:scale-95"
                    style={{ touchAction: 'manipulation' }}
                    aria-label="Go back to time selection"
                  >
                    <ArrowLeft size={16} />
                  </Button>
                  
                  {/* Selected Sounds Preview - Tap to expand */}
                  <button
                    onClick={handleToggleMobileSheet}
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/30 hover:bg-accent/15 active:bg-accent/20 transition-all duration-200 min-w-0 touch-manipulation active:scale-[0.98]"
                    style={{ touchAction: 'manipulation' }}
                    aria-label={`${selectedSounds.length} sounds selected. Tap to view and edit`}
                    aria-expanded={showMobileSheet}
                  >
                    {/* Sound Icons Preview */}
                    <div className="flex -space-x-2 flex-shrink-0">
                      {selectedSounds.slice(0, 3).map((soundId) => {
                        const sound = getSoundById(soundId);
                        if (!sound) return null;
                        return (
                          <div
                            key={soundId}
                            className="w-8 h-8 rounded-full bg-surface border-2 border-accent/30 flex items-center justify-center text-sm"
                          >
                            {sound.icon}
                          </div>
                        );
                      })}
                      {selectedSounds.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-accent text-accent-text border-2 border-accent/30 flex items-center justify-center text-xs font-semibold">
                          +{selectedSounds.length - 3}
                        </div>
                      )}
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {selectedSounds.length} sound{selectedSounds.length !== 1 ? 's' : ''} selected
                      </p>
                      <p className="text-xs text-text-muted">Tap to view & edit</p>
                    </div>
                    
                    {/* Chevron */}
                    <motion.div
                      animate={{ rotate: showMobileSheet ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-soft">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </motion.div>
                  </button>
                  
                  {/* Start Button */}
                  <Button
                    onClick={handleNext}
                    className="gap-2 flex-shrink-0 h-10 touch-manipulation active:scale-95"
                    style={{ touchAction: 'manipulation' }}
                    aria-label="Start focus session"
                  >
                    Start
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Expandable Sheet with Selected Sounds */}
            <AnimatePresence>
              {showMobileSheet && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="bg-surface/98 backdrop-blur-md border-t border-border overflow-hidden"
                >
                  <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-text">Selected Sounds</h3>
                      <Button
                        onClick={clearSounds}
                        variant="ghost"
                        size="sm"
                        className="text-incorrect hover:text-incorrect h-8 -mr-2"
                      >
                        Clear All
                      </Button>
                    </div>
                    
                    {/* Selected Sounds List */}
                    <div className="space-y-2">
                      {selectedSounds.map((soundId) => {
                        const sound = getSoundById(soundId);
                        if (!sound) return null;
                        
                        return (
                          <motion.div
                            key={soundId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center gap-3 p-3 rounded-lg bg-bg-2 border border-border"
                          >
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-xl flex-shrink-0">
                              {sound.icon}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text truncate">
                                {sound.label}
                              </p>
                              <p className="text-xs text-text-muted capitalize">
                                {sound.category}
                              </p>
                            </div>
                            
                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveSound(soundId)}
                              className="w-8 h-8 rounded-full bg-incorrect/10 hover:bg-incorrect/20 active:bg-incorrect/30 flex items-center justify-center text-incorrect transition-all duration-200 flex-shrink-0 touch-manipulation active:scale-95"
                              style={{ touchAction: 'manipulation' }}
                              aria-label={`Remove ${sound.label}`}
                            >
                              <X size={16} />
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Fallback Navigation (when no sounds selected) - Mobile Only */}
      {selectedSounds.length === 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border z-30">
          <div className="w-full max-w-6xl mx-auto p-4">
            <div className="flex justify-between items-center">
              <Button
                onClick={handlePreviousStep}
                variant="outline"
                className="gap-2 touch-manipulation active:scale-95"
                style={{ touchAction: 'manipulation' }}
                aria-label="Go back to time selection"
              >
                <ArrowLeft size={18} />
                Back
              </Button>
              
              <Button
                onClick={handleNext}
                disabled
                className="gap-2 touch-manipulation"
                style={{ touchAction: 'manipulation' }}
                aria-label="Start session (disabled - select sounds first)"
              >
                Start Session
                <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
