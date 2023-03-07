import type { NextApiRequest, NextApiResponse } from 'next';
import { VectorDBQAChain } from 'langchain/chains';
import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeStore } from 'langchain/vectorstores';
import { openai } from '@/utils/openai-client';
import { pinecone } from '@/utils/pinecone-client';
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ message: 'No question in the request' });
  }

  try {
    // OpenAI recommends replacing newlines with spaces for best results
    const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

    const index = pinecone.Index(PINECONE_INDEX_NAME);
    /* create vectorstore*/
    const vectorStore = await PineconeStore.fromExistingIndex(
      index,
      new OpenAIEmbeddings({}),
      'text',
      PINECONE_NAME_SPACE, //optional
    );

    const model = openai;
    // create the chain
    const chain = VectorDBQAChain.fromLLM(model, vectorStore);

    //Ask a question
    const response = await chain.call({
      query: sanitizedQuestion,
    });

    console.log('response', response);

    res.status(200).json(response);
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: error?.message || 'Unknown error.' });
  }
}
