// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/IHeroMetadata.sol";

contract HeroMetadata is IHeroMetadata, Initializable, UUPSUpgradeable, OwnableUpgradeable {
    mapping(bytes32 => Skill) private _skills;
    mapping(uint8 => RaceAttributes) private _races;
    mapping(uint8 => ClassAttributes) private _classes;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
    }

    function setSkill(
        uint8 seasonId,
        uint8 skillId,
        uint8 level,
        string calldata name,
        uint16 points,
        bool isActive
    ) external override onlyOwner {
        require(seasonId < 4, "Invalid season");
        require(skillId < 5, "Invalid skill ID");
        require(level > 0 && level <= 10, "Invalid level");
        require(points > 0, "Invalid points");

        bytes32 skillKey = keccak256(abi.encodePacked(seasonId, skillId, level));
        _skills[skillKey] = Skill({
            name: name,
            level: level,
            points: points,
            season: Season(seasonId),
            isActive: isActive
        });

        emit SkillUpdated(seasonId, skillId, level, name, points);
    }

    function getSkill(
        uint8 seasonId,
        uint8 skillId,
        uint8 level
    ) external view override returns (Skill memory) {
        bytes32 skillKey = keccak256(abi.encodePacked(seasonId, skillId, level));
        return _skills[skillKey];
    }

    function setRace(
        uint8 raceId,
        uint16[4] calldata baseAttributes,
        string calldata description,
        bool isActive
    ) external override onlyOwner {
        require(raceId < 5, "Invalid race");
        for (uint i = 0; i < 4; i++) {
            require(baseAttributes[i] > 0, "Invalid attribute value");
        }

        _races[raceId] = RaceAttributes({
            baseAttributes: baseAttributes,
            description: description,
            isActive: isActive
        });

        emit RaceUpdated(raceId, baseAttributes, description);
    }

    function getRace(uint8 raceId) external view override returns (RaceAttributes memory) {
        require(raceId < 5, "Invalid race");
        return _races[raceId];
    }

    function setClass(
        uint8 classId,
        uint16[4] calldata baseAttributes,
        uint16[4] calldata growthRates,
        string calldata description,
        bool isActive
    ) external override onlyOwner {
        require(classId < 5, "Invalid class");
        for (uint i = 0; i < 4; i++) {
            require(baseAttributes[i] > 0, "Invalid attribute value");
            require(growthRates[i] > 0, "Invalid growth rate");
        }

        _classes[classId] = ClassAttributes({
            baseAttributes: baseAttributes,
            growthRates: growthRates,
            description: description,
            isActive: isActive
        });

        emit ClassUpdated(classId, baseAttributes, growthRates, description);
    }

    function getClass(uint8 classId) external view override returns (ClassAttributes memory) {
        require(classId < 5, "Invalid class");
        return _classes[classId];
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
} 