// EmailSender.ts
import emailjs from "emailjs-com";

class EmailSender {
  private serviceId = 'service_oi4mgpc';
  private templateId = 'template_z6h4cmn';
  private publicKey = 'q8dcmKDCAgHv7QYGs';

  async sendEmail(to_email: string, message: string, from_name = "My App") {
    const templateParams = {
      to_email,
      from_name,
      message,
    };

    try {
      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams,
        this.publicKey
      );
      console.log("Email sent!", response.status, response.text);
    } catch (error) {
      console.error("Email failed:", error);
      throw error;
    }
  }
}

export default EmailSender;
