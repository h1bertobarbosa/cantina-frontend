export function formatPaymentMethod(paymentMethod) {
  const labels = {
    CASH: 'Dinheiro',
    CREDIT_CARD: 'Cartão de Crédito',
    PIX: 'PIX',
    TO_RECEIVE: 'à Receber'
  };

  return labels[paymentMethod] || paymentMethod;
}
