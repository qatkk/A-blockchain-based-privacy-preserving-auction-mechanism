const {BabyJubPoint, G, Fr, Frr, randFr, subOrder, order} = require("./BabyJubPoint");
const bigInt = require("big-integer");
const assert = require('assert');

class biddingGenerate {
    constructor(H = null) {
        if (H instanceof BabyJubPoint) {
            this.H = H;
        } else {
            assert(false, 'pubkey should a BabyJubPoint');
        }

        this.encryptedBid = {"X": new BabyJubPoint(), "Y": new BabyJubPoint()}
        this.commitment = {"A1": new BabyJubPoint(), "B1": new BabyJubPoint(), "A2": new BabyJubPoint(), "B2": new BabyJubPoint()};
        this.proof = {"d1": bigInt.zero, "d2": bigInt.zero, "r1": bigInt.zero, "r2": bigInt.zero};
        this.secrets = {"xi": bigInt.zero, "w": bigInt.zero};
    }

    bidGenerate(v) {
        this.v = v;
        this.secrets.xi = randFr();
        this.encryptedBid.X = G.mul(this.secrets.xi);
        const a = G.mul(this.v);
        this.encryptedBid.Y = this.H.mul(this.secrets.xi).add(a);
        // let x = this.encryptedBid.Y.sub(this.encryptedBid.X.mul(2528226513151037177526654202407881275717488580118780382143183263766960708409n))
        return {"encryptedBid": this.encryptedBid , "Message": a};
    }
}

exports.biddingGenerate = biddingGenerate;
