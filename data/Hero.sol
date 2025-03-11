// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../interfaces/IHeroCore.sol";
import "../interfaces/IHeroNFT.sol";

/**
 * @title Hero
 * @dev 英雄核心合约,实现数据压缩和签名验证
 */
contract Hero is 
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    IHeroCore,
    PausableUpgradeable
{
    using ECDSA for bytes32;

    // 状态变量
    IHeroNFT public nftContract;
    mapping(address => bool) public registeredNodes;
    mapping(uint256 => HeroData) private _heroes;
    
    // 常量
    uint8 private constant _MAX_LEVEL = 100;
    uint32 private constant _MAX_EXP = 1000000;
    
    // 事件
    event NFTContractUpdated(address indexed oldContract, address indexed newContract);
    event NodeRegistered(address indexed node);
    event NodeUnregistered(address indexed node);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        __Pausable_init();
    }

    // NFT 合约管理
    function setNFTContract(address _nftContract) external onlyOwner {
        require(_nftContract != address(0), "Invalid NFT contract address");
        address oldContract = address(nftContract);
        nftContract = IHeroNFT(_nftContract);
        emit NFTContractUpdated(oldContract, _nftContract);
    }

    // 节点管理
    function registerNode(address node) external onlyOwner {
        require(node != address(0), "Invalid node address");
        registeredNodes[node] = true;
        emit NodeRegistered(node);
    }

    function unregisterNode(address node) external onlyOwner {
        registeredNodes[node] = false;
        emit NodeUnregistered(node);
    }

    // 英雄管理
    function createHero(
        uint256 userId,
        string calldata name,
        uint8 race,
        uint8 class
    ) external override returns (uint256) {
        require(address(nftContract) != address(0), "NFT contract not set");
        require(race < 5, "Invalid race");
        require(class < 5, "Invalid class");
        
        // 检查调用者是否拥有对应的 NFT
        uint256 tokenId = uint256(keccak256(abi.encodePacked(userId, name, race, class)));
        require(nftContract.exists(tokenId), "NFT does not exist");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Not NFT owner");

        // 创建英雄数据
        _heroes[tokenId] = HeroData({
            id: tokenId,
            level: 1,
            exp: 0,
            createTime: uint32(block.timestamp),
            lastSaveTime: uint32(block.timestamp),
            signature: ""
        });

        emit HeroCreated(userId, tokenId, name, race, class);
        return tokenId;
    }

    function loadHero(uint256 heroId) external view override returns (HeroData memory) {
        require(_heroes[heroId].id != 0, "Hero does not exist");
        require(nftContract.ownerOf(heroId) == msg.sender, "Not hero owner");
        return _heroes[heroId];
    }

    function saveHero(
        uint256 heroId,
        HeroData calldata data,
        bytes calldata nodeSignature,
        bytes calldata clientSignature
    ) external override whenNotPaused {
        require(_heroes[heroId].id != 0, "Hero does not exist");
        require(nftContract.ownerOf(heroId) == msg.sender, "Not hero owner");
        require(verifyNodeSignature(heroId, data, nodeSignature), "Invalid node signature");
        require(verifyClientSignature(heroId, data, clientSignature), "Invalid client signature");
        
        _heroes[heroId] = data;
        emit HeroSaved(heroId, uint32(block.timestamp));
    }

    function verifyNodeSignature(
        uint256 heroId,
        HeroData calldata data,
        bytes calldata signature
    ) public view override returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                heroId,
                data.level,
                data.exp,
                data.createTime,
                data.lastSaveTime
            )
        );
        address signer = messageHash.toEthSignedMessageHash().recover(signature);
        return registeredNodes[signer];
    }

    function verifyClientSignature(
        uint256 heroId,
        HeroData calldata data,
        bytes calldata signature
    ) public view override returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                heroId,
                data.level,
                data.exp,
                data.createTime,
                data.lastSaveTime
            )
        );
        address signer = messageHash.toEthSignedMessageHash().recover(signature);
        return signer == nftContract.ownerOf(heroId);
    }

    // 紧急暂停
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
} 