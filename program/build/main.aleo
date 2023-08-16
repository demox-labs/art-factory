program leo_nft.aleo;

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

record NFT_mint:
    owner as address.private;
    amount as u8.private;

record NFT_claim:
    owner as address.private;
    claim as field.private;

record NFT_ownership:
    owner as address.private;
    nft_owner as address.private;
    data as TokenId.private;
    edition as scalar.private;


mapping nft_owners:
	key left as field.public;
	value right as address.public;


mapping general_settings:
	key left as u8.public;
	value right as u128.public;


mapping nfts_to_mint:
	key left as u128.public;
	value right as field.public;


mapping claims_to_nfts:
	key left as field.public;
	value right as field.public;


mapping toggle_settings:
	key left as u8.public;
	value right as u32.public;

function initialize_collection:
    input r0 as u128.public;
    input r1 as u128.public;
    input r2 as BaseURI.public;
    assert.eq self.caller aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy;

    finalize r0 r1 r2;

finalize initialize_collection:
    input r0 as u128.public;
    input r1 as u128.public;
    input r2 as BaseURI.public;
    get.or_use toggle_settings[0u8] 0u32 into r3;
    and r3 1u32 into r4;
    assert.eq r4 0u32;
    set 0u128 into general_settings[0u8];
    set r0 into general_settings[1u8];
    set r1 into general_settings[2u8];
    set r2.data0 into general_settings[3u8];
    set r2.data1 into general_settings[4u8];
    set r2.data2 into general_settings[5u8];
    set r2.data3 into general_settings[6u8];
    set 5u32 into toggle_settings[0u8];
    set 0u32 into toggle_settings[1u8];


function add_nft:
    input r0 as TokenId.public;
    input r1 as scalar.public;
    assert.eq self.caller aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy;
    hash.bhp256 r0 into r2 as field;    commit.bhp256 r2 r1 into r3 as field;
    finalize r3;

finalize add_nft:
    input r0 as field.public;
    get toggle_settings[0u8] into r1;
    and r1 9u32 into r2;
    assert.eq r2 1u32;
    get general_settings[1u8] into r3;
    sub r3 1u128 into r4;
    set r4 into general_settings[1u8];
    get general_settings[0u8] into r5;
    set r0 into nfts_to_mint[r5];
    add r5 1u128 into r6;
    set r6 into general_settings[0u8];


function add_minter:
    input r0 as address.private;
    input r1 as u8.public;
    assert.eq self.caller aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy;
    cast r0 r1 into r2 as NFT_mint.record;
    output r2 as NFT_mint.record;

    finalize;

finalize add_minter:
    get toggle_settings[0u8] into r0;
    and r0 9u32 into r1;
    assert.eq r1 1u32;


function update_toggle_settings:
    input r0 as u32.public;
    assert.eq self.caller aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy;

    finalize r0;

finalize update_toggle_settings:
    input r0 as u32.public;
    get toggle_settings[0u8] into r1;
    and r1 9u32 into r2;
    assert.eq r2 1u32;
    and r0 1u32 into r3;
    assert.eq r3 1u32;
    set r0 into toggle_settings[0u8];


function set_mint_block:
    input r0 as u32.public;
    assert.eq self.caller aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy;

    finalize r0;

finalize set_mint_block:
    input r0 as u32.public;
    get toggle_settings[0u8] into r1;
    and r1 9u32 into r2;
    assert.eq r2 1u32;
    set r0 into toggle_settings[1u8];


function update_symbol:
    input r0 as u128.public;
    assert.eq self.caller aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy;

    finalize r0;

finalize update_symbol:
    input r0 as u128.public;
    get toggle_settings[0u8] into r1;
    and r1 9u32 into r2;
    assert.eq r2 1u32;
    set r0 into general_settings[2u8];


function update_base_uri:
    input r0 as BaseURI.public;
    assert.eq self.caller aleo1gy3d0s00s2k7rmgqznnx2q8htmjm2p5rk8q40u5yklqhe44utvys0dmzdy;

    finalize r0;

finalize update_base_uri:
    input r0 as BaseURI.public;
    get toggle_settings[0u8] into r1;
    and r1 9u32 into r2;
    assert.eq r2 1u32;
    set r0.data0 into general_settings[3u8];
    set r0.data1 into general_settings[4u8];
    set r0.data2 into general_settings[5u8];
    set r0.data3 into general_settings[6u8];


function open_mint:
    input r0 as scalar.private;
    hash.bhp256 self.caller into r1 as field;    commit.bhp256 r1 r0 into r2 as field;    cast self.caller r2 into r3 as NFT_claim.record;
    output r3 as NFT_claim.record;

    finalize r2;

finalize open_mint:
    input r0 as field.public;
    get toggle_settings[1u8] into r1;
    lte r1 block.height into r2;
    assert.eq r2 true;
    get toggle_settings[0u8] into r3;
    and r3 15u32 into r4;
    assert.eq r4 3u32;
    get.or_use claims_to_nfts[r0] 0field into r5;
    assert.eq r5 0field;
    rand.chacha into r6 as u128;
    get.or_use general_settings[0u8] 0u128 into r7;
    rem r6 r7 into r8;
    get nfts_to_mint[r8] into r9;
    set r9 into claims_to_nfts[r0];
    sub r7 1u128 into r10;
    set r10 into general_settings[0u8];
    get nfts_to_mint[r10] into r11;
    set r11 into nfts_to_mint[r8];


function mint:
    input r0 as NFT_mint.record;
    input r1 as scalar.private;
    hash.bhp256 self.caller into r2 as field;    commit.bhp256 r2 r1 into r3 as field;    sub r0.amount 1u8 into r4;
    cast r0.owner r4 into r5 as NFT_mint.record;
    cast r0.owner r3 into r6 as NFT_claim.record;
    output r5 as NFT_mint.record;
    output r6 as NFT_claim.record;

    finalize r3;

finalize mint:
    input r0 as field.public;
    get toggle_settings[1u8] into r1;
    lte r1 block.height into r2;
    assert.eq r2 true;
    get toggle_settings[0u8] into r3;
    and r3 11u32 into r4;
    assert.eq r4 3u32;
    get.or_use claims_to_nfts[r0] 0field into r5;
    assert.eq r5 0field;
    rand.chacha into r6 as u128;
    get.or_use general_settings[0u8] 0u128 into r7;
    rem r6 r7 into r8;
    get nfts_to_mint[r8] into r9;
    set r9 into claims_to_nfts[r0];
    sub r7 1u128 into r10;
    set r10 into general_settings[0u8];
    get nfts_to_mint[r10] into r11;
    set r11 into nfts_to_mint[r8];


function claim_nft:
    input r0 as NFT_claim.record;
    input r1 as TokenId.private;
    input r2 as scalar.private;
    hash.bhp256 r1 into r3 as field;    commit.bhp256 r3 r2 into r4 as field;    cast r0.owner r1 r2 into r5 as NFT.record;
    output r5 as NFT.record;

    finalize r0.claim r4;

finalize claim_nft:
    input r0 as field.public;
    input r1 as field.public;
    get claims_to_nfts[r0] into r2;
    assert.eq r2 r1;
    set 0field into claims_to_nfts[r0];


function authorize:
    input r0 as NFT.record;
    input r1 as u64.public;

    finalize;

finalize authorize:
    assert.eq 0u8 1u8;


function transfer_private:
    input r0 as NFT.record;
    input r1 as address.private;
    cast r1 r0.data r0.edition into r2 as NFT.record;
    output r2 as NFT.record;


function transfer_public:
    input r0 as address.private;
    input r1 as TokenId.private;
    input r2 as scalar.private;
    hash.bhp256 r1 into r3 as field;    commit.bhp256 r3 r2 into r4 as field;
    finalize r0 r4 self.caller;

finalize transfer_public:
    input r0 as address.public;
    input r1 as field.public;
    input r2 as address.public;
    get nft_owners[r1] into r3;
    assert.eq r2 r3;
    set r0 into nft_owners[r1];


function convert_private_to_public:
    input r0 as NFT.record;
    hash.bhp256 r0.data into r1 as field;    commit.bhp256 r1 r0.edition into r2 as field;
    finalize r0.owner r2;

finalize convert_private_to_public:
    input r0 as address.public;
    input r1 as field.public;
    set r0 into nft_owners[r1];


function convert_public_to_private:
    input r0 as address.private;
    input r1 as TokenId.private;
    input r2 as scalar.private;
    assert.eq r0 self.caller;
    hash.bhp256 r1 into r3 as field;    commit.bhp256 r3 r2 into r4 as field;    cast r0 r1 r2 into r5 as NFT.record;
    output r5 as NFT.record;

    finalize r0 r4;

finalize convert_public_to_private:
    input r0 as address.public;
    input r1 as field.public;
    get nft_owners[r1] into r2;
    assert.eq r0 r2;
    set aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into nft_owners[r1];
