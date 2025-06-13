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
  "04840e4a64c37de8f2011b1165d2852bf1b8d6bb2286efda6b7ee02a2b447b27343a2d83db92b33f83782f4106da6077c6d3c496eb8e5c16562933507f6e6beb76": 100,
  "041028fcfaf3c574b7c99b93318287fb168dbb2412321f83b813ea9392097b3fb7e8c87adc567ac1549cc6332737c8bb85847833271196732fac705012fee6d7c8": 50,
  "04c60e71cd51c2a7c233f60868e065b6f4f6c275e17ecb3e41f016ab9d64783e06172fb624985235d3bddfc3101c18a4488a159845a54a170e68feb5f511a1116b": 75,
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
