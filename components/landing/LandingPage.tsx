'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Truck,
  Package,
  Users,
  DollarSign,
  BarChart3,
  Shield,
  CheckCircle2,
  ArrowRight,
  Navigation,
  FileText,
  Play,
  MapPin,
  Clock,
  Wrench,
  Receipt,
  AlertTriangle,
  TrendingUp,
  Zap,
  Star,
  Quote,
} from 'lucide-react';

const features = [
  {
    icon: Package,
    title: 'Load Management',
    description: 'Complete load lifecycle from rate con to POD with AI-powered document extraction.',
  },
  {
    icon: Truck,
    title: 'Fleet Management',
    description: 'Real-time vehicle tracking, maintenance scheduling, and fleet health monitoring.',
  },
  {
    icon: Users,
    title: 'Driver Management',
    description: 'Driver profiles, CDL tracking, HOS compliance, and performance analytics.',
  },
  {
    icon: DollarSign,
    title: 'Settlements & Pay',
    description: 'Automated driver settlements, deductions, and comprehensive pay statements.',
  },
  {
    icon: Navigation,
    title: 'Live GPS Tracking',
    description: 'Real-time truck positions, geofencing, route history, and ETA predictions.',
  },
  {
    icon: Receipt,
    title: 'Invoicing & Billing',
    description: 'Batch invoicing, aging reports, factoring integration, and payment tracking.',
  },
  {
    icon: Shield,
    title: 'Safety & DOT',
    description: 'DOT inspections, DVIR, drug testing, medical cards, and FMCSA compliance.',
  },
  {
    icon: Wrench,
    title: 'Maintenance',
    description: 'Preventive maintenance, work orders, breakdown tracking, and vendor management.',
  },
  {
    icon: AlertTriangle,
    title: 'Incident Tracking',
    description: 'Accident reports, insurance claims, CSA scores, and DataQs management.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Revenue forecasting, profitability analysis, empty miles, and fuel tracking.',
  },
  {
    icon: FileText,
    title: 'Documents',
    description: 'Centralized BOLs, PODs, rate cons, and regulatory document storage.',
  },
  {
    icon: Clock,
    title: 'Dispatch Calendar',
    description: 'Weekly dispatch view, drag-and-drop scheduling, and availability tracking.',
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
    name: 'Core Platform',
    price: '$0',
    period: '/mo',
    description: 'Everything you need to move freight',
    features: ['Load Management', 'Load Board', 'Driver List (View)', 'Truck/Trailer List (View)', 'Basic Analytics'],
    popular: true,
    cta: 'Start Free Forever',
  },
  {
    name: 'Fleet Module',
    price: '$200',
    period: '/mo',
    description: 'Complete maintenance & asset tracking',
    features: ['Maintenance Schedule', 'Breakdown Management', 'Inventory Tracking', 'Cost Analysis', 'Asset History'],
    popular: false,
    cta: 'Add on Dashboard',
  },
  {
    name: 'Accounting',
    price: '$300',
    period: '/mo',
    description: 'Financials & Settlements',
    features: ['Driver Settlements', 'Invoicing & Factoring', 'Expense Tracking', 'Profitability Reports', 'QuickBooks Sync'],
    popular: false,
    cta: 'Add on Dashboard',
  },
  {
    name: 'Safety & HR',
    price: '$300',
    period: '/mo',
    description: 'Compliance bundle',
    features: ['Safety Dashboard', 'Incident Tracking', 'Driver Qualification Files', 'Payroll & Performance', 'Training Portal'],
    popular: false,
    cta: 'Add on Dashboard',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">TMS Pro</span>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <Link href="#features" className="text-slate-400 hover:text-white transition-colors">Features</Link>
              <Link href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</Link>
              <Link href="/showcase" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                <Play className="w-3 h-3" /> Demo
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Built for Modern Trucking Operations</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              The Complete TMS for
              <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent block mt-2">
                Trucking Companies
              </span>
            </h1>

            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              Dispatch, fleet management, driver settlements, safety compliance, and invoicing —
              all in one powerful platform built by trucking professionals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-base px-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/showcase">
                <Button size="lg" variant="outline" className="text-base px-8 border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Play className="mr-2 h-5 w-5" />
                  See It In Action
                </Button>
              </Link>
            </div>

            <p className="text-sm text-slate-500 mt-4">No credit card required • 14-day free trial</p>
          </div>

          {/* Hero Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: '50+', label: 'Features' },
              { value: '99.9%', label: 'Uptime' },
              { value: '24/7', label: 'Support' },
              { value: 'Free', label: '14-Day Trial' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
                <div className="text-2xl font-bold text-purple-400">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Everything You Need to Run Your Fleet</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From dispatch to delivery, settlements to safety — one platform for your entire operation.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:border-purple-500/30 transition-colors group"
                >
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                    <Icon className="h-5 w-5 text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href="/showcase">
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <Play className="mr-2 h-4 w-4" />
                See All Features in Action
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-y border-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Trusted by Carriers</h2>
            <p className="text-slate-400">What our users say about TMS Pro</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-slate-900/50 border border-slate-800/50">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-purple-500/30 mb-2" />
                <p className="text-slate-300 text-sm mb-4">{t.quote}</p>
                <div>
                  <div className="font-medium text-white text-sm">{t.author}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Simple, Transparent Pricing</h2>
            <p className="text-slate-400">Start free, upgrade as you grow. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-6 rounded-xl border ${plan.popular
                    ? 'bg-gradient-to-b from-purple-900/30 to-slate-900/50 border-purple-500/50'
                    : 'bg-slate-900/50 border-slate-800/50'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center mb-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-slate-400 ml-1">{plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-400">{plan.description}</p>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center text-sm">
                      <CheckCircle2 className="h-4 w-4 text-purple-400 mr-2 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === 'Enterprise' ? '/contact' : '/register'}>
                  <Button
                    className={`w-full ${plan.popular
                        ? 'bg-purple-600 hover:bg-purple-500'
                        : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-purple-900/20 to-slate-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Modernize Your Fleet?</h2>
            <p className="text-slate-400 mb-8">
              Start your free trial today and see why trucking companies trust TMS Pro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-base px-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/showcase">
                <Button size="lg" variant="outline" className="text-base px-8 border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-10 bg-slate-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">TMS Pro</span>
              </div>
              <p className="text-sm text-slate-500">
                Complete Transportation Management System for modern trucking operations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/showcase" className="hover:text-white transition-colors">Product Tour</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800/50 pt-6 text-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} TMS Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
