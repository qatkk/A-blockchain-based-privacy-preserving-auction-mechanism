const {BabyJubPoint, Fr, randFr, G, keyGen} = require("./BabyJubPoint")
const {biddingGenerate} = require("./biddingGenerate");
const utils = require("ffjavascript").utils;
const fs = require('fs');
const ethers = require('ethers');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const provider = new ethers.providers.InfuraProvider("kovan", "0090b71f3cbd4212bb37f81b9c3aeaab");
const contractAddr =  fs.readFileSync('./ContractAddr.txt','utf8');
const contractABI = fs.readFileSync('./ABI.txt','utf8');

let privateKey = "5f22a80a0824462fc1ed3b79306696b79dd3ed5dbb9a69287f1aa2cddb4413ef";
let wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddr, contractABI, wallet);

const secretKey = JSON.parse(fs.readFileSync('./SellerSecretKey.txt','utf8'));
async function revearlReserved(){
    try { 
        await contract.RevealReserved(40, secretKey.toString(), {gasLimit: 5000000}).then((tx) => {
        console.log(tx);
        });
        }
    catch(err){
        console.log(err);
    }
    await sleep(15000);
}
revearlReserved().then(
    console.log("submittedh the secret key"));