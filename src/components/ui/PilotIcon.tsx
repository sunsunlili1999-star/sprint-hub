"use client";

import Image from "next/image";
import { CSSProperties } from "react";

interface PilotIconProps {
  style?: CSSProperties;
  className?: string;
}

export default function PilotIcon({ style, className }: PilotIconProps) {
  const size = style?.fontSize ? (typeof style.fontSize === 'number' ? style.fontSize : parseInt(style.fontSize as string)) : 16;
  
  return (
    <Image
      src="/icon.png"
      alt="小派"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
        fontSize: undefined, // 移除 fontSize，用 width/height 代替
      }}
    />
  );
}
