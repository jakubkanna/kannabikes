import { useId } from "react";

const KANNA_LOGO_VIEWBOX = 567;
const KANNA_LOGO_PATH =
  "M369.22,535.11l-33.43-32.77c-6.9-6.77-16.02-9.21-25.93-7.07-7.34,1.59-14.96,6.83-19.34,15.35-17.05,33.16-49.59,56.14-87.83,56.13h-86.25c-60.25-.01-109.22-47.12-115.63-105.44-6.6-59.95,31.62-114.45,90.48-129.14,15.3-3.82,27.13-15.93,27.21-31.92l.17-32.26c.08-15.89-10.99-28.62-26.14-32.78-20.97-5.76-40.04-15.01-55.77-30.26C1.1,170.39-10.02,118.66,9.61,72.28,27.68,29.6,70.14,0,118.48,0h82.45c38.48.02,72.11,22.14,89.31,55.99,4.43,8.72,11.92,14.1,19.82,15.85,9.77,2.16,19.2-.6,26.2-7.5l31.16-30.68c46.27-45.55,120.08-44.27,165.14,1.11,45.29,45.61,46.12,119.28.09,165.46l-61.77,61.98c-11.25,11.29-13.26,29.01-1.46,40.93l64.49,65.13c45,45.45,43.24,118.07-.43,163.03-44.12,45.42-118.08,49.08-164.25,3.81ZM339.76,283.5c0-31.17-25.26-56.43-56.42-56.43s-56.42,25.26-56.42,56.43,25.26,56.43,56.42,56.43,56.42-25.26,56.42-56.43Z";

type ArchivoInkBleedProps = {
  align?: "left" | "center";
  className?: string;
  color?: string;
  endMark?: "kanna-logo";
  endMarkColor?: string;
  endMarkGap?: number;
  endMarkSize?: number;
  fontSize?: number;
  lines: string[];
  maxWidth?: number;
};

export function ArchivoInkBleed({
  align = "left",
  className,
  color = "#f3f3ea",
  endMark,
  endMarkColor,
  endMarkGap = 12,
  endMarkSize = 12,
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
  const lastLine = safeLines[lineCount - 1] ?? "";
  const lastLineWidth =
    lastLine.length * estimatedCharacterWidth * fittedFontSize;
  const lastLineStartX =
    align === "center" ? (maxWidth - lastLineWidth) / 2 : paddingX;
  const endMarkX = lastLineStartX + lastLineWidth + endMarkGap;
  const endMarkY =
    paddingTop + lineHeight * (lineCount - 1) - fittedFontSize * 0.82;
  const endMarkScale = endMarkSize / KANNA_LOGO_VIEWBOX;

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

      {endMark === "kanna-logo" ? (
        <path
          d={KANNA_LOGO_PATH}
          fill={endMarkColor ?? color}
          transform={`translate(${endMarkX} ${endMarkY}) scale(${endMarkScale})`}
        />
      ) : null}
    </svg>
  );
}
