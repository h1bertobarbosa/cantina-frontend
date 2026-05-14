export function formatPaymentMethod(paymentMethod) {
  if (paymentMethod === 'TO_RECEIVE') {
    return 'à Receber';
  }

  return paymentMethod;
}
