const {BabyJubPoint, Fr, randFr, G, keyGen} = require("./BabyJubPoint")
const {biddingGenerate} = require("./biddingGenerate");
const utils = require("ffjavascript").utils;
const fs = require('fs');
const crypto = require("crypto");
const ethers = require('ethers');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const provider = new ethers.providers.InfuraProvider("kovan", "0090b71f3cbd4212bb37f81b9c3aeaab");
// const provider = new ethers.providers.HttpProvider("https://kovan.infura.io/v3/0090b71f3cbd4212bb37f81b9c3aeaab");
// let provider = new ethers.providers.Web3Provider(web3Provider);
const contractAddr = fs.readFileSync('./ContractAddr.txt','utf8');
console.log(contractAddr);
const contractABI =  fs.readFileSync('./ABI.txt','utf8');
let privateKey = "5f22a80a0824462fc1ed3b79306696b79dd3ed5dbb9a69287f1aa2cddb4413ef";
let wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddr, contractABI, wallet);



random  = utils.leBuff2int(crypto.randomBytes(32));
const h = BigInt("2456835291674741166095049455855342345491947534893086592908941660589211282525"); 
console.log(G.mul(h));
// function reserveGen(value, random ){
//   let H = G.mul(h); 
//   let temp = H.mul(random); 
//   let secret = G.mul(BigInt(value)); 
//   let commit = temp.add(secret);

// return commit;}


// async function  submitReserve(){
//   try { 
//     await contract.EndAuction( {gasLimit: 5000000}).then((tx) => {
//       console.log(tx);
//       console.log("writing to the file");});
//       await sleep(15000);
//       }
//   catch(err){
//       console.log(err);
//   }
//   return(0);
// }
// submitReserve().then(data => {
//   if (data == 0 ) console.log("submitted the reserve price")});