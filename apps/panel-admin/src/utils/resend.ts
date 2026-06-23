/**
 * Utility to send email notifications via Resend API
 */
export async function sendEmailWithResend(to: string, subject: string, htmlContent: string) {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY || ""

  if (!apiKey) {
    console.warn("VITE_RESEND_API_KEY is not configured. Email simulated in developer console.")
    console.log(`
============================================================
📧 SIMULACIÓN DE ENVÍO DE CORREO ELECTRÓNICO (CONSOLA)
============================================================
Para: ${to}
Asunto: ${subject}
------------------------------------------------------------
${htmlContent.replace(/<[^>]*>/g, "\n").replace(/\n+/g, "\n")}
============================================================
`)
    return { success: false, error: "API Key missing" }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Zynqro Events <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData?.message || "Failed to send email via Resend")
    }

    const data = await response.json()
    console.log("Email sent successfully via Resend:", data)
    return { success: true, data }
  } catch (err: any) {
    console.error("Error sending email via Resend:", err)
    // Fall back to console logs in case of network errors
    return { success: false, error: err.message || err }
  }
}
