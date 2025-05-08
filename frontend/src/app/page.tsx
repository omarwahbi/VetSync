import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Header/Nav */}
      <header className="w-full py-5 px-6 bg-white/70 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="VetSync Logo"
              width={48}
              height={48}
              className="h-12 w-auto"
            />
          </div>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-100"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="max-w-6xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <span className="inline-block px-3 py-1 text-sm font-semibold bg-indigo-100 text-indigo-800 rounded-full mb-4">
                  Coming Soon
                </span>
                <h2 className="text-5xl md:text-6xl font-bold leading-tight text-gray-900 mb-6">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
                    VetSync
                  </span>
                </h2>
                <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-4">
                  Streamlined Reminders for Modern Vet Clinics
                </p>
                <p className="text-lg text-gray-500 leading-relaxed">
                  Seamlessly manage appointments and enhance patient compliance
                  with automated, personalized communications.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="#contact"
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-full shadow-lg hover:shadow-indigo-200 hover:bg-indigo-700 transition-all text-center"
                >
                  Get Early Access
                </Link>
                <a
                  href="#features"
                  className="px-6 py-3 bg-white text-indigo-700 font-medium rounded-full border border-indigo-200 hover:border-indigo-300 shadow-sm hover:shadow transition-all text-center"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-6 -right-6 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply opacity-70 blur-3xl"></div>
              <Image
                src="/window.svg"
                alt="VetSync Dashboard"
                width={600}
                height={400}
                className="w-full h-auto rounded-2xl shadow-2xl border border-gray-200 relative z-10 rotate-1"
              />
              <div className="absolute -z-10 -bottom-8 -left-8 w-full h-full bg-gradient-to-br from-blue-200 to-indigo-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="w-full py-20 px-6 bg-gradient-to-b from-white to-indigo-50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose VetSync?
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A complete solution for veterinary clinics looking to modernize
              patient communication
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all group hover:-translate-y-1">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                Automated Reminders
              </h4>
              <p className="text-gray-600">
                Send timely appointment reminders and follow-ups via WhatsApp
                and SMS to reduce no-shows.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all group hover:-translate-y-1">
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                Patient Records
              </h4>
              <p className="text-gray-600">
                Manage comprehensive digital records for all your patients with
                easy access to treatment history.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all group hover:-translate-y-1">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">
                Analytics Dashboard
              </h4>
              <p className="text-gray-600">
                Track appointment compliance, monitor reminder effectiveness,
                and optimize your clinic&apos;s performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial/Message Section */}
      <section className="w-full py-20 px-6 bg-gradient-to-br from-indigo-900 to-blue-900 text-white relative">
        <div className="absolute left-20 top-1/2 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute right-20 top-1/3 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-6">
              Ready to Transform Your Clinic?
            </h3>
            <p className="text-xl text-indigo-200 max-w-3xl mx-auto mb-10">
              VetSync is designed specifically for veterinary clinics that want
              to provide exceptional patient care while optimizing staff
              efficiency.
            </p>
            <span className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full text-lg font-semibold shadow-lg transform hover:scale-105 transition-transform">
              Launching Soon!
            </span>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="w-full py-20 px-6 bg-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(120,119,198,0.08),rgba(255,255,255,0))]"></div>
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Interested in early access or have questions about VetSync?
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-10 rounded-3xl shadow-xl mx-auto max-w-3xl">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h4 className="text-2xl font-semibold text-gray-900 mb-4">
                Contact Us
              </h4>
              <p className="text-lg text-gray-600 mb-6">
                Reach out to our team at
              </p>
              <a
                href="mailto:info@vetsync.com"
                className="text-xl text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
              >
                info@vetsync.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-10 px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <Image
                src="/logo.svg"
                alt="VetSync Logo"
                width={36}
                height={36}
                className="h-9 w-auto"
              />
            </div>
            <div className="text-gray-400">
              © {new Date().getFullYear()} VetSync. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
