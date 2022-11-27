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

function randomBetween(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1) + min
  )
}
async function retrievePk (){
  let pk_x = await contract.Pk("0");
  await sleep(10000);
  let pk_y = await contract.Pk("1");
  await sleep(10000);
  return {
    "x": pk_x,
    "y": pk_y
  };
}
async function testBidGen(){
  let ret = await retrievePk();
  console.log(ret);
  const unCompressed = new BabyJubPoint(ret.x, ret.y);
  console.log(unCompressed);
  let Cs = [];
  let Rs = [];
  let Ms = [];
  let ms = [];
  let NumberOfBidders = fs.readFileSync('./numberOfBidders.txt','utf8');
  let counter = 0;
  let max = 0;
  let id = 0;
  while(counter < NumberOfBidders){
    let H = new BabyJubPoint(unCompressed.x,unCompressed.y);
    let prover = new biddingGenerate(H);
    let value = randomBetween(2, 100);
    let {encryptedBid, Message} = prover.bidGenerate(BigInt(value));
    Cs.push([encryptedBid.Y.x.toString(),encryptedBid.Y.y.toString()]);
    Rs.push([encryptedBid.X.x.toString(),encryptedBid.X.y.toString()]);
    Ms.push([Message.x.toString(),Message.y.toString()]);
    ms.push(value.toString());
    if(value > max){
      max = value;
      id = counter;
    }
    counter++;
  }
  return {"CypherTexts":Cs,
          "Randoms":Rs,
          "Message Points":Ms,
          "Messages ":ms};
};

testBidGen().then((ret)=> {
	try {
		const data = fs.writeFileSync('./Bids.txt', JSON.stringify(ret),'utf8');
		//file written successfully
	  } catch (err) {
		console.error(err);
	  }
});


exports.testBidGen = testBidGen; 
