"use client"

import {
  Code2,
  Brain,
  Users,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DotPattern } from '@/components/dot-pattern'


const stats = [
  {
    icon: Code2,
    value: '1000+',
    label: 'Problems',
    description: 'Curated coding challenges'
  },
  {
    icon: Brain,
    value: '50K+',
    label: 'AI Analysis',
    description: 'Solutions analyzed'
  },
  {
    icon: Users,
    value: '25K+',
    label: 'Programmers',
    description: 'Active community'
  },
  {
    icon: TrendingUp,
    value: '95%',
    label: 'Improvement',
    description: 'Performance growth'
  }
]

export function StatsSection() {
  return (
    <section className="py-12 sm:py-16 relative">
      {/* Background with transparency */}
      <div className="absolute inset-0 bg-linear-to-r from-primary/8 via-transparent to-secondary/20" />
      <DotPattern className="opacity-75" size="md" fadeStyle="circle" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="group text-center bg-background/60 backdrop-blur-sm border-border/50 py-0 "
            >
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <stat.icon className="h-6 w-6 text-primary group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors duration-300" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors duration-300">
                    {stat.value}
                  </h3>
                  <p className="font-semibold text-foreground group-hover:text-purple-500 dark:group-hover:text-purple-400/80 transition-colors duration-300">{stat.label}</p>
                  <p className="text-sm text-muted-foreground">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
