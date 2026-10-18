'use client'

import {
  Goal,
  Dribbble,
  Hand,
  Volleyball,
  Timer,
  Swords,
  Waves,
  CircleDot,
  Trophy,
  Brain,
  Bike,
  PersonStanding,
  Flame,
  type LucideIcon,
} from 'lucide-react'

const map: Record<string, LucideIcon> = {
  Goal,
  Dribbble,
  Hand,
  Volleyball,
  Timer,
  Swords,
  Waves,
  CircleDot,
  Trophy,
  Brain,
  Bike,
  PersonStanding,
  Flame,
}

export function BranchIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name] ?? Trophy
  return <Icon className={className} />
}
