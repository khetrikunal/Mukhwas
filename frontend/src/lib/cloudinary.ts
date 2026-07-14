export function getCloudinaryCloudName() {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
}

export function hasCloudinaryConfig() {
  return Boolean(getCloudinaryCloudName());
}


