export const TREE_NODE_WIDTH = 148;
export const TREE_NODE_HEIGHT = 40;
export const TREE_H_GAP = 24;
export const TREE_V_GAP = 56;
export const TREE_PADDING = 32;

/**
 * @typedef {import('./versionSelection.js').StageVersionNode} StageVersionNode
 * @typedef {StageVersionNode & { children: LayoutTreeNode[] }} LayoutTreeNode
 * @typedef {LayoutTreeNode & { x: number, y: number, depth: number }} PositionedNode
 */

/**
 * @param {StageVersionNode[]} versions
 * @returns {LayoutTreeNode[]}
 */
export function buildVersionForest(versions) {
  const byParent = new Map();
  for (const v of versions) {
    const key = v.parentVersionId ?? "__root__";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(v);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.localVersion - b.localVersion);
  }

  /** @param {StageVersionNode} version */
  function nest(version) {
    const children = (byParent.get(version.id) ?? []).map(nest);
    return { ...version, children };
  }

  return (byParent.get("__root__") ?? []).map(nest);
}

/**
 * @param {LayoutTreeNode[]} forest
 * @returns {{ nodes: PositionedNode[], edges: { from: PositionedNode, to: PositionedNode }[], width: number, height: number }}
 */
export function layoutVersionForest(forest) {
  /** @type {PositionedNode[]} */
  const nodes = [];
  /** @type {{ from: PositionedNode, to: PositionedNode }[]} */
  const edges = [];
  let globalOffset = 0;

  for (const root of forest) {
    let leafCounter = 0;

    /** @param {LayoutTreeNode} node @param {number} depth @param {PositionedNode|null} parent */
    function layout(node, depth, parent) {
      const children = node.children ?? [];
      const childResults =
        children.length > 0
          ? children.map((child) => layout(child, depth + 1, null))
          : [];

      let x;
      if (children.length === 0) {
        x = globalOffset + leafCounter * (TREE_NODE_WIDTH + TREE_H_GAP);
        leafCounter += 1;
      } else {
        x = (childResults[0].x + childResults[childResults.length - 1].x) / 2;
      }

      const y = depth * (TREE_NODE_HEIGHT + TREE_V_GAP);
      /** @type {PositionedNode} */
      const positioned = { ...node, x, y, depth };
      nodes.push(positioned);

      if (parent) {
        edges.push({ from: parent, to: positioned });
      }

      childResults.forEach((child) => {
        edges.push({ from: positioned, to: child });
      });

      return positioned;
    }

    layout(root, 0, null);

    if (leafCounter > 0) {
      globalOffset += leafCounter * (TREE_NODE_WIDTH + TREE_H_GAP) + TREE_H_GAP * 2;
    }
  }

  const width =
    nodes.length > 0
      ? Math.max(...nodes.map((n) => n.x)) + TREE_NODE_WIDTH + TREE_PADDING * 2
      : 400;
  const height =
    nodes.length > 0
      ? Math.max(...nodes.map((n) => n.y)) + TREE_NODE_HEIGHT + TREE_PADDING * 2
      : 200;

  return { nodes, edges, width, height };
}

/**
 * @param {{ from: PositionedNode, to: PositionedNode }} edge
 */
export function getConnectorPath(edge) {
  const x1 = edge.from.x + TREE_NODE_WIDTH / 2;
  const y1 = edge.from.y + TREE_NODE_HEIGHT;
  const x2 = edge.to.x + TREE_NODE_WIDTH / 2;
  const y2 = edge.to.y;
  const midY = y1 + (y2 - y1) / 2;
  return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
}

/**
 * @param {StageVersionNode} node
 * @param {string} [strategyName]
 */
export function formatTreeNodeLabel(node, strategyName) {
  const code = `(${node.lineageCode})`;
  if (node.stageType === "signal" && strategyName) {
    return `${strategyName} ${node.label} ${code}`;
  }
  return `${node.label} ${code}`;
}
