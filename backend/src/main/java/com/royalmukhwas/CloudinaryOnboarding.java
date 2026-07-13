package com.royalmukhwas;

import com.cloudinary.Cloudinary;
import com.cloudinary.api.ApiResponse;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;

import java.util.Map;

public class CloudinaryOnboarding {

    public static void main(String[] args) throws Exception {
        // Cloudinary credentials (inline, no .env file)
        // If you prefer placeholders, replace values below with:
        // YOUR_CLOUD_NAME, YOUR_API_KEY, YOUR_API_SECRET
        String cloudName = "jk9wre7j"; // ← replace this if needed
        String apiKey = "953535155259876"; // ← replace this if needed
        String apiSecret = "CmaB9NM9nRNDf_Tpgv1j4ZGa7W4"; // ← replace this if needed

        Cloudinary cloudinary = new Cloudinary(
                ObjectUtils.asMap(
                        "cloud_name", cloudName,
                        "api_key", apiKey,
                        "api_secret", apiSecret
                )
        );

        // 2) Upload an image from Cloudinary demo domains
        String sampleImageUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";

        Map uploadResult = cloudinary.uploader().upload(sampleImageUrl, ObjectUtils.emptyMap());

        String publicId = (String) uploadResult.get("public_id");
        String secureUrl = (String) uploadResult.get("secure_url");

        System.out.println("Uploaded image public_id: " + publicId);
        System.out.println("Uploaded image secure_url: " + secureUrl);

        // 3) Get image details
        ApiResponse resource = cloudinary.api().resource(publicId, ObjectUtils.emptyMap());
        Map info = (Map) resource.get("resource");

        Object widthObj = info.get("width");
        Object heightObj = info.get("height");
        Object formatObj = info.get("format");
        Object bytesObj = info.get("bytes");

        long width = widthObj instanceof Number ? ((Number) widthObj).longValue() : -1;
        long height = heightObj instanceof Number ? ((Number) heightObj).longValue() : -1;
        String format = formatObj != null ? formatObj.toString() : "";
        long bytes = bytesObj instanceof Number ? ((Number) bytesObj).longValue() : -1;

        System.out.println("Image metadata:");
        System.out.println("  width: " + width);
        System.out.println("  height: " + height);
        System.out.println("  format: " + format);
        System.out.println("  file size (bytes): " + bytes);

        // 4) Transform the image using both f_auto and q_auto
        // f_auto => automatically selects the best image format
        // q_auto => automatically chooses the best quality for the transformation
        String transformedUrl = cloudinary.url()
                .transformation(
                        new Transformation()
                                .format("auto")
                                .quality("auto")
                )
                .generate(publicId);

        System.out.println("Done! Click link below to see optimized version of the image. Check the size and the format.");
        System.out.println("Transformed optimized URL: " + transformedUrl);

        // Per onboarding rules, do not open the transformed URL here.
        System.out.println("Next: Open the transformed URL manually in your browser.");
    }
}

