'use client';

import Link from 'next/link';
import { Truck, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-purple-500/30 font-sans">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-600/5 blur-[150px] rounded-full" />
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
                            <Scale className="w-4 h-4 text-indigo-400" /> Legal Information
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Terms of Service</h1>
                        <p className="text-slate-400">Last updated: February 20, 2026</p>
                    </div>

                    <div className="prose prose-invert prose-indigo max-w-none prose-headings:font-bold prose-headings:text-slate-200 prose-p:text-slate-300 prose-p:leading-relaxed prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-li:text-slate-300">
                        <p>
                            Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the TMS Pro website and Transportation Management System (the "Service") operated by TMS Pro ("us", "we", or "our").
                        </p>

                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.
                        </p>

                        <h2>2. Description of Service</h2>
                        <p>
                            TMS Pro provides a software-as-a-service (SaaS) platform designed for motor carriers to manage their fleet operations, including dispatch, driver management, compliance, and settlements. We reserve the right to modify or discontinue, temporarily or permanently, the Service with or without notice.
                        </p>

                        <h2>3. User Accounts</h2>
                        <p>
                            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                        </p>
                        <p>
                            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
                        </p>

                        <h2>4. Data Privacy and Security</h2>
                        <p>
                            Your use of the Service is also governed by our Privacy Policy. You maintain full ownership of the operational data you input into the Service. We do not sell your operational or customer data to third parties.
                        </p>

                        <h2>5. Service Limitations & Liability</h2>
                        <p>
                            In no event shall TMS Pro, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content.
                        </p>

                        <h2>6. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at: <br />
                            <strong>Email:</strong> legal@tmspro.com <br />
                            <strong>Address:</strong> 123 Freight Avenue, Suite 100, Chicago, IL 60601
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
