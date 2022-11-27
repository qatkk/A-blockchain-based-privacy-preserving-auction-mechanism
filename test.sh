#!/bin/bash
echo "starting the test"
node secs.js
echo "Initiallising the data values"
# node Initialize.js
echo "Registering bidders"
node regBidders.js 
echo "Generating the bids"
node bidGen.js
echo "Bidding on the smart contract"
node bidOnSC.js
# echo "Revealing the researved price"
# node revealReserved.js
# echo "Submitting the secret keys"
# node submitSecKeys.js  
# echo "Decrypting bids"
# time node decryptorTest.js

