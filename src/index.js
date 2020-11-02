const Web3 = require("web3")
const web3 = new Web3("http://localhost:8545")

async function getBlockNumber() {
    const latestBlockNumber = await web3.eth.getBlockNumber()
    console.log(latestBlockNumber)
    return getBlockNumber
}

detectWeb3 = async () => {
    if(window.ethereum != null) {
        state.web3 = new Web3(window.ethereum)
        try {
            // requesr account access if needed
            await window.ethereum.enable()
            // Accounts now exposed
        } catch (err) {
           // User denied account acccess
        }
    }
}

const ERC20TransferABI = [
    {
      constant: false,
      inputs: [
        {
          name: "_to",
          type: "address",
        },
        {
          name: "_value",
          type: "uint256",
        },
      ],
      name: "transfer",
      outputs: [
        {
          name: "",
          type: "bool",
        },
      ],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [
        {
          name: "_owner",
          type: "address",
        },
      ],
      name: "balanceOf",
      outputs: [
        {
          name: "balance",
          type: "uint256",
        },
      ],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
  ]
  
  const DAI_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f"
  
  const daiToken = new web3.eth.Contract(ERC20TransferABI, DAI_ADDRESS)

  const senderAddress = "0x5921c191fe58175b1fb8943ed3f17345e615ff02"
  const receiverAddress = "0x66c57bf505a85a74609d2c83e94aabb26d691e1f"

  
  
  const addressDaiBalance = async (address) => {
     await daiToken.methods.balanceOf(address).call(function (err, res) {
        if (err) {
          console.log("An error occured", err)
          return
        }
        console.log("The balance of Address is: ", res)
      })
  }
  

  const makeTransaction = async() => {
    await daiToken.methods
    .transfer(receiverAddress, web3.utils.toWei('100, Ether'))
    .send({ from: senderAddress}, function (err, res) {
      if (err) {
        console.log("An error occured", err)
        return
      }
      console.log("Hash of the transaction: " + res)
    })
}

addressDaiBalance(senderAddress)
makeTransaction()
addressDaiBalance(senderAddress)

  


  
  
