import { motion } from 'framer-motion'

export default function PageHeader({ title, description, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-8 sm:mb-10"
    >
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-50 via-indigo-100 to-purple-100 p-8 sm:p-10 shadow-2xl border border-indigo-200/60">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/15 rounded-full blur-3xl -translate-y-36 translate-x-36"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full blur-2xl translate-y-28 -translate-x-28"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex flex-col gap-6 sm:gap-8">
            {/* Main Content */}
            <div className="flex items-start space-x-4 sm:space-x-6">
              {/* Icon */}
              <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-white/70 backdrop-blur-md border border-indigo-300/60 shadow-xl shrink-0">
                {icon}
              </div>
              
              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-indigo-900 mb-3 leading-tight">
                  {title}
                </h1>
                <p className="text-indigo-700 text-base sm:text-lg leading-relaxed max-w-3xl">
                  {description}
                </p>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="flex items-center space-x-3">
              <div className="h-1.5 w-12 bg-linear-to-r from-indigo-300 to-purple-300 rounded-full"></div>
              <div className="h-1.5 w-6 bg-linear-to-r from-purple-300 to-pink-300 rounded-full"></div>
              <div className="h-1.5 w-8 bg-linear-to-r from-pink-300 to-indigo-300 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-linear-to-r from-transparent via-white/50 to-transparent"></div>
      </div>
    </motion.div>
  )
}
