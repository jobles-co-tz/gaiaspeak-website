// server/routes/orderNotification.js
// POST /api/send-order-notification — email admin about a new bracelet order.

import { Router } from 'express';

export const orderNotificationRouter = Router();

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

orderNotificationRouter.post('/send-order-notification', async (req, res) => {
  try {
    const { reservation, adminEmail } = req.body;

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const emailHtml = `
      <h2>🎉 New WHITE Bracelet Pre-Order!</h2>
      <p>A new reservation has been placed on GaiaSpeak.</p>

      <h3>Order Details</h3>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Order ID</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.id}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(reservation.created_at).toLocaleString()}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Quantity</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.quantity}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Size</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.size || 'Not specified'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Color</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.color || 'Not specified'}</td></tr>
        ${reservation.tx_hash ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>TX Hash</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><a href="https://amoy.polygonscan.com/tx/${reservation.tx_hash}">${reservation.tx_hash.slice(0, 10)}...</a></td></tr>` : ''}
      </table>

      <h3>Customer Information</h3>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.full_name}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.email}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.phone}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Wallet</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.wallet_address}</td></tr>
      </table>

      <h3>Shipping Address</h3>
      <p>
        ${reservation.street_address}<br>
        ${reservation.city}, ${reservation.postal_code}<br>
        ${reservation.country}
      </p>

      ${reservation.notes ? `<h3>Notes</h3><p>${reservation.notes}</p>` : ''}

      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This is an automated notification from GaiaSpeak Protocol.<br>
        View all orders in your <a href="https://supabase.com/dashboard">Supabase Dashboard</a>.
      </p>
    `;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'GaiaSpeak <orders@gaiaspeak.io>',
        to: [adminEmail],
        subject: `🎉 New WHITE Bracelet Order - ${reservation.full_name}`,
        html: emailHtml,
      }),
    });

    const data = await emailRes.json();

    if (!emailRes.ok) {
      console.error('Resend error:', data);
      return res.status(500).json({ error: 'Failed to send email', details: data });
    }

    return res.json({ success: true, emailId: data.id });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message });
  }
});
