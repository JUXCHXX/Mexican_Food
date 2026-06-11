interface Props {
  className?: string;
  symbol?: string;
}

export function TalaveraDivider({ className = "", symbol = "✦" }: Props) {
  return (
    <div className={`talavera-divider my-6 ${className}`}>
      <span className="text-sombrero text-sm">{symbol}</span>
    </div>
  );
}
