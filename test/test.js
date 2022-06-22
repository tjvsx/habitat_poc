const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { updateDiamond, testEnvironmentIsReady } = require('./libraries/diamond.js')
const { getDiamondJson } = require("../tasks/lib/utils.js");
const { createAddFacetCut, createRemoveFacetCut } = require('../scripts/libraries/cuts.js')

const TEST_FILE = 'test.diamond.json'
const CHAIN_ID = 1337

describe("Diamond test", async function () {

  let signer = [];
  let ontap;
  let git;

  before(async () => {
    await testEnvironmentIsReady();
    signer = await ethers.getSigners();
    ontap = await updateDiamond('ontap.json', CHAIN_ID)
    // git = await ethers.getContractAt('Git', ontap.contracts["Git"].address)
    git = await ethers.getContractAt('Git', ontap.address);
  });

  
  let diamond
  it("sould deploy new diamond", async function () {
    await hre.run('diamond:init', {
      o: TEST_FILE,
      address: ontap.address
    })
    diamond = await updateDiamond(TEST_FILE, CHAIN_ID)

    // console.log('diamond:', diamond.address) 
    // console.log('facets:', (await diamond.facetAddresses()))
  });

  let cuts;
  it("commits tons of upgrades", async function () {
    const Greeter = await ethers.getContractFactory('Greeter');
    const greeter = await Greeter.deploy();
    await greeter.deployed();

    cuts = createAddFacetCut([greeter]);
    await ontap.connect(signer[0]).commit('Greeter Add', cuts, ethers.constants.AddressZero, '0x');
    await ontap.connect(signer[1]).commit('Greeter Add', cuts, ethers.constants.AddressZero, '0x');

    cuts = createRemoveFacetCut([greeter]);
    await ontap.connect(signer[0]).commit('Greeter Remove', cuts, ethers.constants.AddressZero, '0x');
    await ontap.connect(signer[1]).commit('Greeter Remove', cuts, ethers.constants.AddressZero, '0x');
  });

  it("fetch Commit events", async function () {
    // const abi = "Commit(address,string,address)"
    const events = await ontap.queryFilter(
      ontap.filters.Commit(), 
      'earliest', 
      'latest'
    );

    let repos = []
    for (const evt of events) {
      const { owner, name, upgrade } = evt.args
      repos.push({ owner, name, upgrade})
    }
    console.log(repos);
  });

});
