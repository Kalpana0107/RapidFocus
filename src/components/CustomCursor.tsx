import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../hooks/useTheme";

export const CustomCursor: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      cursor.style.display = "block";

      // Detect hover over interactive elements
      const target = e.target as HTMLElement | null;
      if (target && typeof target.closest === "function") {
        const isInteractive = 
          target.closest('button, a, select, input, textarea, [role="button"], .clickable-tab, .task-card-hover, [type="checkbox"], label') !== null;
        setIsHovered(isInteractive);
      } else {
        setIsHovered(false);
      }
    };

    const handleMouseLeave = () => {
      cursor.style.display = "none";
    };

    const handleMouseEnter = () => {
      cursor.style.display = "block";
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed z-[99999] hidden md:block"
      style={{
        width: "32px",
        height: "32px",
        left: "-100px",
        top: "-100px",
        transform: "translate(-8px, -8px)", // Aligns the (0,0) tip exactly to mouse coordinate
        pointerEvents: "none",
        transition: "none",
        display: "none", // initially hidden
      }}
    >
      <svg
        width="34"
        height="34"
        viewBox="-8 -8 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Classical arrow pointing at 0, 0 */}
        <path
          d="M0 0V20L5.5 14L10 23L12.5 21L8 12.5L14.5 12.5L0 0Z"
          fill="white"
          stroke="#000000"
          strokeWidth="1.2"
          strokeLinejoin="miter"
        />
        {/* Glowing dot sits exactly at (0, 0) */}
        <circle
          cx="0"
          cy="0"
          r="4.5"
          fill={isHovered ? (isDark ? "#FFD700" : "#F59E0B") : (isDark ? "#00D4FF" : "#0891B2")}
          style={{
            filter: isHovered 
              ? (isDark ? "drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 4px #FFD700)" : "drop-shadow(0 0 6px #F59E0B)")
              : (isDark ? "drop-shadow(0 0 6px #00D4FF) drop-shadow(0 0 2px #00D4FF)" : "drop-shadow(0 0 4px #0891B2)"),
            transition: "fill 0.15s ease, filter 0.15s ease",
          }}
        />
      </svg>
    </div>
  );
};
