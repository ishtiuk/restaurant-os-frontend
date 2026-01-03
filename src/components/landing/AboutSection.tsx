import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Users, Zap } from "lucide-react";

export function AboutSection() {
    return (
        <section id="about" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-muted/30">

            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Left Column: Content */}
                    <div className="space-y-8 animate-fade-in-left">
                        <div className="space-y-4">
                            <Badge variant="glass" className="px-4 py-1.5">Our Mission</Badge>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight leading-tight">
                                Empowering Restaurants to <span className="text-primary">Thrive</span>
                            </h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                Founded in 2025, RestaurantOSx was born from a simple observation: great food deserves great technology. We saw restaurant owners struggling with fragmented tools, messy spreadsheets, and outdated POS systems.
                            </p>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                We built RestaurantOSx to be the operating system for modern dining—seamlessly connecting orders, kitchen, inventory, and analytics in one intuitive platform.
                            </p>
                        </div>

                        {/* Stats / Values */}
                        <div className="grid sm:grid-cols-3 gap-6 pt-4">
                            <div className="space-y-2">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-semibold text-xl">Customer First</h3>
                                <p className="text-sm text-muted-foreground">Built with direct feedback from chefs & owners.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-accent" />
                                </div>
                                <h3 className="font-semibold text-xl">Lightning Fast</h3>
                                <p className="text-sm text-muted-foreground">Offline-first architecture for zero downtime.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                                    <Target className="w-6 h-6 text-secondary" />
                                </div>
                                <h3 className="font-semibold text-xl">Data Driven</h3>
                                <p className="text-sm text-muted-foreground">Actionable insights to boost profitability.</p>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary transition-colors">
                                Read our full story <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Visual / Image */}
                    <div className="relative animate-fade-in-right hidden lg:block perspective-1000">
                        {/* Isometric Container */}
                        <div className="relative transform transition-transform duration-700 hover:rotate-y-12 hover:rotate-x-6 rotate-y-6 rotate-x-3 preserve-3d">

                            {/* Main Dashboard Card */}
                            <div className="relative rounded-xl bg-card border border-border/50 shadow-2xl overflow-hidden aspect-square flex flex-col">
                                {/* Header Mockup */}
                                <div className="h-12 border-b border-border/50 bg-muted/30 flex items-center px-4 gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                                    </div>
                                    <div className="h-2 w-24 bg-foreground/10 rounded-full ml-4" />
                                </div>

                                {/* Body Mockup */}
                                <div className="flex-1 p-6 flex gap-6 bg-gradient-to-br from-background to-muted/20">
                                    {/* Sidebar */}
                                    <div className="w-12 flex flex-col gap-3 pt-2">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-lg bg-foreground/5" />
                                        ))}
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex-1 space-y-4">
                                        {/* Stats Row */}
                                        <div className="flex gap-4">
                                            <div className="flex-1 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                                <div className="h-2 w-12 bg-primary/20 rounded-full mb-2" />
                                                <div className="h-6 w-16 bg-primary/40 rounded-full" />
                                            </div>
                                            <div className="flex-1 p-3 rounded-lg bg-accent/10 border border-accent/20">
                                                <div className="h-2 w-12 bg-accent/20 rounded-full mb-2" />
                                                <div className="h-6 w-16 bg-accent/40 rounded-full" />
                                            </div>
                                        </div>

                                        {/* Chart Area */}
                                        <div className="h-32 rounded-lg bg-muted/40 border border-border/40 p-3 relative overflow-hidden">
                                            {/* Fake Chart Lines */}
                                            <svg className="absolute inset-0 w-full h-full p-4 opacity-50" viewBox="0 0 100 50" preserveAspectRatio="none">
                                                <path d="M0 40 Q25 20 50 30 T100 10" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
                                                <path d="M0 40 L0 50 L100 50 L100 10" fill="url(#gradient)" className="text-primary/10" />
                                                <defs>
                                                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                                        <stop offset="0%" stopColor="currentColor" />
                                                        <stop offset="100%" stopColor="transparent" />
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                        </div>

                                        {/* List Items */}
                                        <div className="space-y-2">
                                            {[1, 2].map(i => (
                                                <div key={i} className="h-10 rounded-lg bg-background border border-border/50 flex items-center px-3 gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-muted" />
                                                    <div className="h-2 w-20 bg-muted-foreground/20 rounded-full" />
                                                    <div className="ml-auto h-2 w-8 bg-muted-foreground/20 rounded-full" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements (3D Depth) */}
                            <div className="absolute -right-8 top-20 p-3 rounded-xl bg-card border border-border shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <span className="text-green-500 font-bold">$</span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Revenue</p>
                                        <p className="font-bold text-sm">+24%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -left-4 bottom-20 p-3 rounded-xl bg-card border border-border shadow-xl animate-float" style={{ animationDelay: '2s' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Users className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Active Tables</p>
                                        <p className="font-bold text-sm">12/15</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-accent/10 blur-3xl -z-10 rounded-full transform scale-90" />
                    </div>
                </div>
            </div>
        </section>
    );
}
