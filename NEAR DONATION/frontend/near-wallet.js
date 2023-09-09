/* A helper file that simplifies using the wallet selector */

// near api js
import { providers } from 'near-api-js';

// wallet selector UI
import '@near-wallet-selector/modal-ui/styles.css';
import { setupModal } from '@near-wallet-selector/modal-ui';
import LedgerIconUrl from '@near-wallet-selector/ledger/assets/ledger-icon.png';
import MyNearIconUrl from '@near-wallet-selector/my-near-wallet/assets/my-near-wallet-icon.png';

// wallet selector options
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupLedger } from '@near-wallet-selector/ledger';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';

const THIRTY_TGAS = '30000000000000';
const NO_DEPOSIT = '0';

// Wallet that simplifies using the wallet selector
export class Wallet {
  walletSelector;
  wallet;
  network;
  createAccessKeyFor;

  constructor({ createAccessKeyFor = undefined, network = 'mainnet' }) {
    // Login to a wallet passing a contractId will create a local
    // key, so the user skips signing non-payable transactions.
    // Omitting the accountId will result in the user being
    // asked to sign all transactions.
    this.createAccessKeyFor = createAccessKeyFor
    this.network = network
  }

  // To be called when the website loads
  async startUp() {
    this.walletSelector = await setupWalletSelector({
      network: this.network,
      modules: [setupMyNearWallet({ iconUrl: MyNearIconUrl }),
      setupLedger({ iconUrl: LedgerIconUrl })],
    });

    const isSignedIn = this.walletSelector.isSignedIn();

    if (isSignedIn) {
      this.wallet = await this.walletSelector.wallet();
      this.accountId = this.walletSelector.store.getState().accounts[0].accountId;
    }

    return isSignedIn;
  }

  // Sign-in method
  signIn() {
    const description = 'Please select a wallet to sign in.';
    const modal = setupModal(this.walletSelector, { contractId: this.createAccessKeyFor, description });
    modal.show();
  }

  // Sign-out method
  signOut() {
    this.wallet.signOut();
    this.wallet = this.accountId = this.createAccessKeyFor = null;
    window.location.replace(window.location.origin + window.location.pathname);
  }

  // Make a read-only call to retrieve information from the network
  async viewMethod({ contractId, method, args = {} }) {
    const { network } = this.walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    let res = await provider.query({
      request_type: 'call_function',
      account_id: contractId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: 'optimistic',
    });
    return JSON.parse(Buffer.from(res.result).toString());
  }

  // Call a method that changes the contract's state
  async callMethod({ contractId, method, args = {}, gas = THIRTY_TGAS, deposit = NO_DEPOSIT }) {
    // Sign a transaction with the "FunctionCall" action
    const outcome = await this.wallet.signAndSendTransaction({
      signerId: this.accountId,
      receiverId: contractId,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: method,
            args,
            gas,
            deposit,
          },
        },
      ],
    });

    return providers.getTransactionLastResult(outcome)
  }

  /*
  
  The status field appears at:

the top-level, where it indicates whether all actions in the transaction have been successfully executed,
under transaction_outcome, where it indicates whether the transaction has been successfully converted to a receipt,
under receipts_outcome for each receipt, where it indicates whether the receipt has been successfully executed.
The status is an object with a single key, one of the following four:

status: { SuccessValue: 'val or empty'} - the receipt or transaction has been successfully executed. If it's the result of a function call receipt, the value is the return value of the function, otherwise the value is empty.
status: { SuccessReceiptId: 'id_of_generated_receipt' } - either a transaction has been successfully converted to a receipt, or a receipt is successfully processed and generated another receipt. The value of this key is the id of the newly generated receipt.
status: { Failure: {} }' - transaction or receipt has failed during execution. The value will include error reason.
status: { Unknown: '' }' - the transaction or receipt hasn't been processed yet.
  */
  // Get transaction result from the network
  /*
  example response : {
    "receipts_outcome": [
        {
            "block_hash": "3dLHA3XdWGJqc5XT4YJa7r7oB7oiRhuLnVijqpWFFD8b",
            "id": "F5mSzsFpNCFTQY2VJELUFmCSKZLSrT7TJoyvtQKoMU3G",
            "outcome": {
                "executor_id": "charityimpact-test.near",
                "gas_burnt": 11829115885071,
                "logs": [
                    "deposit is ",
                    "{\"deposit\":\"90000000000000000000000\",\"beneficiary\":\"saingo1.near\"}",
                    "beneficiary is ",
                    "saingo1.near",
                    "donor is ",
                    "98e5cef387b4a0ece23782e37b42b931e58af6a1d55716386608dc02d0dd6b51",
                    "Thank you 98e5cef387b4a0ece23782e37b42b931e58af6a1d55716386608dc02d0dd6b51 for donating 90000000000000000000000!",
                    "Sending money to beneficiary",
                    "saingo1.near",
                    "Money sent successfully"
                ],
                "metadata": {
                    "gas_profile": [
                        {
                            "cost": "NEW_ACTION_RECEIPT",
                            "cost_category": "ACTION_COST",
                            "gas_used": "108059500000"
                        },
                        {
                            "cost": "TRANSFER",
                            "cost_category": "ACTION_COST",
                            "gas_used": "115123062500"
                        },
                        {
                            "cost": "BASE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "8472579552"
                        },
                        {
                            "cost": "CONTRACT_LOADING_BASE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "35445963"
                        },
                        {
                            "cost": "CONTRACT_LOADING_BYTES",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "114689144250"
                        },
                        {
                            "cost": "LOG_BASE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "35433130500"
                        },
                        {
                            "cost": "LOG_BYTE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "4645974432"
                        },
                        {
                            "cost": "READ_CACHED_TRIE_NODE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "45600000000"
                        },
                        {
                            "cost": "READ_MEMORY_BASE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "52197264000"
                        },
                        {
                            "cost": "READ_MEMORY_BYTE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "3158907723"
                        },
                        {
                            "cost": "READ_REGISTER_BASE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "15102991116"
                        },
                        {
                            "cost": "READ_REGISTER_BYTE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "48196818"
                        },
                        {
                            "cost": "STORAGE_READ_BASE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "169070537250"
                        },
                        {
                            "cost": "STORAGE_READ_KEY_BYTE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "4735737549"
                        },
                        {
                            "cost": "STORAGE_READ_VALUE_BYTE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "1615969440"
                        },
                        {
                            "cost": "STORAGE_WRITE_BASE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "128393472000"
                        },
                        {
                            "cost": "STORAGE_WRITE_EVICTED_BYTE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "6969455619"
                        },
                        {
                            "cost": "STORAGE_WRITE_KEY_BYTE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "5568146493"
                        },
                        {
                            "cost": "STORAGE_WRITE_VALUE_BYTE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "6731022963"
                        },
                        {
                            "cost": "TOUCHING_TRIE_NODE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "386446942224"
                        },
                        {
                            "cost": "UTF8_DECODING_BASE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "34229569671"
                        },
                        {
                            "cost": "UTF8_DECODING_BYTE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "106135294356"
                        },
                        {
                            "cost": "WASM_INSTRUCTION",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "8007944209188"
                        },
                        {
                            "cost": "WRITE_MEMORY_BASE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "16822769166"
                        },
                        {
                            "cost": "WRITE_MEMORY_BYTE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "1331924508"
                        },
                        {
                            "cost": "WRITE_REGISTER_BASE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "20058657402"
                        },
                        {
                            "cost": "WRITE_REGISTER_BYTE",
                            "cost_category": "WASM_HOST_COST",
                            "gas_used": "2413993140"
                        }
                    ],
                    "version": 3
                },
                "receipt_ids": [
                    "4Xygz8iQ1NXZbaRVRRVqvJpT3r3psHBgg1WTKuLsvmKm",
                    "F4dF57jZQU4ZSUns581Az1bM3SQHfFywU29vEAgJCZnZ"
                ],
                "status": {
                    "SuccessValue": "e30="
                },
                "tokens_burnt": "1182911588507100000000"
            },
            "proof": [
                {
                    "direction": "Right",
                    "hash": "5xHSoncBqNSLedUYrKaP2weKLtDdiE3RrvCvaWMVFiky"
                },
                {
                    "direction": "Right",
                    "hash": "G7Mx1Kd3DDz3hMnsjm3QUnWWQ1z7LdgGpBMS1ayQqMj5"
                }
            ]
        },
        {
            "block_hash": "6D8GWPdzr2PLVDubXUKrHebZp6A2rGXEVKyWLkKNJ39j",
            "id": "4Xygz8iQ1NXZbaRVRRVqvJpT3r3psHBgg1WTKuLsvmKm",
            "outcome": {
                "executor_id": "saingo1.near",
                "gas_burnt": 223182562500,
                "logs": [],
                "metadata": {
                    "gas_profile": [],
                    "version": 3
                },
                "receipt_ids": [
                    "2cV1u6BevPbPwNZ6MXrYz9zrV1RdbchCp6TLAJJuazA7"
                ],
                "status": {
                    "SuccessValue": ""
                },
                "tokens_burnt": "22318256250000000000"
            },
            "proof": [
                {
                    "direction": "Right",
                    "hash": "AbNTZyckcm2oiA2qZ9wvdfizyEjZxnRgiG1FQgcqL3sU"
                },
                {
                    "direction": "Left",
                    "hash": "HoQt8zCD8bmixGxNTjBJ4mMLm6fHmpzZqxHxx6aYPtab"
                }
            ]
        },
        {
            "block_hash": "F1RC7u3obZg17vnx7qqs2ksDzwXt1e2mo4mrpLBRsYFv",
            "id": "2cV1u6BevPbPwNZ6MXrYz9zrV1RdbchCp6TLAJJuazA7",
            "outcome": {
                "executor_id": "98e5cef387b4a0ece23782e37b42b931e58af6a1d55716386608dc02d0dd6b51",
                "gas_burnt": 4174947687500,
                "logs": [],
                "metadata": {
                    "gas_profile": [],
                    "version": 3
                },
                "receipt_ids": [],
                "status": {
                    "SuccessValue": ""
                },
                "tokens_burnt": "0"
            },
            "proof": [
                {
                    "direction": "Left",
                    "hash": "Xf5DMpW6hW1MMMN2FxQCLmF4WjJriv4eWkPs6S1988E"
                }
            ]
        },
        {
            "block_hash": "6D8GWPdzr2PLVDubXUKrHebZp6A2rGXEVKyWLkKNJ39j",
            "id": "F4dF57jZQU4ZSUns581Az1bM3SQHfFywU29vEAgJCZnZ",
            "outcome": {
                "executor_id": "98e5cef387b4a0ece23782e37b42b931e58af6a1d55716386608dc02d0dd6b51",
                "gas_burnt": 4174947687500,
                "logs": [],
                "metadata": {
                    "gas_profile": [],
                    "version": 3
                },
                "receipt_ids": [],
                "status": {
                    "SuccessValue": ""
                },
                "tokens_burnt": "0"
            },
            "proof": [
                {
                    "direction": "Left",
                    "hash": "CdtBUNnuSw7q4EoshjieSWcy1h3DTBj9SoHEhBE3uNJy"
                }
            ]
        }
    ],
    "status": {
        "SuccessValue": "e30="
    },
    "transaction": {
        "actions": [
            {
                "FunctionCall": {
                    "args": "eyJkZXBvc2l0IjoiOTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCJiZW5lZmljaWFyeSI6InNhaW5nbzEubmVhciJ9",
                    "deposit": "90000000000000000000000",
                    "gas": 30000000000000,
                    "method_name": "donate"
                }
            }
        ],
        "hash": "7PJKBsGkmRh8ocGWqKEFGizZRJqfip4C6ihhCBNFPb2q",
        "nonce": 96737969000021,
        "public_key": "ed25519:BHrDQ9QVfUeHgJrkGYqRyEQsppJCqv7pMSRA7i36Brgx",
        "receiver_id": "charityimpact-test.near",
        "signature": "ed25519:5Nsc1PrT5t593QQ87ipQsNoVYCS3hEseMi1pezAwzy8fy64JqsNjaGuLWQ5zTTd9J8uQ3LnAJt2aDUNWY35aNGzj",
        "signer_id": "98e5cef387b4a0ece23782e37b42b931e58af6a1d55716386608dc02d0dd6b51"
    },
    "": {
        "block_hash": "DF3q7LqGqZ8sNHD79eDujNqX6Go2rh2tSQnk8NVdkFbv",
        "id": "7PJKBsGkmRh8ocGWqKEFGizZRJqfip4C6ihhCBNFPb2q",
        "outcome": {
            "executor_id": "98e5cef387b4a0ece23782e37b42b931e58af6a1d55716386608dc02d0dd6b51",
            "gas_burnt": 2428081987248,
            "logs": [],
            "metadata": {
                "gas_profile": null,
                "version": 1
            },
            "receipt_ids": [
                "F5mSzsFpNCFTQY2VJELUFmCSKZLSrT7TJoyvtQKoMU3G"
            ],
            "status": {
                "SuccessReceiptId": "F5mSzsFpNCFTQY2VJELUFmCSKZLSrT7TJoyvtQKoMU3G"
            },
            "tokens_burnt": "242808198724800000000"
        },
        "proof": [
            {
                "direction": "Right",
                "hash": "3wMRR6zkziNSjs8fpJ21ApwucGYuBtqN2TEdbkx7KDjD"
            },
            {
                "direction": "Right",
                "hash": "EpwkrJx8Vensg1DqHtvxjGePvk4UhLAiALML9pczbmwe"
            },
            {
                "direction": "Right",
                "hash": "EsXrJFDoGR47h3jw9CAca1hYLQH1ybShLF3JaA8fP6P1"
            }
        ]
    }
}
  */
  async getTransactionResult(txhash) {
    const { network } = this.walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });
    let sentamount = 0;

    // Retrieve transaction result from the network
    const transaction = await provider.txStatus(txhash, 'unnused');
    console.log(transaction)
    //if the transaction is success

    if (transaction.status.SuccessValue !== undefined) {
      //get the amount sent
      sentamount = transaction.transaction_outcome.outcome.gas_burnt;
    }
    return sentamount;
  }

  getAccountId() {
    return this.accountId;
  }
}