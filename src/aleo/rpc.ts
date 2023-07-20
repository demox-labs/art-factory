import { JSONRPCClient } from 'json-rpc-2.0';
import { NFTProgramId } from './nft-program';
import { bigIntToString, joinBigIntsToString, parseStringToBigIntArray } from '@/lib/util';
import assert from 'assert';

export const TESTNET3_API_URL = process.env.RPC_URL!;
const ALEO_URL = 'https://vm.aleo.org/api/testnet3/program/';

export async function getHeight(apiUrl: string): Promise<number> {
  const client = getClient(apiUrl);
  const height = await client.request('getHeight', {});
  return height;
}

export async function getProgram(programId: string, apiUrl: string): Promise<string> {
  const client = getClient(apiUrl);
  const program = await client.request('program', {
    id: programId
  });
  return program;
}

export async function getClaimValue(claim: string): Promise<string> {
  const response = await fetch(`${ALEO_URL}${NFTProgramId}/mapping/claims_to_nfts/${claim}`);
  return response.text();
}

export async function getTransactionsForProgram(programId: string, functionName: string, apiUrl: string): Promise<any> {
  const client = getClient(apiUrl);
  const transaction = await client.request('transactionsForProgram', {
      programId,
      functionName,
      "page": 0,
      "maxTransactions": 1000
  });
  return transaction;
}

export async function getAleoTransactionsForProgram(programId: string, functionName: string, apiUrl: string, page = 0, maxTransactions = 1000): Promise<any> {
  const client = getClient(apiUrl);
  const result = await client.request('aleoTransactionsForProgram', {
      programId,
      functionName,
      page,
      maxTransactions
  });
  
  return result;
}


export async function getTransaction(apiUrl: string, transactionId: string): Promise<any> {
  const transactionUrl = `${apiUrl}/aleo/transaction`;
  const response = await fetch(`${transactionUrl}/${transactionId}`);
  if (!response.ok) {
    throw new Error('Transaction not found');
  }
  const transaction = await response.json();
  return transaction;
}

// Handle the case where a whitelist operation is done twice for the same address
export async function getWhitelist(apiUrl: string): Promise<any> {
  const addMinterTransactionMetadata = await getAleoTransactionsForProgram(NFTProgramId, 'add_minter', apiUrl);
  const whitelist = addMinterTransactionMetadata.map((txM: any) => {
    return {
      address: txM.transaction.execution.transitions[0].inputs[0].value,
      amount: parseInt(txM.transaction.execution.transitions[0].inputs[1].value.slice(0, -2))
    }
  }).reverse();

  // Filter out duplicates
  const uniqueMap = new Map<string, any>();
  for (const item of whitelist) {
    if (!uniqueMap.has(item.address)) {
      uniqueMap.set(item.address, item);
    }
  }
  const uniqueWhitelist = Array.from(uniqueMap.values());

  return uniqueWhitelist;
}

export async function getMintedNFTs(apiUrl: string): Promise<any> {
  const mintTransactionsMetadata = await getAleoTransactionsForProgram(NFTProgramId, 'mint', apiUrl);
  const mintedNFTs = mintTransactionsMetadata.map((txM: any) => {
    const urlBigInts = parseStringToBigIntArray(txM.transaction.execution.transitions[0].inputs[0].value);
    const relativeUrl = joinBigIntsToString(urlBigInts);
    return {
      url: relativeUrl,
      edition: parseInt(txM.transaction.execution.transitions[0].inputs[1].value.slice(0, -6)),
      inputs: txM.transaction.execution.transitions[0].inputs
    }
  });
  return mintedNFTs;
}

export async function getInitializedCollection(apiUrl: string): Promise<any> {
  const initializedTransactionMetadata = await getAleoTransactionsForProgram(NFTProgramId, 'initialize_collection', apiUrl);
  assert(initializedTransactionMetadata.length === 1, 'There should only be one initialize_collection transaction');
  const transactionMetadata = initializedTransactionMetadata[0];

  const total = parseInt(transactionMetadata.transaction.execution.transitions[0].inputs[1].value.slice(0, -2));
  const symbol = bigIntToString(BigInt(transactionMetadata.transaction.execution.transitions[0].inputs[1].value.slice(0, -4)));
  const urlBigInts = parseStringToBigIntArray(transactionMetadata.transaction.execution.transitions[0].inputs[2].value);
  const baseUri = joinBigIntsToString(urlBigInts);
  return {
    total,
    symbol,
    baseUri
  }
}

export async function getBaseURI(apiUrl: string): Promise<any> {
  const { baseUri } = await getInitializedCollection(apiUrl);
  if (!baseUri) {
    return;
  }
  
  const updateTxsMetadata = await getAleoTransactionsForProgram(NFTProgramId, 'update_base_uri', apiUrl);
  const transactionIds = updateTxsMetadata.map((txM: any) => txM.transction.id);
  if (transactionIds.length === 0) {
    return baseUri;
  }

  const transaction = await getTransaction(apiUrl, transactionIds[transactionIds.length - 1]);
  const urlBigInts = parseStringToBigIntArray(transaction.execution.transitions[0].inputs[0].value);
  return joinBigIntsToString(urlBigInts);
}

export async function getSettingsStatus(apiUrl: string): Promise<number> {
  const transactions = await getTransactionsForProgram(NFTProgramId, 'update_toggle_settings', apiUrl);
  const transactionIds = transactions.map((transactionId: any) => transactionId.transaction_id);
  if (transactionIds.length === 0) {
    return 5;
  }

  const transaction = await getTransaction(apiUrl, transactionIds[transactionIds.length - 1]);
  const status: string = transaction.execution.transitions[0].inputs[0].value;
  return parseInt(status.slice(0, status.indexOf('u32')));
};

export async function getMintBlock(apiUrl: string): Promise<{ block: number }> {
  const transactionMetadata = await getAleoTransactionsForProgram(NFTProgramId, 'set_mint_block', apiUrl);
  if (transactionMetadata.length === 0) {
    return { block: 0 };
  }

  const transaction = transactionMetadata[transactionMetadata.length - 1].transaction;
  const block = parseInt(transaction.execution.transitions[0].inputs[0].value.slice(0, -4));
  return { block };
}

export async function getClaims(apiUrl: string): Promise<any[]> {
  const claimTxMetadata = await getAleoTransactionsForProgram(NFTProgramId, 'open_mint', apiUrl);
  return claimTxMetadata.map((txM: any) => {txM.transaction});
}

export async function getNFTs(apiUrl: string, fetchProperties: boolean = true): Promise<{ nfts: any[], baseURI: string}> {
  const baseUri = await getBaseURI(apiUrl);
  const addNFTTransactionMetadata = await getAleoTransactionsForProgram(NFTProgramId, 'add_nft', apiUrl);

  let nfts: any[] = addNFTTransactionMetadata.map((txM: any) => {
    const tx = txM.transaction;
    const urlBigInts = parseStringToBigIntArray(tx.execution.transitions[0].inputs[0].value);
    const tokenEditionHash = tx.execution.transitions[0].finalize[0];
    const relativeUrl = joinBigIntsToString(urlBigInts);
    return {
      url: baseUri + relativeUrl,
      edition: parseInt(tx.execution.transitions[0].inputs[1].value.slice(0, -6)),
      inputs: tx.execution.transitions[0].inputs,
      tokenEditionHash
    }
  });

  nfts = await Promise.all(nfts.map(async (nft: any) => {
    if (!fetchProperties) {
      return nft;
    }
    const properties = await getJSON(`https://${nft.url}`);
    return {
      ...nft,
      properties
    }
  }));
  return {
    baseURI: baseUri,
    nfts
  };
}

export const getClient = (apiUrl: string) => {
  const client = new JSONRPCClient((jsonRPCRequest: any) =>
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ ...jsonRPCRequest })
    }).then((response: any) => {
      if (response.status === 200) {
        // Use client.receive when you received a JSON-RPC response.
        return response.json().then((jsonRPCResponse: any) => client.receive(jsonRPCResponse));
      } else if (jsonRPCRequest.id !== undefined) {
        return Promise.reject(new Error(response.statusText));
      }
    })
  );
  return client;
};

export async function getJSON(url: string): Promise<any> {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}