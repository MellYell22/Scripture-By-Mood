export const createCheckoutSession = async (priceId: string, userId: string) => {
  const endpoint = '/api/create-checkout-session';
  console.log(`[StripeDebug] Initiating upgrade. User: ${userId}, PriceId: ${priceId}`);
  console.log(`[StripeDebug] POST ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, userId }),
    });
    
    console.log(`[StripeDebug] Response status: ${response.status} ${response.statusText}`);
    const contentType = response.headers.get('content-type');
    console.log(`[StripeDebug] Content-Type: ${contentType}`);

    if (!response.ok) {
      let errorMessage = 'Failed to create checkout session';
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        const errorText = await response.text();
        console.error(`[StripeDebug] Non-JSON error response: ${errorText.substring(0, 100)}...`);
        errorMessage = `Server error (${response.status}). Please try again later.`;
      }
      throw new Error(errorMessage);
    }

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'No checkout URL returned from server');
      }
    } else {
      const text = await response.text();
      console.error(`[StripeDebug] Unexpected non-JSON response: ${text.substring(0, 100)}...`);
      throw new Error('Unexpected server response format');
    }
  } catch (error: any) {
    console.error(`[StripeDebug] Fetch error: ${error.message}`);
    throw error;
  }
};
