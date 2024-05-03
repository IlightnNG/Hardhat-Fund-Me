// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import "hardhat/console.sol"; // we can use console.log in solidity

//4-12
//custom error
error FundMe__NotOwner();

/**
 * @title A contract for crowd funding
 * @author HP
 * @notice Demo
 * @dev e
 */
contract FundMe {
    // --- Type Declarations
    using PriceConverter for uint256;

    // --- State Variables
    // 4-12
    // constant immutable    --optimize the gas fee
    uint constant MINIMUM_USD = 50 * 1e18;
    uint8 public a = 255;

    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    address private immutable i_owner;

    // 7-7
    AggregatorV3Interface private s_priceFeed;

    // --- Modifier
    // 4-8
    modifier onlyOwner() {
        //require( owner == msg.sender,"only owner can withdraw!");
        // Command above _; will run before the function.

        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    // 4-7
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    //4-1 payable
    function fund() public payable {
        //Want to be able to set a minimum fund amount in USD.
        //require(getConversionRate(msg.value) >= minimumUSD,"Not enough, guy!"); //1e18 wei = 1**18 =  1 ether
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Not enough, guy!"
        );

        // msg.value  will convert into the function as the first parameter.
        // msg.value.getConversionRate(123)  123 is the second parameter

        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] = msg.value;

        //What is reverting?
        // undo any action before, and sent remaining gas back.
    }

    function add() public {
        //a++;
        //safe math
        // if a++ overflow, the contract will revert.  (after 0.8.0)
        // if you don't want to check, please use uncheck{}.
        unchecked {
            a++;
        }
    }

    function withdraw() public onlyOwner {
        //require( owner == msg.sender,"only owner can withdraw!");

        // 4-5
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        // 4-6
        //reset the array.
        s_funders = new address[](0);
        // actually withdraw the funds

        // 1.transfer
        // The contract revert, if transfer failed.
        payable(msg.sender).transfer(address(this).balance);

        // 2.send
        // Return false, if send failed.
        bool sendSuccess = payable(msg.sender).send(address(this).balance);
        require(sendSuccess, "send failed");

        // 3.call
        //
        (bool callSuccess /* bytes memory dataReturned */, ) = payable(
            msg.sender
        ).call{value: address(this).balance}("");
        require(callSuccess, "call failed");
    }

    // 7-17
    function cheapWithdraw() public payable onlyOwner {
        // memory is cheaper
        address[] memory funders = s_funders;
        // mapping can't be in memory
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    // --- view / pure

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
