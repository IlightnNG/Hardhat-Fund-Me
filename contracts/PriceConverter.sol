// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    function getPrice(
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        /**
         * Network: Sepolia
         * Aggregator: BTC/USD
         * Address: 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
         * ChainId: 11155111
         */
        // AggregatorV3Interface priceFeed = AggregatorV3Interface(
        //     0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
        // );
        // prettier-ignore
        (
            /* uint80 roundID */,
            int answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        // ETH in terms of USD.
        // 3000.00000000     Because of no decimal, there are 8 zero behind the point.

        return uint256(answer * 1e10);
    }

    function getVersion() internal view returns (uint256) {
        //When you use different address, the interface will implement different contract which is on the chain
        // and you will obtain the ABI.
        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
        );
        return priceFeed.version();
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd;
    }
}
