'use client';

import Link from 'next/link';
import { Truck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-purple-500/30 font-sans">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-purple-600/5 blur-[150px] rounded-full" />
            </div>

            {/* Navigation */}
            <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
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
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 w-full pt-16 pb-32">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
                    <div className="mb-12 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 mb-6 font-medium text-sm text-slate-300">
                            <ShieldCheck className="w-4 h-4 text-purple-400" /> Legal Information
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Privacy Policy</h1>
                        <p className="text-slate-400">Last updated: February 20, 2026</p>
                    </div>

                    <div className="prose prose-invert prose-purple max-w-none prose-headings:font-bold prose-headings:text-slate-200 prose-p:text-slate-300 prose-p:leading-relaxed prose-a:text-purple-400 hover:prose-a:text-purple-300 prose-li:text-slate-300">
                        <p>
                            At TMS Pro, we take your privacy seriously. This Privacy Policy explains how we collect, use,
                            disclose, and safeguard your information when you visit our website or use our Transportation Management System platform.
                        </p>

                        <h2>1. Information We Collect</h2>
                        <p>
                            We may collect information about you in a variety of ways. The information we may collect includes:
                        </p>
                        <ul>
                            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information that you voluntarily give to us when you register with the application.</li>
                            <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the platform, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the platform.</li>
                            <li><strong>Financial Data:</strong> Financial information securely processed by our payment gateways for subscription billing.</li>
                            <li><strong>Fleet Data:</strong> Operational data related to your trucking fleet, drivers, loads, and DOT compliance, strictly required to provide our Services to you.</li>
                        </ul>

                        <h2>2. Use of Your Information</h2>
                        <p>
                            Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the platform to:
                        </p>
                        <ul>
                            <li>Create and manage your account and TMS operational environment.</li>
                            <li>Process transactions and send related information, including confirmations and invoices.</li>
                            <li>Manage your driver, load, and fleet records specifically for your internal operational use.</li>
                            <li>Improve platform efficiency and monitor metrics such as total number of visitors and traffic.</li>
                        </ul>

                        <h2>3. Security of Your Information</h2>
                        <p>
                            We use administrative, technical, and physical security measures to help protect your personal and operational fleet data. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                        </p>

                        <h2>4. Contact Us</h2>
                        <p>
                            If you have questions or comments about this Privacy Policy, please contact us at: <br />
                            <strong>Email:</strong> privacy@tmspro.com <br />
                            <strong>Address:</strong> 123 Freight Avenue, Suite 100, Chicago, IL 60601
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
