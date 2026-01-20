"use client"

import { useEffect, useState } from 'react'

export function CursorGlow() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isMoving, setIsMoving] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
      setIsMoving(true)

      // Clear existing timeout and set a new one
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsMoving(false)
      }, 100)
    }

    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <>
      {/* Primary cursor glow */}
      <div
        className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, 
            rgba(147, 51, 234, ${isMoving ? '0.15' : '0.08'}), 
            rgba(99, 102, 241, ${isMoving ? '0.1' : '0.05'}) 40%, 
            transparent 70%)`,
        }}
      />
      {/* Secondary smaller glow for more intense effect */}
      <div
        className="fixed inset-0 pointer-events-none z-31 transition-opacity duration-200"
        style={{
          background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, 
            rgba(147, 51, 234, ${isMoving ? '0.2' : '0.1'}), 
            transparent 50%)`,
        }}
      />
    </>
  )
}
