require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require('dotenv').config();


//tasks
require("./tasks/diamond.js");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
// task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
//   const accounts = await hre.ethers.getSigners();

//   for (const account of accounts) {
//     console.log(account.address);
//   }
// });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  solidity: "0.8.12",
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://localhost:8545",
      /*      
        uses account 0 of the hardhat node to deploy
      */
    },
  },
  mocha: {
    timeout: 80000
  }
};
