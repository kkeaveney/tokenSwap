let SwapContract = artifacts.require("SimpleTokenSwap")
const { createQueryString, etherToWei, waitForTxSuccess, weiToEther } = require('../src/utils');
const wethABI  = require('../build/contracts/abis/wethABI.json')
const daiABI = require('../build/contracts/abis/daiABI.json')
const assert = require("chai").assert;
const fetch = require('node-fetch');


require('chai')
  .use(require('chai-as-promised'))
  .should()


contract('Truffle Assertion Tests', async (accounts) => {
    const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    const name = "SimpleTokenSwap"
    const owner = accounts[0]
    const wethHolder = "0x397ff1542f962076d0bfe58ea045ffa2d347aca0"
    const daiHolder = "0x648148a0063b9d43859d9801f2bf9bb768e22142";
    const ether = 10**18;  // 1 ether = 1000000000000000000 wei
    let swapContractAddress
    const API_QUOTE_URL = 'https://api.0x.org/swap/v1/quote';
  

    beforeEach(async () => {

    wethContract = new web3.eth.Contract(wethABI, wethAddress)
    daiContract = new web3.eth.Contract(daiABI, daiAddress)
    swapContract = await SwapContract.new(wethAddress)
    ownerBalance = await web3.eth.getBalance(owner)
    wethHolderEthBalance = await web3.eth.getBalance(wethHolder)
    swapContractAddress = swapContract.address
    
     
    });
    
    it('Confirms the contract name', async () => {
      const result = await swapContract.name()
      assert.equal(result, name, "Contract name is incorrect")
      
    })

    it(`Demonstrates the caller is the contract owner`, async () => {
        
      const result = await swapContract.owner()
      assert.equal(result, owner, "Caller is not the contract owner")
      });

    it('Confirms the deployed WETH address', async () => {
      const result = await swapContract.WETH()
      assert.equal(result, wethAddress, "The WETH address should be passed to the contract constructor")
    })

    it('Transfers Dai from Dai holder to recipient', async () => {
    
    let daiHolderBalance, recipientBalance;
    let amount = await web3.utils.toWei("1", "ether");
   

    ([ daiHolderBalance, recipientBalance] = await Promise.all([
      daiContract.methods.balanceOf(daiHolder).call(),
      daiContract.methods.balanceOf(owner).call()
    ]))


     await daiContract.methods
    .transfer(owner, amount)
    .send({from: daiHolder});

    
    ([ newDaiHolderBalance, newRecipientBalance] = await Promise.all([
      daiContract.methods.balanceOf(daiHolder).call(),
      daiContract.methods.balanceOf(owner).call()
    ]))

    daiHolderBalance.should.not.equal(newDaiHolderBalance)
    recipientBalance.should.not.equal(newRecipientBalance)
    assert.equal(daiHolderBalance / ether, (newDaiHolderBalance / ether) + (amount / ether), "Dai holder balance should reflect tx")
   

   })

    it('Deposits Weth into contract using Eth', async () => {

      let wethOwnerBalance, ethOwnerBalance
      let amount = await web3.utils.toWei("1", "ether");

      ([ wethOwnerBalance, ethOwnerBalance] = await Promise.all([
        wethContract.methods.balanceOf(owner).call(),
        web3.eth.getBalance(owner)
      ]))
      
      await wethContract.methods.deposit().send({
        value: amount,
        from: owner
      });

      let newWethOwnerBalance, newEthOwnerBalance

      ([ newWethOwnerBalance, newEthOwnerBalance] = await Promise.all([
        wethContract.methods.balanceOf(owner).call(),
        web3.eth.getBalance(owner)
      ]))

     assert.equal((wethOwnerBalance / ether) + (amount / ether), newWethOwnerBalance / ether, "Owner WETH balance should reflect tx")
     assert.notEqual(ethOwnerBalance, newEthOwnerBalance)
     
    })

    it('Transfers Weth from Owner to recipient', async () => {

      let wethHolderBalance
      let amount = await web3.utils.toWei("1", "ether");
      ([ wethOwnerBalance, wethHolderBalance] = await Promise.all([
        wethContract.methods.balanceOf(owner).call(),
        wethContract.methods.balanceOf(wethHolder).call(),
        
      ]))

      await wethContract.methods
      .transfer(wethHolder, 1)
      .send({from: owner});

      let newWethOwnerBalance, newWethHolderBalance
      ([ newWethOwnerBalance, newWethHolderBalance] = await Promise.all([
        wethContract.methods.balanceOf(owner).call(),
        wethContract.methods.balanceOf(wethHolder).call(),
      ]))
      assert.equal(wethHolderBalance / ether + (1 / ether), newWethHolderBalance / ether)
      assert.equal(wethOwnerBalance / ether - (1 / ether), newWethOwnerBalance / ether)
   
     })

    it('Deposits ETH to Swap contract, Wrapped into WETH', async () => {
      let deposit = 1 * ether;
      let balance = await wethContract.methods.balanceOf(swapContractAddress).call()
      
      await swapContract.depositETH({
            value: deposit,
            from: owner,
      });

      let newBalance = await wethContract.methods.balanceOf(swapContractAddress).call()
      assert.equal((balance + deposit) / ether, newBalance / ether, "Swap WETH balance should reflect tx")
      
      });
      
    it('Deposits ETH to Swap contract, Withdraws ETH', async () => {
      // Deposit ETH
      let deposit = 1 * ether;
      balance = await swapContract.totalBalance()
      await swapContract.send(deposit), { from: owner }
      newBalance = await swapContract.totalBalance()
      
      assert.equal((balance + deposit) / ether, newBalance / ether, "Owner ETH balance should reflect deposit tx")
      
      // Withdraw ETH
      await swapContract.withdrawETH(1), { from: owner }
      newBalance = await swapContract.totalBalance()
      assert.equal((balance + deposit) / ether, newBalance / ether, "Owner ETH balance should reflect withdrawal tx")
      
      });

    it('Fetches quote from 0x API, emits a BoughtTokens event', async () => {
        const sellAmount = 1
        let deposit = 10 * ether;
        const sellAmountWei = etherToWei(sellAmount);
  
        // Deposit Eth into Contract
        await swapContract.depositETH({
              value: deposit,
              from: owner,
        });
        console.info(`Fetching swap quote from 0x-API to sell ${sellAmount} WETH for DAI...`);
        const qs = createQueryString({
          sellToken: 'WETH',
          buyToken: 'DAI',
          sellAmount: sellAmountWei,
          //takerAddress: taker
        })
        const quoteUrl = `${API_QUOTE_URL}?${qs}`;
        console.info(`Fetching quote ${quoteUrl.bold}...`);
        const response = await fetch(quoteUrl);
        const quote = await response.json();
        console.info(`Received a quote with price ${quote.price}`);
        

        // Have the contract fill the quote, selling its own WETH.
        console.info(`Filling the quote through the contract at ${swapContractAddress.bold}...`);
        const receipt = await waitForTxSuccess(swapContract.fillQuote(
          quote.sellTokenAddress,
          quote.buyTokenAddress,
          quote.allowanceTarget,
          quote.to,
          quote.data,
          { from: owner,
          value: quote.value,
          gasPrice: quote.gasPrice, }));

        const log = receipt.logs[0]
        log.event.should.eq('BoughtTokens')
        const event = log.args
        
        event.sellToken.should.equal(web3.utils.toChecksumAddress(quote.sellTokenAddress), 'Incorrect sell Token address')
        event.buyToken.should.equal(web3.utils.toChecksumAddress(quote.buyTokenAddress), 'Incorrect buy Token address')
        
        const boughtAmount = weiToEther(event.boughtAmount)
        const transactionPrice = boughtAmount / sellAmount
        console.log('Quote guaranteed price', quote.guaranteedPrice)
        console.log('Transaction price', transactionPrice)

        event.boughtAmount.should.be.greaterThan(1, 'Incorrect bought amount')
        
        console.info(`${'✔'.bold.green} Successfully sold ${sellAmount.toString().bold} WETH for ${boughtAmount.toString().bold.green} DAI!`);
        //The contract now has `boughtAmount` of DAI!
        })

  })

        
        