import { Platform } from "react-native";

export type CloudinaryResponse = {
  secure_url: string;
  public_id: string;
};

const uploadToCloudinary = async (imageUri: string): Promise<CloudinaryResponse> => {
  const data = new FormData();

  // Clean URI for Android compatibility
  const uri = Platform.OS === "android" ? imageUri : imageUri.replace("file://", "");

  data.append("file", {
    uri: uri,
    type: "image/jpeg",
    name: "profile_upload.jpg",
  } as any);

  // IMPORTANT: Replace these with your actual Cloudinary Dashboard values
  data.append("upload_preset", "MYBIZ-Cloudinary"); 
  const cloudName = "dgokbm0dx";

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: data,
        headers: {
          "Accept": "application/json",
          "Content-Type": "multipart/form-data",
        },
      }
    );

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