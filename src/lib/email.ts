/**
 * Minimal email abstraction. Sends through Resend when RESEND_API_KEY is
 * configured; otherwise logs to the server console so every flow (magic
 * link, order confirmation, back-in-stock, etc.) still "works" in local
 * dev without an email provider account. See DECISIONS.md.
 */
export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `\n📧 [dev email] to=${payload.to} subject="${payload.subject}"\n${payload.text ?? payload.html.replace(/<[^>]+>/g, " ")}\n`,
    );
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Whole Cuts <no-reply@wholecuts.example>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });
    if (!res.ok) {
      console.error("Resend email failed", await res.text());
    }
  } catch (err) {
    console.error("Failed to send email", err);
  }
}
