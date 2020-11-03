let SwapContract = artifacts.require("SimpleTokenSwap")
//const { abi: ERC20_ABI } = require('../build/contracts/IERC20.json');
const wethABI  = require('../build/contracts/abis/wethABI.json')
const daiABI = require('../build/contracts/abis/daiABI.json')

const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');
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
    const ether = 10**18; // 1 ether = 1000000000000000000 wei
    let swapContractAddress

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
      result.should.equal(name)
    })

    it(`Demonstrates the caller is the contract owner`, async () => {
        
      const result = await swapContract.owner()
      result.should.equal(owner)
      });

    it('Confirms the deployed WETH address', async () => {
      const result = await swapContract.WETH()
      result.should.equal(wethAddress)
    })

    it('Transfers Dai from Dai holder to recipient', async () => {
    
    let daiHolderBalance, recipientBalance;

    ([ daiHolderBalance, recipientBalance] = await Promise.all([
      daiContract.methods.balanceOf(daiHolder).call(),
      daiContract.methods.balanceOf(owner).call()
    ]))

     await daiContract.methods
    .transfer(owner, 1000)
    .send({from: daiHolder});

    
    ([ newDaiHolderBalance, newRecipientBalance] = await Promise.all([
      daiContract.methods.balanceOf(daiHolder).call(),
      daiContract.methods.balanceOf(owner).call()
    ]))

    daiHolderBalance.should.not.equal(newDaiHolderBalance)
    recipientBalance.should.not.equal(newRecipientBalance)

   })

    it('Deposits Weth into contract using Eth', async () => {

      let wethOwnerBalance, ethOwnerBalance

      ([ wethOwnerBalance, ethOwnerBalance] = await Promise.all([
        wethContract.methods.balanceOf(owner).call(),
        web3.eth.getBalance(owner)
      ]))
      
      await wethContract.methods.deposit().send({
        value: 100,
        from: owner
      });

      let newWethOwnerBalance, newEthOwnerBalance

      ([ newWethOwnerBalance, newEthOwnerBalance] = await Promise.all([
        wethContract.methods.balanceOf(owner).call(),
        web3.eth.getBalance(owner)
      ]))

      newWethOwnerBalance.should.not.equal(wethOwnerBalance)
      newEthOwnerBalance.should.not.equal(ethOwnerBalance)
    })

    it('Transfers Weth from Owner to recipient', async () => {

      let wethHolderBalance
      ([ wethOwnerBalance, wethHolderBalance] = await Promise.all([
        wethContract.methods.balanceOf(owner).call(),
        wethContract.methods.balanceOf(wethHolder).call(),
        
      ]))

      await wethContract.methods
      .transfer(wethHolder, 10)
      .send({from: owner});

      let newWethOwnerBalance, newWethHolderBalance
      ([ newWethOwnerBalance, newWethHolderBalance] = await Promise.all([
        wethContract.methods.balanceOf(owner).call(),
        wethContract.methods.balanceOf(wethHolder).call(),
      ]))
      newWethOwnerBalance.should.not.equal(wethOwnerBalance)
      newWethHolderBalance.should.not.equal(wethHolderBalance)
      
    })

    it('Deposits ETH to Swap contract, Wrapped into WETH', async () => {
      let deposit = 1 * ether;
      let balance = await wethContract.methods.balanceOf(swapContractAddress).call()
      
      await swapContract.depositETH({
            value: deposit,
            from: owner,
      });

      let newBalance = await wethContract.methods.balanceOf(swapContractAddress).call()
      balance.should.not.equal(newBalance)

    });
      
    it('Deposits ETH to Swap contract, Withdraws ETH', async () => {
      // Deposit ETH
      let deposit = 1 * ether;
      balance = await swapContract.totalBalance()
      await swapContract.send(deposit), { from: owner }
      newBalance = await swapContract.totalBalance()
      balance.should.not.equal(newBalance)
      // Withdraw ETH
      await swapContract.withdrawETH(1), { from: owner }
      newBalance = await swapContract.totalBalance()
      newBalance.should.not.equal(balance)
            
      });
    })

    