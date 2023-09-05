import { NearBindgen, near, call, view, initialize, UnorderedMap } from 'near-sdk-js'

import { assert } from './utils'
import { Donation, STORAGE_COST } from './model'

@NearBindgen({})
class DonationContract {
  beneficiary: string = "charityimpact-test.near";
  donations = new UnorderedMap<bigint>('map-uid-1');

  @initialize({ privateFunction: true })
  init({ beneficiary }: { beneficiary: string }) {
    this.beneficiary = beneficiary
  }

  @call({ payableFunction: true })
  donate() {
    // Get who is calling the method and how much $NEAR they attached
    let donor = near.predecessorAccountId();
    let donationAmount: bigint = near.attachedDeposit() as bigint;

    let donatedSoFar = this.donations.get(donor, {defaultValue: BigInt(0)})
    let toTransfer = donationAmount;

    // This is the user's first donation, lets register it, which increases storage
    if (donatedSoFar == BigInt(0)) {
      assert(donationAmount > STORAGE_COST, `Attach at least ${STORAGE_COST} yoctoNEAR`);

     // Subtract the storage cost to the amount to transfer
     toTransfer -= STORAGE_COST;
     donatedSoFar += STORAGE_COST; // Add the storage cost to the donated amount 
    }

    // Persist in storage the amount donated so far
    donatedSoFar += donationAmount
    this.donations.set(donor, donatedSoFar)
    near.log(`Thank you ${donor} for donating ${donationAmount}! You donated a total of ${donatedSoFar}`);

    // Send the money to the beneficiary
    const promise = near.promiseBatchCreate(this.beneficiary)
    //(promiseBatchXXX
    //near.promiseBatchActionTransfer(promise, toTransfer)
    try {
      near.promiseBatchActionTransfer(promise, toTransfer)
    } catch (error) {
      // Handle the error here, for example, log the error message
      near.log(`Error transferring funds: ${error}`)
      // Optionally, you can re-throw the error to propagate it further
      throw error
    }
    // Return the total amount donated so far
    return donatedSoFar.toString()
  }

  @call({ privateFunction: false })
  change_beneficiary(beneficiary) {
  
    this.beneficiary = beneficiary.beneficiary;

    return this.beneficiary;
  }

  @call({ payableFunction: true })
  //donate to a specific charity, not the default beneficary , params beneficiary and amount


  @view({})
  get_beneficiary(): string { return this.beneficiary }

  @view({})
  number_of_donors(): number { return this.donations.length }

  @view({})
  get_donations({ from_index = 0, limit = 50 }: { from_index: number, limit: number }): Donation[] {
    let ret: Donation[] = []
    let accounts = this.donations.keys({start: from_index, limit})
    for (let account_id of accounts) {
      const donation: Donation = this.get_donation_for_account({ account_id })
      ret.push(donation)
    }
    return ret
  }

  @view({})
  get_donation_for_account({ account_id }: { account_id: string }): Donation {
    return {
      account_id,
      total_amount: this.donations.get(account_id).toString()
    }
  }
}