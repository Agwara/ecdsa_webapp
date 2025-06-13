import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes, toHex, hexToBytes } from "ethereum-cryptography/utils";
import * as secp from "ethereum-cryptography/secp256k1";

export const generateSignature = async (recipient, amount, privateKeyHex) => {
  // Validate that private key is provided
  if (!privateKeyHex) {
    throw new Error("Private key is required");
  }

  // Remove '0x' prefix if present
  const cleanPrivateKey = privateKeyHex.startsWith('0x') 
    ? privateKeyHex.slice(2) 
    : privateKeyHex;

  const privateKey = hexToBytes(cleanPrivateKey);

  // Create the message to sign
  const message = JSON.stringify({ recipient, amount });
  
  // Hash the message
  const messageHash = keccak256(utf8ToBytes(message));

  // Get the public key from private key to verify ownership
  const publicKey = secp.getPublicKey(privateKey);
  const publicKeyHex = toHex(publicKey);

  console.log("Public key derived:", publicKeyHex);
  
  // Sign the message hash with the private key
  const [signature, recoveryBit] = await secp.sign(messageHash, privateKey, { recovered: true });
  
  // Return the signature, recovery bit, and derived public key
  return {
    signature: toHex(signature),
    recoveryBit,
    publicKey: publicKeyHex
  };
};