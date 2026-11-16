const ImageKit = require("imagekit");

let imagekit = null;

function configureImageKit() {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint || publicKey === "your_public_key") {
    console.error("ImageKit credentials not properly configured in .env file.");
    console.error("Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT.");
    process.exit(1);
  }

  imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
}

function getImageKitInstance() {
  if (!imagekit) {
    configureImageKit();
  }
  return imagekit;
}

async function uploadImage(fileBuffer, fileName, folder = "/receipts") {
  const ik = getImageKitInstance();
  if (!ik) {
    throw new Error("ImageKit initialization failed.");
  }

  return new Promise((resolve, reject) => {
    ik.upload(
      {
        file: fileBuffer,
        fileName: fileName,
        folder: folder,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
}

function getAuthParams() {
  const ik = getImageKitInstance();
  if (!ik) return null;
  return ik.getAuthenticationParameters();
}

module.exports = {
  uploadImage,
  getAuthParams,
  getImageKitInstance,
};