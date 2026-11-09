/**
 * The order in which a period's equations are solved, as sfcr finds it: the graph of what each equation reads in the
 * same period, cut into its strongly connected components (Tarjan, 1972). A component of one equation that does not
 * read itself is computed once; a cycle (the income and the consumption that make each other) is a block iterated
 * until it settles. The blocks come out in the order that computes each one after all it reads; inside a block, the
 * equations keep their written order, so that the same model always iterates the same way.
 */

/**
 * The blocks of `reads`, `reads[i]` the equations equation `i` reads in its period, each block `{ members, cyclic }`.
 *
 * @param {number[][]} reads
 * @returns {Array<{ members: number[], cyclic: boolean }>}
 */
export function blocksOf(reads) {
  const count = reads.length;
  const index = new Int32Array(count).fill(-1);
  const low = new Int32Array(count);
  const onStack = new Uint8Array(count);
  const stack = [];
  const blocks = [];
  let next = 0;
  const visit = (v) => {
    index[v] = next;
    low[v] = next;
    next += 1;
    stack.push(v);
    onStack[v] = 1;
    for (const w of reads[v]) {
      if (index[w] < 0) visit(w);
      if (onStack[w]) low[v] = Math.min(low[v], low[w]);
    }
    if (low[v] === index[v]) blocks.push(component(v, stack, onStack, reads));
  };
  for (let v = 0; v < count; v += 1) if (index[v] < 0) visit(v);
  return blocks;
}

/** The component rooted at `v`, taken off `stack`: its members in written order, and whether it is a cycle. */
function component(v, stack, onStack, reads) {
  const members = [];
  let w;
  do {
    w = stack.pop();
    onStack[w] = 0;
    members.push(w);
  } while (w !== v);
  members.sort((a, b) => a - b);
  return { members, cyclic: members.length > 1 || reads[v].includes(v) };
}
