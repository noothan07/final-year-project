import React from 'react'

export default function ThemeWrapper({ children }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* WhatsApp-style background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(37, 99, 235, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(96, 165, 250, 0.2) 0%, transparent 40%),
            radial-gradient(circle at 70% 20%, rgba(147, 197, 253, 0.2) 0%, transparent 40%)
          `,
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(45deg, rgba(59, 130, 246, 0.05) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(59, 130, 246, 0.05) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(59, 130, 246, 0.05) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(59, 130, 246, 0.05) 75%)
          `,
          backgroundSize: '60px 60px',
          backgroundPosition: '0 0, 0 30px, 30px -30px, -30px 0px'
        }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
