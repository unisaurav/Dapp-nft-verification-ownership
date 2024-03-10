import { useEffect, useState } from "react";
import "./App.css";
import { ethers } from "ethers";
import abi from "./abi/abi.json";
import image from "./assets/img.png";
import ownedImg from "./assets/owned.png";

import axios from "axios";
axios.defaults.timeout = 1500;
function App() { 
  const [data, setData] = useState([]);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);

  const balance = async (nftContract) => { //Checking if your owns nft or not.
    const contractInstance = new ethers.Contract(nftContract, abi, provider);
    const tempBalance = await contractInstance.balanceOf(account);
    const copyData = [...data];
    const tempNft =
      copyData[copyData.findIndex((item) => item === data.contract_address)];
    tempNft.owner = tempBalance > 0;
    tempNft.countnft = tempBalance;
    setData([...copyData]);
  };

  const initConnection = async () => { //connection to wallet
    if (typeof window.ethereum !== "undefined") {
      const account = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(tempProvider);
      setAccount(account[0]);
    } else {
      alert("You Dont have metamask");
    }
  };
  const fetchRandomNftData = () => { //getting nft data insted of keeping it constant 
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        "X-API-KEY": "API_KEY_GOES_HERE",
      },
    };
    fetch(
      "https://api.blockspan.com/v1/exchanges/collections?chain=eth-main&page_size=100",
      options
    )
      .then((response) => response.json())
      .then(async (response) => {
        const res = await Promise.allSettled(
          response.results.map((item) => {
            return axios.get(
              `https://api.blockspan.com/v1/collections/contract/${item.contracts[0].contract_address}?chain=eth-main`,
              {
                headers: {
                  accept: "application/json",
                  "X-API-KEY": "NTjDJMPY07kH6R9GHP3H3ThLGVFxlwuv",
                },
              }
            );
          })
        );
        const validNft = [];
        res.forEach(async (res, index) => {
          if (res.status === "fulfilled") {
            validNft.push({
              ...response.results[index],
              ...res.value.data,
              isOwner: true,
            });
          }
        });
        setData([
          ...validNft.filter((item) =>
            item.functions.includes("balanceOf(address)")
          ),
        ]);
      })
      .catch((err) => console.error(err));
  };
  useEffect(() => {
    initConnection();
    fetchRandomNftData();
  }, []);

  useEffect(() => {
    data.forEach(async (item) => {
      balance(item.contract_address);
    });
  }, [account]);

  return (
    <div className="flex-1 flex-col h-screen w-full bg-white">
      <div className="bg-green-200 flex flex-row justify-between px-10 py-2">
        <p>{account}</p>
        <button
          type="button"
          onClick={initConnection}
          title={
            "Connect via Metamask to check all NFT you own from collection below"
          }
          class="text-gray-900 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-2 py-1 text-center inline-flex items-center dark:focus:ring-gray-500 me-1 mb-1"
        >
          <svg
            class="w-4 h-4 me-2 -ms-1 text-[#626890]"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="ethereum"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 320 512"
          >
            <path
              fill="currentColor"
              d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"
            ></path>
          </svg>
          {account ? "Connected" : "Connect"}
        </button>
      </div>
      <div className="flex flex-wrap justify-center">
        {data.length > 0 &&
          data.map((item) => {
            return (
              <div className="flex flex-col  items-center my-5">
                <div className="flex flex-row">
                  {" "}
                  <a
                    href={item.exchange_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={image}
                      className="object-contain h-5 w-5 m-1 borderred rounded-3xl shadow-md"
                    />
                  </a>
                  <button
                    onClick={() => {
                      balance(item.contracts[0].contract_address);
                    }}
                  >
                    <img
                      src={ownedImg}
                      className="object-contain h-5 w-5 m-1 borderred rounded-3xl shadow-md"
                    />
                  </button>
                </div>

                <img
                  src={item.image_url}
                  className={`object-contain h-48 w-48  mx-5 borderred rounded-xl shadow-md opacity-100`}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default App;
