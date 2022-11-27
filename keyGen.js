const BabyJubJub = require("./BabyJubPoint")
const utils = require("ffjavascript").utils;

console.log('first one :');
const secretValueOne = BigInt("277033706901428915424752803494827665184494250049921935015444730526609944494");
let sss = BabyJubJub.keyGen(secretValueOne);
console.log('------------------------');
console.log("publickey is",sss.Public_key.toString());
console.log('------------------------');
// console.log("bigint random is",sss.infield.n);
console.log('------------------------');
console.log("secret in field",sss.infield.n);
console.log(sss.infield);
console.log('------------------------');
console.log("point is",sss.Public_point);
console.log('------------------------');
console.log('------------------------');

console.log(' second one:');
const secretValue = BigInt("2397218593166471134396836982622771206052462974031128906153416875887823352823");

let ssss = BabyJubJub.keyGen(secretValue);
console.log('------------------------');
console.log("secret in field is",ssss.infield.n);
console.log('------------------------');
console.log("publickey is",ssss.Public_key.toString());
console.log('------------------------');
console.log("publickey point is",ssss.Public_point);
console.log('------------------------');

const pubKey = BabyJubJub.G.mul(secretValue + secretValueOne)
const compressedPointInt = utils.leBuff2int(pubKey  .compress());
console.log("Sc pubkey",pubKey);
console.log("Sc compressed pub  ", compressedPointInt);