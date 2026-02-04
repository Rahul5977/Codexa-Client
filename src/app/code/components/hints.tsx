"use client"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Lightbulb, Tag } from "lucide-react"
import { type Problem } from "@/api/services/problem"

interface HintsProps {
  problem: Problem | null
}

export function Hints({ problem }: HintsProps) {
  if (!problem) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No hints available</p>
        </div>
      </div>
    )
  }

  // Combine tags as first hint with other hints
  const allHints = [
    {
      title: "Topics & Tags",
      content: problem.tags || [],
      isTags: true
    },
    ...(problem.hints || []).map((hint, index) => ({
      title: `Hint ${index + 1}`,
      content: hint,
      isTags: false
    }))
  ]

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Hints</h2>
        </div>

        {allHints.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No hints available for this problem</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-2">
            {allHints.map((hint, index) => (
              <AccordionItem 
                key={index} 
                value={`hint-${index}`}
                className="border border-border/50 rounded-lg px-4 bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    {hint.isTags ? (
                      <Tag className="h-4 w-4 text-primary" />
                    ) : (
                      <Lightbulb className="h-4 w-4 text-primary" />
                    )}
                    <span className="font-semibold">{hint.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {hint.isTags ? (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {(hint.content as string[]).map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="text-xs px-3 py-1 bg-secondary/50 hover:bg-secondary/70 transition-colors"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground leading-relaxed pt-2">
                      {hint.content as string}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </ScrollArea>
  )
}
