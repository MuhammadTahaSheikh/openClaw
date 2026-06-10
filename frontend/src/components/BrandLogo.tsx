import logo from "../../logo.png";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
};

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
};

export function BrandLogo({ size = "md", showName = true }: BrandLogoProps) {
  const px = sizeMap[size];

  return (
    <div className={`brand-logo brand-logo--${size}`}>
      <img src={logo} alt="BestechVision" width={px} height={px} />
      {showName && <span className="brand-logo__name">BestechVision</span>}
    </div>
  );
}
