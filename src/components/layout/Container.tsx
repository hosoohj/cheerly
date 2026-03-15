interface ContainerProps {
  children: React.ReactNode
  className?: string
}

export function Container({ children, className = '' }: ContainerProps) {
  return (
    <main className={`max-w-2xl mx-auto px-4 py-6 ${className}`}>
      {children}
    </main>
  )
}
