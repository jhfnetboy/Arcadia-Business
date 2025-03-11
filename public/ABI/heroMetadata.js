export const heroMetadataAbi = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "classId",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "uint16[4]",
                "name": "baseAttributes",
                "type": "uint16[4]"
            },
            {
                "indexed": false,
                "internalType": "uint16[4]",
                "name": "growthRates",
                "type": "uint16[4]"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "description",
                "type": "string"
            }
        ],
        "name": "ClassUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "raceId",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "uint16[4]",
                "name": "baseAttributes",
                "type": "uint16[4]"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "description",
                "type": "string"
            }
        ],
        "name": "RaceUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "seasonId",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "skillId",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "level",
                "type": "uint8"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint16",
                "name": "points",
                "type": "uint16"
            }
        ],
        "name": "SkillUpdated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "classId",
                "type": "uint8"
            }
        ],
        "name": "getClass",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint16[4]",
                        "name": "baseAttributes",
                        "type": "uint16[4]"
                    },
                    {
                        "internalType": "uint16[4]",
                        "name": "growthRates",
                        "type": "uint16[4]"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    }
                ],
                "internalType": "struct IHeroMetadata.ClassAttributes",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "raceId",
                "type": "uint8"
            }
        ],
        "name": "getRace",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint16[4]",
                        "name": "baseAttributes",
                        "type": "uint16[4]"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    }
                ],
                "internalType": "struct IHeroMetadata.RaceAttributes",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "seasonId",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "skillId",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "level",
                "type": "uint8"
            }
        ],
        "name": "getSkill",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "uint8",
                        "name": "level",
                        "type": "uint8"
                    },
                    {
                        "internalType": "uint16",
                        "name": "points",
                        "type": "uint16"
                    },
                    {
                        "internalType": "enum IHeroMetadata.Season",
                        "name": "season",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    }
                ],
                "internalType": "struct IHeroMetadata.Skill",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "classId",
                "type": "uint8"
            },
            {
                "internalType": "uint16[4]",
                "name": "baseAttributes",
                "type": "uint16[4]"
            },
            {
                "internalType": "uint16[4]",
                "name": "growthRates",
                "type": "uint16[4]"
            },
            {
                "internalType": "string",
                "name": "description",
                "type": "string"
            },
            {
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
            }
        ],
        "name": "setClass",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "raceId",
                "type": "uint8"
            },
            {
                "internalType": "uint16[4]",
                "name": "baseAttributes",
                "type": "uint16[4]"
            },
            {
                "internalType": "string",
                "name": "description",
                "type": "string"
            },
            {
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
            }
        ],
        "name": "setRace",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint8",
                "name": "seasonId",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "skillId",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "level",
                "type": "uint8"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "uint16",
                "name": "points",
                "type": "uint16"
            },
            {
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
            }
        ],
        "name": "setSkill",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "VERSION",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];