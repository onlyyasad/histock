import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ShoppingBag,
  Boxes,
  Users,
  FileText,
  Banknote,
  UserCog,
  Check,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'HiStock — The back office for your Facebook & Instagram shop',
  description:
    'Order tracking, inventory, customer CRM, invoices and COD remittance reconciliation for social commerce sellers in Bangladesh.',
}

const FEATURES = [
  {
    icon: ShoppingBag,
    title: 'Order tracking',
    description:
      'Full 8-state lifecycle from pending to delivered — including failed-delivery re-attempts, the everyday reality of COD.',
  },
  {
    icon: Boxes,
    title: 'Inventory & lots',
    description:
      'Stock counts, purchase lots and per-product margins. Know what\'s low before you promise it in a DM.',
  },
  {
    icon: Users,
    title: 'Customer CRM',
    description:
      'Profiles, address books, lifetime value and a flag system for repeat non-payers.',
  },
  {
    icon: FileText,
    title: 'PDF invoices',
    description:
      'Generate invoices and packing slips in your browser. Free on every plan, no limits.',
  },
  {
    icon: Banknote,
    title: 'COD reconciliation',
    description:
      'Import courier CSVs and match payouts against delivered orders. Stop losing money in the gap.',
  },
  {
    icon: UserCog,
    title: 'Team roles',
    description:
      'Owner, manager and staff access — let your team log orders without touching your numbers.',
  },
]

const TIERS = [
  {
    name: 'Starter',
    price: 'Free',
    priceSuffix: null,
    features: ['1 user', '200 orders/mo', '5 products', '25 SKUs'],
    cta: 'Start free',
    href: '/register',
    highlight: false,
    trial: null,
  },
  {
    name: 'Growth',
    price: '৳500',
    priceSuffix: '/mo',
    features: ['3 users', '500 orders/mo', '20 products', '100 SKUs'],
    cta: 'Start 14-day trial',
    href: '/register',
    highlight: true,
    trial: '14-day free trial · No credit card required',
  },
  {
    name: 'Business',
    price: '৳1,200',
    priceSuffix: '/mo',
    features: ['10 users', '1,500 orders/mo', '50 products', '250 SKUs'],
    cta: 'Get started',
    href: '/register',
    highlight: false,
    trial: null,
  },
  {
    name: 'Enterprise',
    price: 'Contact sales',
    priceSuffix: null,
    features: ['Custom limits', 'Dedicated support', 'SLA', 'Custom onboarding'],
    cta: 'Contact sales',
    href: 'mailto:sales@histock.app',
    highlight: false,
    trial: null,
  },
]

export default function HomePage() {
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-6xl flex h-14 items-center justify-between px-4 md:px-6">
          <Link href="/" className="text-lg font-bold">
            <span className="text-primary">Hi</span>Stock
          </Link>
          <nav className="hidden sm:flex gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Sign in
            </Link>
            <Link href="/register" className={buttonVariants({ size: 'sm' })}>
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 py-20 md:py-28 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          The back office for your Facebook &amp; Instagram shop
        </h1>
        <p className="text-lg text-muted-foreground mt-4">
          Keep selling in your DMs. HiStock tracks every order, your stock, your customers and your
          courier payouts — in one place.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          <Link href="/register" className={buttonVariants({ size: 'lg' })}>
            Get started free
          </Link>
          <Link href="/login" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Sign in
          </Link>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          14-day free trial · No credit card required
        </p>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-12">
          {[
            { label: "Today's orders", value: '24' },
            { label: 'Pending', value: '6' },
            { label: 'With courier', value: '9' },
            { label: "Today's revenue", value: '৳18,540' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-semibold tabular-nums font-mono">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 md:px-6 pb-20">
        <h2 className="text-2xl font-semibold tracking-tight text-center">
          Everything after the DM
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="p-5 flex gap-4">
                <f.icon className="size-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{f.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{f.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 md:px-6 pb-24">
        <h2 className="text-2xl font-semibold tracking-tight text-center">Simple pricing</h2>
        <p className="text-center text-muted-foreground mt-2">
          Start free. Upgrade when your order volume grows.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={cn(tier.highlight && 'border-primary shadow-sm')}
            >
              <CardContent className="p-5 flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{tier.name}</p>
                  {tier.highlight && (
                    <Badge variant="secondary" className="text-xs">Most popular</Badge>
                  )}
                </div>
                <div>
                  <span className="text-3xl font-semibold tabular-nums">{tier.price}</span>
                  {tier.priceSuffix && (
                    <span className="text-sm text-muted-foreground">{tier.priceSuffix}</span>
                  )}
                </div>
                <ul className="space-y-1.5 flex-1">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <Check className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
                {tier.trial && (
                  <p className="text-xs text-muted-foreground">{tier.trial}</p>
                )}
                <Link
                  href={tier.href}
                  className={buttonVariants({
                    variant: tier.highlight ? 'default' : 'outline',
                    size: 'sm',
                  })}
                >
                  {tier.cta}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>&copy; {year} HiStock</p>
          <a href="mailto:support@histock.app" className="hover:text-foreground transition-colors">
            support@histock.app
          </a>
        </div>
      </footer>
    </div>
  )
}
