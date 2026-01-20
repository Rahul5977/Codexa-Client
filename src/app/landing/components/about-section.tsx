"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CardDecorator } from '@/components/ui/card-decorator'
import { Github, Brain, Code, BarChart3, Users } from 'lucide-react'

const values = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Advanced AI evaluates your code beyond correctness - analyzing efficiency, scalability, and performance patterns.'
  },
  {
    icon: BarChart3,
    title: 'Performance Insights',
    description: 'Get detailed complexity analysis, runtime predictions, and scalability simulations for every solution.'
  },
  {
    icon: Code,
    title: 'Smart Mentoring',
    description: 'AI mentor provides personalized guidance, hints, and optimized strategies to improve your coding skills.'
  },
  {
    icon: Users,
    title: 'Community Learning',
    description: 'Connect with developers, compare solutions, participate in contests, and learn from diverse approaches.'
  }
]

export function AboutSection() {
  return (
    <section id="about" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            About Codexa
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Intelligent coding platform for the future
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Codexa transforms how programmers learn and practice code by combining competitive programming
            with AI-powered performance analysis, creating an environment that understands how you think
            and teaches you to think better.
          </p>
        </div>

        {/* Modern Values Grid with Enhanced Design */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4 mb-12">
          {values.map((value, index) => (
            <Card key={index} className='group shadow-xs py-2'>
              <CardContent className='p-8'>
                <div className='flex flex-col items-center text-center'>
                  <CardDecorator>
                    <value.icon className='h-6 w-6 group-hover:text-purple-600 dark:group-hover:text-purple-400' aria-hidden />
                  </CardDecorator>
                  <h3 className='mt-6 font-medium text-balance group-hover:text-purple-600 dark:group-hover:text-purple-400'>{value.title}</h3>
                  <p className='text-muted-foreground mt-3 text-sm'>{value.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-muted-foreground">🚀 Elevating the next generation of programmers</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="cursor-pointer" asChild>
              <a href="https://github.com/silicondeck/codexa-dashboard-landing-template" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                Star on GitHub
              </a>
            </Button>
            <Button size="lg" variant="outline" className="cursor-pointer" asChild>
              <a href="https://discord.com/invite/XEQhPc9a6p" rel="noopener noreferrer">
                Join Community
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
