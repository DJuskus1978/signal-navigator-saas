interface IPhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function IPhoneFrame({ children, className = "" }: IPhoneFrameProps) {
  return (
    <div style={{ display: "inline-block" }} className={className}>
      <div style={{ position: "relative", background: "#0A0F2E", borderRadius: "2.5rem", padding: "3px", boxShadow: "0 0 0 1.5px #1E3A7B, 0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(0,212,255,0.08)" }}>
        {/* Dynamic island / notch */}
        <div style={{ position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", width: "90px", height: "24px", background: "#050810", borderRadius: "12px", zIndex: 10 }} />
        {/* Screen */}
        <div style={{ position: "relative", background: "#0A0F2E", borderRadius: "2.4rem", overflow: "hidden" }}>
          {/* Status bar */}
          <div style={{ height: "40px", background: "#050810" }} />
          {children}
          {/* Home indicator */}
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 12px", background: "#050810" }}>
            <div style={{ width: "100px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.2)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
