"use client";

import { CldImage } from "next-cloudinary";
import { hasCloudinaryConfig } from "@/lib/cloudinary";

export default function CloudinarySampleImage() {
  const cloudinaryConfigured = hasCloudinaryConfig();

  if (!cloudinaryConfigured) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(
        "[Cloudinary] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set. Showing placeholder image."
      );
    }

    return (

      <div className="absolute top-5 right-5 z-20">
        {/* Placeholder while Cloudinary env var is missing */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Logo.png"
          alt="Cloudinary placeholder"
          width={120}
          height={120}
          style={{ borderRadius: 12, opacity: 0.9 }}
        />
      </div>
    );
  }

  return (
    <div className="absolute top-5 right-5 z-20">
      <CldImage
        src="cld-sample-5" // Use this sample image or upload your own via the Media Library
        width="500"
        height="500"
        crop={{
          type: "auto",
          source: true,
        }}
        alt="Cloudinary sample image"
      />
    </div>
  );
}


