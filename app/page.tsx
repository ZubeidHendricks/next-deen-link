import Link from 'next/link';
import Image from 'next/image';
import { getUser } from '@/lib/db/queries';

export default async function HomePage() {
  const user = await getUser();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="container relative px-4 mx-auto">
          <div className="grid items-center grid-cols-1 gap-12 md:grid-cols-2">
            <div className="max-w-lg">
              <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                Find the Perfect Teacher for Your Child
              </h1>
              <p className="mb-8 text-xl text-blue-100">
                Connect with qualified Mualimas for personalized learning experiences tailored to your child's needs.
              </p>
              <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-center px-8 py-3 text-lg font-medium text-white transition-colors bg-indigo-700 rounded-lg hover:bg-indigo-800"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/teachers"
                      className="flex items-center justify-center px-8 py-3 text-lg font-medium text-white transition-colors bg-indigo-700 rounded-lg hover:bg-indigo-800"
                    >
                      Browse Teachers
                    </Link>
                    <Link
                      href="/sign-up"
                      className="flex items-center justify-center px-8 py-3 text-lg font-medium text-indigo-700 transition-colors bg-white rounded-lg hover:bg-gray-100"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl aspect-square">
                {/* Replace with your actual image */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-75"></div>
                <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-white">
                  Mualimas
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">How It Works</h2>
            <p className="text-xl text-gray-600">
              Connect with qualified teachers in just a few simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="p-6 bg-white rounded-xl shadow">
              <div className="flex items-center justify-center w-12 h-12 mb-4 text-lg font-bold text-white bg-blue-600 rounded-full">
                1
              </div>
              <h3 className="mb-3 text-xl font-semibold">Search for Teachers</h3>
              <p className="text-gray-600">
                Browse profiles of qualified Mualimas based on subjects, ratings, and price.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow">
              <div className="flex items-center justify-center w-12 h-12 mb-4 text-lg font-bold text-white bg-blue-600 rounded-full">
                2
              </div>
              <h3 className="mb-3 text-xl font-semibold">Book a Session</h3>
              <p className="text-gray-600">
                Select a convenient time from your teacher's available slots and make your booking.
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow">
              <div className="flex items-center justify-center w-12 h-12 mb-4 text-lg font-bold text-white bg-blue-600 rounded-full">
                3
              </div>
              <h3 className="mb-3 text-xl font-semibold">Start Learning</h3>
              <p className="text-gray-600">
                Connect with your teacher and begin your personalized learning journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Why Choose Mualimas</h2>
            <p className="text-xl text-gray-600">
              Our platform provides everything you need for quality education
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 mb-4 text-blue-600 bg-blue-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Qualified Teachers</h3>
              <p className="text-gray-600">
                All our Mualimas are vetted professionals with verified qualifications and experience.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 mb-4 text-blue-600 bg-blue-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Flexible Scheduling</h3>
              <p className="text-gray-600">
                Book sessions at times that work for you with our easy-to-use scheduling system.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 mb-4 text-blue-600 bg-blue-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Direct Communication</h3>
              <p className="text-gray-600">
                Message teachers directly to discuss your child's learning needs and goals.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 mb-4 text-blue-600 bg-blue-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Secure Payments</h3>
              <p className="text-gray-600">
                Our platform handles all payments securely, so you can focus on learning.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 mb-4 text-blue-600 bg-blue-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Personalized Learning</h3>
              <p className="text-gray-600">
                Each session is tailored to your child's specific learning needs and pace.
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 mb-4 text-blue-600 bg-blue-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="mb-3 text-xl font-semibold">Ratings & Reviews</h3>
              <p className="text-gray-600">
                Read verified reviews from other parents to find the perfect teacher match.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="container px-4 mx-auto text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">Ready to Get Started?</h2>
          <p className="max-w-2xl mx-auto mb-8 text-xl text-blue-100">
            Join thousands of parents who have found the perfect teachers for their children.
          </p>
          <div className="flex flex-col justify-center space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Link
              href="/teachers"
              className="px-8 py-3 text-lg font-medium text-indigo-700 transition-colors bg-white rounded-lg hover:bg-gray-100"
            >
              Browse Teachers
            </Link>
            <Link
              href="/sign-up"
              className="px-8 py-3 text-lg font-medium text-white transition-colors bg-indigo-700 border border-white rounded-lg hover:bg-indigo-800"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-white">Mualimas</h2>
              <p className="mt-2 text-gray-400">
                Connecting Parents with Quality Teachers
              </p>
            </div>
            <div className="flex flex-wrap gap-8">
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">Quick Links</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link href="/teachers" className="hover:text-white">
                      Find Teachers
                    </Link>
                  </li>
                  <li>
                    <Link href="/sign-up" className="hover:text-white">
                      Sign Up
                    </Link>
                  </li>
                  <li>
                    <Link href="/sign-in" className="hover:text-white">
                      Sign In
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">For Teachers</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link href="/sign-up" className="hover:text-white">
                      Become a Teacher
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/teacher" className="hover:text-white">
                      Teacher Dashboard
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">Support</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link href="#" className="hover:text-white">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="pt-8 mt-8 text-center border-t border-gray-800 text-gray-400">
            <p>&copy; {new Date().getFullYear()} Mualimas. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
