# PrivacyPreservingMPCAuciton
## Introduction 

This repository impelements a full sealed-bid auction with off-chain verification. The verifications are done with the help of Zokrates[1] and verified on chain in the smart contract. 
First the bidders submit to the smart contract by presenting a public key and a proof of Schnorr to prove they have the corresponding secret key. 
Further, the bidders must submit their bids to the smart contract. The bids are encrypted on Baby Jub Jub curve which is one of the curves that Zokrates supports. The public key which bidders use to to the encryption later helps safe decryption for the off-chain server. 
The public key is calculated from the summation of the public keys of the bidders and the public key of the server. 
Further information of the scheme and the impelentation can be found in *Privacy Preserving E-auction Scheme WithOff-chain Computation.pdf*

## Reference 
<a id="1">[1]</a> 
https://zokrates.github.io
