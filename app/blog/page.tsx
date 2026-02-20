'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Truck, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BlogPage() {
    const posts = [
        { title: "The Future of AI in Trucking Logistics", date: "Feb 20, 2026", category: "Technology", image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
        { title: "Staying FMCSA Compliant in 2026", date: "Jan 15, 2026", category: "Compliance", image: "https://images.unsplash.com/photo-1586528116311-ad8ed7c663c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
        { title: "Maximizing Profit per Mile", date: "Dec 10, 2025", category: "Strategy", image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
        { title: "Understanding Owner-Operator Settlements", date: "Nov 05, 2025", category: "Finance", image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
        { title: "Transitioning to Digital Maintenance Records", date: "Oct 22, 2025", category: "Fleet Management", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
        { title: "Top 5 Metrics Every Fleet Manager Should Track", date: "Sep 14, 2025", category: "Analytics", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-purple-500/30">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[130px] rounded-full" />
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
                                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-500/30">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 w-full pt-20 pb-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-20 text-balance">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 font-medium text-sm text-emerald-300">
                            <BookOpen className="w-4 h-4" /> Company Insights
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                            News & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Industry Insights</span>
                        </h1>
                        <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">Latest updates on the trucking industry, fleet management strategies, and TMS Pro developments.</p>
                    </motion.div>

                    {/* Featured Post */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="group relative rounded-3xl overflow-hidden mb-12 border border-white/10 aspect-auto md:aspect-[21/9] bg-slate-900 cursor-pointer">
                        <img src="https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" alt="Featured" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3">
                            <div className="text-emerald-400 font-medium text-sm mb-3">Featured • Product Update</div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-emerald-300 transition-colors">TMS Pro unveils next-gen AI Dispatch Routing</h2>
                            <p className="text-slate-300 text-lg mb-6 line-clamp-2">Our new AI routing engine automatically assigns the best loads to your drivers, cutting empty miles by up to 15% and maximizing your fleet's profitability.</p>
                            <div className="inline-flex items-center text-white font-semibold">Read Full Article <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></div>
                        </div>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post, i) => (
                            <motion.div
                                key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 + (i * 0.1) }}
                                className="group flex flex-col rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden hover:bg-white/[0.04] transition-all cursor-pointer hover:border-emerald-500/30"
                            >
                                <div className="aspect-[16/9] w-full relative overflow-hidden">
                                    <img src={post.image} alt={post.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mt-2 mb-4">
                                        <span className="text-xs font-semibold text-emerald-400 px-2.5 py-1 rounded-md bg-emerald-500/10 tracking-wide uppercase">{post.category}</span>
                                        <span className="text-xs text-slate-500">{post.date}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">{post.title}</h3>
                                    <div className="mt-auto pt-4 flex items-center text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Read Article <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" /></div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </main>
        </div>
    );
}
