// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity ^0.8.0;
library Pairing {
    struct G1Point {
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() pure internal returns (G1Point memory) {
        return G1Point(1, 2);
    }
    /// @return the generator of G2
    function P2() pure internal returns (G2Point memory) {
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );
    }
    /// @return the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) pure internal returns (G1Point memory) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }
    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success);
    }


    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory r) {
        uint[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success);
    }
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length);
        uint elements = p1.length;
        uint inputSize = elements * 6;
        uint[] memory input = new uint[](inputSize);
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[1];
            input[i * 6 + 3] = p2[i].X[0];
            input[i * 6 + 4] = p2[i].Y[1];
            input[i * 6 + 5] = p2[i].Y[0];
        }
        uint[1] memory out;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success);
        return out[0] != 0;
    }
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}

contract Verifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    struct Proof {
        Pairing.G1Point a;
        Pairing.G2Point b;
        Pairing.G1Point c;
    }
    function verifyingKey() pure internal returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(uint256(0x2fd961dbf25392e6ea92d4b414aa6ec22804e9f0daff4a1d2a168eec6d94d85b), uint256(0x04c2004735335005c0f7acd5042215c6be4740ee5665cb6601e45aa7356f002a));
        vk.beta = Pairing.G2Point([uint256(0x2e208ccaa11144c260d39f4250bf6a8a9b6a5ca1af6817743acbbeceb3dc2d71), uint256(0x2a452c58c01c24925498c03534dd857adc383b298e891acb6190499f5942c2be)], [uint256(0x22882076721ffa00d789bd903d7d79764b05d7ce841a755b73b278e141684e9e), uint256(0x2f8d92673abbbae097f9d853a1624c2b9c7e020ec6f91e8477ff00de9ad7c34b)]);
        vk.gamma = Pairing.G2Point([uint256(0x17ca1f87b6aa5243ee138ca76472952c41639d1c262a65659d536c941204f203), uint256(0x16156ebb5f6d5235064864e0819b6b22c202f324049eec3552aadc7b73af4b47)], [uint256(0x288b966906be51dbf51ef4050b2fb54c425e87354866d3171b5943ea01460ddc), uint256(0x2a751dafc442519ee796a10629fade5e228cd8d459c22be9ba0de2915758ce3d)]);
        vk.delta = Pairing.G2Point([uint256(0x1c19eba0e804476d30f79b122b9ac521ae0ac09ce8dd6027208cdd62dad8ed6d), uint256(0x0d2c2fcdd1122e4db96ada5b36064799a97474d9ce8c7656a354cd0afdc346d0)], [uint256(0x2ce3adae67afa41ef3fae942d64c86cc72171b9f3fc2e6ef5f47f641eb49ebbb), uint256(0x1f0ca755429191452a9a69d3988c7f708ed364de7e37884e4c2d4408c3bc54c9)]);
        vk.gamma_abc = new Pairing.G1Point[](12);
        vk.gamma_abc[0] = Pairing.G1Point(uint256(0x128a71e739e30268215e68d6308c4c29b1509dbde9759a9d87fc8b9ce77d183e), uint256(0x23add9ad5b35d3b0583e1f279aa90f025abdaaf47a8c8ec8157d177cbd79bd2c));
        vk.gamma_abc[1] = Pairing.G1Point(uint256(0x1611affc3c03a9c81ced14e7830441db5958aced66acf9e021fdf03b5b2e2c49), uint256(0x2789c9df15b6a8c8e1bde62527ba8910cf612ec9fed5cda30c8ea35e8b3cccb0));
        vk.gamma_abc[2] = Pairing.G1Point(uint256(0x1acd79cc45aa1a1fc4e502cde6fd0f54977310eefa79af2f8d63884ce5aaf212), uint256(0x0a707ccbcd2f5a152b951ed020eef722eea86384197fac6ab75f77509a979bd2));
        vk.gamma_abc[3] = Pairing.G1Point(uint256(0x145d7691bfdef0bd64cd21ac540691477630db9d4284e130b2d4ef0233710e72), uint256(0x23b450552734df1b163152343398e5ca14d06a8c363f162feef9c5b73d21900f));
        vk.gamma_abc[4] = Pairing.G1Point(uint256(0x1ae6b7f3982961828b001c292dc8517b40132e4a2f944ada5370f5744f7abfe1), uint256(0x13031ec5d329908235d9bb5cfdca384bbb31e42f09b85c45a30f204da8fbddbf));
        vk.gamma_abc[5] = Pairing.G1Point(uint256(0x2a450d53bc7824184eae8f460f12cab3c4c97ecf4af5642211f3f2aa5796b307), uint256(0x28b2712fa7b493ae3d606064c09b13096b1e3217d76058314c507b3d7f230e2b));
        vk.gamma_abc[6] = Pairing.G1Point(uint256(0x11115e97d59652fd7efb231dacce0ec2eb23fda60d26b55b897bec0ced2efe2b), uint256(0x04ab476b59d052d4a44ca7716c9651350a10d5d031ebeb462e5d5efbb8e50ad6));
        vk.gamma_abc[7] = Pairing.G1Point(uint256(0x16f481cf6014a7fb0e03efe8c152cfd43db91c9da5599e1293242b3ae8839db8), uint256(0x1440b0e5aa9f1ee08cb8a45ba1b41ff76d83703a6740718ecb4148ec247bf42e));
        vk.gamma_abc[8] = Pairing.G1Point(uint256(0x16f864a81418fcd030831a673028455a32a3e479720c307a61d30a56073d084a), uint256(0x24cb612c00367b57d0819dd915bc5763981982be94959350328f3c03f479d2a0));
        vk.gamma_abc[9] = Pairing.G1Point(uint256(0x301cec727cdc6cff82a7dd311278fa4ab648e696bd7594f97e461747a5094674), uint256(0x221aa484c7cff0f6fed2d9711e9c86d8b99007d741627b1fae5421a865e9ed91));
        vk.gamma_abc[10] = Pairing.G1Point(uint256(0x11020253691a73c5a53b2004b2b7a411a93ec4692a2896354717895d9ba54e4c), uint256(0x00791d1325367cdc7ad025168b91468f34ae62c74138772d37fd43704a85dfb7));
        vk.gamma_abc[11] = Pairing.G1Point(uint256(0x24d8a69fde4d6fc665966d19c39d76413ddfbf6b0092ba91b5b1366070d05db8), uint256(0x1f8dc31290330e9ec2d7898d6fdef79c7a8f6fca6088294235d96f320b5f3a71));
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.gamma_abc.length);
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field);
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.gamma_abc[i + 1], input[i]));
        }
        vk_x = Pairing.addition(vk_x, vk.gamma_abc[0]);
        if(!Pairing.pairingProd4(
             proof.a, proof.b,
             Pairing.negate(vk_x), vk.gamma,
             Pairing.negate(proof.c), vk.delta,
             Pairing.negate(vk.alpha), vk.beta)) return 1;
        return 0;
    }
    function verifyTx(
            Proof memory proof, uint[11] memory input
        ) public view returns (bool r) {
        uint[] memory inputValues = new uint[](11);
        
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
