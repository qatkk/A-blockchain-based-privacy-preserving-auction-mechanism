#!/bin/bash
# compile
time zokrates compile -i verify_test.zok
zokrates inspect
# perform the setup phase
time zokrates setup
# export verifier.sol
time zokrates export-verifier
