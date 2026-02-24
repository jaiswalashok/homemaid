import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, ensureAuth } from "./firebase";

export async function uploadImageToStorage(
  imageData: Uint8Array,
  path: string,
  contentType: string = "image/png"
): Promise<string> {
  // Ensure user is authenticated before uploading
  await ensureAuth();
  const storageRef = ref(storage, path);
  console.log("[Storage] Uploading to:", path, "size:", imageData.length, "bytes");
  try {
    await uploadBytes(storageRef, imageData, { contentType });
    const url = await getDownloadURL(storageRef);
    console.log("[Storage] Upload success:", url);
    return url;
  } catch (err: any) {
    console.error("[Storage] Upload failed:", err.code, err.message);
    throw err;
  }
}
