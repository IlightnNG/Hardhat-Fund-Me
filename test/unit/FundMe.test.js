const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

describe("FundMe", async function () {
  let fundMe;
  let deployer;
  let mockV3Aggregator;
  const sendValue = ethers.utils.parseEther("1"); // 1 ETH
  beforeEach(async function () {
    //    const accounts = await ethers.getSigners()
    //    const accountZero = accounts[0]
    // const {deployer} = await getNamedAccounts()
    deployer = (await getNamedAccounts()).deployer;
    // deploy all the contracts
    await deployments.fixture(["all"]);
    //const FUNDME_ADDRESS = process.env.FUNDME_ADDRESS
    //const MOCK_ADDRESS = process.env.MOCK_ADDRESS
    //console.log(FUNDME_ADDRESS)
    fundMe = await ethers.getContract("FundMe", deployer); // ERROR
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });

  describe("constructor", async function () {
    it("sets the aggregator addresses correctly", async function () {
      const response = await fundMe.getPriceFeed();
      assert.equal(response, mockV3Aggregator.address);
    });
  });

  describe("fund", async function () {
    it("Fails if you don't send enough ETH", async function () {
      await expect(fundMe.fund()).to.be.reverted;
    });
    it("update the amount funded data structure", async function () {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.getAddressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });
    it("Adds funder to array of funders", async function () {
      await fundMe.fund({ value: sendValue });
      const funder = await fundMe.getFunders(0);
      assert.equal(funder, deployer);
    });
  });
  describe("cheapwithdraw", async function () {
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue });
    });
    it("withdraw ETH from a single founder", async function () {
      // Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      // Act
      const transactionResponse = await fundMe.cheapWithdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
      // Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
    });
    it("allows us to withdraw with multiple funders", async function () {
      // Arrange
      const accounts = await ethers.getSigners();
      for (let i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );

      // Act
      const transactionResponse = await fundMe.cheapWithdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);

      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      // Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
      // make sure funders are reset
      await expect(fundMe.getFunders(0)).to.be.reverted;

      for (i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.getAddressToAmountFunded(accounts[i].address),
          0
        );
      }
    });
    it("only allows the owner to withdraw", async function () {
      const accounts = await ethers.getSigners();
      const attacker = accounts[1];
      const attackerConnectContract = await fundMe.connect(attacker);
      await expect(attackerConnectContract.withdraw()).to.be.revertedWith(
        "FundMe__NotOwner"
      );
    });
  });
});
