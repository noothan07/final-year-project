import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import About from '../components/About'
import HowItWorks from '../components/HowItWorks'
import Features from '../components/Features'
import Footer from '../components/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white" style={{
      backgroundImage: `
        linear-gradient(to right, #f0f0f0 1px, transparent 1px),
        linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)
      `,
      backgroundSize: '50px 50px'
    }}>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <About />
      
      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Get Started Today</h2>
            <p className="text-lg text-gray-600 mb-12">
              Join the smart attendance management system trusted by educational institutions
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Staff Login
              </a>
              <a
                href="/student-attendance"
                className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 font-medium rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Student View
              </a>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
