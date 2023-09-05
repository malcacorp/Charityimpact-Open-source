import 'regenerator-runtime/runtime'
//import { Contract } from './near-interface';
import { Wallet } from './near-wallet'
const { connect, KeyPair, keyStores, utils } = require("near-api-js");
import * as nearAPI from "near-api-js";
//import contract from near-interface as Cont;
import { Contracto }  from './near-interface';


// When creating the wallet you can choose to create an access key, so the user
// can skip signing non-payable methods when interacting with the contract

const wallet = new Wallet({ createAccessKeyFor: process.env.CONTRACT_NAME })
const contracto = new Contracto({ contractId: process.env.CONTRACT_NAME, walletToUse: wallet });

// Abstract the logic of interacting with the contract to simplify your project
//const contract = new Contract({ contractId: process.env.CONTRACT_NAME, walletToUse: wallet });
const { Contract } = nearAPI;


// Setup on page load

const path = require("path");
const homedir = require("os").homedir();

const CREDENTIALS_DIR = ".near-credentials";
const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
const keyStore = new keyStores.InMemoryKeyStore();
const PRIVATE_KEY =
  "ed25519:2gMggVGJ1gDrKMqomYxu5pzL6pHdTfZoEMRV2qQkqeBR7bkhWCbh9FL5C5E5YaRQVPfAhJMznJ7UUz1NiFkXpc5F";
// creates a public / private key pair using the provided private key
const keyPair = KeyPair.fromString(PRIVATE_KEY);
// adds the keyPair you created to keyStore
var nearConnection = null;
var cuenta= null;
var currentbeneficiary = 'charityimpact-test.near';
var contrato = null;

window.onload = async ()=>{
  //contract

  //get the current beneficiary from input #new-beneficiary using dom
  currentbeneficiary = document.getElementById("new-beneficiary").value;
 setnearloading();

const myKeyStore = new keyStores.InMemoryKeyStore();


// creates a public / private key pair using the provided private key
const keyPair = KeyPair.fromString(PRIVATE_KEY);



// adds the keyPair you created to keyStore
  await myKeyStore.setKey( 'mainnet', 'charityimpact-test.near', keyPair);
  const config = {
    keyStore:myKeyStore,
    networkId: "mainnet",
    nodeUrl: "https://rpc.mainnet.near.org",
  };
  nearConnection = await connect(config);
 cuenta = await nearConnection.account("charityimpact-test.near");
contrato = new Contract(cuenta, 
  "charityimpact-test.near",{
  changeMethods: ["change_beneficiary","get_beneficiary", "donate"],
  sender: cuenta,

});

var response= await contrato.change_beneficiary(
  {
    beneficiary: currentbeneficiary, // argument name and value - pass empty object if no args required
  },
);
//fetchBeneficiary();
currentbeneficiary = await contrato.get_beneficiary();
currentbeneficiary = currentbeneficiary;

// Set all elements marked as greeting with the current greeting
document.querySelectorAll('[data-behavior=beneficiary]').forEach(el => {
  el.innerText = currentbeneficiary
  el.value = currentbeneficiary
})


  const isSignedIn = await wallet.startUp();
  if (isSignedIn) signedInFlow();
  else signedOutFlow();
  window.set_donation(10);

 // fetchBeneficiary();
  releasenearloading();
};
// On submit, get the greeting and send it to the contract
document.querySelector("#form-near").onsubmit = async (event)=>{
  event.preventDefault();
  // get elements from the form using their id attribute
  const { fieldset, donation } = event.target.elements;
  // disable the form while the value gets updated on-chain
  fieldset.disabled = true;
  try {
      setloading();
     let amount = document.getElementById("donation").value;
     let deposit = utils.format.parseNearAmount(amount.toString())

      await contrato.donate(
        { 
          deposit: deposit,
        },
      );
      releaseloading();
      //redirect to success page
      //$url= "https://charityimpact.io/process-near-donation?amount="+amount+"&project_id="+project_id+"&near_id="+near_id+"&first_name="+firstname+"&email="+email+"&last_name="+lastname;
      var url = "https://charityimpact.io/process-near-donation";
      window.location.href = url;
  } catch (e) {
      alert("Something went wrong! Maybe you need to sign out and back in? Check your browser console for more info.");
      throw e;
  }
  // re-enable the form, whether the call succeeded or failed
  fieldset.disabled = false;
};

document.querySelector('#sign-in-button').onclick = () => { wallet.signIn() }
document.querySelector('#sign-out-button').onclick = () => { wallet.signOut() }


// Display the signed-out-flow container
function signedOutFlow() {
  document.querySelector('.signed-out-flow').style.display = 'block'
}

async function signedInFlow() {
  // Displaying the signed in flow container
  document.querySelectorAll('.signed-in-flow').forEach(elem => elem.style.display = 'block')

  // Check if there is a transaction hash in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const txhash = urlParams.get("transactionHashes")

  if(txhash !== null){
    // Get result from the transaction
    let result = await contract.getDonationFromTransaction(txhash)
    document.querySelector('[data-behavior=donation-so-far]').innerText = result

    // show notification
    document.querySelector('[data-behavior=notification]').style.display = 'block'

    // remove notification again after css animation completes
    setTimeout(() => {
      document.querySelector('[data-behavior=notification]').style.display = 'none'
    }, 11000)
  }

}

async function getAndShowDonations(){
  document.getElementById('donations-table').innerHTML = 'Loading ...'

  // Load last 10 donations
  let donations = await contract.latestDonations()

  document.getElementById('donations-table').innerHTML = ''

  donations.forEach(elem => {
    let tr = document.createElement('tr')
    tr.innerHTML = `
      <tr>
        <th scope="row">${elem.account_id}</th>
        <td>${elem.total_amount}</td>
      </tr>
    `
    document.getElementById('donations-table').appendChild(tr)
  })
}

window.set_donation = async function(amount){
  let data = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd").then(response => response.json())
  const near2usd = data['near']['usd']
  const amount_in_near = amount / near2usd
  const rounded_two_decimals = Math.round(amount_in_near * 100) / 100
  document.querySelector('#donation').value = rounded_two_decimals
}