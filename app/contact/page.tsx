'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Truck, Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-purple-500/30">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-[-20%] w-[60%] h-[60%] bg-indigo-600/10 blur-[130px] rounded-full" />
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

            <main className="relative z-10 w-full pt-16 pb-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                    <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

                        {/* Left Content */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 font-medium text-sm text-indigo-300">
                                <Mail className="w-4 h-4" /> Get in Touch
                            </div>
                            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                                We're here to <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">help you scale.</span>
                            </h1>
                            <p className="text-lg text-slate-400 font-light mb-12 leading-relaxed">
                                Whether you have a question about features, pricing, or need a custom demonstration of how TMS Pro can fit your operations, our team is ready to answer all your questions.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                                        <MapPin className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-1">Office</h3>
                                        <p className="text-slate-400 font-light">123 Freight Avenue, Suite 100<br />Chicago, IL 60601</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                                        <Phone className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-1">Phone</h3>
                                        <p className="text-slate-400 font-light">1-800-TMS-PRO-1</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                                        <Mail className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-white mb-1">Email</h3>
                                        <p className="text-slate-400 font-light">support@tmspro.com</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Form */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
                            <h3 className="text-2xl font-bold text-white mb-6">Send us a message</h3>
                            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">First Name</Label>
                                        <Input className="bg-white/[0.03] border-white/10 rounded-xl h-12" placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Last Name</Label>
                                        <Input className="bg-white/[0.03] border-white/10 rounded-xl h-12" placeholder="Doe" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Work Email</Label>
                                    <Input className="bg-white/[0.03] border-white/10 rounded-xl h-12" placeholder="john@company.com" type="email" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Message</Label>
                                    <textarea className="w-full bg-white/[0.03] border border-white/10 rounded-xl min-h-[120px] p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="How can we help you?"></textarea>
                                </div>
                                <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold">
                                    Send Message <Send className="w-4 h-4 ml-2" />
                                </Button>
                            </form>
                        </motion.div>

                    </div>
                </div>
            </main>
        </div>
    );
}
