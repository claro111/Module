import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [desiredAmountEth, setDesiredAmountEth] = useState("");
  const [desiredAmountUsd, setDesiredAmountUsd] = useState("");
  const [usdBalance, setUsdBalance] = useState(undefined);
  const [ethToUsd, setEthToUsd] = useState(undefined);
  const [showBalance, setShowBalance] = useState(false);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  // Define deposit and withdraw limits
  const depositLimit = 1000; // Maximum amount to deposit
  const withdrawLimit = 1000; // Maximum amount to withdraw

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const account = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(account);
    }
  };

  const handleAccount = (account) => {
    if (account) {
      console.log("Account connected: ", account);
      setAccount(account);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);

    // once wallet is set we can get a reference to our deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      const balance = await atm.getBalance();
      setBalance(balance);
      if (balance) {
        // Fetch the current exchange rate for Ether to USD
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        const data = await response.json();
        setEthToUsd(data.ethereum.usd);
      }
    }
  };

  const convertToUSD = () => {
    if (desiredAmountEth && ethToUsd) {
      setUsdBalance((parseFloat(desiredAmountEth) * ethToUsd).toFixed(2));
    }
  };

  const convertToETH = () => {
    if (desiredAmountUsd && ethToUsd) {
      setUsdBalance((parseFloat(desiredAmountUsd) / ethToUsd).toFixed(6));
    }
  };

  const depositEth = async () => {
    const amount = parseFloat(desiredAmountEth);
    if (!isNaN(amount)) {
      if (amount > depositLimit) {
        alert("Deposit amount exceeds the limit");
        return;
      }
      if (atm) {
        let tx = await atm.deposit(ethers.utils.parseEther(amount.toString()));
        await tx.wait();
        getBalance();
      }
    } else {
      alert("Invalid amount");
    }
  };

  const depositUsd = async () => {
    const amount = parseFloat(desiredAmountUsd);
    if (!isNaN(amount)) {
      if (amount > depositLimit / ethToUsd) {
        alert("Deposit amount exceeds the limit");
        return;
      }
      if (atm) {
        let tx = await atm.deposit(ethers.utils.parseEther((amount / ethToUsd).toString()));
        await tx.wait();
        getBalance();
      }
    } else {
      alert("Invalid amount");
    }
  };

  const withdrawEth = async () => {
    const amount = parseFloat(desiredAmountEth);
    if (!isNaN(amount)) {
      if (amount > withdrawLimit) {
        alert("Withdrawal amount exceeds the limit");
        return;
      }
      if (atm) {
        let tx = await atm.withdraw(ethers.utils.parseEther(amount.toString()));
        await tx.wait();
        getBalance();
      }
    } else {
      alert("Invalid amount");
    }
  };

  const withdrawUsd = async () => {
    const amount = parseFloat(desiredAmountUsd);
    if (!isNaN(amount)) {
      if (amount > withdrawLimit / ethToUsd) {
        alert("Withdrawal amount exceeds the limit");
        return;
      }
      if (atm) {
        let tx = await atm.withdraw(ethers.utils.parseEther((amount / ethToUsd).toString()));
        await tx.wait();
        getBalance();
      }
    } else {
      alert("Invalid amount");
    }
  };

  const toggleBalance = () => {
    setShowBalance(!showBalance);
  };

  const initUser = () => {
    // Check to see if user has Metamask
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>;
    }

    // Check to see if user is connected. If not, connect to their account
    if (!account) {
      return <button onClick={connectAccount}>Please connect your Metamask wallet</button>;
    };

    const styles = {
      button: {
        width: '225px',
        padding: '10px',
        margin:'10px'
      },

      button1: {
        width: '116px',
        color: 'white',
        backgroundColor: 'black',
        marginRight: '5px',
        marginLeft: '5px'
      },

      button2: {
        width: '240px',
        color: 'white',
        backgroundColor: 'black',
      }
    }

    return (
      <div style={styles.div}>
          <p style={styles.account}>Your Account: <br></br>{account}</p>
      <br></br>
        <div>
          <input style={styles.button}
            type="number"
            value={desiredAmountEth}
            onChange={(e) => setDesiredAmountEth(e.target.value)}
            placeholder="Enter amount in ETH"
          />
          <br></br>
          <button style={styles.button1} onClick={depositEth}>Deposit ETH</button>
          <button style={styles.button1} onClick={withdrawEth}>Withdraw ETH</button>
        </div>
          <p>Your Balance (ETH): {balance ? ethers.utils.formatEther(balance) : "***********"}</p>
          <p>Your Balance (USD): {usdBalance ? `$${usdBalance}` : "***********"}</p>
        <div>
          <button style={styles.button2} onClick={convertToUSD}>Convert to USD</button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Welcome to the Metacrafters ATM!</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
        }

        .container h1 {
          background-color:#000080;
          color: white;
          margin-left:575px;
          margin-right:575px;
        }
      `}</style>
    </main>
  );
}
