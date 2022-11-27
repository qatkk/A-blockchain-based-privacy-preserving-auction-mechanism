const {BabyJubPoint, G, Fr, Frr, randFr, subOrder, order} = require("./BabyJubPoint");
const utils = require("ffjavascript").utils;
const fs = require("fs");
const { promisify } = require('util');
const { bufToBigint, hexToBigint, bigintToBuf, bigintToHex } = require("bigint-conversion");

const sleep = promisify(setTimeout);
const web3 = require("web3-utils"); 
const {decryptBid} = require("./decryptBid");
let otherSecretKey ;
const selfSecretKey = BigInt("0");
const ethers = require('ethers');
const {exec}  = require('child_process');
const provider = new ethers.providers.InfuraProvider("kovan", "0090b71f3cbd4212bb37f81b9c3aeaab");
const contractAddr =  fs.readFileSync('./ContractAddr.txt','utf8');
const contractABI = fs.readFileSync('./ABI.txt','utf8');
let privateKey = "5f22a80a0824462fc1ed3b79306696b79dd3ed5dbb9a69287f1aa2cddb4413ef";
let wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddr, contractABI, wallet);


// let reservedPrice; 
// let Bids ;
// let RandomElements;
// let numberOfBidders = 5;
// let decryptedBids = [] ;
// let Messages = [];



function computePayment(firstPrice, secondPrice, thirdPrice, reservedPrice) {
	let winnerServerPay = 0 ; 
	let winnerSellerPay = 0 ; 
	let sellerPay = 0; 
	let K3 = 0 ;
	if (firstPrice > reservedPrice && secondPrice > reservedPrice && thirdPrice >= reservedPrice)  K3 = thirdPrice
	if  (firstPrice > reservedPrice && secondPrice > reservedPrice) {
		winnerServerPay = (firstPrice - secondPrice) / (firstPrice - K3 + 1 );
		winnerSellerPay = secondPrice; 
		sellerPay = (secondPrice - reservedPrice) /  (secondPrice - K3 + 1); 
	}
	minimum = Math.min(winnerSellerPay, winnerServerPay, sellerPay);
    logOf = Math.log10(minimum);
    if (logOf < 0 & minimum !=0) {
        pow = Math.ceil(logOf * -1 ) + 1 ;
        accuracy = Math.pow(10, pow);
    }
    else {
        accuracy = 10; 
    }
	return  {
		"winnerServerPay": parseInt(winnerServerPay * accuracy),
		"winnerSellerPay": winnerSellerPay,
		"sellerPay": parseInt(sellerPay * accuracy), 
		"accuracy": accuracy}; 
	}

function sliceArray(arr) {
    var step = 0, sliceArr = [], len = arr.length;
    while (step < len) {
      sliceArr.push(arr.slice(step,step+= 2));
    }
    return sliceArr;
}

async function retrieveSec() {
//  Retrieve the secret key from the smart contract
let contractsSecKey = await contract.BiddersSekKey();
return BigInt(contractsSecKey.toString())
}
retrieveSec().then(data => {
	otherSecretKey  = data
	console.log(otherSecretKey)
});

async function retrieveResevereSec() {
	let temp = await contract.reservedPrice();
	console.log("Reserved price is", temp.toString() );
	return temp.toString();
}

retrieveResevereSec().then(data => {
	reservedPrice  = data
});

let Bids ;
let RandomElements;
async function getBids(){
	let tempRandoms = await contract.ReturnRandoms();
	await sleep(6000)
    let tempBids = await contract.ReturnBids();
    tempRandoms = tempRandoms.toString().split(",");
    tempBids = tempBids.toString().split(",");
	Bids = sliceArray(tempBids);
	RandomElements = sliceArray(tempRandoms);
}
getBids().then(async() => {
	let numberOfBidders = fs.readFileSync('./numberOfBidders.txt','utf8');
	let decryptedBids = [] ;
	let originalBids = [];
	let Messages = [];
	const decryptorTest = new decryptBid(otherSecretKey);
	let maxBidId = -1 ; 
	let maxBid = BigInt(0) ;  
	let currentDecryptedBid = -1 ; 
	for (let i = 0 ; i < numberOfBidders ; i++ ){
		try{
		currentDecryptedBid = decryptorTest.decrypt(Bids[i],RandomElements[i]); 
		}catch(err){
			console.log(err);
		}
		console.log(currentDecryptedBid); 
		originalBids.push(currentDecryptedBid);
		decryptedBids.push(parseInt(currentDecryptedBid));
		console.log(decryptedBids);
		let M = G.mul(BigInt(currentDecryptedBid));
		Messages.push([M.x,M.y]);
		 if (maxBid < currentDecryptedBid){
			 maxBid = currentDecryptedBid ;
			 maxBidId = i ; 
		 }
	}
	console.log("max id \n " , maxBidId);

	// ////////////// Compute has and pre hash 
	const data = JSON.parse(fs.readFileSync('./Bids.txt','utf8'));
const bids = data.CypherTexts;
let checking = 1;
let decimal = 0 ; 
let decimals ;
for (i = 0 ; i<bids.length; i++) {
    if (i == 0) {
        checking = web3.encodePacked(bids[i][0]).slice(2,18); 
        decimal = hexToBigint(web3.encodePacked(bids[i][0]).slice(2,18));
        decimal = decimal.toString().split('n')[0];
        decimals = decimal;
    }
    else {
        checking = checking + web3.encodePacked(bids[i][0]).slice(2,18); 
        decimal = hexToBigint(web3.encodePacked(bids[i][0]).slice(2,18));
        decimal = decimal.toString().split('n')[0];
        decimals = decimals + " " + decimal;
     }
}

//  Smart contract hash check 
console.log("checking",checking);
console.log("decimals", decimals);
let buff = web3.soliditySha3("0x" + checking);
buff = buff.split("x")[1]; 
console.log('checking hash', buff);
let hash = ''; 
for (i= 0 ; i<4 ; i++) {
    dummy = hexToBigint(buff.slice(i*16, (i+1)*16)); 
    dummy = dummy.toString().split('n')[0];
    if(i==0 ) { 
    hash = hash + dummy;
    } 
    else {
        hash = hash + " " + dummy;
    }
}


// async function computeWit () {
//     return new Promise((resolve, reject) => {
//     exec('zokrates compute-witness -a ' + decimals + " " + hash + ' --verbose', (error, stdout, stderr) => {
//     if (error) {
//     console.warn(error);
//     }
//     resolve(stdout? stdout : stderr);
//     console.log(stdout);
//     });
//     });
// }
decryptedBids.sort((first, second) => {
			return first - second; 
		});
payments = computePayment( decryptedBids[numberOfBidders - 1],  decryptedBids[numberOfBidders-2] , decryptedBids[numberOfBidders-3], (reservedPrice));
console.log("Message points and messages", payments);

console.log(payments);
let result = (maxBidId + " " + Bids + " " + RandomElements + " " + Messages + " " +  originalBids + " " + otherSecretKey).replace(/,/g, " ");

	try {
		const data = fs.writeFileSync('./results.txt', result);
	  } catch (err) {
		console.error(err);
	  }
	async function computeWit () {
		return new Promise((resolve, reject) => {
		let input = result +" "+decimals + " " + hash + " " + decryptedBids[numberOfBidders - 1] + " " + decryptedBids[numberOfBidders-2] + " " + decryptedBids[numberOfBidders-3] + " " +  payments.winnerServerPay + " " + payments.winnerSellerPay + " " + payments.sellerPay + " " + reservedPrice + " " + payments.accuracy + " --verbose"; 
		console.log("witness input is :", input);
		exec('time zokrates compute-witness -a ' +  input , (error, stdout, stderr) => {
	if (error) {
		console.warn(error);
		}
		resolve(stdout? stdout : stderr);
		console.log(stdout);
		});
		});
	}
	let start = Date.now(); 
	await computeWit().then(()=>{
		console.log("compute witness took", Date.now() - start);
	});
	async function proofGen () {
		return new Promise((resolve, reject) => {
		exec('time zokrates generate-proof  ', (error, stdout, stderr) => {
		if (error) {
		console.warn(error);
		}
		resolve(stdout? stdout : stderr);
		console.log(stdout);
		});
		});
	}
	start = Date.now();
	await proofGen().then(()=>{
		console.log("proof gen took ", Date.now() - start);
	});
	proof = JSON.parse(fs.readFileSync('./proof.json','utf8'));
	try {
		await contract.SubmitWinner(maxBidId, proof.proof.a, proof.proof.b, proof.proof.c , [payments.winnerServerPay  , payments.winnerSellerPay  , payments.sellerPay , payments.accuracy], {gasLimit: 5000000}).then ((tx)=>{
			console.log(tx);
		});
	}catch (err){
		console.log(err);
	}
});
// function sliceArray(arr) {
//     var step = 0, sliceArr = [], len = arr.length;
//     while (step < len) {
//       sliceArr.push(arr.slice(step,step+= 2));
//     }
//     return sliceArr;
// }

// async function retrieveSec() {
// //  Retrieve the secret key from the smart contract
// let contractsSecKey = await contract.BiddersSekKey();
// console.log("others secret key is", contractsSecKey);
// return BigInt(contractsSecKey.toString())
// }

// async function retrieveResevereSec() {
// 	let temp = await contract.reservedPrice();
// 	console.log("Reserved price is", temp.toString() );
// 	return temp.toString();
// }

// async function getBids(){
// 	let tempRandoms = await contract.ReturnRandoms();
// 	await sleep(6000)
//     let tempBids = await contract.ReturnBids();
//     tempRandoms = tempRandoms.toString().split(",");
//     tempBids = tempBids.toString().split(",");
// 	Bids = sliceArray(tempBids);
// 	RandomElements = sliceArray(tempRandoms);
// }	

// async function computeWit (result, decimals, hash, decryptedBids, payments, reservedPrice ) {
// 	return new Promise((resolve, reject) => {
// 	exec('zokrates compute-witness -a ' + result +" "+decimals + " " + hash + " " + decryptedBids[numberOfBidders - 1],  decryptedBids[numberOfBidders-2] + " " + decryptedBids[numberOfBidders-3] + " " +  payments.winnerServerPay * 4 + " " + payments.winnerSellerPay * 4 + " " + payments.sellerPay*4 + " " + reservedPrice + " --verbose" , (error, stdout, stderr) => {
// 		if (error) {
// 	console.warn(error);
// 	}
// 	resolve(stdout? stdout : stderr);
// 	console.log(stdout);
// 	});
// 	});
// }

// async function proofGen () {
// 	return new Promise((resolve, reject) => {
// 	exec('zokrates generate-proof  ', (error, stdout, stderr) => {
// 	if (error) {
// 	console.warn(error);
// 	}
// 	resolve(stdout? stdout : stderr);
// 	console.log(stdout);
// 	});
// 	});
// }

// retrieveSec().then(data => {
// 	otherSecretKey  = data;
// 	console.log(otherSecretKey);
// });	
// retrieveResevereSec().then(data => {
// 	reservedPrice  = data
// });

// let publickey = G.mul(otherSecretKey);
// console.log(publickey);
// const decryptorTest = new decryptBid(otherSecretKey);
// let maxBidId = -1 ; 
// let maxBid = BigInt(0) ;  
// let currentDecryptedBid = -1 ; 

// getBids().then(async() => {
// 	console.log(Bids);
// 	for (let i = 0 ; i < numberOfBidders ; i++ ){
// 		currentDecryptedBid = decryptorTest.decrypt(Bids[i],RandomElements[i]); 
// 		console.log(currentDecryptedBid); 
// 		decryptedBids.push(parseInt(currentDecryptedBid));
// 		console.log(decryptedBids);
// 		let M = G.mul(BigInt(currentDecryptedBid));
// 		Messages.push([M.x,M.y]);
// 		 if (maxBid < currentDecryptedBid){
// 			 maxBid = currentDecryptedBid ;
// 			 maxBidId = i ; 
// 		 }
// 	}
// 	console.log("max id \n " , maxBidId);
// 	console.log("sorted bids", decryptedBids.sort((first, second) => {
// 		return first - second; 
// 	}));
// 	console.log("winning price is", decryptedBids[numberOfBidders-2], "Third price is", decryptedBids[numberOfBidders-3]);
// 	// ////////////// Compute has and pre hash 
// 	const data = JSON.parse(fs.readFileSync('./Bids.txt','utf8'));
// 	const bids = data.CypherTexts;
// 	let checking = 1;
// 	let decimal = 0 ; 
// 	let decimals ;
// 	for (i = 0 ; i<bids.length; i++) {
// 		if (i == 0) {
// 			checking = web3.encodePacked(bids[i][0]).slice(2,18); 
// 			decimal = hexToBigint(web3.encodePacked(bids[i][0]).slice(2,18));
// 			decimal = decimal.toString().split('n')[0];
// 			decimals = decimal;
// 		}
// 		else {
// 			checking = checking + web3.encodePacked(bids[i][0]).slice(2,18); 
// 			decimal = hexToBigint(web3.encodePacked(bids[i][0]).slice(2,18));
// 			decimal = decimal.toString().split('n')[0];
// 			decimals = decimals + " " + decimal;
// 		}
// 	}

// //  Smart contract hash check 
// 	console.log("checking",checking);
// 	console.log("decimals", decimals);
// 	let buff = web3.soliditySha3("0x" + checking);
// 	buff = buff.split("x")[1]; 
// 	console.log('checking hash', buff);
// 	let hash = ''; 
// 	for (i= 0 ; i<4 ; i++) {
// 		dummy = hexToBigint(buff.slice(i*16, (i+1)*16)); 
// 		dummy = dummy.toString().split('n')[0];
// 		if(i==0 ) { 
// 			hash = hash + dummy;
// 		} 
// 		else {
// 			hash = hash + " " + dummy;
// 		}
// 	}




// 	let result = (maxBidId + " " + Bids + " " + RandomElements + " " + Messages + " " +  decryptedBids + " " + contractSecKey).replace(/,/g, " ");
// 	try {
// 		const data = fs.writeFileSync('./results.txt', result);
// 	  } catch (err) {
// 		console.error(err);
// 	  }
// 	payments = computePayment(decryptedBids[numberOfBidders - 1], decryptedBids[numberOfBidders - 2], decryptedBids[numberOfBidders - 3], reservedPrice);
// 	await computeWit(result, decimals, hash, decryptedBids, payments, reservedPrice);
// 	await proofGen();
// 	proof = JSON.parse(fs.readFileSync('./proof.json','utf8'));
// 	// try {
// 	// 	await contract.SubmitWinner(maxBidId, proof.proof.a, proof.proof.b, proof.proof.c, decryptedBids[numberOfBidders-2], decryptedBids[numberOfBidders-3],  {gasLimit: 5000000}).then ((tx)=>{
// 	// 		console.log(tx);
// 	// 	});
// 	// }catch (err){
// 	// 	console.log(err);
// 	// }
// });


