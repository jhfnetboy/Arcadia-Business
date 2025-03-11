module hero_nft::hero_nft {
    use std::string::String;
    use std::string;
    use std::signer;
    use std::vector;
    use std::error;
    use aptos_framework::account;
    use aptos_framework::coin::{Self as coin};
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::type_info;
    use aptos_token::token;

    // Error codes
    const ENOT_INITIALIZED: u64 = 1;
    const EINVALID_TOKEN_ID: u64 = 2;
    const ETOKEN_ALREADY_EXISTS: u64 = 3;
    const ETOKEN_NOT_EXISTS: u64 = 4;
    const ENOT_OWNER: u64 = 5;
    const EINVALID_PAYMENT: u64 = 6;

    // Price configuration structure
    struct PriceConfig has store, drop {
        token_type: string::String,
        price: u64,
        is_active: bool,
    }

    // NFT collection data
    struct CollectionData has key {
        name: string::String,
        description: string::String,
        uri: string::String,
        default_native_price: u64,
        default_token_price: u64,
        default_token_type: string::String,
        price_configs: vector<PriceConfig>,
    }

    // Events
    #[event]
    struct NFTMintedEvent has drop, store {
        to: address,
        token_id: u64,
        payment_token: string::String,
        price: u64,
        timestamp: u64,
    }

    #[event]
    struct PriceConfigUpdatedEvent has drop, store {
        token_id: u64,
        token_type: string::String,
        price: u64,
        timestamp: u64,
    }

    // Initialize the NFT collection
    public entry fun initialize(
        account: &signer,
        name: string::String,
        description: string::String,
        uri: string::String,
        default_token_name: string::String,
        default_native_price: u64,
        default_token_price: u64,
    ) {
        let collection_data = CollectionData {
            name,
            description,
            uri,
            default_native_price,
            default_token_price,
            default_token_type: default_token_name,
            price_configs: vector::empty(),
        };
        move_to(account, collection_data);

        let mutate_setting = vector::empty<bool>();
        vector::push_back(&mut mutate_setting, true); // description
        vector::push_back(&mut mutate_setting, true); // uri
        vector::push_back(&mut mutate_setting, true); // maximum

        token::create_collection(
            account,
            name,
            description,
            uri,
            0,
            mutate_setting,
        );
    }

    // Mint a new NFT
    public entry fun mint_with_native<CoinType>(
        account: &signer,
        token_id: u64,
        amount: u64,
    ) acquires CollectionData {
        let collection_data = borrow_global<CollectionData>(@hero_nft);
        let price = get_price_for_token(token_id, collection_data);
        assert!(amount >= price, EINVALID_PAYMENT);

        coin::transfer<CoinType>(account, @hero_nft, price);

        // Create admin signer
        let cap = account::create_test_signer_cap(@hero_nft);
        let admin = account::create_signer_with_capability(&cap);
        mint_internal(account, &admin, token_id);

        event::emit(NFTMintedEvent {
            to: signer::address_of(account),
            token_id,
            payment_token: type_info::type_name<CoinType>(),
            price,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun set_price_config(
        account: &signer,
        token_id: u64,
        token_name: string::String,
        price: u64,
    ) acquires CollectionData {
        assert!(signer::address_of(account) == @hero_nft, 0);
        
        let collection_data = borrow_global_mut<CollectionData>(@hero_nft);
        let i = 0;
        let found = false;
        
        while (i < vector::length(&collection_data.price_configs)) {
            let config = vector::borrow_mut(&mut collection_data.price_configs, i);
            if (token_id == i) {
                config.token_type = token_name;
                config.price = price;
                config.is_active = true;
                found = true;
                break
            };
            i = i + 1;
        };
        
        if (!found) {
            vector::push_back(&mut collection_data.price_configs, PriceConfig {
                token_type: token_name,
                price,
                is_active: true,
            });
        };

        event::emit(PriceConfigUpdatedEvent {
            token_id,
            token_type: token_name,
            price,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun set_default_token_type(
        account: &signer,
        token_name: string::String,
    ) acquires CollectionData {
        assert!(signer::address_of(account) == @hero_nft, 0);
        
        let collection_data = borrow_global_mut<CollectionData>(@hero_nft);
        collection_data.default_token_type = token_name;
    }

    // Batch mint NFTs with native token
    public entry fun mint_batch_with_native<CoinType>(
        account: &signer,
        token_ids: vector<u64>,
        amount: u64,
    ) acquires CollectionData {
        let collection_data = borrow_global<CollectionData>(@hero_nft);
        let total_price = get_total_price_for_tokens(&token_ids, collection_data);
        assert!(amount >= total_price, EINVALID_PAYMENT);

        coin::transfer<CoinType>(account, @hero_nft, total_price);

        // Create admin signer
        let cap = account::create_test_signer_cap(@hero_nft);
        let admin = account::create_signer_with_capability(&cap);

        let i = 0;
        let len = vector::length(&token_ids);
        while (i < len) {
            let token_id = *vector::borrow(&token_ids, i);
            mint_internal(account, &admin, token_id);

            event::emit(NFTMintedEvent {
                to: signer::address_of(account),
                token_id,
                payment_token: type_info::type_name<CoinType>(),
                price: get_price_for_token(token_id, collection_data),
                timestamp: timestamp::now_seconds(),
            });
            i = i + 1;
        };
    }

    // Set default prices for native and token payments
    public entry fun set_default_prices(
        account: &signer,
        native_price: u64,
        token_price: u64,
    ) acquires CollectionData {
        assert!(signer::address_of(account) == @hero_nft, 0);
        
        let collection_data = borrow_global_mut<CollectionData>(@hero_nft);
        collection_data.default_native_price = native_price;
        collection_data.default_token_price = token_price;
    }

    // Internal functions
    fun mint_internal(user: &signer, admin: &signer, token_id: u64) {
        // Check if the admin account is valid
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @hero_nft, error::permission_denied(ENOT_OWNER));
        let token_name = string::utf8(b"");
        string::append(&mut token_name, string::utf8(b"HERO #"));
        string::append(&mut token_name, string::utf8(num_to_string(token_id)));

        let collection = string::utf8(b"Hero NFT");
        let description = string::utf8(b"Hero NFT Collection");
        let uri = string::utf8(b"https://hero.example.com/nft/");

        // Create token data using admin account
        let token_data_id = token::create_tokendata(
            admin,
            collection,
            token_name,
            description,
            1, // maximum
            uri,
            @hero_nft, // royalty payee address
            100, // royalty points denominator
            5, // royalty points numerator (5%)
            {
                let mutate_setting = vector::empty<bool>();
                vector::push_back(&mut mutate_setting, true); // maximum
                vector::push_back(&mut mutate_setting, true); // uri
                vector::push_back(&mut mutate_setting, true); // royalty
                vector::push_back(&mut mutate_setting, true); // description
                vector::push_back(&mut mutate_setting, true); // properties
                token::create_token_mutability_config(&mutate_setting)
            }, // token mutate config
            vector::empty<String>(), // property keys
            vector::empty<vector<u8>>(), // property values
            vector::empty<String>(), // property types
        );

        // Mint token using admin account
        let token_id = token::mint_token(
            admin,
            token_data_id,
            1, // amount
        );

        // Transfer token to user
        token::direct_transfer(admin, user, token_id, 1);
    }

    fun get_total_price_for_tokens(token_ids: &vector<u64>, collection_data: &CollectionData): u64 {
        let total = 0u64;
        let i = 0;
        let len = vector::length(token_ids);
        while (i < len) {
            let token_id = *vector::borrow(token_ids, i);
            total = total + get_price_for_token(token_id, collection_data);
            i = i + 1;
        };
        total
    }

    fun get_price_for_token(token_id: u64, collection_data: &CollectionData): u64 {
        let i = 0;
        while (i < vector::length(&collection_data.price_configs)) {
            let config = vector::borrow(&collection_data.price_configs, i);
            if (token_id == i && config.is_active) {
                return config.price
            };
            i = i + 1;
        };
        collection_data.default_native_price
    }

    fun num_to_string(num: u64): vector<u8> {
        if (num == 0) {
            return b"0"
        };
        let bytes = vector::empty<u8>();
        let n = num;
        while (n > 0) {
            let digit = ((48 + n % 10) as u8);
            vector::push_back(&mut bytes, digit);
            n = n / 10;
        };
        let len = vector::length(&bytes);
        let i = 0;
        while (i < len / 2) {
            let j = len - i - 1;
            let temp = *vector::borrow(&bytes, i);
            *vector::borrow_mut(&mut bytes, i) = *vector::borrow(&bytes, j);
            *vector::borrow_mut(&mut bytes, j) = temp;
            i = i + 1;
        };
        bytes
    }

    fun get_token_price<CoinType>(token_id: u64, collection_data: &CollectionData): u64 {
        let token_type = type_info::type_name<CoinType>();
        let i = 0;
        while (i < vector::length(&collection_data.price_configs)) {
            let config = vector::borrow(&collection_data.price_configs, i);
            if (token_id == i && config.is_active && token_type == config.token_type) {
                return config.price
            };
            i = i + 1;
        };
        collection_data.default_token_price
    }
} 