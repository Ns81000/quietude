import { ReactNode } from 'react';
import { 
  BiSolidTree, BiWater, BiSolidTraffic, BiSolidCoffeeAlt, 
  BiSolidPlaneAlt, BiSolidDryer, BiSolidTrain 
} from 'react-icons/bi';
import { 
  BsFire, BsFillDropletFill, BsFillCloudRainFill, BsFillCloudRainHeavyFill,
  BsUmbrellaFill, BsSoundwave, BsPeopleFill, BsFillKeyboardFill
} from 'react-icons/bs';
import { 
  FaWater, FaWind, FaLeaf, FaRegSnowflake, FaTree, FaDog, FaFrog,
  FaHorseHead, FaCat, FaCrow, FaCity, FaRoad, FaChurch, FaSubway,
  FaShoppingBasket, FaCarSide, FaKeyboard, FaClock, FaFan
} from 'react-icons/fa';
import { 
  GiWaterfall, GiStonePile, GiSeagull, GiWolfHead, GiOwl, GiWhaleTail,
  GiTreeBeehive, GiEgyptianBird, GiChicken, GiCow, GiSheep, GiCricket,
  GiWindow, GiVillage, GiCarousel, GiSubmarine, GiSailboat, GiWindchimes,
  GiFilmProjector, GiWashingMachine, GiSoundWaves
} from 'react-icons/gi';
import { 
  PiBirdFill, PiDogBold, PiRoadHorizonFill, PiSirenBold, PiTentFill,
  PiVinylRecord 
} from 'react-icons/pi';
import { 
  MdOutlineThunderstorm, MdTempleBuddhist, MdConstruction, MdLocationPin,
  MdSmartToy, MdWaterDrop, MdRadio 
} from 'react-icons/md';
import { 
  TbScubaMask, TbBeerFilled, TbSailboat, TbBowlFilled, TbWiper 
} from 'react-icons/tb';
import { 
  RiSparkling2Fill, RiFilePaper2Fill, RiBubbleChartFill 
} from 'react-icons/ri';
import { HiOfficeBuilding } from 'react-icons/hi';
import { AiFillExperiment } from 'react-icons/ai';
import { IoRestaurant } from 'react-icons/io5';
import { IoIosRadio } from 'react-icons/io';
import { FaBookOpen } from 'react-icons/fa6';

export interface Sound {
  id: string;
  label: string;
  icon: ReactNode;
  src: string;
  category: string;
}

export interface Category {
  id: string;
  title: string;
  icon: ReactNode;
  sounds: Sound[];
}

// Audio base URL - use local files in development, GitHub in production
export const GITHUB_AUDIO_BASE = 
  import.meta.env.DEV 
    ? '/sounds/' 
    : 'https://raw.githubusercontent.com/Ns81000/quietude/main/public/sounds/';

// Nature sounds
export const natureCategory: Category = {
  id: 'nature',
  title: 'Nature',
  icon: <BiSolidTree />,
  sounds: [
    {
      id: 'river',
      label: 'River',
      icon: <BiWater />,
      src: `${GITHUB_AUDIO_BASE}nature/river.mp3`,
      category: 'nature'
    },
    {
      id: 'waves',
      label: 'Waves',
      icon: <FaWater />,
      src: `${GITHUB_AUDIO_BASE}nature/waves.mp3`,
      category: 'nature'
    },
    {
      id: 'campfire',
      label: 'Campfire',
      icon: <BsFire />,
      src: `${GITHUB_AUDIO_BASE}nature/campfire.mp3`,
      category: 'nature'
    },
    {
      id: 'wind',
      label: 'Wind',
      icon: <FaWind />,
      src: `${GITHUB_AUDIO_BASE}nature/wind.mp3`,
      category: 'nature'
    },
    {
      id: 'howling-wind',
      label: 'Howling Wind',
      icon: <FaWind />,
      src: `${GITHUB_AUDIO_BASE}nature/howling-wind.mp3`,
      category: 'nature'
    },
    {
      id: 'wind-in-trees',
      label: 'Wind in Trees',
      icon: <BiSolidTree />,
      src: `${GITHUB_AUDIO_BASE}nature/wind-in-trees.mp3`,
      category: 'nature'
    },
    {
      id: 'waterfall',
      label: 'Waterfall',
      icon: <GiWaterfall />,
      src: `${GITHUB_AUDIO_BASE}nature/waterfall.mp3`,
      category: 'nature'
    },
    {
      id: 'walk-in-snow',
      label: 'Walk in Snow',
      icon: <FaRegSnowflake />,
      src: `${GITHUB_AUDIO_BASE}nature/walk-in-snow.mp3`,
      category: 'nature'
    },
    {
      id: 'walk-on-leaves',
      label: 'Walk on Leaves',
      icon: <FaLeaf />,
      src: `${GITHUB_AUDIO_BASE}nature/walk-on-leaves.mp3`,
      category: 'nature'
    },
    {
      id: 'walk-on-gravel',
      label: 'Walk on Gravel',
      icon: <GiStonePile />,
      src: `${GITHUB_AUDIO_BASE}nature/walk-on-gravel.mp3`,
      category: 'nature'
    },
    {
      id: 'droplets',
      label: 'Droplets',
      icon: <BsFillDropletFill />,
      src: `${GITHUB_AUDIO_BASE}nature/droplets.mp3`,
      category: 'nature'
    },
    {
      id: 'jungle',
      label: 'Jungle',
      icon: <FaTree />,
      src: `${GITHUB_AUDIO_BASE}nature/jungle.mp3`,
      category: 'nature'
    },
  ],
};

// Rain sounds
export const rainCategory: Category = {
  id: 'rain',
  title: 'Rain',
  icon: <BsFillCloudRainFill />,
  sounds: [
    {
      id: 'light-rain',
      label: 'Light Rain',
      icon: <BsFillCloudRainFill />,
      src: `${GITHUB_AUDIO_BASE}rain/light-rain.mp3`,
      category: 'rain'
    },
    {
      id: 'heavy-rain',
      label: 'Heavy Rain',
      icon: <BsFillCloudRainHeavyFill />,
      src: `${GITHUB_AUDIO_BASE}rain/heavy-rain.mp3`,
      category: 'rain'
    },
    {
      id: 'thunder',
      label: 'Thunder',
      icon: <MdOutlineThunderstorm />,
      src: `${GITHUB_AUDIO_BASE}rain/thunder.mp3`,
      category: 'rain'
    },
    {
      id: 'rain-on-window',
      label: 'Rain on Window',
      icon: <GiWindow />,
      src: `${GITHUB_AUDIO_BASE}rain/rain-on-window.mp3`,
      category: 'rain'
    },
    {
      id: 'rain-on-car-roof',
      label: 'Rain on Car Roof',
      icon: <FaCarSide />,
      src: `${GITHUB_AUDIO_BASE}rain/rain-on-car-roof.mp3`,
      category: 'rain'
    },
    {
      id: 'rain-on-umbrella',
      label: 'Rain on Umbrella',
      icon: <BsUmbrellaFill />,
      src: `${GITHUB_AUDIO_BASE}rain/rain-on-umbrella.mp3`,
      category: 'rain'
    },
    {
      id: 'rain-on-tent',
      label: 'Rain on Tent',
      icon: <PiTentFill />,
      src: `${GITHUB_AUDIO_BASE}rain/rain-on-tent.mp3`,
      category: 'rain'
    },
    {
      id: 'rain-on-leaves',
      label: 'Rain on Leaves',
      icon: <FaLeaf />,
      src: `${GITHUB_AUDIO_BASE}rain/rain-on-leaves.mp3`,
      category: 'rain'
    },
  ],
};

// Animal sounds
export const animalsCategory: Category = {
  id: 'animals',
  title: 'Animals',
  icon: <FaDog />,
  sounds: [
    {
      id: 'birds',
      label: 'Birds',
      icon: <PiBirdFill />,
      src: `${GITHUB_AUDIO_BASE}animals/birds.mp3`,
      category: 'animals'
    },
    {
      id: 'seagulls',
      label: 'Seagulls',
      icon: <GiSeagull />,
      src: `${GITHUB_AUDIO_BASE}animals/seagulls.mp3`,
      category: 'animals'
    },
    {
      id: 'crickets',
      label: 'Crickets',
      icon: <GiCricket />,
      src: `${GITHUB_AUDIO_BASE}animals/crickets.mp3`,
      category: 'animals'
    },
    {
      id: 'wolf',
      label: 'Wolf',
      icon: <GiWolfHead />,
      src: `${GITHUB_AUDIO_BASE}animals/wolf.mp3`,
      category: 'animals'
    },
    {
      id: 'owl',
      label: 'Owl',
      icon: <GiOwl />,
      src: `${GITHUB_AUDIO_BASE}animals/owl.mp3`,
      category: 'animals'
    },
    {
      id: 'frog',
      label: 'Frog',
      icon: <FaFrog />,
      src: `${GITHUB_AUDIO_BASE}animals/frog.mp3`,
      category: 'animals'
    },
    {
      id: 'dog-barking',
      label: 'Dog Barking',
      icon: <PiDogBold />,
      src: `${GITHUB_AUDIO_BASE}animals/dog-barking.mp3`,
      category: 'animals'
    },
    {
      id: 'horse-galopp',
      label: 'Horse Galopp',
      icon: <FaHorseHead />,
      src: `${GITHUB_AUDIO_BASE}animals/horse-galopp.mp3`,
      category: 'animals'
    },
    {
      id: 'cat-purring',
      label: 'Cat Purring',
      icon: <FaCat />,
      src: `${GITHUB_AUDIO_BASE}animals/cat-purring.mp3`,
      category: 'animals'
    },
    {
      id: 'crows',
      label: 'Crows',
      icon: <FaCrow />,
      src: `${GITHUB_AUDIO_BASE}animals/crows.mp3`,
      category: 'animals'
    },
    {
      id: 'whale',
      label: 'Whale',
      icon: <GiWhaleTail />,
      src: `${GITHUB_AUDIO_BASE}animals/whale.mp3`,
      category: 'animals'
    },
    {
      id: 'beehive',
      label: 'Beehive',
      icon: <GiTreeBeehive />,
      src: `${GITHUB_AUDIO_BASE}animals/beehive.mp3`,
      category: 'animals'
    },
    {
      id: 'woodpecker',
      label: 'Woodpecker',
      icon: <GiEgyptianBird />,
      src: `${GITHUB_AUDIO_BASE}animals/woodpecker.mp3`,
      category: 'animals'
    },
    {
      id: 'chickens',
      label: 'Chickens',
      icon: <GiChicken />,
      src: `${GITHUB_AUDIO_BASE}animals/chickens.mp3`,
      category: 'animals'
    },
    {
      id: 'cows',
      label: 'Cows',
      icon: <GiCow />,
      src: `${GITHUB_AUDIO_BASE}animals/cows.mp3`,
      category: 'animals'
    },
    {
      id: 'sheep',
      label: 'Sheep',
      icon: <GiSheep />,
      src: `${GITHUB_AUDIO_BASE}animals/sheep.mp3`,
      category: 'animals'
    },
  ],
};

// Urban sounds
export const urbanCategory: Category = {
  id: 'urban',
  title: 'Urban',
  icon: <FaCity />,
  sounds: [
    {
      id: 'highway',
      label: 'Highway',
      icon: <PiRoadHorizonFill />,
      src: `${GITHUB_AUDIO_BASE}urban/highway.mp3`,
      category: 'urban'
    },
    {
      id: 'road',
      label: 'Road',
      icon: <FaRoad />,
      src: `${GITHUB_AUDIO_BASE}urban/road.mp3`,
      category: 'urban'
    },
    {
      id: 'ambulance-siren',
      label: 'Ambulance Siren',
      icon: <PiSirenBold />,
      src: `${GITHUB_AUDIO_BASE}urban/ambulance-siren.mp3`,
      category: 'urban'
    },
    {
      id: 'busy-street',
      label: 'Busy Street',
      icon: <BsSoundwave />,
      src: `${GITHUB_AUDIO_BASE}urban/busy-street.mp3`,
      category: 'urban'
    },
    {
      id: 'crowd',
      label: 'Crowd',
      icon: <BsPeopleFill />,
      src: `${GITHUB_AUDIO_BASE}urban/crowd.mp3`,
      category: 'urban'
    },
    {
      id: 'traffic',
      label: 'Traffic',
      icon: <BiSolidTraffic />,
      src: `${GITHUB_AUDIO_BASE}urban/traffic.mp3`,
      category: 'urban'
    },
    {
      id: 'fireworks',
      label: 'Fireworks',
      icon: <RiSparkling2Fill />,
      src: `${GITHUB_AUDIO_BASE}urban/fireworks.mp3`,
      category: 'urban'
    },
  ],
};

// Places sounds
export const placesCategory: Category = {
  id: 'places',
  title: 'Places',
  icon: <MdLocationPin />,
  sounds: [
    {
      id: 'cafe',
      label: 'Cafe',
      icon: <BiSolidCoffeeAlt />,
      src: `${GITHUB_AUDIO_BASE}places/cafe.mp3`,
      category: 'places'
    },
    {
      id: 'airport',
      label: 'Airport',
      icon: <BiSolidPlaneAlt />,
      src: `${GITHUB_AUDIO_BASE}places/airport.mp3`,
      category: 'places'
    },
    {
      id: 'church',
      label: 'Church',
      icon: <FaChurch />,
      src: `${GITHUB_AUDIO_BASE}places/church.mp3`,
      category: 'places'
    },
    {
      id: 'temple',
      label: 'Temple',
      icon: <MdTempleBuddhist />,
      src: `${GITHUB_AUDIO_BASE}places/temple.mp3`,
      category: 'places'
    },
    {
      id: 'construction-site',
      label: 'Construction Site',
      icon: <MdConstruction />,
      src: `${GITHUB_AUDIO_BASE}places/construction-site.mp3`,
      category: 'places'
    },
    {
      id: 'underwater',
      label: 'Underwater',
      icon: <TbScubaMask />,
      src: `${GITHUB_AUDIO_BASE}places/underwater.mp3`,
      category: 'places'
    },
    {
      id: 'crowded-bar',
      label: 'Crowded Bar',
      icon: <TbBeerFilled />,
      src: `${GITHUB_AUDIO_BASE}places/crowded-bar.mp3`,
      category: 'places'
    },
    {
      id: 'night-village',
      label: 'Night Village',
      icon: <GiVillage />,
      src: `${GITHUB_AUDIO_BASE}places/night-village.mp3`,
      category: 'places'
    },
    {
      id: 'subway-station',
      label: 'Subway Station',
      icon: <FaSubway />,
      src: `${GITHUB_AUDIO_BASE}places/subway-station.mp3`,
      category: 'places'
    },
    {
      id: 'office',
      label: 'Office',
      icon: <HiOfficeBuilding />,
      src: `${GITHUB_AUDIO_BASE}places/office.mp3`,
      category: 'places'
    },
    {
      id: 'supermarket',
      label: 'Supermarket',
      icon: <FaShoppingBasket />,
      src: `${GITHUB_AUDIO_BASE}places/supermarket.mp3`,
      category: 'places'
    },
    {
      id: 'carousel',
      label: 'Carousel',
      icon: <GiCarousel />,
      src: `${GITHUB_AUDIO_BASE}places/carousel.mp3`,
      category: 'places'
    },
    {
      id: 'laboratory',
      label: 'Laboratory',
      icon: <AiFillExperiment />,
      src: `${GITHUB_AUDIO_BASE}places/laboratory.mp3`,
      category: 'places'
    },
    {
      id: 'laundry-room',
      label: 'Laundry Room',
      icon: <BiSolidDryer />,
      src: `${GITHUB_AUDIO_BASE}places/laundry-room.mp3`,
      category: 'places'
    },
    {
      id: 'restaurant',
      label: 'Restaurant',
      icon: <IoRestaurant />,
      src: `${GITHUB_AUDIO_BASE}places/restaurant.mp3`,
      category: 'places'
    },
    {
      id: 'library',
      label: 'Library',
      icon: <FaBookOpen />,
      src: `${GITHUB_AUDIO_BASE}places/library.mp3`,
      category: 'places'
    },
  ],
};

// Transport sounds
export const transportCategory: Category = {
  id: 'transport',
  title: 'Transport',
  icon: <FaCarSide />,
  sounds: [
    {
      id: 'train',
      label: 'Train',
      icon: <BiSolidTrain />,
      src: `${GITHUB_AUDIO_BASE}transport/train.mp3`,
      category: 'transport'
    },
    {
      id: 'inside-a-train',
      label: 'Inside a Train',
      icon: <BiSolidTrain />,
      src: `${GITHUB_AUDIO_BASE}transport/inside-a-train.mp3`,
      category: 'transport'
    },
    {
      id: 'airplane',
      label: 'Airplane',
      icon: <BiSolidPlaneAlt />,
      src: `${GITHUB_AUDIO_BASE}transport/airplane.mp3`,
      category: 'transport'
    },
    {
      id: 'submarine',
      label: 'Submarine',
      icon: <GiSubmarine />,
      src: `${GITHUB_AUDIO_BASE}transport/submarine.mp3`,
      category: 'transport'
    },
    {
      id: 'sailboat',
      label: 'Sailboat',
      icon: <GiSailboat />,
      src: `${GITHUB_AUDIO_BASE}transport/sailboat.mp3`,
      category: 'transport'
    },
    {
      id: 'rowing-boat',
      label: 'Rowing Boat',
      icon: <TbSailboat />,
      src: `${GITHUB_AUDIO_BASE}transport/rowing-boat.mp3`,
      category: 'transport'
    },
  ],
};

// Things sounds
export const thingsCategory: Category = {
  id: 'things',
  title: 'Things',
  icon: <MdSmartToy />,
  sounds: [
    {
      id: 'keyboard',
      label: 'Keyboard',
      icon: <BsFillKeyboardFill />,
      src: `${GITHUB_AUDIO_BASE}things/keyboard.mp3`,
      category: 'things'
    },
    {
      id: 'typewriter',
      label: 'Typewriter',
      icon: <FaKeyboard />,
      src: `${GITHUB_AUDIO_BASE}things/typewriter.mp3`,
      category: 'things'
    },
    {
      id: 'paper',
      label: 'Paper',
      icon: <RiFilePaper2Fill />,
      src: `${GITHUB_AUDIO_BASE}things/paper.mp3`,
      category: 'things'
    },
    {
      id: 'clock',
      label: 'Clock',
      icon: <FaClock />,
      src: `${GITHUB_AUDIO_BASE}things/clock.mp3`,
      category: 'things'
    },
    {
      id: 'wind-chimes',
      label: 'Wind Chimes',
      icon: <GiWindchimes />,
      src: `${GITHUB_AUDIO_BASE}things/wind-chimes.mp3`,
      category: 'things'
    },
    {
      id: 'singing-bowl',
      label: 'Singing Bowl',
      icon: <TbBowlFilled />,
      src: `${GITHUB_AUDIO_BASE}things/singing-bowl.mp3`,
      category: 'things'
    },
    {
      id: 'ceiling-fan',
      label: 'Ceiling Fan',
      icon: <FaFan />,
      src: `${GITHUB_AUDIO_BASE}things/ceiling-fan.mp3`,
      category: 'things'
    },
    {
      id: 'dryer',
      label: 'Dryer',
      icon: <BiSolidDryer />,
      src: `${GITHUB_AUDIO_BASE}things/dryer.mp3`,
      category: 'things'
    },
    {
      id: 'slide-projector',
      label: 'Slide Projector',
      icon: <GiFilmProjector />,
      src: `${GITHUB_AUDIO_BASE}things/slide-projector.mp3`,
      category: 'things'
    },
    {
      id: 'boiling-water',
      label: 'Boiling Water',
      icon: <MdWaterDrop />,
      src: `${GITHUB_AUDIO_BASE}things/boiling-water.mp3`,
      category: 'things'
    },
    {
      id: 'bubbles',
      label: 'Bubbles',
      icon: <RiBubbleChartFill />,
      src: `${GITHUB_AUDIO_BASE}things/bubbles.mp3`,
      category: 'things'
    },
    {
      id: 'tuning-radio',
      label: 'Tuning Radio',
      icon: <MdRadio />,
      src: `${GITHUB_AUDIO_BASE}things/tuning-radio.mp3`,
      category: 'things'
    },
    {
      id: 'morse-code',
      label: 'Morse Code',
      icon: <IoIosRadio />,
      src: `${GITHUB_AUDIO_BASE}things/morse-code.mp3`,
      category: 'things'
    },
    {
      id: 'washing-machine',
      label: 'Washing Machine',
      icon: <GiWashingMachine />,
      src: `${GITHUB_AUDIO_BASE}things/washing-machine.mp3`,
      category: 'things'
    },
    {
      id: 'vinyl-effect',
      label: 'Vinyl Effect',
      icon: <PiVinylRecord />,
      src: `${GITHUB_AUDIO_BASE}things/vinyl-effect.mp3`,
      category: 'things'
    },
    {
      id: 'windshield-wipers',
      label: 'Windshield Wipers',
      icon: <TbWiper />,
      src: `${GITHUB_AUDIO_BASE}things/windshield-wipers.mp3`,
      category: 'things'
    },
  ],
};

// Noise sounds
export const noiseCategory: Category = {
  id: 'noise',
  title: 'Noise',
  icon: <BsSoundwave />,
  sounds: [
    {
      id: 'white-noise',
      label: 'White Noise',
      icon: <GiSoundWaves />,
      src: `${GITHUB_AUDIO_BASE}noise/white-noise.wav`,
      category: 'noise'
    },
    {
      id: 'pink-noise',
      label: 'Pink Noise',
      icon: <GiSoundWaves />,
      src: `${GITHUB_AUDIO_BASE}noise/pink-noise.wav`,
      category: 'noise'
    },
    {
      id: 'brown-noise',
      label: 'Brown Noise',
      icon: <GiSoundWaves />,
      src: `${GITHUB_AUDIO_BASE}noise/brown-noise.wav`,
      category: 'noise'
    },
  ],
};

// All categories
export const categories: Category[] = [
  natureCategory,
  rainCategory,
  animalsCategory,
  urbanCategory,
  placesCategory,
  transportCategory,
  thingsCategory,
  noiseCategory,
];

// Helper function to get sound by ID
export function getSoundById(id: string): Sound | undefined {
  for (const category of categories) {
    const sound = category.sounds.find(s => s.id === id);
    if (sound) return sound;
  }
  return undefined;
}

// Helper function to get all sounds as flat array
export function getAllSounds(): Sound[] {
  return categories.flatMap(cat => cat.sounds);
}
