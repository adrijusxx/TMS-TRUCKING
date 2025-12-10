import { Metadata } from 'next';
import Link from 'next/link';
import { ProductGallery } from '@/components/showcase';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, ArrowRight, Truck, Sparkles, Shield, Zap, 
  BarChart3, FileText, Calculator, MapPin, Users, Wrench,
  Clock, Receipt, AlertTriangle, CheckCircle2
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Product Showcase | TMS Pro',
  description: 'Explore TMS Pro - The complete Transportation Management System with dispatch, fleet management, safety compliance, and accounting.',
};

const highlights = [
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Smart document extraction & recommendations',
  },
  {
    icon: Shield,
    title: 'DOT Compliant',
    description: 'Built-in safety & FMCSA compliance tools',
  },
  {
    icon: Zap,
    title: 'Real-Time',
    description: 'Live GPS, instant alerts & updates',
  },
];

const allFeatures = [
  { icon: MapPin, label: 'Live GPS Tracking', category: 'Operations' },
  { icon: Users, label: 'Driver Management', category: 'Operations' },
  { icon: Truck, label: 'Fleet Management', category: 'Operations' },
  { icon: FileText, label: 'Load Management', category: 'Operations' },
  { icon: Calculator, label: 'Settlements & Pay', category: 'Accounting' },
  { icon: Receipt, label: 'Invoicing & Billing', category: 'Accounting' },
  { icon: BarChart3, label: 'Revenue Analytics', category: 'Analytics' },
  { icon: Shield, label: 'Safety Compliance', category: 'Compliance' },
  { icon: AlertTriangle, label: 'Incident Tracking', category: 'Compliance' },
  { icon: Wrench, label: 'Maintenance Hub', category: 'Fleet' },
  { icon: Clock, label: 'HOS Monitoring', category: 'Compliance' },
  { icon: CheckCircle2, label: 'DOT Inspections', category: 'Compliance' },
];

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              <Truck className="h-7 w-7 text-purple-500 group-hover:text-purple-400 transition-colors" />
              <span className="text-lg font-bold text-white">TMS Pro</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-12 pb-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">Product Showcase</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              See TMS Pro{' '}
              <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                In Action
              </span>
            </h1>
            
            <p className="text-base text-slate-400 mb-6">
              The complete trucking management platform - from dispatch to delivery, 
              settlements to safety compliance.
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
              {highlights.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30"
                >
                  <div className="p-1.5 rounded-lg bg-purple-500/10">
                    <item.icon className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs font-medium text-white">{item.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="relative z-10 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <ProductGallery />
        </div>
      </section>

      {/* All Features Grid */}
      <section className="relative z-10 py-12 border-t border-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-white text-center mb-6">
            Everything You Need to Run Your Fleet
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-w-4xl mx-auto">
            {allFeatures.map((feature, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-800/20 border border-slate-700/20 hover:border-purple-500/30 transition-colors"
              >
                <feature.icon className="w-5 h-5 text-purple-400" />
                <span className="text-xs text-slate-300 text-center">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-12 border-t border-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Ready to Modernize Your Operations?
            </h2>
            <p className="text-slate-400 mb-6 text-sm">
              Join carriers who trust TMS Pro to manage their fleet, drivers, and compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-slate-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-500" />
              <span>&copy; {new Date().getFullYear()} TMS Pro</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
