import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Blog", href: "/blog" },
  ],
  support: [
    { label: "Help Center", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "Track Order", href: "/orders" },
    { label: "Returns", href: "/returns" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Refund Policy", href: "/refund" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-app py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-black">F</span>
              </div>
              <span className="font-black text-2xl text-white">
                Fresh<span className="text-green-400">In10</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 mb-6 max-w-xs leading-relaxed">
              Ultra-fast grocery delivery promising fresh groceries at your doorstep in just 10 minutes.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-400" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-400" />
                <span>support@freshin10.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-400" />
                <span>Mumbai, Maharashtra, India</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-bold text-white mb-4 capitalize">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-green-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} FreshIn10. All rights reserved.
          </p>

          {/* Social */}
          <div className="flex items-center gap-3">
            {[
              { icon: Facebook, href: "#" },
              { icon: Twitter, href: "#" },
              { icon: Instagram, href: "#" },
              { icon: Youtube, href: "#" },
            ].map(({ icon: Icon, href }, i) => (
              <a
                key={i}
                href={href}
                className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>

          {/* Payment icons */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Secure payments:</span>
            <span className="bg-gray-800 px-2 py-1 rounded font-bold text-white">Razorpay</span>
            <span className="bg-gray-800 px-2 py-1 rounded font-bold text-white">UPI</span>
            <span className="bg-gray-800 px-2 py-1 rounded font-bold text-white">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
