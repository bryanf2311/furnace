export function CoalBed({ className = "" }: { className?: string }) {
  return (
    <div className={`coal-bed ${className}`} aria-hidden="true" role="presentation" />
  );
}

export function CoalBedThin({ className = "" }: { className?: string }) {
  return (
    <div className={`coal-bed-thin ${className}`} aria-hidden="true" role="presentation" />
  );
}
