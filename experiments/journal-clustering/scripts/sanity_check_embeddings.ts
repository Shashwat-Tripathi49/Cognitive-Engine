import { pipeline } from '@xenova/transformers';

async function verifySemanticEmbeddings() {
  console.log('=======================================================');
  console.log('🔍 TASK 1 & 2: EMBEDDING MODEL SANITY CHECK');
  console.log('Model: Xenova/all-MiniLM-L6-v2 (384 dimensions)');
  console.log('=======================================================\n');

  console.log('--> Loading all-MiniLM-L6-v2 model checkpoint...');
  const extractor = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  );
  console.log('✅ Model loaded successfully.');

  const groupA = [
    'Worked on the Expense Tracker.',
    'Continued improving the budgeting module.',
    'Spent time debugging the finance app.',
  ];

  const groupB = [
    'Went running before breakfast.',
    'Cooked dinner for family.',
    'Visited my parents for lunch.',
  ];

  async function getEmbedding(text: string): Promise<number[]> {
    const output = await extractor(text, {
      pooling: 'mean',
      normalize: true,
    });
    return Array.from(output.data);
  }

  function cosineSimilarity(v1: number[], v2: number[]): number {
    let dot = 0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
    }
    return dot;
  }

  console.log('\nGenerating embeddings for Group A (Finance/Budgeting paraphrases) and Group B (Unrelated)...');

  const embedsA = await Promise.all(groupA.map(getEmbedding));
  const embedsB = await Promise.all(groupB.map(getEmbedding));

  console.log('\n--- Group A Intra-Similarity (Paraphrases) ---');
  const simA1_A2 = cosineSimilarity(embedsA[0], embedsA[1]);
  const simA1_A3 = cosineSimilarity(embedsA[0], embedsA[2]);
  const simA2_A3 = cosineSimilarity(embedsA[1], embedsA[2]);

  console.log(`"${groupA[0]}" <-> "${groupA[1]}": Cosine Sim = ${simA1_A2.toFixed(4)}`);
  console.log(`"${groupA[0]}" <-> "${groupA[2]}": Cosine Sim = ${simA1_A3.toFixed(4)}`);
  console.log(`"${groupA[1]}" <-> "${groupA[2]}": Cosine Sim = ${simA2_A3.toFixed(4)}`);
  const avgIntraA = (simA1_A2 + simA1_A3 + simA2_A3) / 3;
  console.log(`--> Average Paraphrase Intra-Similarity: ${avgIntraA.toFixed(4)}`);

  console.log('\n--- Group A vs Group B Inter-Similarity (Unrelated) ---');
  let interSimSum = 0;
  let count = 0;
  for (let i = 0; i < groupA.length; i++) {
    for (let j = 0; j < groupB.length; j++) {
      const sim = cosineSimilarity(embedsA[i], embedsB[j]);
      console.log(`"${groupA[i]}" <-> "${groupB[j]}": Cosine Sim = ${sim.toFixed(4)}`);
      interSimSum += sim;
      count++;
    }
  }
  const avgInter = interSimSum / count;
  console.log(`--> Average Inter-Group Similarity: ${avgInter.toFixed(4)}`);

  console.log('\n=======================================================');
  console.log('SANITY CHECK VERDICT:');
  if (avgIntraA > avgInter + 0.35) {
    console.log(`✅ PASSED: Paraphrases exhibit high similarity (${avgIntraA.toFixed(4)}) while unrelated entries exhibit low similarity (${avgInter.toFixed(4)}). Margin = ${(avgIntraA - avgInter).toFixed(4)}.`);
  } else {
    console.log(`❌ FAILED: Embeddings failed to separate semantic paraphrases from unrelated text.`);
    process.exit(1);
  }
  console.log('=======================================================\n');
}

verifySemanticEmbeddings().catch((err) => {
  console.error('Sanity check error:', err);
  process.exit(1);
});
