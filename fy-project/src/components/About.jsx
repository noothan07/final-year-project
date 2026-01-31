import { motion } from 'framer-motion'

export default function About() {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50 rounded-4xl border-2 border-blue-100">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">About AttendMark</h2>
          <p className="text-lg text-gray-600">Transforming attendance management for educational institutions</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Smart Attendance Management</h3>
            <div className="space-y-4 text-gray-600">
              <p>
                AttendMark is a comprehensive attendance management system designed specifically for educational institutions. 
                Our platform streamlines the attendance process, making it faster, more accurate, and completely digital.
              </p>
              <p>
                With separate access for staff and students, we ensure data security while providing transparency 
                for attendance tracking and reporting.
              </p>
              <div className="pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Key Benefits:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Reduce attendance marking time by 80%
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Eliminate manual calculation errors
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Provide instant attendance reports
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Enable transparent student access
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 border border-black/5"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Built for Education</h4>
              <p className="text-gray-600 mb-6">
                Designed with input from educators and administrators to solve real-world attendance challenges.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-600">500+</div>
                  <div className="text-gray-600">Students Managed</div>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-600">50+</div>
                  <div className="text-gray-600">Faculty Users</div>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <div className="text-2xl font-bold text-purple-600">99.9%</div>
                  <div className="text-gray-600">Uptime</div>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <div className="text-2xl font-bold text-orange-600">24/7</div>
                  <div className="text-gray-600">Support</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
