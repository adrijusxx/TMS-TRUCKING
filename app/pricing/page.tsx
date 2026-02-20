'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Truck, Check, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PricingPage() {
    const plans = [
        {
            name: "Starter",
            description: "Perfect for owner-operators and small fleets getting started.",
            price: "Free",
            billing: "forever",
            features: [
                "Up to 3 active trucks",
                "Basic Dispatch & Load Management",
                "Standard Document Storage (5GB)",
                "Email Support",
                "Mobile App Access"
            ],
            cta: "Get Started Free",
            popular: false,
            href: "/register"
        },
        {
            name: "Pro",
            description: "Everything you need to scale your growing operations.",
            price: "$99",
            billing: "per month / truck",
            features: [
                "Unlimited trucks & drivers",
                "Advanced AI Dispatch Routing",
                "Full Accounting & Settlements",
                "Safety & DOT Compliance Hub",
                "Real-Time GPS Tracking",
                "Premium 24/7 Phone Support",
                "Unlimited Document Storage"
            ],
            cta: "Start 14-Day Free Trial",
            popular: true,
            href: "/register"
        },
        {
            name: "Enterprise",
            description: "Custom solutions for large carriers and brokerages.",
            price: "Custom",
            billing: "tailored pricing",
            features: [
                "Everything in Pro",
                "Custom API Integrations",
                "Dedicated Account Manager",
                "Custom Feature Development",
                "Single Sign-On (SSO)",
                "On-Premise Deployment Options",
                "Quarterly Business Reviews"
            ],
            cta: "Contact Sales",
            popular: false,
            href: "/contact"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-purple-500/30">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-purple-600/10 blur-[130px] rounded-full" />
                <div className="absolute bottom-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40 z-0" />
            </div>

            {/* Navigation */}
            <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
                                <Truck className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">TMS Pro</span>
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link href="/login">
                                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">Sign In</Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-500/30">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 w-full pt-20 pb-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-16 text-balance">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                            Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">transparent pricing</span>
                        </h1>
                        <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">
                            No hidden fees, no long-term contracts. Just the tools you need to build and scale your operations efficiently.
                        </p>
                    </motion.div>

                    {/* Pricing Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
                        {plans.map((plan, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className={`relative rounded-3xl p-8 border backdrop-blur-md ${plan.popular
                                        ? 'bg-gradient-to-b from-purple-900/30 to-indigo-900/10 border-purple-500/40 shadow-2xl shadow-purple-500/10'
                                        : 'bg-white/[0.02] border-white/5 hover:border-white/10 transition-colors'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold uppercase tracking-widest py-1 px-4 rounded-full flex items-center gap-1 shadow-lg shadow-purple-500/25 border border-purple-400/30">
                                            <Sparkles className="w-3 h-3" /> Most Popular
                                        </span>
                                    </div>
                                )}

                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-slate-400 text-sm h-10 mb-6">{plan.description}</p>
                                <div className="mb-8">
                                    <span className="text-5xl font-extrabold text-white tracking-tight">{plan.price}</span>
                                    {plan.price !== "Custom" && <span className="text-slate-400 ml-2">/ {plan.billing}</span>}
                                </div>

                                <Link href={plan.href} className="w-full">
                                    <Button
                                        className={`w-full h-12 rounded-xl font-semibold text-base mb-8 border ${plan.popular
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-500/30 shadow-lg shadow-purple-500/20'
                                                : 'bg-white/[0.05] hover:bg-white/10 text-white border-white/10'
                                            }`}
                                    >
                                        {plan.cta} <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>

                                <div className="space-y-4">
                                    <p className="text-sm font-semibold text-white uppercase tracking-wider mb-4">What's included</p>
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className={`mt-0.5 rounded-full p-0.5 ${plan.popular ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                                                <Check className={`w-3.5 h-3.5 ${plan.popular ? 'text-purple-400' : 'text-slate-400'}`} />
                                            </div>
                                            <span className="text-sm text-slate-300 leading-tight">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </main>
        </div>
    );
}
