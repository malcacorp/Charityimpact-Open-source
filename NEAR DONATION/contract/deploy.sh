#!/bin/sh

# build the contract
#npm run build

# deploy the contract
#near dev-deploy --wasmFile build/contract.wasm
#NEAR_ENV=mainnet near login

# deploy the contract
NEAR_ENV=mainnet near deploy --accountId charityimpact-test.near --wasmFile build/contract.wasm