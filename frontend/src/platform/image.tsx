import React from "react";
export default function Image({
  src,
  alt,
  fill,
  priority,
  quality,
  unoptimized,
  loader,
  onLoadingComplete,
  style,
  ...props
}: any) {
  return (
    <img
      {...props}
      src={typeof src === "string" ? src : src?.src}
      alt={alt || ""}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      style={{
        ...(fill
          ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
          : {}),
        ...style,
      }}
      onLoad={onLoadingComplete}
    />
  );
}
