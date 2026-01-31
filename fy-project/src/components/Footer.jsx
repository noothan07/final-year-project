import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="text-xl font-semibold">AttendMark</span>
            </div>
            <p className="text-gray-400 text-sm">
              Smart attendance management system for educational institutions.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Staff Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Access Types</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><span className="text-blue-400">Staff:</span> Full access management</li>
              <li><span className="text-green-400">Students:</span> Read-only viewing</li>
              <li><span className="text-purple-400">Both:</span> Mobile-friendly</li>
              <li><span className="text-yellow-400">Reports:</span> Excel downloads</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2024 AttendMark. Smart Attendance Management System.</p>
        </div>
      </div>
    </footer>
  )
}
