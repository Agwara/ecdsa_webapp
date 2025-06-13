import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes, toHex, hexToBytes } from "ethereum-cryptography/utils";
import * as secp from "ethereum-cryptography/secp256k1";

export const generateSignature = async (recipient, amount) => {
  
  const privateKeyHex  = "0b6a997f463fdb73cd9971e1235d5ddcaf140ed0d91b7c3a2a9a2aa99527e19b"
  const privateKey = hexToBytes(privateKeyHex);

  // Create the message to sign
  const message = JSON.stringify({ recipient, amount });
  
  // Hash the message
  const messageHash = keccak256(utf8ToBytes(message));

  console.log("Private key (hex):", toHex(privateKey));
  console.log("Expected public key:", toHex(secp.getPublicKey(privateKey)));
  
  // Sign the message hash with the private key
  const [signature, recoveryBit] = await secp.sign(messageHash, privateKey, { recovered: true });
  
  // Return the signature and recovery bit
  return {
    signature: toHex(signature),
    recoveryBit,
  };
}