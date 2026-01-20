"use client"

import {
  BarChart3,
  Zap,
  Users,
  ArrowRight,
  Database,
  Package,
  Brain,
  Target,
  Code2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Image3D } from '@/components/image-3d'

const mainFeatures = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Get instant feedback on complexity, efficiency, and performance patterns.'
  },
  {
    icon: Target,
    title: 'Personalized Learning',
    description: 'AI mentor adapts to your skill level and provides targeted guidance.'
  },
  {
    icon: Code2,
    title: 'Smart Code Review',
    description: 'Deep analysis beyond correctness - scalability and optimization insights.'
  },
  {
    icon: Zap,
    title: 'Real-time Feedback',
    description: 'Instant complexity estimation and performance predictions.'
  }
]

const secondaryFeatures = [
  {
    icon: BarChart3,
    title: 'Performance Visualization',
    description: 'Visual graphs showing how your algorithm scales with input size.'
  },
  {
    icon: Database,
    title: 'Growth Tracking',
    description: 'Monitor your progress across different topics and difficulty levels.'
  },
  {
    icon: Users,
    title: 'Community Contests',
    description: 'Participate in coding competitions and learn from peer solutions.'
  },
  {
    icon: Package,
    title: 'Comprehensive Problems',
    description: 'Curated problem sets covering all algorithmic concepts and patterns.'
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">Platform Features</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Beyond traditional coding practice
          </h2>
          <p className="text-lg text-muted-foreground">
            Codexa combines competitive programming with intelligent analysis, creating a comprehensive
            learning environment that transforms how you approach algorithmic thinking.
          </p>
        </div>

        {/* First Feature Section */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16 mb-24">
          {/* Left Image */}
          <Image3D
            lightSrc="feature-1-light.png"
            darkSrc="feature-1-dark.png"
            alt="Analytics dashboard"
            direction="left"
          />
          {/* Right Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                AI that understands your code deeply
              </h3>
              <p className="text-muted-foreground text-base text-pretty">
                Our advanced AI doesn't just check if your solution works - it analyzes efficiency,
                predicts performance at scale, and provides insights that help you become a better programmer.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {mainFeatures.map((feature, index) => (
                <li key={index} className="group hover:bg-accent/5 flex items-start gap-3 p-2 rounded-lg transition-colors">
                  <div className="mt-0.5 flex shrink-0 items-center justify-center">
                    <feature.icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-medium">{feature.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pe-4 pt-2">
              <Button size="lg" className="cursor-pointer">
                <a href="#" className='flex items-center'>
                  Try AI Analysis
                  <ArrowRight className="ms-2 size-4" aria-hidden="true" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="cursor-pointer">
                <a href="#">
                  View Problems
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Second Feature Section - Flipped Layout */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8 xl:gap-16">
          {/* Left Content */}
          <div className="space-y-6 order-2 lg:order-1">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Learn, compete, and grow together
              </h3>
              <p className="text-muted-foreground text-base text-pretty">
                Join a community of passionate programmers where you can track your progress,
                participate in contests, and learn from diverse problem-solving approaches.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {secondaryFeatures.map((feature, index) => (
                <li key={index} className="group hover:bg-accent/5 flex items-start gap-3 p-2 rounded-lg transition-colors">
                  <div className="mt-0.5 flex shrink-0 items-center justify-center">
                    <feature.icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-medium">{feature.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pe-4 pt-2">
              <Button size="lg" className="cursor-pointer">
                <a href="#" className='flex items-center'>
                  View Documentation
                  <ArrowRight className="ms-2 size-4" aria-hidden="true" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="cursor-pointer">
                <a href="https://github.com/silicondeck/codexa-dashboard-landing-template" rel="noopener noreferrer">
                  GitHub Repository
                </a>
              </Button>
            </div>
          </div>

          {/* Right Image */}
          <Image3D
            lightSrc="feature-2-light.png"
            darkSrc="feature-2-dark.png"
            alt="Performance dashboard"
            direction="right"
            className="order-1 lg:order-2"
          />
        </div>
      </div>
    </section>
  )
}
