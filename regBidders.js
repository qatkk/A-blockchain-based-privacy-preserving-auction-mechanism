const BabyJubJub = require("./BabyJubPoint")
const {verifySchnorr, genSchnorrProof} = require("./SchnorrGen")
const ethers = require('ethers');
const fs = require('fs');
const { promisify } = require('util');
const sleep = promisify(setTimeout);
const provider = new ethers.providers.InfuraProvider("kovan", "0090b71f3cbd4212bb37f81b9c3aeaab");
const contractAddr =  fs.readFileSync('./ContractAddr.txt','utf8');
const contractABI = fs.readFileSync('./ABI.txt','utf8');
let privateKey = "5f22a80a0824462fc1ed3b79306696b79dd3ed5dbb9a69287f1aa2cddb4413ef";
let wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddr, contractABI, wallet);


let params = []; 
let N =  fs.readFileSync('./numberOfBidders.txt','utf8');
let genedSecKeys = fs.readFileSync("./genedSecKeys.txt",'utf-8');
genedSecKeys = genedSecKeys.toString().split(",");
console.log("number of the secret keys are ", genedSecKeys.length);

function genPk(secret){
    let message = 1234567;
    let params = BabyJubJub.keyGen(BigInt(secret.toString()));
	let proof = genSchnorrProof(message, params.infield.n, params.Public_point);
	let verify = verifySchnorr (proof.sig, proof.rand, message, params.Public_key);
    console.log("verification resuls : ", verify);
    return {
        "secKey": params.infield.n,
        "sig": proof.sig,
        "rand": proof.rand, 
        "message": message, 
        "pubKey": params.Public_key
    }
}
async function regOnSC (){
    for (let i = 0 ; i< N  ; i++ ){
        params.push(genPk(genedSecKeys[i])); 
		console.log("i is", i);
        try { 
			    await contract.RegisterBidder(params[i].pubKey.toString(), params[i].rand.toString(), params[i].sig.toString(), params[i].message.toString(), {gasLimit: 5000000}).then((tx) => {
					if (!i == 0 ){
						console.log("writing to the file");
                        fs.appendFileSync('./SecKeys.txt', JSON.stringify(params[i].secKey.toString()),'utf8');
                }
                else {
                        fs.writeFileSync('./SecKeys.txt', JSON.stringify(params[i].secKey.toString()),'utf8');
                }
                });
            }
        catch(err){
            console.log(err);
			i-- ;
        }
		await sleep(15000);
    }
}
regOnSC().then(async()=>{
	let bidders = await contract.ReturnBidders();
	bidders = bidders.toString().split(",");
	console.log(bidders.length);
    await sleep(15000);
    console.log("finished");
});
exports.pkGenProof = genPk;