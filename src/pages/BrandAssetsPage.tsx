import { Link } from "react-router-dom";
import { RadarLogo } from "@/components/RadarLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import logoFullJpg from "@/assets/stocksradars-logo-full.jpg";

const logos = [
  {
    name: "Full Logo (Dark BG)",
    description: "SVG vector — dark navy background, green radar + white text",
    file: "/stocksradars-logo.svg",
    format: "SVG",
  },
  {
    name: "Full Logo (Light BG)",
    description: "SVG vector — transparent background, blue radar + dark text",
    file: "/stocksradars-logo-white.svg",
    format: "SVG",
  },
  {
    name: "Icon Only",
    description: "SVG vector — radar icon, rounded square, dark background",
    file: "/stocksradars-icon.svg",
    format: "SVG",
  },
  {
    name: "Full Logo (High-Res)",
    description: "JPG 1920×1024 — ultra high resolution, dark background",
    file: logoFullJpg,
    format: "JPG",
  },
];

export default function BrandAssetsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <RadarLogo />
            <span className="font-display font-bold text-xl">Stocks<span className="text-primary">Radars</span></span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="font-display text-3xl font-bold mb-2">Brand Assets</h1>
        <p className="text-muted-foreground mb-10">Download official StocksRadars logo files.</p>

        <div className="grid gap-6 sm:grid-cols-2">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4"
            >
              <div className="aspect-[2/1] rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
                <img
                  src={logo.file}
                  alt={logo.name}
                  className="max-h-full max-w-full object-contain p-4"
                />
              </div>
              <div>
                <h2 className="font-display font-semibold text-foreground">{logo.name}</h2>
                <p className="text-sm text-muted-foreground">{logo.description}</p>
              </div>
              <a href={logo.file} download className="mt-auto">
                <Button variant="outline" className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Download {logo.format}
                </Button>
              </a>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-10">
          For PDF versions, open any SVG file in a design tool (Figma, Illustrator, Inkscape) and export as PDF — vector quality is preserved.
        </p>
      </main>
    </div>
  );
}