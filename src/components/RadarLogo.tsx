import brandIcon from "@/assets/stocksradars-icon-brand.jpeg";

export function RadarLogo({ size = 32 }: { size?: number }) {
  return (
    <img
      src={brandIcon}
      alt="StocksRadars logo"
      className="rounded-lg object-contain"
      style={{ width: size, height: size }}
    />
  );
}
