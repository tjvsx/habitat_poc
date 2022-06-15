/* global ethers */

const { 
  createAddFacetCut
} = require('./libraries/cuts.js');

const {
  setDiamondJson,
  verify,
  getChainIdByNetworkName
} = require('../tasks/lib/utils.js')

const init = '0xe1c7392a';

// reusable facets - attached facets are prefixed with 'x_';

async function createDiamond(signer, cuts, initAddr) {

  const Diamond = await ethers.getContractFactory('Diamond');
  const diamond = await Diamond.connect(signer).deploy(cuts, initAddr, init);
  await diamond.deployed();
  console.log('💎 Diamond deployed:', diamond.address);

  return diamond;
}

async function createOntap(cuts) {
  const OnTap = await ethers.getContractFactory('OnTap');
  const ontap = await OnTap.deploy(cuts, ethers.constants.AddressZero, '0x');
  await ontap.deployed();
  console.log('💎 OnTap deployed:', ontap.address);

  const x_writable = await ethers.getContractAt('Writable', ontap.address);
  const x_ownership = await ethers.getContractAt('Ownership', ontap.address);
  const x_readable = await ethers.getContractAt('Readable', ontap.address);

  let facetAddresses = [ontap.address]
  for (cut of cuts) { facetAddresses.push(cut.target) }
  const writableAddr = (await x_readable.facetAddresses()).filter((x) => {
    if (facetAddresses.indexOf(x) === -1) return x;
  })[0];
  const writable = await ethers.getContractAt('Writable', writableAddr);
  console.log('🪩  Writable deployed:', writableAddr);

  //deploy greeter
  const Greeter = await ethers.getContractFactory('Greeter');
  const greeter = await Greeter.deploy();
  await greeter.deployed();
  console.log('👋 Greeter deployed:', greeter.address);

  //deploy git
  cuts = createAddFacetCut([greeter]);
  const Git = await ethers.getContractFactory('Git');
  const git = await Git.deploy(cuts);
  await git.deployed();
  console.log('📚 Git deployed:', git.address);

  cuts = createAddFacetCut([git]);

  //deploy initializer
  const OnTapInit = await ethers.getContractFactory('OnTapInit');
  const ontapinit = await OnTapInit.deploy();
  await ontapinit.deployed();
  console.log('💠 OnTapInit deployed:', ontapinit.address);

  await x_writable.diamondCut(cuts, ontapinit.address, init);

  return [ ontap, writable, git, ontapinit ];
}

async function deployOnTap() {

  console.log('~~~~~  C R E A T I N G   O N T A P  ~~~~~')

  const Readable = await ethers.getContractFactory('Readable');
  const readable = await Readable.deploy();
  await readable.deployed();
  console.log('🔮 Readable deployed:', readable.address);

  const Ownership = await ethers.getContractFactory('Ownership');
  const ownership = await Ownership.deploy();
  await ownership.deployed();
  console.log('💍 Ownership deployed:', ownership.address);

  const ERC165 = await ethers.getContractFactory('Erc165');
  const erc165 = await ERC165.deploy();
  await erc165.deployed();
  console.log('🗺  ERC165 deployed:', erc165.address);

  let cuts = createAddFacetCut([readable, ownership, erc165]);

  const [ ontap, writable, git, ontapinit ] = await createOntap(cuts);

  console.log('~~~~~~  O N T A P   C R E A T E D  ~~~~~~');

  return [ ontap, readable, ownership, erc165, writable, git, ontapinit ];
}

async function deploy() {
  const CHAIN_ID = getChainIdByNetworkName(hre.config.defaultNetwork);

  await hre.run("clean")
  await hre.run("compile")

  let diamondJson = {
    functionSelectors: {},
    contracts: {}
  }

  let [ ontap, readable, ownership, erc165, writable, git, ontapinit ] = await deployOnTap();
  contractsToVerify = [
    {
      name: 'OnTap',
      address: ontap.address
    },
    {
      name: 'Readable',
      address: readable.address
    },
    {
      name: 'Ownership',
      address: ownership.address
    },
    {
      name: 'Erc165',
      address: erc165.address
    },
    {
      name: 'Writable',
      address: writable.address
    },
    {
      name: 'Git',
      address: git.address
    },
    {
      name: 'OnTapInit',
      address: ontapinit.address
    }
  ];
  diamondJson.chainId = CHAIN_ID
  diamondJson.address = ontap.address
  await setDiamondJson(diamondJson, 'ontap.json')
  await verify(contractsToVerify)
  
  console.log('[OK] Ontap verified')

  let facets = [readable, ownership, erc165, writable, git]
  for (let facet of facets) {
    await hre.run('diamond:add', {
      o: 'ontap.json',
      remote: true,
      address: facet.address
    })
  }
}

if (require.main === module) {
  deploy()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployOnTap = deployOnTap
exports.createDiamond = createDiamond;
exports.createOntap = createOntap;