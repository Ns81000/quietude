import { ReactNode } from 'react';
import { 
  FaTree, FaWater, FaMoon 
} from 'react-icons/fa';
import { 
  BsFillCloudRainFill 
} from 'react-icons/bs';
import { 
  BiSolidCoffeeAlt 
} from 'react-icons/bi';
import { 
  GiSoundWaves 
} from 'react-icons/gi';

export interface Collection {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  sounds: Array<{
    id: string;
    volume: number; // 0-1
  }>;
  gradient: [string, string]; // CSS gradient colors
}

export const collections: Collection[] = [
  {
    id: 'forest-retreat',
    name: 'Forest Retreat',
    description: 'Immerse yourself in nature',
    icon: <FaTree />,
    sounds: [
      { id: 'birds', volume: 0.6 },
      { id: 'wind-in-trees', volume: 0.4 },
      { id: 'river', volume: 0.5 },
      { id: 'crickets', volume: 0.3 }
    ],
    gradient: ['hsl(145, 35%, 45%)', 'hsl(120, 30%, 35%)']
  },
  {
    id: 'rainy-day',
    name: 'Rainy Day',
    description: 'Cozy indoor vibes',
    icon: <BsFillCloudRainFill />,
    sounds: [
      { id: 'light-rain', volume: 0.7 },
      { id: 'rain-on-window', volume: 0.5 },
      { id: 'thunder', volume: 0.3 },
      { id: 'wind', volume: 0.4 }
    ],
    gradient: ['hsl(210, 30%, 50%)', 'hsl(220, 25%, 40%)']
  },
  {
    id: 'cafe-ambience',
    name: 'Cafe Ambience',
    description: 'Work in a bustling cafe',
    icon: <BiSolidCoffeeAlt />,
    sounds: [
      { id: 'cafe', volume: 0.6 },
      { id: 'keyboard', volume: 0.4 },
      { id: 'paper', volume: 0.3 },
      { id: 'crowd', volume: 0.5 }
    ],
    gradient: ['hsl(30, 40%, 55%)', 'hsl(25, 35%, 45%)']
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    description: 'Peaceful seaside escape',
    icon: <FaWater />,
    sounds: [
      { id: 'waves', volume: 0.7 },
      { id: 'seagulls', volume: 0.4 },
      { id: 'wind', volume: 0.3 },
      { id: 'sailboat', volume: 0.5 }
    ],
    gradient: ['hsl(200, 60%, 55%)', 'hsl(190, 50%, 45%)']
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    description: 'Minimal distractions',
    icon: <GiSoundWaves />,
    sounds: [
      { id: 'white-noise', volume: 0.5 },
      { id: 'ceiling-fan', volume: 0.4 },
      { id: 'clock', volume: 0.3 }
    ],
    gradient: ['hsl(240, 20%, 30%)', 'hsl(260, 15%, 25%)']
  },
  {
    id: 'night-study',
    name: 'Night Study',
    description: 'Late-night concentration',
    icon: <FaMoon />,
    sounds: [
      { id: 'crickets', volume: 0.5 },
      { id: 'owl', volume: 0.3 },
      { id: 'night-village', volume: 0.4 },
      { id: 'clock', volume: 0.2 }
    ],
    gradient: ['hsl(240, 30%, 20%)', 'hsl(260, 25%, 15%)']
  }
];

// Helper function to get collection by ID
export function getCollectionById(id: string): Collection | undefined {
  return collections.find(c => c.id === id);
}
