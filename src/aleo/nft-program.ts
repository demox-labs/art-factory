export const NFTProgramId = 'leo_nft_test_1.aleo';

export const NFTProgram = `program leo_nft_test_1.aleo;

struct TokenId:
    data1 as u128;
    data2 as u128;

struct BaseURI:
    data0 as u128;
    data1 as u128;
    data2 as u128;
    data3 as u128;

struct SymbolBits:
    data as u128;

record NFT:
    owner as address.private;
    data as TokenId.private;
    edition as scalar.private;

record NFT_ownership:
    owner as address.private;
    nft_owner as address.private;
    data as TokenId.private;
    edition as scalar.private;


mapping nft_totals:
	key left as field.public;
	value right as u8.public;


mapping nft_owners:
	key left as field.public;
	value right as address.public;


mapping settings:
	key left as u8.public;
	value right as u128.public;


mapping whitelist:
	key left as address.public;
	value right as u8.public;

function initialize_collection:
    input r0 as u128.public;
    input r1 as u128.public;
    input r2 as BaseURI.public;
    assert.eq self.caller aleo1uran94ddjnvdr0neh8d0mzxuvv77pyprnp7jmzpkuh7950t46qyqnsadey;

    finalize r0 r1 r2;

finalize initialize_collection:
    input r0 as u128.public;
    input r1 as u128.public;
    input r2 as BaseURI.public;
    get.or_init settings[0u8] 0u128 into r3;
    assert.eq r3 0u128;
    set 1u128 into settings[0u8];
    set r0 into settings[1u8];
    set 0u128 into settings[2u8];
    set r1 into settings[3u8];
    set r2.data0 into settings[4u8];
    set r2.data1 into settings[5u8];
    set r2.data2 into settings[6u8];
    set r2.data3 into settings[7u8];
    set 0u128 into settings[8u8];


function add_nft:
    input r0 as TokenId.public;
    input r1 as scalar.public;
    input r2 as u8.public;
    assert.eq self.caller aleo1uran94ddjnvdr0neh8d0mzxuvv77pyprnp7jmzpkuh7950t46qyqnsadey;
    hash.bhp256 r0 into r3;    commit.bhp256 r3 r1 into r4;
    finalize r4 r2;

finalize add_nft:
    input r0 as field.public;
    input r1 as u8.public;
    get settings[8u8] into r2;
    assert.eq r2 0u128;
    get.or_init nft_totals[r0] 255u8 into r3;
    assert.eq r3 255u8;
    set r1 into nft_totals[r0];
    get settings[1u8] into r4;
    sub r4 1u128 into r5;
    set r5 into settings[1u8];


function add_minter:
    input r0 as address.public;
    input r1 as u8.public;
    assert.eq self.caller aleo1uran94ddjnvdr0neh8d0mzxuvv77pyprnp7jmzpkuh7950t46qyqnsadey;

    finalize r0 r1;

finalize add_minter:
    input r0 as address.public;
    input r1 as u8.public;
    get settings[8u8] into r2;
    assert.eq r2 0u128;
    set r1 into whitelist[r0];


function set_mint_status:
    input r0 as u128.public;
    assert.eq self.caller aleo1uran94ddjnvdr0neh8d0mzxuvv77pyprnp7jmzpkuh7950t46qyqnsadey;

    finalize r0;

finalize set_mint_status:
    input r0 as u128.public;
    get settings[8u8] into r1;
    assert.eq r1 0u128;
    set r0 into settings[2u8];


function update_symbol:
    input r0 as u128.public;
    assert.eq self.caller aleo1uran94ddjnvdr0neh8d0mzxuvv77pyprnp7jmzpkuh7950t46qyqnsadey;

    finalize r0;

finalize update_symbol:
    input r0 as u128.public;
    get settings[8u8] into r1;
    assert.eq r1 0u128;
    set r0 into settings[3u8];


function update_base_uri:
    input r0 as BaseURI.public;
    assert.eq self.caller aleo1uran94ddjnvdr0neh8d0mzxuvv77pyprnp7jmzpkuh7950t46qyqnsadey;

    finalize r0;

finalize update_base_uri:
    input r0 as BaseURI.public;
    get settings[8u8] into r1;
    assert.eq r1 0u128;
    set r0.data0 into settings[4u8];
    set r0.data1 into settings[5u8];
    set r0.data2 into settings[6u8];
    set r0.data3 into settings[7u8];


function freeze:
    assert.eq self.caller aleo1uran94ddjnvdr0neh8d0mzxuvv77pyprnp7jmzpkuh7950t46qyqnsadey;

    finalize;

finalize freeze:
    get settings[8u8] into r0;
    assert.eq r0 0u128;
    set 1u128 into settings[8u8];


function mint:
    input r0 as TokenId.public;
    input r1 as scalar.public;
    hash.bhp256 r0 into r2;    commit.bhp256 r2 r1 into r3;    cast self.caller r0 r1 into r4 as NFT.record;
    output r4 as NFT.record;

    finalize self.caller r3;

finalize mint:
    input r0 as address.public;
    input r1 as field.public;
    get settings[2u8] into r2;
    assert.eq r2 1u128;
    get whitelist[r0] into r3;
    sub r3 1u8 into r4;
    set r4 into whitelist[r0];
    get nft_totals[r1] into r5;
    sub r5 1u8 into r6;
    set r6 into nft_totals[r1];


function transfer_private:
    input r0 as NFT.record;
    input r1 as address.private;
    cast r1 r0.data r0.edition into r2 as NFT.record;
    output r2 as NFT.record;


function transfer_public:
    input r0 as address.private;
    input r1 as TokenId.private;
    input r2 as scalar.private;
    hash.bhp256 r1 into r3;    commit.bhp256 r3 r2 into r4;
    finalize r0 r4;

finalize transfer_public:
    input r0 as address.public;
    input r1 as field.public;
    get nft_owners[r1] into r2;
    assert.eq self.caller r2;
    set r0 into nft_owners[r1];


function convert_private_to_public:
    input r0 as NFT.record;
    hash.bhp256 r0.data into r1;    commit.bhp256 r1 r0.edition into r2;
    finalize r0.owner r2;

finalize convert_private_to_public:
    input r0 as address.public;
    input r1 as field.public;
    set r0 into nft_owners[r1];


function convert_public_to_private:
    input r0 as address.private;
    input r1 as TokenId.private;
    input r2 as scalar.private;
    hash.bhp256 r1 into r3;    commit.bhp256 r3 r2 into r4;    cast r0 r1 r2 into r5 as NFT.record;
    output r5 as NFT.record;

    finalize r0 r4;

finalize convert_public_to_private:
    input r0 as address.public;
    input r1 as field.public;
    get nft_owners[r1] into r2;
    assert.eq self.caller r2;
    set aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into nft_owners[r1];


function prove_ownership:
    input r0 as NFT.record;
    input r1 as address.private;
    cast r0.owner r0.data r0.edition into r2 as NFT.record;
    cast r1 r0.owner r0.data r0.edition into r3 as NFT_ownership.record;
    output r2 as NFT.record;
    output r3 as NFT_ownership.record;
`;
