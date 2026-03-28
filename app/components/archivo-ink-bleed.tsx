import { useId } from "react";

type ArchivoInkBleedProps = {
  align?: "left" | "center";
  className?: string;
  color?: string;
  fontSize?: number;
  lines: string[];
  maxWidth?: number;
};

export function ArchivoInkBleed({
  align = "left",
  className,
  color = "#f3f3ea",
  fontSize = 180,
  lines,
  maxWidth = 1200,
}: ArchivoInkBleedProps) {
  const filterId = useId();
  const safeLines = lines.filter((line) => line.trim().length > 0);
  const lineCount = Math.max(safeLines.length, 1);
  const paddingX = 0;
  const estimatedCharacterWidth = 0.58;
  const longestLineLength = safeLines.reduce(
    (longest, line) => Math.max(longest, line.length),
    1,
  );
  const availableWidth = Math.max(maxWidth - paddingX * 2, 1);
  const fittedFontSize = Math.min(
    fontSize,
    availableWidth / (longestLineLength * estimatedCharacterWidth),
  );
  const lineHeight = fittedFontSize * 1.14;
  const paddingTop = fittedFontSize * 0.9;
  const paddingBottom = fittedFontSize * 0.7;
  const viewBoxHeight = paddingTop + paddingBottom + lineHeight * lineCount;

  return (
    <svg
      aria-label={safeLines.join(" ")}
      fill="none"
      overflow="visible"
      className={className}
      viewBox={`0 0 ${maxWidth} ${viewBoxHeight}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={filterId} x="-30%" y="-40%" width="160%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix
            in="blur"
            result="threshold"
            type="matrix"
            values={`
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 35 -12
            `}
          />
          <feComposite in="threshold" in2="SourceGraphic" operator="over" />
        </filter>
      </defs>

      {safeLines.map((line, index) => (
        <text
          key={`${line}-${index}`}
          fill={color}
          filter={`url(#${filterId})`}
          fontFamily='"Archivo", sans-serif'
          fontSize={fittedFontSize}
          fontWeight="900"
          letterSpacing="-0.06em"
          textAnchor={align === "center" ? "middle" : "start"}
          x={align === "center" ? maxWidth / 2 : paddingX}
          y={paddingTop + lineHeight * index}
        >
          {line}
        </text>
      ))}
    </svg>
  );
}
