import { useState } from "react";
import server from "./server";
import { generateSignature } from "./utils/generateSignature";

function Transfer({ address, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();
    
    if (!privateKey.trim()) {
      alert("Please enter your private key");
      return;
    }

    if (!recipient.trim()) {
      alert("Please enter a recipient address");
      return;
    }

    if (!sendAmount || isNaN(sendAmount) || parseInt(sendAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsLoading(true);

    try {
      const normalizedAmount = parseInt(sendAmount);
      
      // Generate signature using the provided private key
      const { signature, recoveryBit, publicKey } = await generateSignature(
        recipient,
        normalizedAmount,
        privateKey
      );

      // Verify that the derived public key matches the current wallet address
      if (publicKey !== address) {
        alert("Private key does not match the current wallet address!");
        setIsLoading(false);
        return;
      }

      // Send the transaction
      const {
        data: { balance },
      } = await server.post(`send`, {
        amount: normalizedAmount,
        recipient,
        signature,
        recoveryBit,
      });
      
      setBalance(balance);
      
      // Clear the form
      setSendAmount("");
      setRecipient("");
      setPrivateKey("");
      
      alert("Transaction successful!");
      
    } catch (ex) {
      console.error("Transaction error:", ex);
      if (ex.response?.data?.message) {
        alert(ex.response.data.message);
      } else {
        alert("Transaction failed: " + ex.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
          type="number"
          min="1"
          disabled={isLoading}
        />
      </label>

      <label>
        Recipient Address
        <input
          placeholder="Type an address, for example: 0x2..."
          value={recipient}
          onChange={setValue(setRecipient)}
          disabled={isLoading}
        />
      </label>

      <label>
        Your Private Key (required to sign transaction)
        <input
          type="password"
          placeholder="Enter your private key"
          value={privateKey}
          onChange={setValue(setPrivateKey)}
          disabled={isLoading}
        />
        <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
          ⚠️ Your private key is never sent to the server and is only used locally to sign the transaction
        </small>
      </label>

      <input 
        type="submit" 
        className="button" 
        value={isLoading ? "Processing..." : "Transfer"} 
        disabled={isLoading}
      />
    </form>
  );
}

export default Transfer;