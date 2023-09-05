const HELP = `Please run this script in the following format:

  node create-mainnet-account.js charityimpact-test.near charityimpact-created2.near 0"
`;

const { connect, KeyPair, keyStores, utils } = require("near-api-js");
const path = require("path");
const homedir = require("os").homedir();
//import { generateSeedPhrase } from 'near-seed-phrase';
const { generateSeedPhrase } = require('near-seed-phrase');
const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
const keyStore = new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);
const { seedPhrase, publicKey, secretKey } = generateSeedPhrase()

const config = {
  keyStore,
  networkId: "mainnet",
  nodeUrl: "https://rpc.mainnet.near.org",
};


console.log("Seed phrase: ", seedPhrase);
export class Cuenta {

  constructor({ creador }) {
    this.creator = creador;
  }

}
