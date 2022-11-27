const utils = require("ffjavascript").utils;
const fs = require("fs");
const crypto = require("crypto");
let NumberOfBidders = fs.readFileSync('./numberOfBidders.txt','utf8');
let rand = [];
for (let i = 0 ; i< NumberOfBidders ; i++){
    rand.push(utils.leBuff2int(crypto.randomBytes(32)));
}
fs.writeFileSync("genedSecKeys.txt",rand.toString(), 'utf8');