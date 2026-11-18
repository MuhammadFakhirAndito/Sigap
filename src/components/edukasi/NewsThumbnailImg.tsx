"use client";

import React, { useEffect, useState } from "react";

interface NewsThumbnailImgProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
}

export function NewsThumbnailImg({
  src,
  fallbackSrc,
  alt,
  className = "",
  width,
  height,
  loading = "lazy",
}: NewsThumbnailImgProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      width={width}
      height={height}
      referrerPolicy="no-referrer"
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
      className={className}
    />
  );
}
