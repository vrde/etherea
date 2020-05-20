# Why another ethereum library

Both web3js and ethersjs don't solve some of the common problems I have while developing DApps, that are:

- Manage the state of transactions is tricky when a user is interacting with a DApp on an unreliable internet connection. This is especially true for mobile DApps, where the user can put the phone to sleep after sending a transaction, or when a DApp is used during a public event and the WiFi connection is slow or drop packets.
- Instantiate the correct web3 client. The user agent might have a native web3 wallet while browsing the DApp, or have none so a wallet has to be generate for the user's session. On top of that, some operations don't require "write" access to the blockchain, i.e. calling `pure` or `view` methods. In that case we don't even need to bother the user asking for access to their wallet. How annoying is to visit a website and immediately after opening it a confirmation dialog appears on MetaMask?
- Related to the previous point: there is no common interface for a native wallet and a newly generated local wallet. For the first one we don't have access to the private key, while for the second we do. In that case a developer would have to write custom code to manage those two possibilities.
- Work with big numbers. This is partially related to the two libraries mentioned (`web3` and `ethers`).
- Listen to events.

```node
import { Wallet, Contract } from "eth2000";

// New wallet, will prefer native web3 wallets.
const wallet = new Wallet();

// New wallet from Mnemonic.
const wallet = Wallet.fromMnemonic("blurry cat ...");

// New wallet from Private Key.
const wallet = Wallet.fromPrivateKey("0xaabbccdd");
const wallet = Wallet.fromPrivateKey([0xaa, 0xbb, 0xcc, 0xdd]);

// New wallet from a secret (will autodetect if it's a mnemonic seedphrase or a
// private key).
const wallet = Wallet.fromSecret("blurry cat ...");

// Send ether
wallet.sendEther("0.001", "0x1979...");

// Other properties
wallet.address;
wallet.balance([callback]);

// If available:
wallet.privateKey;

// Sign a message
wallet.signMessage("Message to sign");

// Recover a signed message
wallet.recover("Message to sign", r, v, s);

// Load a contract
const contract = new Contract(address, abi);
const call = contract.myMethod(param0, param1);
console.log("ABI encoded:", call.raw());
console.log("Estimated cost:", call.cost());

// If it's a write call specify the wallet instance and optionally the amount
const transaction = call.send(wallet, "0.1");

// Now the fun part, react to the state changes of the transaction
transaction.on;
```
