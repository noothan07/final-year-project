import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section id='home' className="py-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center ">
      <div className="max-w-5xl mx-auto text-center ">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Smart Attendance, <span className="text-blue-600">Simplified</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Mark attendance faster, reduce errors, and track student performance digitally.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Staff Login
            </Link>
            <Link
              to="/student-attendance"
              className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 font-medium rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Student View
            </Link>
          </div>

          {/* Access Explanation */}
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            <span className="font-medium text-blue-600">Staff:</span> Manage attendance • 
            <span className="font-medium text-green-600 ml-2">Students:</span> View attendance only
          </p>
        </motion.div>
      </div>
    </section>
  )
}
