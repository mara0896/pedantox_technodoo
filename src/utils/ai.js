import { pipeline, env} from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0";
env.allowLocalModels = false;

let pipe = null;

export async function getPipe() {
  if (!pipe) {
    pipe = await pipeline(
      "feature-extraction",
      "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
    );
  }
  return pipe;
}

export async function embed(curr_word, target_word) {
  const pipe = await getPipe();
  const emb1 = await pipe(curr_word);
  const emb2 = await pipe(target_word);

  return cosineSimilarity(emb1.data, emb2.data);
}

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (var i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
} 
