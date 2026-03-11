import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ENCRYPTION_KEY_ALIAS = "kezi_encryption_key";
const ASYNC_KEY_FALLBACK = "@kezi/encryption_key_fallback";
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const HASH_OUTPUT_LENGTH = 32;

let encryptionKey: string | null = null;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function stringToBytes(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

function bytesToString(bytes: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

async function storeKey(key: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(ASYNC_KEY_FALLBACK, key);
  } else {
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, key);
  }
}

async function loadKey(): Promise<string | null> {
  if (Platform.OS === "web") {
    return await AsyncStorage.getItem(ASYNC_KEY_FALLBACK);
  } else {
    return await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
  }
}

async function generateKey(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(KEY_LENGTH);
  return bytesToHex(new Uint8Array(randomBytes));
}

// Generate keystream blocks using SHA-256(key + IV + counter) to create a stream cipher.
// Each block produces 32 bytes of keystream. Blocks are concatenated and truncated
// to match the plaintext length, then XORed with the data.
async function generateKeystream(
  keyHex: string,
  ivHex: string,
  length: number
): Promise<Uint8Array> {
  const keystream = new Uint8Array(length);
  const blocksNeeded = Math.ceil(length / HASH_OUTPUT_LENGTH);
  let offset = 0;

  for (let counter = 0; counter < blocksNeeded; counter++) {
    const input = keyHex + ivHex + counter.toString();
    const hashHex = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      input
    );
    const hashBytes = hexToBytes(hashHex);

    const remaining = length - offset;
    const toCopy = Math.min(HASH_OUTPUT_LENGTH, remaining);
    keystream.set(hashBytes.subarray(0, toCopy), offset);
    offset += toCopy;
  }

  return keystream;
}

function xorBytes(data: Uint8Array, keystream: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keystream[i];
  }
  return result;
}

export async function initEncryption(): Promise<void> {
  try {
    let key = await loadKey();
    if (!key) {
      key = await generateKey();
      await storeKey(key);
    }
    encryptionKey = key;
  } catch (error) {
    console.error("Failed to initialize encryption:", error);
    encryptionKey = null;
  }
}

export async function encryptData(plaintext: string): Promise<string> {
  try {
    if (!encryptionKey) {
      return plaintext;
    }

    const ivBytes = new Uint8Array(await Crypto.getRandomBytesAsync(IV_LENGTH));
    const ivHex = bytesToHex(ivBytes);

    const plaintextBytes = stringToBytes(plaintext);
    const keystream = await generateKeystream(
      encryptionKey,
      ivHex,
      plaintextBytes.length
    );
    const ciphertextBytes = xorBytes(plaintextBytes, keystream);

    const combined = new Uint8Array(IV_LENGTH + ciphertextBytes.length);
    combined.set(ivBytes, 0);
    combined.set(ciphertextBytes, IV_LENGTH);

    return bytesToBase64(combined);
  } catch (error) {
    console.error("Encryption failed:", error);
    return plaintext;
  }
}

export async function decryptData(ciphertext: string): Promise<string> {
  try {
    if (!encryptionKey) {
      return ciphertext;
    }

    const combined = base64ToBytes(ciphertext);

    if (combined.length < IV_LENGTH) {
      return ciphertext;
    }

    const ivBytes = combined.subarray(0, IV_LENGTH);
    const ivHex = bytesToHex(ivBytes);
    const ciphertextBytes = combined.subarray(IV_LENGTH);

    const keystream = await generateKeystream(
      encryptionKey,
      ivHex,
      ciphertextBytes.length
    );
    const plaintextBytes = xorBytes(ciphertextBytes, keystream);

    return bytesToString(plaintextBytes);
  } catch (error) {
    console.error("Decryption failed:", error);
    return ciphertext;
  }
}

export function isEncryptionEnabled(): boolean {
  return encryptionKey !== null;
}
