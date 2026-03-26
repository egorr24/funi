const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (arrayBuffer: ArrayBuffer): string => {
  return Buffer.from(arrayBuffer).toString("base64");
};

const fromBase64 = (value: string): ArrayBuffer => {
  const buffer = Buffer.from(value, "base64");
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

export type E2EEPayload = {
  encryptedBody: string;
  encryptedAes: string;
  iv: string;
};

export const generateIdentityKeys = async () => {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKey = await crypto.subtle.exportKey("spki", pair.publicKey);
  const privateKey = await crypto.subtle.exportKey("pkcs8", pair.privateKey);

  return {
    publicKey: toBase64(publicKey),
    privateKey: toBase64(privateKey),
  };
};

export const encryptMessage = async (body: string, receiverPublicKeyB64: string): Promise<E2EEPayload> => {
  const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBodyBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoder.encode(body)
  );
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
  const receiverPublicKey = await crypto.subtle.importKey(
    "spki",
    fromBase64(receiverPublicKeyB64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
  const encryptedAesBuffer = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, receiverPublicKey, rawAesKey);

  return {
    encryptedBody: toBase64(encryptedBodyBuffer),
    encryptedAes: toBase64(encryptedAesBuffer),
    iv: toBase64(iv.buffer),
  };
};

export const decryptMessage = async (
  payload: E2EEPayload,
  receiverPrivateKeyB64: string
): Promise<string> => {
  const receiverPrivateKey = await crypto.subtle.importKey(
    "pkcs8",
    fromBase64(receiverPrivateKeyB64),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );

  const rawAesKey = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    receiverPrivateKey,
    fromBase64(payload.encryptedAes)
  );
  const aesKey = await crypto.subtle.importKey("raw", rawAesKey, { name: "AES-GCM" }, false, ["decrypt"]);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(fromBase64(payload.iv)) },
    aesKey,
    fromBase64(payload.encryptedBody)
  );

  return decoder.decode(plainBuffer);
};
