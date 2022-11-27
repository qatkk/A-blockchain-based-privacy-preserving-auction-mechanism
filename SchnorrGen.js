const {BabyJubPoint, G, Fr, Frr, randFr, subOrder, order} = require("./BabyJubPoint");
const crypto = require("crypto");
const utils = require("ffjavascript").utils;
const keccak256  = require("keccak256");
const assert = require('assert');
const { bufToBigint } = require("bigint-conversion");

//  proof Gen 
function genProof (message, secKey, pubKeyPoint) {
    if (!(typeof message == "bigInt")){
        message = BigInt(message);
    }
    if (!(typeof secKey == "bigInt")){
       let  _secKey = BigInt(secKey.toString());
        assert(secKey == _secKey, "sec key differs when converting to bigint");
    }
    if (! pubKeyPoint instanceof BabyJubPoint ) {
        pubKeyPoint = new BabyJubPoint (pubKeyPoint[0], pubKeyPoint[1]);
    }
    const rand = BigInt(utils.leBuff2int(crypto.randomBytes(32)));
    console.log("generator is ", G); 
    let R = G.mul(rand);
    console.log("Random is ", R);
    let Int = bufToBigint(keccak256("0x"+R.x.toString(16).padStart(64, "0") +pubKeyPoint.x.toString(16).padStart(64, "0")  +message.toString(16).padStart(64, "0")), 16); 
    let hash = new Fr(Int);
    let s = new Fr(rand + hash.n * secKey);
    return {
        "sig": s.n,
        "rand": utils.leBuff2int(R.compress())
    }
}
function verify (s, r, m, pubKey){
    s = BigInt(s);
    let buff = utils.leInt2Buff(r, 32);
    let point = new BabyJubPoint();
    let R = new BabyJubPoint(point.decompress(buff)[0], point.decompress(buff)[1]);
    buff = utils.leInt2Buff(pubKey, 32);
    let pubKeyPoint = new BabyJubPoint (point.decompress(buff)[0], point.decompress(buff)[1]);
    let Int = bufToBigint(keccak256("0x"+R.x.toString(16).padStart(64, "0") + pubKeyPoint.x.toString(16).padStart(64, "0")  + m.toString(16).padStart(64 , "0"))); 
    let hash = new Fr(Int);
    assert(G.mul(s).equal(R.add(pubKeyPoint.mul(hash))))
    return true ; 
}

exports.verifySchnorr = verify; 
exports.genSchnorrProof = genProof; 
