import twitterLogo from './assets/twitter-logo.svg';
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import React, { useEffect, useState } from "react";
import idl from './idl.json'
import kp from "./keypair.json";
import "./App.css";

// Constants
const TWITTER_HANDLE = "PrasoonPratham";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

const App = () => {
  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */

  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;


      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!");
          const response = await solana.connect({ onlyIfTrusted: false });
          console.log(
            "Connected with Public Key:",
            response.publicKey.toString()
          );

          /*
           * Set the user's publicKey in state to be used later!
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana object not found! Get a Phantom Wallet 👻");
      }
    } catch (error) {
      console.error(error);
    }
  };

  /*
   * Let's define this method so our code doesn't break.
   * We will write the logic for this next!
   */
  const connectWallet = async () => { };
  
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

const getProvider = () => {
  const connection = new Connection(network, opts.preflightCommitment);
  const provider = new Provider(
    connection,
    window.solana,
    opts.preflightCommitment
  );
  return provider;
};

const sendGif = async () => {
  if (inputValue.length === 0) {
    console.log("No gif link given!");
    return;
  }
  setInputValue("");
  console.log("Gif link:", inputValue);
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);

    await program.rpc.addGif(inputValue, {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    });
    console.log("GIF successfully sent to program", inputValue);

    await getGifList();
  } catch (error) {
    console.log("Error sending GIF:", error);
  }
};



  /*
   * We want to render this UI when the user hasn't connected
   * their wallet to our app yet.
   */
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

const renderConnectedContainer = () => {
  // If we hit this, it means the program account hasn't been initialized.
  if (gifList === null) {
    return (
      <div className="connected-container">
        <button
          className="cta-button submit-gif-button"
          onClick={createGifAccount}
        >
          Do One-Time Initialization For GIF Program Account
        </button>
      </div>
    );
  }
  // Otherwise, we're good! Account exists. User can submit GIFs.
  else {
    return (
      <div className="connected-container">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendGif();
          }}
        >
          <input
            type="text"
            placeholder="Enter gif link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button type="submit" className="cta-button submit-gif-button">
            Submit
          </button>
        </form>
        <div className="gif-grid">
          {/* We use index as the key instead, also, the src is now item.gifLink */}
          {gifList.map((item, index) => (
            <div className="gif-item" key={index}>
              <img src={item.gifLink} />
            </div>
          ))}
        </div>
      </div>
    );
  }
};

  /*
   * When our component first mounts, let's check to see if we have a connected
   * Phantom Wallet
   */
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  const TEST_GIFS = [
    "https://i.imgur.com/AD3MbBib.jpg",
    "https://i.imgur.com/NUyttbnb.jpg",
    "https://i.imgur.com/wBtPCiNb.jpg",
    "https://i.imgur.com/fqd9uUjb.jpg",
  ];

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  };


const getGifList = async () => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    const account = await program.account.baseAccount.fetch(
      baseAccount.publicKey
    );

    console.log("Got the account", account);
    setGifList(account.gifList);
  } catch (error) {
    console.log("Error in getGifList: ", error);
    setGifList(null);
  }
};

useEffect(() => {
  if (walletAddress) {
    console.log("Fetching GIF list...");
    getGifList();
  }
}, [walletAddress]);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🖼️ Image board</p>
          <p className="sub-text">
            View your memes from the Solano™ Blockchain✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
