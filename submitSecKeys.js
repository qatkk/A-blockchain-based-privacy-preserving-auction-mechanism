const { assert } = require('console');
const ethers = require('ethers');
const fs = require('fs');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const BabyJubPoint = require("./BabyJubPoint");
// const provider = new ethers.getDefaultProvider("ropsten", {etherscan:"T1EAFXG7C316H3HIXAIKIYV4Q2FFJMQM5C"});
const provider = new ethers.providers.InfuraProvider("kovan", "0090b71f3cbd4212bb37f81b9c3aeaab");
const contractAddr =  fs.readFileSync('./ContractAddr.txt','utf8');
const contractABI = fs.readFileSync('./ABI.txt','utf8');

let privateKey = "5f22a80a0824462fc1ed3b79306696b79dd3ed5dbb9a69287f1aa2cddb4413ef";
let wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddr, contractABI, wallet);

let seckeys = JSON.stringify(fs.readFileSync("./SecKeys.txt", "utf-8"));
seckeys = seckeys.split("\\\"");
let SecKeys = []; 
for ( i = 1 ; i<seckeys.length; i+= 2){
	SecKeys.push(seckeys[i]);
}
console.log("read from file number of keys ",SecKeys.length);
async function SubmitSecKey () {
	for (let i = 0 ; i < 3; i++) {
		console.log('i is', i);
		try {
			console.log((SecKeys[i]));
			await contract.SubmitSecKey(SecKeys[i].toString(),  {gasLimit: 5000000}).then ((tx)=> {
				console.log(tx);
			});
		}
		catch(err) {
			console.log(err);
			i--; 
		}
		// await sleep(15000);
		// try {
		// 	await contract.SecKeys(i.toString(),  {gasLimit: 5000000}).then ((tx)=> {
		// 		// console.log(tx);
		// 	});
		// }
		// catch(err) {
		// 	console.log(err);
		// 	i--; 
		// }

		await sleep(15000);
	}
	let contractSecKey = await contract.BiddersSekKey();
	await sleep(10000);
	let retreivedSecKeys = await contract.ReturnSecKeys();
	retreivedSecKeys = retreivedSecKeys.toString().split(",");
	console.log(contractSecKey);
	console.log("smart contract submmited keys ",retreivedSecKeys.length);
	let SecretKeys = []; 
	for ( i = 0 ; i<retreivedSecKeys.length; i+= 1){
		SecretKeys.push(retreivedSecKeys[i]);
	}
	console.log("seperated keyes",SecretKeys.length);
	return {
		"seckey":contractSecKey.toString(),
		"submitted": SecretKeys
	};
}
 SubmitSecKey().then(async(data) => {
	 console.log(data.seckey);
	 let correctSecKey = new BabyJubPoint.Fr(BigInt(0));
	 for (i = 0 ; i< data.submitted.length ; i++ ){
		correctSecKey = correctSecKey.add(BigInt(data.submitted[i].toString()));
	}
	console.log(correctSecKey);
 });
