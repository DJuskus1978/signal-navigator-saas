interface IPhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function IPhoneFrame({ children, className = "" }: IPhoneFrameProps) {
  return (
    <div className={`inline-block ${className}`}>
      <div className="relative bg-foreground rounded-[2.5rem] p-2 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground rounded-b-2xl z-10" />
        {/* Screen */}
        <div className="relative bg-background rounded-[2rem] overflow-hidden">
          {/* Status bar area */}
          <div className="h-8 bg-background" />
          {children}
          {/* Home indicator */}
          <div className="flex justify-center py-2 bg-background">
            <div className="w-28 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
