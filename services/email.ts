// Email service for professional communications
// In a real app, this would integrate with services like SendGrid, Mailgun, etc.

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private apiKey: string = '';
  private fromEmail: string = 'noreply@coppet.com';

  constructor() {
    // In a real app, get API key from environment variables
    this.apiKey = process.env.EMAIL_API_KEY || '';
  }

  // Professional account verification email
  generateVerificationEmail(userEmail: string, verificationCode: string): EmailTemplate {
    const subject = 'Vérification de votre compte professionnel Coppet';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Vérification compte professionnel</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb;">Coppet</h1>
            </div>
            
            <h2>Vérification de votre compte professionnel</h2>
            
            <p>Bonjour,</p>
            
            <p>Merci d'avoir créé un compte professionnel sur Coppet. Pour finaliser votre inscription, veuillez utiliser le code de vérification suivant :</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h3 style="font-size: 24px; letter-spacing: 4px; margin: 0; color: #2563eb;">${verificationCode}</h3>
            </div>
            
            <p>Ce code est valide pendant 10 minutes.</p>
            
            <p>Une fois votre compte vérifié, vous pourrez :</p>
            <ul>
              <li>Vendre vos produits sur la boutique Coppet</li>
              <li>Accéder à votre tableau de bord professionnel</li>
              <li>Gérer vos commandes et analytics</li>
              <li>Recevoir des paiements sécurisés</li>
            </ul>
            
            <p>Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p>Coppet - L'application pour les propriétaires d'animaux</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Vérification de votre compte professionnel Coppet
      
      Bonjour,
      
      Merci d'avoir créé un compte professionnel sur Coppet. Pour finaliser votre inscription, veuillez utiliser le code de vérification suivant :
      
      ${verificationCode}
      
      Ce code est valide pendant 10 minutes.
      
      Une fois votre compte vérifié, vous pourrez vendre vos produits sur la boutique Coppet et accéder à votre tableau de bord professionnel.
      
      Si vous n'avez pas créé ce compte, vous pouvez ignorer cet email.
      
      Coppet - L'application pour les propriétaires d'animaux
    `;

    return { subject, html, text };
  }

  // Product approval notification
  generateProductApprovalEmail(userEmail: string, productName: string, isApproved: boolean, rejectionReason?: string): EmailTemplate {
    const subject = isApproved 
      ? `Votre produit "${productName}" a été approuvé`
      : `Votre produit "${productName}" nécessite des modifications`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb;">Coppet</h1>
            </div>
            
            <h2>${subject}</h2>
            
            <p>Bonjour,</p>
            
            ${isApproved ? `
              <div style="background-color: #dcfce7; border: 1px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #16a34a; margin: 0;"><strong>✅ Félicitations ! Votre produit a été approuvé.</strong></p>
              </div>
              
              <p>Votre produit "<strong>${productName}</strong>" est maintenant visible sur la boutique Coppet et peut être acheté par les utilisateurs.</p>
              
              <p>Vous pouvez suivre les ventes et analytics de ce produit depuis votre tableau de bord professionnel.</p>
            ` : `
              <div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #f59e0b; margin: 0;"><strong>⚠️ Votre produit nécessite des modifications.</strong></p>
              </div>
              
              <p>Votre produit "<strong>${productName}</strong>" n'a pas pu être approuvé pour la raison suivante :</p>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><em>${rejectionReason}</em></p>
              </div>
              
              <p>Vous pouvez modifier votre produit depuis votre tableau de bord professionnel et le soumettre à nouveau pour validation.</p>
            `}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://coppet.com/pro/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Accéder au tableau de bord
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p>Coppet - L'application pour les propriétaires d'animaux</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      ${subject}
      
      Bonjour,
      
      ${isApproved 
        ? `Félicitations ! Votre produit "${productName}" a été approuvé et est maintenant visible sur la boutique Coppet.`
        : `Votre produit "${productName}" n'a pas pu être approuvé pour la raison suivante : ${rejectionReason}`
      }
      
      Vous pouvez accéder à votre tableau de bord professionnel sur https://coppet.com/pro/dashboard
      
      Coppet - L'application pour les propriétaires d'animaux
    `;

    return { subject, html, text };
  }

  // New order notification
  generateOrderNotificationEmail(userEmail: string, orderData: any): EmailTemplate {
    const subject = `Nouvelle commande #${orderData.id.slice(-6)}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb;">Coppet</h1>
            </div>
            
            <h2>Nouvelle commande reçue</h2>
            
            <p>Bonjour,</p>
            
            <p>Vous avez reçu une nouvelle commande sur votre boutique Coppet :</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Commande #${orderData.id.slice(-6)}</h3>
              <p><strong>Client :</strong> ${orderData.customerName}</p>
              <p><strong>Email :</strong> ${orderData.customerEmail}</p>
              <p><strong>Montant total :</strong> ${orderData.totalAmount.toFixed(2)}€</p>
              <p><strong>Date :</strong> ${new Date(orderData.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
            
            <h4>Articles commandés :</h4>
            <ul>
              ${orderData.items.map((item: any) => `
                <li>${item.productName} - Quantité: ${item.quantity} - ${item.totalPrice.toFixed(2)}€</li>
              `).join('')}
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://coppet.com/pro/orders" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Gérer la commande
              </a>
            </div>
            
            <p><strong>Prochaines étapes :</strong></p>
            <ol>
              <li>Confirmez la commande dans votre tableau de bord</li>
              <li>Préparez les articles</li>
              <li>Expédiez la commande</li>
              <li>Mettez à jour le statut de livraison</li>
            </ol>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
              <p>Coppet - L'application pour les propriétaires d'animaux</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Nouvelle commande reçue
      
      Bonjour,
      
      Vous avez reçu une nouvelle commande sur votre boutique Coppet :
      
      Commande #${orderData.id.slice(-6)}
      Client : ${orderData.customerName}
      Email : ${orderData.customerEmail}
      Montant total : ${orderData.totalAmount.toFixed(2)}€
      
      Articles commandés :
      ${orderData.items.map((item: any) => `- ${item.productName} - Quantité: ${item.quantity} - ${item.totalPrice.toFixed(2)}€`).join('\n')}
      
      Gérez cette commande sur https://coppet.com/pro/orders
      
      Coppet - L'application pour les propriétaires d'animaux
    `;

    return { subject, html, text };
  }

  // Send email (mock implementation)
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real app, this would use a service like SendGrid
      console.log('📧 Email sent:', {
        to: emailData.to,
        subject: emailData.subject,
        preview: emailData.text.substring(0, 100) + '...'
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }

  // Send verification email
  async sendVerificationEmail(userEmail: string, verificationCode: string): Promise<{ success: boolean; error?: string }> {
    const template = this.generateVerificationEmail(userEmail, verificationCode);
    
    return this.sendEmail({
      to: userEmail,
      from: this.fromEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Send product approval email
  async sendProductApprovalEmail(
    userEmail: string, 
    productName: string, 
    isApproved: boolean, 
    rejectionReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const template = this.generateProductApprovalEmail(userEmail, productName, isApproved, rejectionReason);
    
    return this.sendEmail({
      to: userEmail,
      from: this.fromEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Send order notification email
  async sendOrderNotificationEmail(userEmail: string, orderData: any): Promise<{ success: boolean; error?: string }> {
    const template = this.generateOrderNotificationEmail(userEmail, orderData);
    
    return this.sendEmail({
      to: userEmail,
      from: this.fromEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}

export const emailService = new EmailService();