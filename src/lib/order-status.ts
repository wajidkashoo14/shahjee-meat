/** Whether a paid order is still inside its cancel window (before packing starts). */
export function isOrderCancellable(order: { status: string; cancelCutoffAt: Date | null }): boolean {
  if (order.status !== "paid") return false;
  if (!order.cancelCutoffAt) return true;
  return order.cancelCutoffAt.getTime() > Date.now();
}
