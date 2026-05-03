// EmailJS Configuration - FiveM Dev Pro
var EMAILJS_PUBLIC_KEY      = 'bENbj-7aOaUqFxFxk';
var EMAILJS_SERVICE_ID      = 'service_0imsq13';
var EMAILJS_TEMPLATE_RESET  = 'template_kzxswws';
var EMAILJS_TEMPLATE_QUOTE  = 'template_9gn0mof';

if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

// Envoi email reset password
async function sendResetPasswordEmail(toEmail, resetLink) {
    return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_RESET, {
        to_email:   toEmail,
        reset_link: resetLink,
        site_name:  'FiveM Dev Pro'
    });
}

// Envoi email devis (admin + confirmation client dans le meme template)
async function sendQuoteEmail(quoteData) {
    return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_QUOTE, {
        // Destinataires
        to_email:        'nxrsh27@gmail.com',
        reply_to:        quoteData.client_email,
        // Infos client
        client_name:     quoteData.client_name,
        client_email:    quoteData.client_email,
        server_name:     quoteData.server_name || 'Non renseigne',
        // Infos projet
        project_type:    quoteData.project_type,
        project_details: quoteData.project_details,
        framework:       quoteData.framework,
        deadline:        quoteData.deadline,
        budget:          quoteData.budget || 'Non specifie',
        quote_id:        quoteData.id || 'N/A'
    });
}