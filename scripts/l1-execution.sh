#!/bin/bash

yarn wait-on tcp:5050 && 
yarn wait-on tcp:8545 && 
yarn hardhat test starknet/test/l1-execution.test.ts --network 'ethereumLocal' --starknet-network 'starknetLocal'
if [ $? -eq 0 ]
then
  kill -9 $(lsof -t -i:8545)
  kill -9 $(lsof -t -i:5050)
  exit 0
else
  kill -9 $(lsof -t -i:8545)
  kill -9 $(lsof -t -i:5050)
  echo "Tests failed"
  exit 1
fi