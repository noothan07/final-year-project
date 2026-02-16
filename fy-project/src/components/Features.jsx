import { motion } from 'framer-motion'

export default function Features() {
  const features = [
    {
      icon: "✅",
      title: "Single-List Attendance",
      description: "Mark attendance using either absentees or presents list",
      access: "Staff"
    },
    {
      icon: "📱",
      title: "Attendance Calculation",
      description: "Real-time attendance percentage computation",
      access: "Both"
    },
    {
      icon: "⬇️",
      title: "Excel Report Download",
      description: "Generate detailed attendance reports in Excel format",
      access: "Both"
    },
    {
      icon: "👁",
      title: "Read-Only Student Access",
      description: "Students can view their attendance without login",
      access: "Student"
    },
    {
      icon: "📱",
      title: "Responsive UI Design",
      description: "Works seamlessly on all devices and responsive",
      access: "Both"
    },
    {
      icon: "🔒",
      title: "Secure Faculty Login",
      description: "Protected access for staff members only",
      access: "Staff"
    }
  ]

  return (
    <section id='features' className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-50 min-h-screen flex items-center justify-center rounded-4xl p-8 border-2 border-black/5">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Features</h2>
          <p className="text-lg text-gray-600">Powerful tools for attendance management</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6  border border-gray-200 hover:shadow-md shadow-blue-100 transition-shadow"
            >
              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-xl font-bold text-blue-600">{feature.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                  <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                    feature.access === 'Staff' ? 'bg-blue-100 text-blue-700' :
                    feature.access === 'Student' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {feature.access}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
