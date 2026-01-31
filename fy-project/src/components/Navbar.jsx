import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault()
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setMenuOpen(false)
    }
  }

  return (
    <nav
      className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[92%] md:w-[80%]
      flex items-center justify-between px-6 py-3
      backdrop-blur-[10px] bg-[#00000000]
      border border-black/20 dark:border-blue-600/20 
      rounded-full z-50 transition-all duration-300"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 text-xl font-extrabold tracking-wide text-gray-800 dark:text-gray-100">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <p className='text-blue-600'>AttendMark</p>
      </div>

      {/* Desktop Links */}
      <ul className="hidden lg:flex items-center gap-8">
        <li>
          <a 
           href="#home"
           onClick={(e) => handleSmoothScroll(e, 'home')}
           className="relative text-gray-600 font-semibold transition hover:text-blue-500">
            Home
          </a>
        </li>
        <li>
          <a 
            href="#features" 
            onClick={(e) => handleSmoothScroll(e, 'features')}
            className="relative text-gray-600 font-semibold transition hover:text-blue-500"
          >
            Features
          </a>
        </li>
        <li>
          <a 
            href="#how-it-works" 
            onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
            className="relative text-gray-600 font-semibold transition hover:text-blue-500"
          >
            How It Works
          </a>
        </li>
        <li>
          <a 
            href="#about" 
            onClick={(e) => handleSmoothScroll(e, 'about')}
            className="relative text-gray-600 font-semibold transition hover:text-blue-500"
          >
            About
          </a>
        </li>
      </ul>

      {/* Desktop Right Side */}
      <div className="hidden lg:flex items-center gap-4">
        <Link
          to="/login"
          className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600
          text-white font-semibold hover:scale-[1.03] hover:shadow-md transition duration-500"
        >
          Staff Login
        </Link>
      </div>

      {/* Mobile Menu Toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg text-gray-500 hover:bg-white/20 transition"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-20 left-0 w-full px-6 py-6 flex flex-col items-center gap-4
         bg-white border border-gray-300 dark:border-gray-800
          rounded-2xl shadow-lg lg:hidden backdrop-blur-md"
        >
          <a
            href="home"
            onClick={(e) => handleSmoothScroll(e, 'home')}
            className="relative text-gray-600 font-semibold transition hover:text-blue-500"
          >
            Home
          </a>
          <a
            href="#features"
            onClick={(e) => handleSmoothScroll(e, 'features')}
            className="relative text-gray-600 font-semibold transition hover:text-blue-500"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
            className="relative text-gray-600 font-semibold transition hover:text-blue-500"
          >
            How It Works
          </a>
          <a
            href="#about"
            onClick={(e) => handleSmoothScroll(e, 'about')}
            className="relative text-gray-600 font-semibold transition hover:text-blue-500"
          >
            About
          </a>
          

          <div className="flex justify-center items-center w-full gap-3 mt-3">
            <Link
              to="/login"
              className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600
              text-white font-semibold backdrop-blur-md hover:scale-[1.03] hover:shadow-md transition"
              onClick={() => setMenuOpen(false)}
            >
              Staff Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
