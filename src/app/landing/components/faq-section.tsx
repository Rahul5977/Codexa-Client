"use client"

import { CircleHelp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

type FaqItem = {
  value: string
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    value: 'item-1',
    question: 'How does Codexa\'s AI analysis work?',
    answer:
      'Our AI analyzes your code beyond correctness, evaluating time and space complexity, detecting inefficiency patterns, and simulating performance at scale. It provides detailed insights on algorithmic behavior, optimization opportunities, and performance predictions in clear, human-friendly language.',
  },
  {
    value: 'item-2',
    question: 'What makes Codexa different from other coding platforms?',
    answer:
      'Unlike traditional platforms that only check if your solution works, Codexa evaluates performance, scalability, and efficiency. Our AI mentor provides personalized guidance, explains optimization strategies, and helps you develop performance-aware thinking rather than just problem-solving skills.',
  },
  {
    value: 'item-3',
    question: 'Do I need prior competitive programming experience?',
    answer:
      'Not at all! Codexa adapts to your skill level with personalized learning paths. Whether you\'re a beginner learning algorithms or an experienced programmer optimizing performance, our AI mentor provides appropriate guidance and gradually increases complexity as you improve.',
  },
  {
    value: 'item-4',
    question: 'How does the community and contest system work?',
    answer:
      'You can connect with friends, compare solutions, analyze performance differences, and participate in coding contests. Our platform encourages collaborative learning where you can learn from diverse approaches, track your progress against peers, and grow together in a supportive environment.',
  },
  {
    value: 'item-5',
    question: 'What programming languages does Codexa support?',
    answer:
      'Codexa supports all major programming languages including Python, Java, C++, JavaScript, C#, and more. Our AI analysis works consistently across languages, focusing on algorithmic complexity and optimization patterns rather than language-specific syntax.',
  },
  {
    value: 'item-6',
    question: 'How does the AI mentor provide personalized learning?',
    answer:
      'The AI tracks your progress across different topics, identifies strengths and weaknesses, analyzes your problem-solving patterns, and generates customized learning paths. It provides hints, alternative approaches, and optimized strategies tailored to your current skill level and learning pace.',
  },
]

const FaqSection = () => {
  return (
    <section id="faq" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Codexa's AI-powered coding platform and learning experience. Still have questions? We're here to help!
          </p>
        </div>

        {/* FAQ Content */}
        <div className="max-w-4xl mx-auto">
          <div className='bg-transparent'>
            <div className='p-0'>
              <Accordion type='single' collapsible className='space-y-5'>
                {faqItems.map(item => (
                  <AccordionItem key={item.value} value={item.value} className='group rounded-md border! transition-all duration-300 cursor-pointer'>
                    <AccordionTrigger className='cursor-pointer items-center gap-4 rounded-none bg-transparent py-2 ps-3 pe-4 hover:no-underline data-[state=open]:border-b'>
                      <div className='flex items-center gap-4'>
                        <div className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full transition-all duration-300'>
                          <CircleHelp className='size-5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300' />
                        </div>
                        <span className='text-start font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300'>{item.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className='p-4 bg-transparent'>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Contact Support CTA */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Still have questions? We're here to help.
            </p>
            <Button className='cursor-pointer' asChild>
              <a href="#contact">
                Contact Support
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export { FaqSection }
