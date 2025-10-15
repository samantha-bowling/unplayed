import {
  // Gaming pack
  Ghost, Cpu, Headset, Gem, Rocket, Trophy, Skull, Monitor, Wifi,
  // Nature pack
  Flower, Leaf, MountainSnow, Flower2 as Rose, Sprout, TreeDeciduous, Sun, Rainbow,
  // Fruit pack
  Apple, Banana, Cherry, Citrus, Grape,
  // Snacks pack
  CakeSlice, Candy, Cookie, CupSoda, Popcorn, Pizza, IceCreamCone, Drumstick, Sandwich,
  // Special packs
  Egg, Heart,
  // Emoji pack
  Smile, Star, Zap,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type AnimationPackId = 'gaming' | 'nature' | 'fruit' | 'snacks' | 'egg' | 'heart' | 'emoji';

export interface AnimationPack {
  id: AnimationPackId;
  name: string;
  description: string;
  icon: LucideIcon;
  icons: LucideIcon[];
  count: number;
  specialAnimation?: 'spin' | 'pulse';
}

export const ANIMATION_PACKS: Record<AnimationPackId, AnimationPack> = {
  gaming: {
    id: 'gaming',
    name: 'Gaming',
    description: 'Controllers, gems, and gaming vibes',
    icon: Ghost,
    icons: [Ghost, Cpu, Headset, Gem, Rocket, Trophy, Skull, Monitor, Wifi],
    count: 12,
  },
  nature: {
    id: 'nature',
    name: 'Nature',
    description: 'Flowers, trees, and natural elements',
    icon: Flower,
    icons: [Flower, Leaf, MountainSnow, Rose, Sprout, TreeDeciduous, Sun, Rainbow],
    count: 12,
  },
  fruit: {
    id: 'fruit',
    name: 'Fruit',
    description: 'Fresh and fruity',
    icon: Apple,
    icons: [Apple, Banana, Cherry, Citrus, Grape],
    count: 12,
  },
  snacks: {
    id: 'snacks',
    name: 'Snacks',
    description: 'Delicious treats and munchies',
    icon: Pizza,
    icons: [CakeSlice, Candy, Cookie, CupSoda, Popcorn, Pizza, IceCreamCone, Drumstick, Sandwich],
    count: 12,
  },
  egg: {
    id: 'egg',
    name: 'Egg',
    description: 'Just vibing eggs',
    icon: Egg,
    icons: [Egg],
    count: 15,
    specialAnimation: 'spin',
  },
  heart: {
    id: 'heart',
    name: 'Heart',
    description: 'Pulsing love',
    icon: Heart,
    icons: [Heart],
    count: 12,
    specialAnimation: 'pulse',
  },
  emoji: {
    id: 'emoji',
    name: 'Emoji',
    description: 'Happy faces and vibes',
    icon: Smile,
    icons: [Smile, Star, Heart, Zap],
    count: 12,
  },
};
