// The 'leo_nft' program.
program leo_nft.aleo {
    // dummy address, ie the aleo address equivalent of 0: aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc
    struct TokenId {
        data1: u128, // Part 1 of the image data -- i.e., a way to link this nft to image or aws
        data2: u128,
    }

    // base uri ascii bits. Include as many data pieces as necessary to encapsulate the uri. Padded with 0s at the end.
    struct BaseURI {
        data0: u128, // Part 1 of the base uri in bits. Bits should be the representation of the hexadecimal bytes for the ASCII text of the URL
        data1: u128,
        data2: u128,
        data3: u128
    }

    struct SymbolBits {
        data: u128 // The sybmol's ascii text represented in bits, and the u128 value of the bitstring.
    }

    record NFT {
        private owner: address,
        private data: TokenId,
        private edition: scalar, // which edition of the nft this particular one is -- will be 0 for unique NFTs
    }

    record NFT_mint {
        private owner: address,
        private amount: u8,
    }

    record NFT_claim {
        private owner: address,
        private claim: field
    }

    // a way to prove ownership of an nft privately
    record NFT_ownership {
        private owner: address,
        private nft_owner: address,
        private data: TokenId,
        private edition: scalar, // which edition of the nft this particular one is -- will be 0 for unique NFTs
    }

    mapping nft_owners: field => address;

    // keys: setting index
    // values: setting value
    mapping general_settings: u8 => u128;

    // keys: index of the nft to mint
    // values: hash of the token id + edition
    mapping nfts_to_mint: u128 => field;

    // keys: fields that represent claims for having minted an nft
    // values: fields that are the hash of the nft that was minted
    mapping claims_to_nfts: field => field;

    // keys: just two, 0u8 which corresponds to different on/off settings for the contract, and 1u8
    // which corresponds to the mint block height.
    // values: the bitstring that represents the settings that can be toggled
    // in order of least significant bit index to most significant bit:
    // 0: collection has been initialized
    // 1: can minters mint
    // 2: do minters have to have a mint record (i.e. is the private whitelist a requirement)
    // 3: is the collection frozen
    mapping toggle_settings: u8 => u32;

    transition initialize_collection(
        public total: u128,
        public symbol: u128,
        public base_uri: BaseURI,
    ) {
        assert_eq(self.caller, aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy);
        return then finalize(total, symbol, base_uri);
    }

    finalize initialize_collection(
        public total: u128,
        public symbol: u128,
        public base_uri: BaseURI,
    ) {
        // Ensure initialize cannot be called twice!
        let toggle_settings_status: u32 = toggle_settings.get_or_use(0u8, 0u32);
        let is_initialized: u32 = toggle_settings_status & 1u32;
        assert_eq(is_initialized, 0u32);

        general_settings.set(0u8, 0u128); // number of mintable NFTs (all editions)
        general_settings.set(1u8, total); // Number of total NFTs (first-editions) that can be minted
        general_settings.set(2u8, symbol); // Symbol for the NFT
        general_settings.set(3u8, base_uri.data0); // Base URI for NFT
        general_settings.set(4u8, base_uri.data1);
        general_settings.set(5u8, base_uri.data2);
        general_settings.set(6u8, base_uri.data3);
        // initialized flag = 0b0000...0001 = 1u32
        // minting flag = 0b0000...0010 = 2u32
        // whitelist flag = 0b0000...0100 = 4u32
        // frozen flag = 0b0000...1000 = 8u32
        // defaults -- not frozen, whitelist required, not minting, initialized
        // 0b0000...0101 = 5u32.
        toggle_settings.set(0u8, 5u32);
        toggle_settings.set(1u8, 0u32); // block height when mint is allowed
    }
    
    // Load the data into the mapping
    // Enables someone to mint an NFT with provided image data
    transition add_nft(public tokenId: TokenId, public edition: scalar) {
        assert_eq(self.caller, aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy);
        let tokenHash: field = BHP256::hash_to_field(tokenId);
        let tokenEditionHash: field = BHP256::commit_to_field(tokenHash, edition);
        return then finalize(tokenEditionHash);
    }

    finalize add_nft(public tokenEditionHash: field) {
        // Ensure collection is initialized and not frozen.
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // initialized & frozen flags = 0b0000...1001 = 9u32
        // what the settings should be = 0b0000...0001 = 1u32
        let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
        assert_eq(is_initialized_and_not_frozen, 1u32);

        // Reduce the amount of total nfts that can be initialized
        let remaining: u128 = general_settings.get(1u8);
        general_settings.set(1u8, remaining - 1u128);

        // Add this NFT to the mintable NFT collection
        let mintable_num: u128 = general_settings.get(0u8);
        nfts_to_mint.set(mintable_num, tokenEditionHash);
        general_settings.set(0u8, mintable_num + 1u128);
    }

    transition add_minter(private minter: address, public amount: u8) -> NFT_mint {
        assert_eq(self.caller, aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy);
        return NFT_mint {
            owner: minter,
            amount,
        } then finalize();
    }

    finalize add_minter()
    {
        // Ensure collection is initialized and not frozen.
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // initialized & frozen flags = 0b0000...1001 = 9u32
        // what the settings should be = 0b0000...0001 = 1u32
        let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
        assert_eq(is_initialized_and_not_frozen, 1u32);
    }

    // call this function to toggle minting, the whitelist requirement, or to permanently freeze the contract
    transition update_toggle_settings(public toggle_settings_bitstring: u32) {
        assert_eq(self.caller, aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy);
        return then finalize(toggle_settings_bitstring);
    }

    finalize update_toggle_settings(public toggle_settings_bitstring: u32) {
        // Ensure collection is initialized and not frozen.
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // initialized & frozen flags = 0b0000...1001 = 9u32
        // what the settings should be = 0b0000...0001 = 1u32
        let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
        assert_eq(is_initialized_and_not_frozen, 1u32);

        // Ensure updated settings are not uninitializing the collection.
        let still_initialized: u32 = toggle_settings_bitstring & 1u32;
        assert_eq(still_initialized, 1u32);

        toggle_settings.set(0u8, toggle_settings_bitstring);
    }

    transition set_mint_block(public mint_block: u32) {
        assert_eq(self.caller, aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy);
        return then finalize(mint_block);
    }

    finalize set_mint_block(public mint_block: u32) {
        // Ensure collection is initialized and not frozen.
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // initialized & frozen flags = 0b0000...1001 = 9u32
        // what the settings should be = 0b0000...0001 = 1u32
        let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
        assert_eq(is_initialized_and_not_frozen, 1u32);

        toggle_settings.set(1u8, mint_block);
    }

    transition update_symbol(public symbol: u128) {
        assert_eq(self.caller, aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy);
        return then finalize(symbol);
    }

    finalize update_symbol(public symbol: u128) {
        // Ensure collection is initialized and not frozen.
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // initialized & frozen flags = 0b0000...1001 = 9u32
        // what the settings should be = 0b0000...0001 = 1u32
        let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
        assert_eq(is_initialized_and_not_frozen, 1u32);

        general_settings.set(2u8, symbol);
    }

    transition update_base_uri(public base_uri: BaseURI) {
        assert_eq(self.caller, aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy);
        return then finalize(base_uri);
    }

    finalize update_base_uri(public base_uri: BaseURI) {
       // Ensure collection is initialized and not frozen.
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // initialized & frozen flags = 0b0000...1001 = 9u32
        // what the settings should be = 0b0000...0001 = 1u32
        let is_initialized_and_not_frozen: u32 = toggle_settings_status & 9u32;
        assert_eq(is_initialized_and_not_frozen, 1u32);

        general_settings.set(3u8, base_uri.data0); // Base URI for NFT
        general_settings.set(4u8, base_uri.data1);
        general_settings.set(5u8, base_uri.data2);
        general_settings.set(6u8, base_uri.data3);
    }

    transition open_mint(private hiding_nonce: scalar) -> NFT_claim {
        // CAUTION: If the minter selects the same hiding nonce,
        // that minter will not be able to mint all of their NFTs without claiming some first.
        // Additionally, some privacy will be lost as the claim is a deterministic hash and is held in public state.
        let address_hash: field = BHP256::hash_to_field(self.caller);
        let claim: field = BHP256::commit_to_field(address_hash, hiding_nonce);
        return NFT_claim {
            owner: self.caller,
            claim
        } then finalize(claim);
    }

    // note, much of this code should be combined in a closure, but finalize closures are not yet stable on aleo.
    finalize open_mint(public claim: field) {
        // Ensure mint block height is less than current block height
        let mint_block: u32 = toggle_settings.get(1u8);
        let passed_height_check: bool = mint_block <= block.height;
        assert_eq(passed_height_check, true);

        // Ensure collection is not frozen, whitelist is not required, minting is allowed, and is initialized, 
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // frozen & whitelist & minting & initialized flags = 0b0000...1111 = 15u32
        // what the settings should be = 0b0000...0011 = 3u32
        let collection_settings_met: u32 = toggle_settings_status & 15u32;
        assert_eq(collection_settings_met, 3u32);

        // Ensure this claim has not already been made
        let existing_claim: field = claims_to_nfts.get_or_use(claim, 0field);
        assert_eq(existing_claim, 0field);

        // Randomly select an NFT to mint
        let randomNum: u128 = ChaCha::rand_u128();
        let old_mintable_sum: u128 = general_settings.get_or_use(0u8, 0u128);
        let randomIndex: u128 = randomNum % old_mintable_sum;
        let tokenEditionHash: field = nfts_to_mint.get(randomIndex);
        claims_to_nfts.set(claim, tokenEditionHash);

        // Decrease the number of mintable nfts
        let new_mintable_num: u128 = old_mintable_sum - 1u128;
        general_settings.set(0u8, new_mintable_num);

        // Replace the minted nft from the mintable nfts with the last mintable nft.
        // This is done to ensure that the minted nft is not minted again.
        // If the minted nft was the last mintable nft, it still won't be minted again because the next random index must stay
        // within the bounds of the mintable nfts, set by the new mintable num.
        nfts_to_mint.set(randomIndex, nfts_to_mint.get(new_mintable_num));
    }

    transition mint(nft_mint: NFT_mint, private hiding_nonce: scalar) -> (NFT_mint, NFT_claim) {
        // CAUTION: For security purposes, the hiding nonce should be unique for each mint.
        let address_hash: field = BHP256::hash_to_field(self.caller);
        let claim: field = BHP256::commit_to_field(address_hash, hiding_nonce);
        // overflow protection for minting
        return (
            NFT_mint {
                owner: nft_mint.owner,
                amount: nft_mint.amount - 1u8
            },
            NFT_claim {
                owner: nft_mint.owner,
                claim
            }) then finalize(claim);
    }

    finalize mint(public claim: field) {
        // Ensure mint block height is less than current block height
        let mint_block: u32 = toggle_settings.get(1u8);
        let passed_height_check: bool = mint_block <= block.height;
        assert_eq(passed_height_check, true);

        // Ensure collection is not frozen, minting is allowed, and is initialized, 
        let toggle_settings_status: u32 = toggle_settings.get(0u8);
        // frozen & minting & initialized flags = 0b0000...1011 = 11u32
        // what the settings should be = 0b0000...0011 = 3u32
        let is_initialized_and_not_frozen_and_minting: u32 = toggle_settings_status & 11u32;
        assert_eq(is_initialized_and_not_frozen_and_minting, 3u32);

        // Ensure this claim has not already been made
        let existing_claim: field = claims_to_nfts.get_or_use(claim, 0field);
        assert_eq(existing_claim, 0field);

        // Randomly select an NFT to mint
        let randomNum: u128 = ChaCha::rand_u128();
        let old_mintable_sum: u128 = general_settings.get_or_use(0u8, 0u128);
        let randomIndex: u128 = randomNum % old_mintable_sum;
        let tokenEditionHash: field = nfts_to_mint.get(randomIndex);
        claims_to_nfts.set(claim, tokenEditionHash);

        // Decrease the number of mintable nfts
        let new_mintable_num: u128 = old_mintable_sum - 1u128;
        general_settings.set(0u8, new_mintable_num);

        // Replace the minted nft from the mintable nfts with the last mintable nft.
        // This is done to ensure that the minted nft is not minted again.
        // If the minted nft was the last mintable nft, it still won't be minted again because the next random index must stay
        // within the bounds of the mintable nfts, set by the new mintable num.
        nfts_to_mint.set(randomIndex, nfts_to_mint.get(new_mintable_num));
    }

    transition claim_nft(nft_claim: NFT_claim, private tokenId: TokenId, private edition: scalar) -> NFT {
        let tokenHash: field = BHP256::hash_to_field(tokenId);
        let tokenEditionHash: field = BHP256::commit_to_field(tokenHash, edition);
        return NFT {
            owner: nft_claim.owner,
            data: tokenId,
            edition
        } then finalize(nft_claim.claim, tokenEditionHash);
    }

    finalize claim_nft(public claim: field, tokenEditionHash: field) {
        // ensure that the claimed nft matches the claim
        let claimedNFT: field = claims_to_nfts.get(claim);
        assert_eq(claimedNFT, tokenEditionHash);
        claims_to_nfts.set(claim, 0field);
    }

    // Proof that you own an nft without revealing the nft.
    // this burn never actually destroys the nft as the finalize
    // block is guaranteed to fail.
    transition authorize(
        nft: NFT,
        public nonce: u64
    )
    {
        return then finalize();
    }

    finalize authorize(
    )
    {
        // fails on purpose, so that the nft is not burned.
        assert_eq(0u8, 1u8);
    }

    transition transfer_private(
        nft: NFT,
        private receiver: address
    ) -> NFT
    {
        return NFT {
            owner: receiver,
            data: nft.data,
            edition: nft.edition
        };
    }

    transition transfer_public(
        private receiver: address,
        private data: TokenId,
        private edition: scalar
    )
    {
        let tokenHash: field = BHP256::hash_to_field(data);
        let tokenEditionHash: field = BHP256::commit_to_field(tokenHash, edition);
        let caller: address = self.caller;
        return then finalize(receiver, tokenEditionHash, caller);
    }

    finalize transfer_public(
        public receiver: address,
        public tokenEditionHash: field,
        public caller: address
    )
    {
        assert_eq(caller, nft_owners.get(tokenEditionHash));
        nft_owners.set(tokenEditionHash, receiver);
    }

    transition convert_private_to_public(
        nft: NFT
    )
    {
        let tokenHash: field = BHP256::hash_to_field(nft.data);
        let tokenEditionHash: field = BHP256::commit_to_field(tokenHash, nft.edition);
        return then finalize(nft.owner, tokenEditionHash);
    }

    finalize convert_private_to_public(
        public owner: address,
        public tokenEditionHash: field
    )
    {
        nft_owners.set(tokenEditionHash, owner);
    }

    transition convert_public_to_private(
        private owner: address,
        private data: TokenId,
        private edition: scalar
    ) -> NFT
    {
        assert_eq(owner, self.caller);
        let tokenHash: field = BHP256::hash_to_field(data);
        let tokenEditionHash: field = BHP256::commit_to_field(tokenHash, edition);
        return NFT {
            owner,
            data,
            edition
        } then finalize(owner, tokenEditionHash);
    }

    finalize convert_public_to_private(
        public owner: address,
        public tokenEditionHash: field
    )
    {
        assert_eq(owner, nft_owners.get(tokenEditionHash));
        // mapping::remove is not implemented yet, so instead we set the owner to be a dummy address that cannot publicly transfer or convert to private
        nft_owners.set(tokenEditionHash, aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc);
    }
}
