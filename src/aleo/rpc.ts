import { JSONRPCClient } from 'json-rpc-2.0';
import { NFTProgramId } from './nft-program';
import { bigIntToString, joinBigIntsToString, parseStringToBigIntArray } from '@/lib/util';
import assert from 'assert';

export const TESTNET3_API_URL = process.env.RPC_URL!;

export async function getProgram(programId: string, apiUrl: string): Promise<string> {
  const client = getClient(apiUrl);
  const program = await client.request('program', {
    id: programId
  });
  return program;
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
  const transaction = await client.request('aleoTransactionsForProgram', {
      programId,
      functionName,
      page,
      maxTransactions
  });
  return transaction;
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
  const addMinterTransactions = await getAleoTransactionsForProgram(NFTProgramId, 'add_minter', apiUrl);
  const whitelist = addMinterTransactions.map((tx: any) => {
    return {
      address: tx.execution.transitions[0].inputs[0].value,
      amount: parseInt(tx.execution.transitions[0].inputs[1].value.slice(0, -2))
    }
  });
  return whitelist;
}

export async function getInitializedCollection(apiUrl: string): Promise<any> {
  const initializedTransactions = await getAleoTransactionsForProgram(NFTProgramId, 'initialize_collection', apiUrl);
  assert(initializedTransactions.length === 1, 'There should only be one initialize_collection transaction');
  const transaction = initializedTransactions[0];

  const total = parseInt(transaction.execution.transitions[0].inputs[1].value.slice(0, -2));
  const symbol = bigIntToString(BigInt(transaction.execution.transitions[0].inputs[1].value.slice(0, -4)));
  const urlBigInts = parseStringToBigIntArray(transaction.execution.transitions[0].inputs[2].value);
  const baseUri = joinBigIntsToString(urlBigInts);
  return {
    total,
    symbol,
    baseUri
  }
}

export async function getMintStatus(apiUrl: string): Promise<{ active: boolean }> {
  const transactions = await getTransactionsForProgram(NFTProgramId, 'set_mint_status', apiUrl);
  const transactionIds = transactions.map((transactionId: any) => transactionId.transaction_id);
  if (transactionIds.length === 0) {
    return { active: false };
  }

  const transaction = await getTransaction(apiUrl, transactionIds[transactionIds.length - 1]);
  const status = transaction.execution.transitions[0].inputs[0].value;

  if (status !== '0u128') {
    return { active: true };
  }

  return { active: false };
}

export async function getNFTs(apiUrl: string): Promise<any> {
  const initializedCollection = await getInitializedCollection(apiUrl);
  const addNFTTransactions = await getAleoTransactionsForProgram(NFTProgramId, 'add_nft', apiUrl);

  let nfts: any[] = addNFTTransactions.map((tx: any) => {
    const urlBigInts = parseStringToBigIntArray(tx.execution.transitions[0].inputs[0].value);
    const relativeUrl = joinBigIntsToString(urlBigInts);
    return {
      url: initializedCollection.baseUri + relativeUrl,
      edition: parseInt(tx.execution.transitions[0].inputs[1].value.slice(0, -6)),
      inputs: tx.execution.transitions[0].inputs
    }
  });

  nfts = await Promise.all(nfts.map(async (nft: any) => {
    const properties = await getJSON(`https://${nft.url}`);
    return {
      ...nft,
      properties
    }
  }));
  return {
    collection: initializedCollection,
    nfts
  };
}

export async function getUnmintedNFTs(apiUrl: string): Promise<any> {
  const allNFTs = await getNFTs(apiUrl);
  const mintTransactions = await getAleoTransactionsForProgram(NFTProgramId, 'mint', apiUrl);
  const mintedNFTs = new Set(mintTransactions.map((tx: any) => {
    const urlBigInts = parseStringToBigIntArray(tx.execution.transitions[0].inputs[0].value);
    const relativeUrl = joinBigIntsToString(urlBigInts);
    return allNFTs.collection.baseUri + relativeUrl;
  }));

  const unmintedNFTs = allNFTs.nfts.filter((nft: any) => !mintedNFTs.has(nft.url));
  return {
    collection: allNFTs.collection,
    nfts: unmintedNFTs
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

async function getJSON(url: string): Promise<any> {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}