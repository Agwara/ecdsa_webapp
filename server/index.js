const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");
const secp = require("ethereum-cryptography/secp256k1");

const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

// The addresses are generated using the generate.js script
// from the server/scripts directory, which uses secp256k1 to generate
// a random private key and derive the public key from it.
// The balances are initialized with some arbitrary values for demonstration purposes.
const balances = {
  "04a1829c4bc62563a1942fdeaa21c98ac37663a0b31f64569b39b204ddb8f804ffc2978396d5c967234ed8b0935130009e30f6a8db9c895d7969905ada1560ee84": 100,
  "042c79270d11eb89c7a9a3a1d872307d18b18106864387c20d3c0d0d8da3383911f9a1543aad061f6acf3c9c2da06502a1f16adae6e27e890d87e84d365814317c": 50,
  "04b4ed259ddaa84a4d2b806c573c98e059805c420e1ef4505a8c22402f42d20123218a794a0a49576942ef863da4a24748eac73e7bcdd638155a170507509131dc": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", async (req, res) => {
  const { recipient, amount, signature, recoveryBit } = req.body;

  // 1. Recreate the message
  const message = JSON.stringify({ recipient, amount });
  const messageHash = keccak256(utf8ToBytes(message));

  // 2. Recover public key from signature and message hash
  let publicKey;
  try {
    publicKey = secp.recoverPublicKey(messageHash, signature, recoveryBit, false);
  } catch (e) {
    return res.status(400).send({ message: "Invalid signature" });
  }

  const sender = toHex(publicKey); // full hex public key

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    return res.status(400).send({ message: "Not enough funds!" });
  }

  balances[sender] -= amount;
  balances[recipient] += amount;

  res.send({ balance: balances[sender] });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
