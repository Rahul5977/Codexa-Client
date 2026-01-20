"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

type Testimonial = {
  name: string
  role: string
  image: string
  quote: string
}

const testimonials: Testimonial[] = [
  {
    name: 'Alexandra Mitchell',
    role: 'Software Engineer',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-1',
    quote:
      'Codexa\'s AI analysis completely changed how I approach problem-solving. It taught me to think about efficiency from the start, not as an afterthought.',
  },
  {
    name: 'James Thompson',
    role: 'Computer Science Student',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-1',
    quote: 'The AI mentor is like having a personal tutor. It explains not just what\'s wrong, but why and how to improve.',
  },
  {
    name: 'Priya Sharma',
    role: 'Backend Developer',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-2',
    quote:
      'The performance visualization helped me understand Big O notation better than any textbook. Seeing my algorithms scale in real-time was a game-changer.',
  },
  {
    name: 'Robert Kim',
    role: 'Data Scientist',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-2',
    quote:
      'Codexa helped me transition from academia to industry. The platform taught me how to write production-ready code, not just algorithms.',
  },
  {
    name: 'Maria Santos',
    role: 'Full Stack Developer',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-3',
    quote:
      'The contest feature is addictive! Competing with friends while learning from their solutions has accelerated my growth tremendously. The AI feedback keeps me motivated to improve.',
  },
  {
    name: 'Thomas Anderson',
    role: 'Tech Lead',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-3',
    quote: 'I use Codexa to prepare my team for technical interviews. The insights help us identify optimization opportunities we never considered before.',
  },
  {
    name: 'Lisa Chang',
    role: 'CS Professor',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-4',
    quote:
      'I recommend Codexa to all my students. The personalized learning paths adapt to each student\'s progress, and the detailed analysis helps them understand algorithmic complexity deeply.',
  },
  {
    name: 'Michael Foster',
    role: 'Software Engineer',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-4',
    quote: 'The growth dashboard showed me patterns in my coding I never noticed. Now I can see my weak areas and focus my learning effectively.',
  },
  {
    name: 'Sophie Laurent',
    role: 'Algorithm Engineer',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-5',
    quote:
      'Codexa\'s community feature is amazing. Seeing how others solve the same problem with different approaches has broadened my problem-solving toolkit significantly.',
  },
  {
    name: 'Daniel Wilson',
    role: 'Junior Developer',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-5',
    quote: 'The AI mentor explains concepts so clearly. It\'s like having a senior developer reviewing every piece of code I write.',
  },
  {
    name: 'Natasha Petrov',
    role: 'Mobile Developer',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=female-6',
    quote:
      'The performance insights helped me optimize my mobile algorithms. I never realized how much my nested loops were affecting user experience until Codexa showed me the complexity analysis.',
  },
  {
    name: 'Carlos Rivera',
    role: 'Coding Bootcamp Graduate',
    image: 'https://notion-avatars.netlify.app/api/avatar?preset=male-6',
    quote: 'Codexa bridged the gap between bootcamp theory and real-world performance optimization. It prepared me for senior-level technical discussions.',
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 sm:py-32">
      <div className="container mx-auto px-8 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">Testimonials</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Transforming programmers worldwide
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of developers who use Codexa to elevate their coding skills through AI-powered insights and community learning.
          </p>
        </div>

        {/* Testimonials Masonry Grid */}
        <div className="columns-1 gap-4 md:columns-2 md:gap-6 lg:columns-3 lg:gap-4">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="mb-6 break-inside-avoid shadow-none lg:mb-4">
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="bg-muted size-12 shrink-0">
                    <AvatarImage
                      alt={testimonial.name}
                      src={testimonial.image}
                      loading="lazy"
                      width="120"
                      height="120"
                    />
                    <AvatarFallback>
                      {testimonial.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <a href="#" onClick={e => e.preventDefault()} className="cursor-pointer">
                      <h3 className="font-medium hover:text-primary transition-colors">{testimonial.name}</h3>
                    </a>
                    <span className="text-muted-foreground block text-sm tracking-wide">
                      {testimonial.role}
                    </span>
                  </div>
                </div>

                <blockquote className="mt-4">
                  <p className="text-sm leading-relaxed text-balance">{testimonial.quote}</p>
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
