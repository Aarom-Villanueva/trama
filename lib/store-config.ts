// Set the shop's international number (digits only) when adapting this demo.
// Empty means WhatsApp lets the visitor choose the recipient; no invented contact.
export const storeConfig={name:'TRAMA',whatsappNumber:''};
export function whatsappHref(message:string){const number=storeConfig.whatsappNumber.replace(/\D/g,'');return 'https://wa.me/'+number+'?text='+encodeURIComponent(message)}
