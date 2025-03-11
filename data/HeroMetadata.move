module hero::metadata {
    use std::string;
    use std::vector;
    use std::signer;
    use aptos_framework::event;
    use aptos_framework::timestamp;

    /// Error codes
    const ENOT_INITIALIZED: u64 = 1;
    const ENOT_AUTHORIZED: u64 = 2;
    const EINVALID_RACE_ID: u64 = 3;
    const EINVALID_CLASS_ID: u64 = 4;
    const EINVALID_SKILL_ID: u64 = 5;

    /// Race attributes
    struct RaceAttributes has store, drop, copy {
        id: u8,
        name: string::String,
        description: string::String,
        base_hp: u32,
        base_mp: u32,
        base_attack: u32,
        base_defense: u32,
    }

    /// Class attributes
    struct ClassAttributes has store, drop, copy {
        id: u8,
        name: string::String,
        description: string::String,
        hp_per_level: u32,
        mp_per_level: u32,
        attack_per_level: u32,
        defense_per_level: u32,
    }

    /// Skill attributes
    struct SkillAttributes has store, drop, copy {
        id: u8,
        name: string::String,
        description: string::String,
        mp_cost: u32,
        cooldown: u32,
        required_level: u8,
        required_class: vector<u8>,
    }

    /// Metadata store resource
    struct MetadataStore has key {
        races: vector<RaceAttributes>,
        classes: vector<ClassAttributes>,
        skills: vector<SkillAttributes>,
    }

    // Events
    #[event]
    struct RaceAddedEvent has drop, store {
        race_id: u8,
        name: string::String,
        timestamp: u64,
    }

    #[event]
    struct ClassAddedEvent has drop, store {
        class_id: u8,
        name: string::String,
        timestamp: u64,
    }

    #[event]
    struct SkillAddedEvent has drop, store {
        skill_id: u8,
        name: string::String,
        timestamp: u64,
    }

    /// Initialize metadata
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<MetadataStore>(admin_addr), ENOT_INITIALIZED);

        move_to(admin, MetadataStore {
            races: vector::empty(),
            classes: vector::empty(),
            skills: vector::empty(),
        });
    }

    /// Add a new race
    public entry fun add_race(
        admin: &signer,
        name: string::String,
        description: string::String,
        base_hp: u32,
        base_mp: u32,
        base_attack: u32,
        base_defense: u32,
    ) acquires MetadataStore {
        assert!(signer::address_of(admin) == @hero, ENOT_AUTHORIZED);
        let store = borrow_global_mut<MetadataStore>(@hero);
        
        let race = RaceAttributes {
            id: vector::length(&store.races) as u8,
            name,
            description,
            base_hp,
            base_mp,
            base_attack,
            base_defense,
        };

        vector::push_back(&mut store.races, race);

        // Emit event
        event::emit(RaceAddedEvent {
            race_id: race.id,
            name,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Add a new class
    public entry fun add_class(
        admin: &signer,
        name: string::String,
        description: string::String,
        hp_per_level: u32,
        mp_per_level: u32,
        attack_per_level: u32,
        defense_per_level: u32,
    ) acquires MetadataStore {
        assert!(signer::address_of(admin) == @hero, ENOT_AUTHORIZED);
        let store = borrow_global_mut<MetadataStore>(@hero);
        
        let class = ClassAttributes {
            id: vector::length(&store.classes) as u8,
            name,
            description,
            hp_per_level,
            mp_per_level,
            attack_per_level,
            defense_per_level,
        };

        vector::push_back(&mut store.classes, class);

        // Emit event
        event::emit(ClassAddedEvent {
            class_id: class.id,
            name,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Add a new skill
    public entry fun add_skill(
        admin: &signer,
        name: string::String,
        description: string::String,
        mp_cost: u32,
        cooldown: u32,
        required_level: u8,
        required_class: vector<u8>,
    ) acquires MetadataStore {
        assert!(signer::address_of(admin) == @hero, ENOT_AUTHORIZED);
        let store = borrow_global_mut<MetadataStore>(@hero);
        
        let skill = SkillAttributes {
            id: vector::length(&store.skills) as u8,
            name,
            description,
            mp_cost,
            cooldown,
            required_level,
            required_class,
        };

        vector::push_back(&mut store.skills, skill);

        // Emit event
        event::emit(SkillAddedEvent {
            skill_id: skill.id,
            name,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Get race attributes
    public fun get_race(race_id: u8): RaceAttributes acquires MetadataStore {
        let store = borrow_global<MetadataStore>(@hero);
        assert!(race_id < (vector::length(&store.races) as u8), EINVALID_RACE_ID);
        *vector::borrow(&store.races, race_id as u64)
    }

    /// Get class attributes
    public fun get_class(class_id: u8): ClassAttributes acquires MetadataStore {
        let store = borrow_global<MetadataStore>(@hero);
        assert!(class_id < (vector::length(&store.classes) as u8), EINVALID_CLASS_ID);
        *vector::borrow(&store.classes, class_id as u64)
    }

    // Set race attributes
    public entry fun set_race(
        admin: &signer,
        race_id: u8,
        name: string::String,
        base_attributes: vector<u32>
    ) acquires MetadataStore {
        assert!(signer::address_of(admin) == @hero, ENOT_AUTHORIZED);
        let store = borrow_global_mut<MetadataStore>(@hero);
        
        let race = RaceAttributes {
            id: race_id,
            name,
            description: string::utf8(b""),
            base_hp: *vector::borrow(&base_attributes, 0),
            base_mp: *vector::borrow(&base_attributes, 1),
            base_attack: *vector::borrow(&base_attributes, 2),
            base_defense: *vector::borrow(&base_attributes, 3),
        };

        if (race_id >= (vector::length(&store.races) as u8)) {
            vector::push_back(&mut store.races, race);
        } else {
            *vector::borrow_mut(&mut store.races, race_id as u64) = race;
        };

        event::emit(RaceAddedEvent {
            race_id,
            name,
            timestamp: timestamp::now_seconds(),
        });
    }

    // Set class attributes
    public entry fun set_class(
        admin: &signer,
        class_id: u8,
        name: string::String,
        base_attributes: vector<u32>
    ) acquires MetadataStore {
        assert!(signer::address_of(admin) == @hero, ENOT_AUTHORIZED);
        let store = borrow_global_mut<MetadataStore>(@hero);
        
        let class = ClassAttributes {
            id: class_id,
            name,
            description: string::utf8(b""),
            hp_per_level: *vector::borrow(&base_attributes, 0),
            mp_per_level: *vector::borrow(&base_attributes, 1),
            attack_per_level: *vector::borrow(&base_attributes, 2),
            defense_per_level: *vector::borrow(&base_attributes, 3),
        };

        if (class_id >= (vector::length(&store.classes) as u8)) {
            vector::push_back(&mut store.classes, class);
        } else {
            *vector::borrow_mut(&mut store.classes, class_id as u64) = class;
        };

        event::emit(ClassAddedEvent {
            class_id,
            name,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Get skill attributes
    public fun get_skill(skill_id: u8): SkillAttributes acquires MetadataStore {
        let store = borrow_global<MetadataStore>(@hero);
        assert!(skill_id < (vector::length(&store.skills) as u8), EINVALID_SKILL_ID);
        *vector::borrow(&store.skills, skill_id as u64)
    }
}
