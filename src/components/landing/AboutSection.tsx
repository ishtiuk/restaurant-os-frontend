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
                                Founded in 2025, RestaurantOS was born from a simple observation: great food deserves great technology. We saw restaurant owners struggling with fragmented tools, messy spreadsheets, and outdated POS systems.
                            </p>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                We built RestaurantOS to be the operating system for modern dining—seamlessly connecting orders, kitchen, inventory, and analytics in one intuitive platform.
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
                    <div className="relative animate-fade-in-right hidden lg:block">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50">
                            <div className="aspect-square bg-gradient-to-br from-gray-900 to-gray-800 relative flex items-center justify-center">
                                {/* Abstract Representation of "OS" */}
                                <div className="relative z-10 text-center space-y-4">
                                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-primary/20 backdrop-blur-xl border border-primary/30 text-primary">
                                        <span className="text-4xl font-bold">R</span>
                                    </div>
                                    <div className="absolute -top-6 -right-6 w-16 h-16 rounded-2xl bg-accent/20 backdrop-blur-xl border border-accent/30 flex items-center justify-center animate-bounce duration-[3000ms]">
                                        <Zap className="w-8 h-8 text-accent" />
                                    </div>
                                    <div className="absolute -bottom-4 -left-8 w-20 h-20 rounded-full bg-secondary/20 backdrop-blur-xl border border-secondary/30 flex items-center justify-center animate-pulse">
                                        <Users className="w-10 h-10 text-secondary" />
                                    </div>
                                </div>

                                {/* Background Grid */}
                                <div className="absolute inset-0 opacity-20"
                                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                                </div>
                            </div>
                        </div>
                        {/* Background offset border */}
                        <div className="absolute -inset-4 border-2 border-dashed border-primary/20 rounded-3xl -z-10" />
                    </div>

                </div>
            </div>
        </section>
    );
}
