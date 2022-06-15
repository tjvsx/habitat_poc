const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { updateDiamond, testEnvironmentIsReady } = require('./libraries/diamond.js')
const { deploy } = require('../scripts/deploy.js');
const { getDiamondJson } = require("../tasks/lib/utils.js");
const { createAddFacetCut } = require('../scripts/libraries/cuts.js')

const TEST_FILE = 'test.diamond.json'
const CHAIN_ID = 1337

describe("Diamond test", async function () {

  let signer = [];
  let ontap;

  before(async () => {
    await testEnvironmentIsReady();
    signer = await ethers.getSigners();
    ontap = await getDiamondJson('ontap.json');
  });

  
  let diamond
  it("sould deploy new diamond", async function () {
    await hre.run('diamond:init', {
      o: TEST_FILE,
      address: ontap.address
    })
    diamond = await updateDiamond(TEST_FILE, CHAIN_ID)
    // TODO - send all facets through diamond constructor to be cut on deployment
  });
});
