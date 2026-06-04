"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";

interface SafeImageProps extends Omit<ImageProps, "src"> {
  src?: string | null;
  fallbackIcon?: string;
  fallbackClassName?: string;
}

export function SafeImage({ src, fallbackIcon = "🛒", fallbackClassName = "w-full h-full flex items-center justify-center text-4xl bg-gray-50", ...props }: SafeImageProps) {
  const [error, setError] = useState(false);

  let isValidUrl = false;
  try {
    if (src) {
      new URL(src);
      isValidUrl = true;
    }
  } catch {
    if (src?.startsWith("/")) isValidUrl = true;
  }

  if (!isValidUrl || error || !src) {
    return <div className={fallbackClassName}>{fallbackIcon}</div>;
  }

  let hostname = "";
  try {
    if (src) {
      const url = new URL(src);
      hostname = url.hostname;
    }
  } catch {}

  const configuredHosts = [
    "res.cloudinary.com",
    "images.unsplash.com",
    "images.pexels.com",
    "cdn.freshin10.com",
    "localhost",
    "lh3.googleusercontent.com"
  ];

  const useStandardImg = hostname && !configuredHosts.includes(hostname);

  if (useStandardImg) {
    const { fill, ...imgProps } = props as any;
    return (
      <img
        src={src}
        {...imgProps}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      {...props}
      onError={() => setError(true)}
    />
  );
}
