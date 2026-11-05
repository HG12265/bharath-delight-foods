import Image from "@/platform/image";
import type { ReactNode } from "react";

/** Shared presentation only: existing page copy, links and actions are supplied unchanged. */
export default function PageBanner({
  children,
  image,
  imageMobile,
  alt,
  variant = "inner",
  imageClassName = "",
}: {
  children: ReactNode;
  image: string;
  imageMobile?: string;
  alt: string;
  variant?: "home" | "inner" | "about";
  imageClassName?: string;
}) {
  const isLegacyExtracted = image === "/images/extracted_image1.png";

  // If no explicit imageMobile is passed, but home-and-about-page-panner is used, default to the mobile-cropped version
  const resolvedMobileImage = imageMobile || (
    image.includes("home-and-about-page-panner")
      ? "/images/home-and-about-page-panner-mobile.png"
      : undefined
  );

  return (
    <section className={`reference-banner reference-banner--${variant}`}>
      <div className="reference-banner__media">
        {variant === "home" && isLegacyExtracted ? (
          <svg className="reference-banner__image" viewBox="303 82 532 402" preserveAspectRatio="xMidYMid slice" role="img" aria-label={alt}>
            <image href="/images/extracted_image1.png" width="835" height="1883" />
          </svg>
        ) : (
          <>
            {/* Desktop / Tablet Image */}
            <div className={resolvedMobileImage ? "hidden md:block w-full h-full relative" : "w-full h-full relative"}>
              <Image
                src={image}
                alt={alt}
                fill
                priority
                sizes="(max-width: 767px) 100vw, 62vw"
                quality={95}
                className={`reference-banner__image ${imageClassName}`}
              />
            </div>

            {/* Mobile Image (Cosmic Latte cream area cropped out) */}
            {resolvedMobileImage && (
              <div className="block md:hidden w-full h-full relative">
                <Image
                  src={resolvedMobileImage}
                  alt={alt}
                  fill
                  priority
                  sizes="100vw"
                  quality={95}
                  className={`reference-banner__image ${imageClassName}`}
                />
              </div>
            )}
          </>
        )}
      </div>
      <div className="reference-banner__container">
        <div className="reference-banner__content">{children}</div>
      </div>
    </section>
  );
}
