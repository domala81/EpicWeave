import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b border-border bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight text-purple-700">EPIC<span className="text-orange-500">WEAVE</span></span>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/products" className="hover:text-purple-700 transition-colors">Catalog</Link>
            <Link href="/design" className="hover:text-purple-700 transition-colors">AI Studio</Link>
            <Link href="/cart" className="hover:text-purple-700 transition-colors">Cart</Link>
            <Link href="/orders" className="hover:text-purple-700 transition-colors">Orders</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/products"><Button variant="outline" size="sm" className="border-purple-200 hover:border-purple-400">Browse</Button></Link>
            <Link href="/design"><Button size="sm" className="bg-orange-500 hover:bg-orange-400 text-white">Start Designing</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-950 via-indigo-900 to-purple-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, #a855f7 0%, transparent 50%), radial-gradient(circle at 80% 20%, #f97316 0%, transparent 50%)'}} />
        <div className="container mx-auto px-4 py-28 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8 backdrop-blur-sm">
            <span className="text-orange-400">✦</span>
            <span className="text-purple-100">AI-Powered Custom Apparel</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
            Wear the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              Mythology
            </span>
          </h1>
          <p className="text-lg md:text-xl text-purple-200 max-w-xl mx-auto mb-10 leading-relaxed">
            Shop pre-designed Hindu &amp; Greek mythology tees, or use AI to generate a completely unique design — yours in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 bg-white/10 border-white/30 text-white hover:bg-white/20">
                Browse Catalog
              </Button>
            </Link>
            <Link href="/design">
              <Button size="lg" className="w-full sm:w-auto px-8 bg-orange-500 hover:bg-orange-400 text-white font-bold">
                ✨ Create with AI — $2.00
              </Button>
            </Link>
          </div>
        </div>

        {/* Sample designs strip */}
        <div className="relative z-10 pb-12">
          <div className="flex justify-center gap-4 px-4 flex-wrap">
            {['/TestImg/Greek1.png', '/TestImg/Hindu1.png', '/TestImg/Greek2.png', '/TestImg/Hindu2.png'].map((src, i) => (
              <div key={i} className="w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden border-2 border-white/20 shadow-xl">
                <Image src={src} alt="design preview" width={112} height={112} className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-3">How It Works</h2>
          <p className="text-muted-foreground text-lg">From design to doorstep in three steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: '01', icon: '🛍️', title: 'Pick a Design', desc: 'Browse 6 pre-designed Hindu & Greek mythology tees — filtered by mythology and art style.' , cta: 'Browse Catalog', href: '/products', variant: 'outline' as const },
            { step: '02', icon: '🎨', title: 'Generate with AI', desc: 'Start a $2 AI session and use DALL-E to generate up to 5 iterations of your dream design.', cta: 'Start AI Session', href: '/design', variant: 'default' as const },
            { step: '03', icon: '👕', title: 'Customize & Order', desc: 'Choose your tee color, size, and print placement. Add to cart and checkout securely.', cta: 'View Cart', href: '/cart', variant: 'outline' as const },
          ].map(({ step, icon, title, desc, cta, href, variant }) => (
            <div key={step} className="relative bg-card rounded-2xl border border-border p-7 hover:border-primary/40 hover:shadow-md transition-all">
              <div className="absolute -top-3 -left-1 text-6xl font-black text-primary/8 select-none leading-none">{step}</div>
              <div className="text-4xl mb-4">{icon}</div>
              <h3 className="text-lg font-bold mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5">{desc}</p>
              <Link href={href}>
                <Button variant={variant} className={`w-full ${variant === 'default' ? 'bg-primary hover:bg-primary/90' : ''}`}>{cta}</Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Design preview strip */}
      <section className="bg-gradient-to-r from-secondary/80 to-secondary py-14">
        <div className="container mx-auto px-4 text-center mb-8">
          <h2 className="text-2xl font-black mb-2">Featured Designs</h2>
          <p className="text-muted-foreground text-sm">Click any design in the catalog to customize your tee</p>
        </div>
        <div className="flex justify-center gap-5 px-4 flex-wrap">
          {[
            { src: '/TestImg/Greek1.png', name: 'Zeus', type: 'Greek · Modern' },
            { src: '/TestImg/Hindu1.png', name: 'Shiva', type: 'Hindu · Modern' },
            { src: '/TestImg/Greek2.png', name: 'Athena', type: 'Greek · Anime' },
            { src: '/TestImg/Hindu2.png', name: 'Ganesha', type: 'Hindu · Anime' },
            { src: '/TestImg/Greek3.png', name: 'Poseidon', type: 'Greek · Modern' },
            { src: '/TestImg/Hindu3.png', name: 'Durga', type: 'Hindu · Modern' },
          ].map(({ src, name, type }) => (
            <Link href="/products" key={name} className="group flex flex-col items-center gap-2">
              <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-border group-hover:border-primary shadow-sm group-hover:shadow-md transition-all">
                <Image src={src} alt={name} width={112} height={112} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
              </div>
              <span className="text-xs font-semibold text-foreground">{name}</span>
              <span className="text-xs text-muted-foreground">{type}</span>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/products">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">View Full Catalog →</Button>
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-black mb-2">Simple Pricing</h2>
        <p className="text-muted-foreground mb-10">No subscriptions — pay only for what you order.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl mx-auto">
          {[
            { price: '$2.00', label: 'AI Design Session', sub: '5 iterations · 1 hour', highlight: false },
            { price: '$29.99', label: 'Custom T-Shirt', sub: '+$8 for front & back', highlight: true },
            { price: '$5.99', label: 'Flat Shipping', sub: 'All orders · tracked', highlight: false },
          ].map(({ price, label, sub, highlight }) => (
            <div key={label} className={`rounded-2xl border p-6 ${highlight ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card'}`}>
              <div className={`text-3xl font-black mb-1 ${highlight ? 'text-primary' : 'text-foreground'}`}>{price}</div>
              <div className="text-sm font-semibold text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground mt-1">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-black text-base text-purple-700">EPIC<span className="text-orange-500">WEAVE</span></span>
          <span>© 2025 EpicWeave. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="/products" className="hover:text-foreground transition-colors">Catalog</Link>
            <Link href="/design" className="hover:text-foreground transition-colors">AI Studio</Link>
            <Link href="/orders" className="hover:text-foreground transition-colors">Orders</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
