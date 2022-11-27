//SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.8.7;
import "./verifier.sol" ;
import "./BJJ.sol";

contract SmartContract is Verifier {
    ////// Variables 
    address public Owner; 
    string public DataName; 
    bool TimeOut;
    bool public VerificationStatus;
    bool public DataValidated;
    uint256 public MinimumDeposit;  
    uint256 public NumberOfBidders ;
    address[] Bidders; 
    uint256[2] _pkDecompressed; 
    uint256[]  public SecKeys; 
    uint256[2] public Pk;
    uint256[2] public Commitment; 
    uint256[][] public Bids; 
    uint256[][] public Randoms;
    uint256 EndRegistration ; 
    uint256 public WinningPrice; 
    uint256 Paytime; 
    uint256 public H; 
    uint256 EndBidding ;
    uint256 VerifiedTime; 
    uint256 public BiddersSekKey;
    uint256 public SellerPayment;
    uint256 public WinnerPayment;
    uint256 public ServerPortion;
    uint256 public OwnerSecKey;
    uint256 DecryptorSecretKey ;
    uint256 public reservedPrice;
    uint256 public token;
    address public WinnerBidder; 
    uint256 public ThirdPrice;
    bytes public preHashed ; 
    bytes public test; 
    bytes8[] public testPrime;
    bytes  public DataAddr;
    bytes public DataHash; 
    mapping (uint256 => address) BiddersId; 
    mapping (address  => Encrypted) BiddersBid;
    mapping (address => bool) BidderRegistration;
    mapping (address => uint256) BidderPK; 
    mapping (uint256 => bool) SecKeysMapp;
    struct Server{
        address ServerAddress;
        uint256 PartialPk;
        bool IsRegistered;
    }
    struct Encrypted {
        uint256[2] R ;
        uint256[2] C;
    }
    Server ComputerServer;
    enum Phases {Initiation, Registering, Bidding, Opening, DataDelivery}
    Phases AuctionPhase;

     /////////Methods 
    constructor(uint RegistrationTime, uint BiddingTime, uint _MinimumDeposit, uint _PayTime){
        Owner = msg.sender;
        EndRegistration = block.timestamp + RegistrationTime; 
        EndBidding = EndRegistration + BiddingTime; 
        MinimumDeposit = _MinimumDeposit;
        ComputerServer.IsRegistered = false; 
        Pk =[uint256(0),uint256(1)];
        NumberOfBidders = 0 ;
        AuctionPhase = Phases.Initiation;
        BiddersSekKey = 0 ; 
        Paytime = _PayTime;
        VerificationStatus = false; 
        H = uint256(uint160(Owner));
        DataValidated = false;
    }
    function Initialize ( bytes memory  _DataAddr, string memory _DataName, bytes memory _DataHash, uint256[2] memory _Commitment) public {
         DataAddr = _DataAddr;
         DataName = _DataName; 
         DataHash = _DataHash; 
         Commitment = _Commitment; 
         }
    function VerifySchnorr (uint256 s, uint256 r, uint256 m, uint256 pubKey) public view returns (bool) {
        uint256[4] memory R = BJJ.exDecompress(r);
        uint256[4] memory pubKeyPoint = BJJ.exDecompress(pubKey);
        bytes memory Byte = abi.encodePacked(R[0], pubKeyPoint[0], m);
        uint256  hash = uint256(keccak256(Byte));
        hash = BJJ.submod_s(hash, 0);
        uint256[4] memory G = BJJ.exG();
        uint256[4] memory first = BJJ.exMul(G, s);
        uint256[4] memory second = BJJ.exAdd(R, BJJ.exMul(pubKeyPoint, hash));
        return BJJ.toAffine(first)[0] == BJJ.toAffine(second)[0];
    }
    function RegisterBidder (uint256 _pk, uint256 r, uint256 s, uint256 m ) public  {
        address Bidder = msg.sender;
        // require (BidderRegistration[Bidder] == false , "Bidder already registered");
        bool res = VerifySchnorr(s, r, m, _pk);
        require(res, "not a valid pubkey");
        BiddersId[NumberOfBidders] = Bidder;
        BiddersBid[Bidder]= Encrypted([uint256(1),uint256(0)],[uint256(1),uint256(0)]);
        // BidderRegistration[Bidder] = res;
        Bidders.push(Bidder);
        BidderPK[Bidder] = _pk;
        _pkDecompressed = BJJ.afDecompress(_pk);
        Pk = BJJ.afAdd(Pk,_pkDecompressed);
        NumberOfBidders = NumberOfBidders + uint256(1) ; 
    }
    function RegisterServer (uint256 _pk, uint256 r, uint256 s, uint256 m ) public {
        // require(!(ComputerServer.IsRegistered && DecryptorServer.IsRegistered), "All servers registered.");
        bool res = VerifySchnorr(s, r, m, _pk);
        require(res, "not a valid pubkey");
        if (!ComputerServer.IsRegistered) {
            ComputerServer.ServerAddress = msg.sender; 
            ComputerServer.PartialPk = _pk;
            ComputerServer.IsRegistered = true; 
        }
        _pkDecompressed = BJJ.afDecompress(_pk);
        Pk = BJJ.afAdd(Pk,_pkDecompressed);
    }
    function Bid(uint256[2] memory _R, uint256[2] memory _C)public payable {
        address Bidder = msg.sender;
        // require(msg.value = MinimumDeposit, "Does'nt satisfy minimum deposit.");
        // require(BidderRegistration[Bidder], "Bidder is not registered.");
        BiddersBid[Bidder]= Encrypted(_R, _C);
        Bids.push(_C);
        Randoms.push(_R);
        testPrime.push(bytes8(abi.encodePacked(_C[0])));
        preHashed = abi.encodePacked(preHashed, bytes8(abi.encodePacked(_C[0])));
    }
    function ReturnBidders() public view returns (address[] memory ){ 
       require (NumberOfBidders > 0 , "No bidders registered");
       return Bidders;
    }
    function SubmitWinner (uint256  _id, uint[2] memory a, uint[2][2] memory b, uint[2] memory c, uint256[4]memory inputs) public {
        // require(msg.sender == ComputerServer.ServerAddress, "Only Computer is allowed.");
        bytes32 h = keccak256(preHashed); 
        bytes8 hash1 = bytes8(h);
        bytes8 hash2 = bytes8(h << 64); 
        bytes8 hash3 = bytes8(h << 128) ; 
        bytes8 hash4 = bytes8(h << 192); 
        Proof memory proof =  Proof(Pairing.G1Point(a[0],a[1]),Pairing.G2Point(b[0],b[1]),Pairing.G1Point(c[0],c[1]));
        uint256[11] memory input = [uint256(_id), uint256(bytes32(abi.encodePacked(hash1)) >> 192), uint256(bytes32(abi.encodePacked(hash2)) >> 192), uint256(bytes32(abi.encodePacked(hash3)) >> 192), uint256(bytes32(abi.encodePacked(hash4)) >> 192), inputs[0], inputs[1], inputs[2], reservedPrice, inputs[3],  uint256(1)]; 
        VerificationStatus  = verifyTx(proof, input) ;
        require(VerificationStatus, "The computation is faulty!"); 
        require(inputs[1] > 0, "Auction fault");
        WinningPrice = inputs[1] ; 
        ServerPortion = (inputs[0] + inputs[2] ) / inputs[3] ;
        SellerPayment = inputs[2] / inputs[3]; 
        WinnerPayment = (inputs[0] / inputs[3]) + inputs[1]; 
        WinnerBidder = Bidders[_id];
    }

    function SubmitSecKey (uint256 _secKey) public {
        //  require the bidder to be registered 
        if (SecKeysMapp[_secKey] == false) {
            SecKeysMapp[_secKey] = true ;
            SecKeys.push(_secKey);
            BiddersSekKey = BJJ.submod_s(BiddersSekKey, BJJ.S - _secKey);
        }
    }
    function RevealReserved(uint256 _reserved, uint256 _random ) public {
        uint256[4] memory G  = BJJ.exG();
        uint256[4] memory tempRandom = BJJ.exMul(G, H); 
        tempRandom = BJJ.exMul(tempRandom, _random); 
        uint256[4] memory tempSecret = BJJ.exMul(G, _reserved); 
        uint256[2] memory tempCommitment = BJJ.toAffine(BJJ.exAdd(tempRandom, tempSecret)); 
        bool verif = tempCommitment[0] == Commitment[0]; 
        require(verif, "Commitment isn't correct"); 
        reservedPrice = _reserved; 
    }
    function ReturnBids ()public view returns(uint256[][] memory) {
        return Bids;
    }
    function ReturnSecKeys() public view returns (uint256[] memory) {
        return SecKeys;
    }
    function ReturnRandoms () public view returns (uint256[][] memory){
        return Randoms;
    }
    function EndAuction () public payable{
        // require(msg.sender == Owner, "only owner allowd.");
        // require(msg.value == SellerPayment, "not sufficient payment");
        if (! TimeOut ){
            payable(Owner).transfer(WinningPrice);
        }
        for (uint32 i = 0 ; i< NumberOfBidders; i++){
            if (TimeOut == false && BiddersId[i] != WinnerBidder ){
                 payable( BiddersId[i]).transfer(MinimumDeposit);
            }
        }
        if (VerificationStatus) {
            payable(ComputerServer.ServerAddress).transfer(MinimumDeposit + ServerPortion);
        }
    }
    function DataValidation(bool _DataValidated) public {
        // require(msg.sender == WinnerBidder, "only winner allowd.");
        DataValidated= _DataValidated;
    }
    function PayBid() public payable{
            // require(msg.sender == WinnerBidder, "only winner allowd.");
            // require(msg.value ==  WinnerPayment , "Paid value doesn't match the winning price.");
            if (block.timestamp  > VerifiedTime + Paytime) {
                TimeOut = true; 
                //  The buyer is punished with it's deposit being sent to the owner 
            }
            // require(!TimeOut, "Time out");
            bytes memory Byte = abi.encodePacked(WinnerBidder, block.timestamp);
            token = uint256(keccak256(Byte));
            //  the token is generated for the buyer to get the data 
    }
}
