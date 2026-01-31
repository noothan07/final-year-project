import { motion } from 'framer-motion'

export default function HowItWorks() {
  return (
    <section id='how-it-works' className="py-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-600">Simple workflow for staff and students</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Staff Flow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Staff Workflow</h3>
            </div>
            
            <div className="space-y-4">
              {[
                { step: "1", desc: "Staff logs in securely" },
                { step: "2", desc: "Selects class & subject" },
                { step: "3", desc: "Marks attendance using one list" },
                { step: "4", desc: "System auto-calculates attendance" },
                { step: "5", desc: "Excel report generated" }
              ].map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 flex-shrink-0">
                    {item.step}
                  </div>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Student Flow */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200"
          >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Student Access</h3>
            </div>
            
            <div className="space-y-4">
              {[
                { step: "1", desc: "Student opens Student View" },
                { step: "2", desc: "Selects roll number / class" },
                { step: "3", desc: "Views attendance percentage" },
                { step: "4", desc: "Downloads Excel report" }
              ].map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 flex-shrink-0">
                    {item.step}
                  </div>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Important:</strong> Students have read-only access. No login required.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
