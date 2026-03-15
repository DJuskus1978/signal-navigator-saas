import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { RadarLogo } from "@/components/RadarLogo";
import { ArrowLeft } from "lucide-react";

const NAVY       = "#0A0F2E";
const NAVY2      = "#0F1A3E";
const CYAN       = "#00D4FF";
const RED        = "#FF4757";
const BORDER_CLR = "#1E3A7B";
const MUTED      = "#6B7A99";
const WHITE      = "#FFFFFF";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div style={{ minHeight: "100vh", background: NAVY, display: "flex", flexDirection: "column" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,15,46,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER_CLR}` }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 1.25rem", height: "60px", display: "flex", alignItems: "center" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <RadarLogo />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "1.2rem", letterSpacing: "0.04em", color: WHITE }}>
              Stocks<span style={{ color: CYAN }}>Radars</span>
            </span>
          </Link>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{ background: NAVY2, border: `1px solid ${BORDER_CLR}`, borderLeft: `5px solid ${RED}`, padding: "2.5rem", marginBottom: "1.5rem" }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: RED, marginBottom: "0.5rem" }}>
              Error 404
            </p>
            <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: "6rem", color: WHITE, lineHeight: 1, letterSpacing: "-0.02em", margin: 0 }}>
              404
            </h1>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.08em", color: WHITE, margin: "0.5rem 0" }}>
              Page Not Found
            </p>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: MUTED, lineHeight: 1.6, margin: 0 }}>
              The page <code style={{ fontFamily: "monospace", color: CYAN, fontSize: "0.8rem" }}>{location.pathname}</code> doesn't exist.
            </p>
          </div>
          <Link
            to="/"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: CYAN, color: NAVY, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.16em", textTransform: "uppercase", padding: "0.75rem 1.5rem", textDecoration: "none" }}
          >
            <ArrowLeft size={14} /> Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
