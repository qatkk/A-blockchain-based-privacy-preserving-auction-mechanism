const ethers = require('ethers');
const fs = require('fs');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const provider = new ethers.providers.InfuraProvider("kovan", "0090b71f3cbd4212bb37f81b9c3aeaab");
const contractAddr =  fs.readFileSync('./ContractAddr.txt','utf8');
const contractABI = fs.readFileSync('./ABI.txt','utf8');

let NumberOfBidders = fs.readFileSync('./numberOfBidders.txt','utf8');
let privateKey = "5f22a80a0824462fc1ed3b79306696b79dd3ed5dbb9a69287f1aa2cddb4413ef";
let wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddr, contractABI, wallet);
const data = JSON.parse(fs.readFileSync('./Bids.txt','utf8'));
const bids = data.CypherTexts;
const randomValues = data.Randoms;
async function bidOnSC (){
	 for (let i = 80; i<NumberOfBidders ; i++){
		 console.log("i is", i); 
		try {
			await contract.Bid(randomValues[i], bids[i],{value: 2}).then((tx)=> {
				tx.wait().then((receipt) => {
				// console.log(receipt);
				});
			});
		}catch(err){
			console.log(err);
			i--;
		}
		await sleep(15000);
	}
}
bidOnSC().then(async ()=> {
	await contract.ReturnBids().then((returnedBids)=>{
		console.log(returnedBids.toString().split(","));
	});
});
