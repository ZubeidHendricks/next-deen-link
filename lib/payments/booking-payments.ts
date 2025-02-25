import { stripe } from './stripe';
import { updateBookingPayment } from '@/lib/db/booking-queries';
import { Booking } from '@/lib/db/schema-extensions';

export async function createPaymentIntent(
  booking: Booking,
  parentEmail: string,
  teacherName: string,
  description?: string
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.price,
      currency: 'usd',
      description: description || `Booking with ${teacherName}`,
      metadata: {
        bookingId: booking.id.toString(),
        teacherProfileId: booking.teacherProfileId.toString(),
        parentId: booking.parentId.toString(),
      },
      receipt_email: parentEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update booking with payment intent ID
    await updateBookingPayment(booking.id, paymentIntent.id, 'pending');

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export async function confirmPaymentSuccess(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      const bookingId = parseInt(paymentIntent.metadata.bookingId);
      await updateBookingPayment(bookingId, paymentIntentId, 'paid');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error confirming payment:', error);
    return false;
  }
}

export async function refundBookingPayment(
  bookingId: number,
  paymentIntentId: string,
  amount?: number,
  reason?: string
) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, // If not provided, will refund the full amount
      reason: (reason as 'duplicate' | 'fraudulent' | 'requested_by_customer' | undefined) || 'requested_by_customer',
    });
    
    await updateBookingPayment(bookingId, paymentIntentId, 'refunded');
    
    return refund;
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw error;
  }
}

export async function cancelPaymentIntent(paymentIntentId: string) {
  try {
    return await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (error) {
    console.error('Error canceling payment intent:', error);
    throw error;
  }
}

export async function createSetupIntent(customerId: string) {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
    
    return {
      clientSecret: setupIntent.client_secret,
    };
  } catch (error) {
    console.error('Error creating setup intent:', error);
    throw error;
  }
}

export async function listPaymentMethods(customerId: string) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    
    return paymentMethods.data;
  } catch (error) {
    console.error('Error listing payment methods:', error);
    throw error;
  }
}

export async function calculateTeacherEarnings(price: number) {
  // Platform takes 15% commission
  const platformFee = Math.round(price * 0.15);
  const teacherEarnings = price - platformFee;
  
  return {
    platformFee,
    teacherEarnings,
  };
}
