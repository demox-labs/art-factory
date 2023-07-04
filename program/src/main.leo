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

    // a way to prove ownership of an nft privately
    record NFT_ownership {
        private owner: address,
        private nft_owner: address,
        private data: TokenId,
        private edition: scalar, // which edition of the nft this particular one is -- will be 0 for unique NFTs
    }

    mapping nft_totals: field => u8;
    mapping nft_owners: field => address;
    mapping settings: u8 => u128;
    mapping whitelist: address => u8;

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
        let is_initialized: u128 = settings.get_or_use(0u8, 0u128);
        assert_eq(is_initialized, 0u128); 

        settings.set(0u8, 1u128); // Collection has been initialized
        settings.set(1u8, total); // Number of total NFTs (first-editions) that can be minted
        settings.set(2u8, 0u128); // Is the mint live
        settings.set(3u8, symbol); // Symbol for the NFT
        settings.set(4u8, base_uri.data0); // Base URI for NFT
        settings.set(5u8, base_uri.data1);
        settings.set(6u8, base_uri.data2);
        settings.set(7u8, base_uri.data3);
        settings.set(8u8, 0u128); // Block height for mint to go live (given mint is live setting)
        settings.set(9u8, 0u128); // If collection is frozen
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
        let frozen: u128 = settings.get(9u8);
        assert_eq(frozen, 0u128);

        let existing_editions: u8 = nft_totals.get_or_use(tokenEditionHash, 255u8);
        assert_eq(existing_editions, 255u8);
        nft_totals.set(tokenEditionHash, 1u8);

        // Reduce the amount of total nfts that can be minted
        let remaining: u128 = settings.get(1u8);
        settings.set(1u8, remaining - 1u128);
    }

    transition add_minter(public minter: address, public amount: u8) {
        assert_eq(self.caller, aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy);
        return then finalize(minter, amount);
    }

    finalize add_minter(
        public minter: address,
        public amount: u8
        )
    {
        let frozen: u128 = settings.get(9u8);
        assert_eq(frozen, 0u128);

        whitelist.set(minter, amount);
    }

    transition set_mint_status(public status: u128) {
        assert_eq(self.caller, aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy);
        return then finalize(status);
    }

    finalize set_mint_status(public status: u128) {
        let frozen: u128 = settings.get(9u8);
        assert_eq(frozen, 0u128);

        settings.set(2u8, status);
    }

    transition set_mint_block(public mint_block: u128) {
        assert_eq(self.caller, aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy);
        return then finalize(mint_block);
    }

    finalize set_mint_block(public mint_block: u128) {
        let frozen: u128 = settings.get(9u8);
        assert_eq(frozen, 0u128);

        settings.set(8u8, mint_block);
    }

    transition update_symbol(public symbol: u128) {
        assert_eq(self.caller, aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy);
        return then finalize(symbol);
    }

    finalize update_symbol(public symbol: u128) {
        let frozen: u128 = settings.get(9u8);
        assert_eq(frozen, 0u128);

        settings.set(3u8, symbol);
    }

    transition update_base_uri(public base_uri: BaseURI) {
        assert_eq(self.caller, aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy);
        return then finalize(base_uri);
    }

    finalize update_base_uri(public base_uri: BaseURI) {
        let frozen: u128 = settings.get(9u8);
        assert_eq(frozen, 0u128);

        settings.set(4u8, base_uri.data0); // Base URI for NFT
        settings.set(5u8, base_uri.data1);
        settings.set(6u8, base_uri.data2);
        settings.set(7u8, base_uri.data3);
    }

    transition freeze() {
        assert_eq(self.caller, aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy);
        return then finalize();
    }

    finalize freeze() {
        let frozen: u128 = settings.get(9u8);
        assert_eq(frozen, 0u128);

        settings.set(9u8, 1u128);
    }

    transition mint(public tokenId: TokenId, public edition: scalar) -> NFT {
        let tokenHash: field = BHP256::hash_to_field(tokenId);
        let tokenEditionHash: field = BHP256::commit_to_field(tokenHash, edition);
        return NFT {
            owner: self.caller,
            data: tokenId,
            edition
        } then finalize(self.caller, tokenEditionHash);
    }

    finalize mint(public owner: address, public tokenEditionHash: field) {
        // Ensure mint is live
        let is_live: u128 = settings.get(2u8);
        assert_eq(is_live, 1u128);

        // Ensure owner can mint and decrease remaining mints (overflow protection)
        let remaining: u8 = whitelist.get(owner);
        whitelist.set(owner, remaining - 1u8);

        // Ensure more editions can be made and decrease remaining editions (overflow protection)
        let amount: u8 = nft_totals.get(tokenEditionHash);
        nft_totals.set(tokenEditionHash, amount - 1u8);
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

    transition prove_ownership(private nft: NFT, private prove_to: address) -> (NFT, NFT_ownership) {
        return (
            NFT {
                owner: nft.owner,
                data: nft.data,
                edition: nft.edition
            },
            NFT_ownership {
                owner: prove_to,
                nft_owner: nft.owner,
                data: nft.data,
                edition: nft.edition
            }
        );
    }
}
