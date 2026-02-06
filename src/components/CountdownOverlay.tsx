interface CountdownOverlayProps {
  count: number;
}

export function CountdownOverlay({ count }: CountdownOverlayProps) {
  if (count <= 0) return null;

  return (
    <div className="countdown-overlay">
      <div key={count} className="countdown-number">
        {count}
      </div>
    </div>
  );
}
