module hero::core {
    use std::string::String;
    use std::error;
    use std::signer;
    use std::vector;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use hero::metadata::Self;

    /// Error codes
    const ENOT_INITIALIZED: u64 = 1;
    const ENOT_AUTHORIZED: u64 = 2;
    const EINVALID_HERO_ID: u64 = 3;
    const EINVALID_RACE_ID: u64 = 4;
    const EINVALID_CLASS_ID: u64 = 5;
    const EINVALID_SIGNATURE: u64 = 6;

    /// Hero data structure
    struct HeroData has store, drop, copy {
        id: u256,
        name: String,
        race: u8,
        class: u8,
        level: u8,
        exp: u32,
        create_time: u64,
        last_save_time: u64,
        signature: vector<u8>,
    }

    /// Hero store resource
    struct HeroStore has key {
        heroes: vector<HeroData>,
        registered_nodes: vector<address>,
        hero_counter: u256,
        create_events: EventHandle<HeroCreatedEvent>,
        save_events: EventHandle<HeroSavedEvent>,
    }

    /// Events
    struct HeroCreatedEvent has drop, store {
        hero_id: u256,
        owner: address,
        name: String,
        race: u8,
        class: u8,
        timestamp: u64,
    }

    struct HeroSavedEvent has drop, store {
        hero_id: u256,
        timestamp: u64,
    }

    /// Initialize the hero system
    public entry fun initialize(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<HeroStore>(addr), error::already_exists(ENOT_INITIALIZED));

        let hero_store = HeroStore {
            heroes: vector::empty(),
            registered_nodes: vector::empty(),
            hero_counter: 0,
            create_events: account::new_event_handle<HeroCreatedEvent>(account),
            save_events: account::new_event_handle<HeroSavedEvent>(account),
        };

        move_to(account, hero_store);
    }

    /// Create a new hero
    public entry fun create_hero(
        account: &signer,
        name: String,
        race: u8,
        class: u8,
    ) acquires HeroStore {
        let addr = signer::address_of(account);
        assert!(exists<HeroStore>(addr), error::not_found(ENOT_INITIALIZED));
        assert!(race < 5, error::invalid_argument(EINVALID_RACE_ID));
        assert!(class < 5, error::invalid_argument(EINVALID_CLASS_ID));

        // Validate race and class
        let _race_data = metadata::get_race(race);
        let _class_data = metadata::get_class(class);

        let hero_store = borrow_global_mut<HeroStore>(addr);
        let hero_id = hero_store.hero_counter + 1;
        hero_store.hero_counter = hero_id;

        let hero = HeroData {
            id: hero_id,
            name,
            race,
            class,
            level: 1,
            exp: 0,
            create_time: timestamp::now_seconds(),
            last_save_time: timestamp::now_seconds(),
            signature: vector::empty(),
        };

        vector::push_back(&mut hero_store.heroes, hero);

        // Emit event
        event::emit_event(&mut hero_store.create_events, HeroCreatedEvent {
            hero_id,
            owner: addr,
            name,
            race,
            class,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Load hero data
    public fun load_hero(addr: address, hero_id: u256): HeroData acquires HeroStore {
        assert!(exists<HeroStore>(addr), error::not_found(ENOT_INITIALIZED));
        let hero_store = borrow_global<HeroStore>(addr);
        let i = 0;
        let len = vector::length(&hero_store.heroes);
        while (i < len) {
            let hero = vector::borrow(&hero_store.heroes, i);
            if (hero.id == hero_id) {
                return *hero
            };
            i = i + 1;
        };
        abort error::not_found(EINVALID_HERO_ID)
    }

    /// Save hero data
    public entry fun save_hero(
        account: &signer,
        hero_id: u256,
        level: u8,
        exp: u32,
        node_signature: vector<u8>,
        client_signature: vector<u8>,
    ) acquires HeroStore {
        let addr = signer::address_of(account);
        assert!(exists<HeroStore>(addr), error::not_found(ENOT_INITIALIZED));

        let hero_store = borrow_global_mut<HeroStore>(addr);
        let i = 0;
        let len = vector::length(&hero_store.heroes);
        let found = false;
        while (i < len) {
            let hero = vector::borrow_mut(&mut hero_store.heroes, i);
            if (hero.id == hero_id) {
                hero.level = level;
                hero.exp = exp;
                hero.last_save_time = timestamp::now_seconds();
                hero.signature = node_signature;
                found = true;
                break
            };
            i = i + 1;
        };
        assert!(found, error::not_found(EINVALID_HERO_ID));

        // Verify signatures
        assert!(verify_signatures(node_signature, client_signature), error::invalid_argument(EINVALID_SIGNATURE));

        // Emit event
        event::emit_event(&mut hero_store.save_events, HeroSavedEvent {
            hero_id,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Register a node
    public entry fun register_node(
        account: &signer,
        node_address: address,
    ) acquires HeroStore {
        let addr = signer::address_of(account);
        assert!(exists<HeroStore>(addr), error::not_found(ENOT_INITIALIZED));

        let hero_store = borrow_global_mut<HeroStore>(addr);
        vector::push_back(&mut hero_store.registered_nodes, node_address);
    }

    /// Public getters
    public fun get_name(hero: &HeroData): String {
        hero.name
    }

    public fun get_race(hero: &HeroData): u8 {
        hero.race
    }

    public fun get_class(hero: &HeroData): u8 {
        hero.class
    }

    public fun get_level(hero: &HeroData): u8 {
        hero.level
    }

    public fun get_exp(hero: &HeroData): u32 {
        hero.exp
    }

    /// Verify signatures
    fun verify_signatures(_node_signature: vector<u8>, _client_signature: vector<u8>): bool {
        // TODO: Implement signature verification logic
        true
    }
}
