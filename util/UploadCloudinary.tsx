// util/cloudinaryUpload.ts
import { Platform } from "react-native";

export type CloudinaryResponse = {
  secure_url: string;
  public_id: string;
};

const uploadToCloudinary = async (fileUri: string): Promise<CloudinaryResponse> => {
  const data = new FormData();

  // Clean URI for Android compatibility
  const uri = Platform.OS === "android" ? fileUri : fileUri.replace("file://", "");

  // Determine file type
  const isPDF = uri.toLowerCase().endsWith('.pdf');
  
  data.append("file", {
    uri: uri,
    type: isPDF ? "application/pdf" : "image/jpeg",
    name: isPDF ? `invoice_${Date.now()}.pdf` : "upload.jpg",
  } as any);

  data.append("upload_preset", "MYBIZ-Cloudinary"); 
  const cloudName = "dgokbm0dx";

  // Use correct endpoint based on file type
  const endpoint = isPDF 
    ? `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`  // for PDFs
    : `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`; // for images

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      body: data,
      headers: {
        "Accept": "application/json",
        "Content-Type": "multipart/form-data",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Cloudinary upload failed");
    }

    return result;
  } catch (error) {
    console.error("Upload Error:", error);
    throw error;
  }
};

export default uploadToCloudinary;