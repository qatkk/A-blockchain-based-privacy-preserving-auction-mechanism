const {BabyJubPoint, G, Fr, Frr, randFr, subOrder, order} = require("./BabyJubPoint");
const utils = require("ffjavascript").utils;
const assert = require("assert");
class decryptBid{
    constructor(sKey){
            this.selfSecretKey = BigInt("0");
            this.otherSecretKey = sKey;
        }
        decrypt(bid, randElement){
            const Bid = new BabyJubPoint(bid[0], bid[1]);
            const Random = new BabyJubPoint(randElement[0], randElement[1]);
            //// R*S1 + R*S2
            let dummy = Random.mul(BigInt( this.otherSecretKey.toString()));
            let M;
            dummy = Bid.sub(dummy);
            for (let i = BigInt(2); i<= 100 ; i++){
                M = G.mul(BigInt(i));
                if (dummy.equal(M)){
                    return  i;
                }
            }
            // assert(0 == -1 , "none of the bids matched");
            return 0;        
        }
}

exports.decryptBid = decryptBid;