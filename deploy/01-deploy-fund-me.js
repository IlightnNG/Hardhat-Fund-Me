// import
// main function
// calling of main function

const { network, ethers } = require("hardhat")

// 1.
// async function deployFunc(hre) {
//     console.log("hi")
//     hre.getNamedAccounts()
// }
// module.exports.default = deployFunc

// hre: hardhat runtime environment

// 2.
// module.exports.default =  async(hre) => {
//    const { getNamedAccounts, deployments} = hre
// hre.getNamedAccounts
// hre.deployments
//}

const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainID = network.config.chainId

    // if the chainId is X, the address is Y
    // so we use [aave]
    // details in helper-hardhat-config
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainID]["ethUsdPriceFeed"]
    }
    // mock:
    // if the contract doesn't exist, we deploy a minimal version
    // for our local testing

    // different chain has different priceFeed address
    // so we should use a [mock]
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        // verify
        await verify(fundMe.address, args)
    }
    // getContractAt
    // process.env.FUNDME_ADDRESS = fundMe.address
    // console.log(process.env.FUNDME_ADDRESS)
    // const fundMe2 = await ethers.getContractAt(
    //     "FundMe",
    //     process.env.FUNDME_ADDRESS,
    //     deployer
    // )
    // console.log(fundMe2)
    log("-----------------------------")
}
module.exports.tags = ["all", "fundme"]
