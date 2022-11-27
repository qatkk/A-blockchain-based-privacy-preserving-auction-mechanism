pragma solidity >=0.8.0 <0.8.7;

uint preshash public ; 

function sha256Check (uint256 s) public  view returns ( uint256) {
    bytes memory Byte = abi.encodePacked(s);
    preshash = uint256(Byte);
    uint256  hash = uint256(sha256(Byte));
    return hash; 
}

function keccak256Check (uint256 s) public  view returns ( uint256) {
    bytes memory Byte = abi.encodePacked(s);
    preshash = uint256(Byte);
    uint256  hash = uint256(keccak256(Byte));
    return hash; 
}
