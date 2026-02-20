'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  Truck,
  CheckCircle2,
  ArrowRight,
  Play,
  Zap,
  Star,
  Quote,
} from 'lucide-react';
import {
  LoadManagementIcon,
  FleetIcon,
  DriverIcon,
  SettlementIcon,
  GPSIcon,
  InvoiceIcon,
  SafetyIcon,
  MaintenanceIcon,
  IncidentIcon,
  AnalyticsIcon,
  DocumentIcon,
  CalendarIcon
} from './FeatureIcons';

const features = [
  {
    icon: LoadManagementIcon,
    title: 'Load Management',
    description: 'Complete load lifecycle from rate con to POD with AI-powered document extraction.',
    gradientId: 'load-grad'
  },
  {
    icon: FleetIcon,
    title: 'Fleet Management',
    description: 'Real-time vehicle tracking, maintenance scheduling, and fleet health monitoring.',
    gradientId: 'fleet-grad'
  },
  {
    icon: DriverIcon,
    title: 'Driver Management',
    description: 'Driver profiles, CDL tracking, HOS compliance, and performance analytics.',
    gradientId: 'driver-grad'
  },
  {
    icon: SettlementIcon,
    title: 'Settlements & Pay',
    description: 'Automated driver settlements, deductions, and comprehensive pay statements.',
    gradientId: 'settlement-grad'
  },
  {
    icon: GPSIcon,
    title: 'Live GPS Tracking',
    description: 'Real-time truck positions, geofencing, route history, and ETA predictions.',
    gradientId: 'gps-grad'
  },
  {
    icon: InvoiceIcon,
    title: 'Invoicing & Billing',
    description: 'Batch invoicing, aging reports, factoring integration, and payment tracking.',
    gradientId: 'invoice-grad'
  },
  {
    icon: SafetyIcon,
    title: 'Safety & DOT',
    description: 'DOT inspections, DVIR, drug testing, medical cards, and FMCSA compliance.',
    gradientId: 'safety-grad'
  },
  {
    icon: MaintenanceIcon,
    title: 'Maintenance',
    description: 'Preventive maintenance, work orders, breakdown tracking, and vendor management.',
    gradientId: 'maint-grad'
  },
  {
    icon: IncidentIcon,
    title: 'Incident Tracking',
    description: 'Accident reports, insurance claims, CSA scores, and DataQs management.',
    gradientId: 'incident-grad'
  },
  {
    icon: AnalyticsIcon,
    title: 'Analytics',
    description: 'Revenue forecasting, profitability analysis, empty miles, and fuel tracking.',
    gradientId: 'analytics-grad'
  },
  {
    icon: DocumentIcon,
    title: 'Documents',
    description: 'Centralized BOLs, PODs, rate cons, and regulatory document storage.',
    gradientId: 'doc-grad'
  },
  {
    icon: CalendarIcon,
    title: 'Dispatch Calendar',
    description: 'Weekly dispatch view, drag-and-drop scheduling, and availability tracking.',
    gradientId: 'calendar-grad'
  },
];

const testimonials = [
  {
    quote: "Finally a TMS that understands trucking. The dispatch board alone saves us 2 hours daily.",
    author: "Mike R.",
    role: "Fleet Manager, 45 trucks",
    rating: 5,
  },
  {
    quote: "Settlements that used to take a full day now take 30 minutes. Game changer for our accounting.",
    author: "Sarah T.",
    role: "Owner-Operator",
    rating: 5,
  },
  {
    quote: "The safety compliance features keep us DOT-ready. No more scrambling before audits.",
    author: "James K.",
    role: "Safety Director",
    rating: 5,
  },
];

const pricingPlans = [
  {
    name: 'Free Tier',
    price: '$0',
    period: '/mo',
    description: 'Get started with usage-based limits',
    features: ['10 Loads/month', '5 Invoices/month', '3 Settlements/month', '1 Truck, 2 Drivers', 'Basic Analytics'],
    popular: false,
    cta: 'Start Free',
  },
  {
    name: 'Pro Plan',
    price: '$99',
    period: '/mo',
    description: 'Unlimited usage for growing fleets',
    features: ['Unlimited Loads', 'Unlimited Invoices', 'Unlimited Settlements', 'Unlimited Trucks & Drivers', 'Priority Support'],
    popular: true,
    cta: 'Start 14-Day Trial',
  },
  {
    name: 'Module Add-ons',
    price: 'From $100',
    period: '/mo',
    description: 'Expand with powerful modules',
    features: ['Fleet Management', 'Accounting & Finance', 'Safety & Compliance', 'AI Dispatch', 'Integrations'],
    popular: false,
    cta: 'View Modules',
  },
];

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2], [0, -50]);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-purple-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[100px] rounded-full" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-emerald-600/10 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-70" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/20">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">TMS Pro</span>
            </div>
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
              <Link href="#features" className="text-slate-300 hover:text-white transition-colors tracking-wide">Features</Link>
              <Link href="#pricing" className="text-slate-300 hover:text-white transition-colors tracking-wide">Pricing</Link>
              <Link href="/showcase" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-current" /> Demo
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5 tracking-wide">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-white text-slate-950 hover:bg-slate-200 shadow-lg shadow-white/10 font-semibold tracking-wide border border-white/20">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      <main className="relative z-10 w-full">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-40 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              style={{ opacity, y }}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8 backdrop-blur-md shadow-lg shadow-purple-500/5 cursor-pointer hover:bg-purple-500/20 transition-all"
              >
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-200">The Next Gen TMS is Here</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]"
              >
                The Modern TMS for <br className="hidden sm:block" />
                <span className="relative">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 drop-shadow-lg">
                    Ambitious Fleets
                  </span>
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="absolute -bottom-2 left-0 h-3 bg-gradient-to-r from-purple-500/50 to-indigo-500/50 blur-[8px] -z-10"
                  />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed"
              >
                Dispatch, fleet management, driver settlements, safety compliance, and invoicing — seamlessly integrated with a truly stunning intuitive experience.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full text-base px-8 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-900/40 border border-purple-500/30 group">
                    <span className="font-semibold tracking-wide">Start Free Trial</span>
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/showcase" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full text-base px-8 h-14 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md text-slate-200 group transition-all">
                    <div className="p-1 rounded-full bg-white/10 mr-2 group-hover:scale-110 transition-transform">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                    <span>Watch Demo</span>
                  </Button>
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm font-medium text-slate-500 mt-6 tracking-wide uppercase"
              >
                No credit card required. Setup in minutes.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative z-10">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">An Operating System <br className="hidden md:block" /> for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Your Entire Fleet</span></h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
                  We've reimagined what a TMS should look and feel like. Powerful features packed inside an interface you'll actually love using every day.
                </p>
              </motion.div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    key={index}
                    className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-purple-500/30 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    <div className="w-16 h-16 mb-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.01] rounded-xl border border-white/10 backdrop-blur-md shadow-lg" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="w-10 h-10" gradientId={feature.gradientId} />
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-3 tracking-tight group-hover:text-purple-300 transition-colors">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed font-light text-sm">{feature.description}</p>

                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-24 relative bg-black/20">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Industry Leaders</h2>
              <p className="text-slate-400">See what early adopters are saying about TMS Pro.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((t, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx}
                  className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] relative hover:bg-white/[0.04] transition-colors"
                >
                  <Quote className="absolute top-6 right-6 w-8 h-8 text-white/5" />
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-lg font-light leading-relaxed mb-8">"{t.quote}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/20 text-purple-300 font-bold">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-white tracking-wide">{t.author}</div>
                      <div className="text-sm text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 relative">
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[60%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Fair, Transparent Pricing</h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">Stop paying per truck limits. Start free and scale up when your operations demand it.</p>
              </motion.div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  key={index}
                  className={`relative p-8 rounded-3xl border ${plan.popular
                    ? 'bg-gradient-to-b from-purple-900/40 to-slate-900/80 border-purple-500/50 shadow-2xl shadow-purple-900/20'
                    : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                    } transition-all duration-300`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider shadow-lg">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold mb-3 text-slate-200">{plan.name}</h3>
                    <div className="flex items-baseline justify-center mb-3">
                      <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                      <span className="text-slate-400 ml-2 font-medium">{plan.period}</span>
                    </div>
                    <p className="text-slate-400 font-light text-sm">{plan.description}</p>
                  </div>

                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

                  <ul className="space-y-4 mb-10">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start text-sm">
                        <CheckCircle2 className="h-5 w-5 text-purple-400 mr-3 flex-shrink-0" />
                        <span className="text-slate-300 leading-relaxed font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.name === 'Enterprise' ? '/contact' : '/register'} className="block mt-auto">
                    <Button
                      size="lg"
                      className={`w-full font-semibold tracking-wide rounded-xl h-12 ${plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                        }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/20" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center bg-white/[0.02] border border-white/[0.05] p-12 md:p-16 rounded-[3rem] backdrop-blur-xl shadow-2xl"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Ready to Elevate Your Fleet?</h2>
              <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                Join thousands of operators who are working smarter, not harder. Get full access to all features free for 14 days.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full text-base px-10 h-14 rounded-xl bg-white text-slate-950 hover:bg-slate-200 font-bold tracking-wide shadow-xl shadow-white/10 flex items-center justify-center">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 bg-slate-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">TMS Pro</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                The modern operating system for the transportation industry. Built to scale with your ambitions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-slate-200 tracking-wide">Product</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><Link href="/showcase" className="hover:text-purple-400 transition-colors">Product Tour</Link></li>
                <li><Link href="#features" className="hover:text-purple-400 transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-slate-200 tracking-wide">Company</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-purple-400 transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-purple-400 transition-colors">Contact</Link></li>
                <li><Link href="/blog" className="hover:text-purple-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6 text-slate-200 tracking-wide">Legal</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-purple-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500 font-light">&copy; {new Date().getFullYear()} TMS Pro Systems. All rights reserved.</p>
            <div className="flex space-x-6">
              <span className="text-slate-500 hover:text-white cursor-pointer transition-colors text-sm">Twitter</span>
              <span className="text-slate-500 hover:text-white cursor-pointer transition-colors text-sm">LinkedIn</span>
              <span className="text-slate-500 hover:text-white cursor-pointer transition-colors text-sm">GitHub</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
