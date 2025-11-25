export interface PQItem<T> {
  item: T;
  priority: number;
}

export class PriorityQueue<T> {
  private heap: PQItem<T>[] = [];

  enqueue(item: T, priority: number): void {
    const node: PQItem<T> = { item, priority };
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0 && end) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return min.item;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(n: number): void {
    const element = this.heap[n];
    let index = n;

    while (index > 0) {
      const parentIdx = Math.floor((index + 1) / 2) - 1;
      const parent = this.heap[parentIdx];

      if (element.priority >= parent.priority) break;

      this.heap[parentIdx] = element;
      this.heap[index] = parent;
      index = parentIdx;
    }
  }

  private sinkDown(n: number): void {
    const length = this.heap.length;
    const element = this.heap[n];
    let index = n;

    while (true) {
      const leftChildIdx = 2 * (index + 1) - 1;
      const rightChildIdx = 2 * (index + 1);
      let leftChild: PQItem<T> | undefined;
      let rightChild: PQItem<T> | undefined;
      let swap = null;

      if (leftChildIdx < length) {
        leftChild = this.heap[leftChildIdx];
        if (leftChild.priority < element.priority) {
          swap = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        rightChild = this.heap[rightChildIdx];
        if (
          (swap === null && rightChild.priority < element.priority) ||
          (swap !== null && leftChild && rightChild.priority < leftChild.priority)
        ) {
          swap = rightChildIdx;
        }
      }

      if (swap === null) break;

      this.heap[index] = this.heap[swap];
      this.heap[swap] = element;
      index = swap;
    }
  }
}