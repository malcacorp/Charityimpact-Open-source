import 'regenerator-runtime/runtime'
import { Contract } from './near-interface';
import { Wallet } from './near-wallet'

// When creating the wallet you can choose to create an access key, so the user
// can skip signing non-payable methods when interacting with the contract
const wallet = new Wallet({ createAccessKeyFor: process.env.CONTRACT_NAME })

// Abstract the logic of interacting with the contract to simplify your project
const contract = new Contract({ contractId: process.env.CONTRACT_NAME, walletToUse: wallet });

// Setup on page load
let charityid = '';
let projectid= '';

window.onload = async () => {
 
  charityid= document.getElementById("new-beneficiary").value;
  projectid= document.getElementById("project_id").value;
  setnearloading();
  displayBeneficiary();
  charityid='saingo1.near';
  const isSignedIn = await wallet.startUp();
  console.log(wallet.getAccountId())
  if (isSignedIn){
    signedInFlow()
  }else{
    signedOutFlow()
  }

  window.set_donation(10);
  releasenearloading();

}

// On submit, get the greeting and send it to the contract
document.querySelector("#form-near").onsubmit = async (event) => {



  event.preventDefault()


  // get elements from the form using their id attribute
  const { fieldset, donation } = event.target.elements
  //set the csrf token
  let data = [
    { amount: donation.value,
    token : document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
   },
  ];
  const route = "/set-session";
  //send the ajax post 
  await fetch(route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
    },
    body: JSON.stringify(data)
  }).then(function(response) {
    if (response.status >= 200 && response.status < 300) {
      return response.json()
    }
    throw new Error(response.statusText)
  }).then(function(response) {
    console.log(response)
  }).catch(function(error) {
    console.log('Request failed', error)
  })

  // disable the form while the value gets updated on-chain
  fieldset.disabled = true
//ajax to /set session


  try {
    setloading();
    await contract.donate(donation.value, charityid)
  } catch (e) {
    alert(
      'Something went wrong! ' +
      'Maybe you need to sign out and back in? ' +
      'Check your browser console for more info.'
    )
    throw e
  }

  // re-enable the form, whether the call succeeded or failed
  fieldset.disabled = false
}

document.querySelector('#sign-in-button').onclick = () => { wallet.signIn() }
document.querySelector('#sign-out-button').onclick = () => { wallet.signOut() }

async function fetchBeneficiary() {
  // Get greeting from the contract
  const currentGreeting = await contract.getBeneficiary()

  // Set all elements marked as greeting with the current greeting
  document.querySelectorAll('[data-behavior=beneficiary]').forEach(el => {
    el.innerText = currentGreeting
    el.value = currentGreeting
  })
}
function displayBeneficiary() {
  const currentbeneficiary = document.getElementById("new-beneficiary").value;
  document.querySelectorAll('[data-behavior=beneficiary]').forEach(el => {
    el.innerText = currentbeneficiary
    el.value = currentbeneficiary
  })
}

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
    showtoast('We are processing your transacction, it may take some time before it gets approved.');
    let result = await contract.getDonationFromTransaction(txhash)
    let donatedamount = result;
    if (donatedamount > 0){

    //var https://charityimpact.io/process-near-donation?amount=0.000000000002428081987248&txhash=EoKaVk6BmkNs1GiyTyw6S8fRPe8CGpzHkrreEEXkA4S&project_id=3
    var url = "https://charityimpact.io/process-near-donation?amount=" + donatedamount + "&txhash=" + txhash + "&project_id=" + projectid;
    window.location.href = url;
    }
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

//display beneficiary info
