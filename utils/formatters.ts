import { CartItem, ChildUser, StoreSettings, OrderRecord } from '../types/candy';

/**
 * Formats a price according to active currency
 * All base prices are stored in FCFA (or converted smoothly)
 */
export function formatPrice(
  amountInFcfa: number,
  currency: 'FCFA' | 'EUR' = 'FCFA',
  rate: number = 655.957
): string {
  if (currency === 'EUR') {
    const inEur = amountInFcfa / rate;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(inEur);
  }

  // Format in FCFA with nice thousands space
  const rounded = Math.round(amountInFcfa);
  return `${rounded.toLocaleString('fr-FR')} FCFA`;
}

/**
 * Helper to dynamically load canvas-confetti only in browser environment
 */
async function getConfetti() {
  if (typeof window === 'undefined') return null;
  try {
    const mod = await import('canvas-confetti');
    return mod.default || mod;
  } catch {
    return null;
  }
}

/**
 * Triggers a joyful candy explosion confetti animation
 */
export async function fireCandyConfetti(): Promise<void> {
  try {
    const confetti = await getConfetti();
    if (!confetti) return;
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#FF6B9D', '#FFB703', '#06D6A0', '#118AB2', '#9D4EDD', '#F72585'],
      shapes: ['circle', 'square'],
      scalar: 1.2,
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Massive celebration confetti for order submission
 */
export async function fireOrderCelebration(): Promise<void> {
  try {
    const confetti = await getConfetti();
    if (!confetti) return;

    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.4), y: Math.random() - 0.2 },
        colors: ['#FF6B9D', '#FFD166', '#06D6A0', '#118AB2', '#8338EC'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.6, 0.9), y: Math.random() - 0.2 },
        colors: ['#FF6B9D', '#FFD166', '#06D6A0', '#118AB2', '#8338EC'],
      });
    }, 250);
  } catch {
    // Graceful fallback
  }
}

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

/**
 * Builds the WhatsApp pre-filled order text and generates wa.me link
 */
export function generateWhatsAppOrderUrl(params: {
  cart: CartItem[];
  user: ChildUser | null;
  settings: StoreSettings;
  deliveryAddress: string;
  customerPhone?: string;
  notes?: string;
  deliveryFee: number;
}): { url: string; formattedMessage: string } {
  const { cart, user, settings, deliveryAddress, customerPhone, notes, deliveryFee } = params;

  const childName = user ? `${user.firstName} (${user.avatar} ${user.username})` : 'Petit Gourmand';

  const subtotal = cart.reduce((acc, item) => acc + item.candy.price * item.quantity, 0);
  const total = subtotal + deliveryFee;

  let message = `🍭 *NOUVELLE COMMANDE GOURMANDE !* 🍭\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👤 *Client :* ${childName}\n`;
  if (customerPhone && customerPhone.trim().length > 0) {
    message += `📞 *Numéro de téléphone :* ${customerPhone.trim()}\n`;
  }
  if (deliveryAddress && deliveryAddress.trim().length > 0) {
    message += `📍 *Adresse de livraison :* ${deliveryAddress.trim()}\n`;
  }
  message += `📅 *Date :* ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n\n`;

  message += `🛍️ *DÉTAIL DU PANIER :*\n`;
  cart.forEach((item, index) => {
    const itemTotal = item.candy.price * item.quantity;
    const formattedItemTotal = formatPrice(itemTotal, settings.currency, settings.eurToFcfaRate);
    message += `${index + 1}. *${item.candy.name}* (x${item.quantity}) - ${formattedItemTotal}\n`;
  });

  message += `\n`;
  message += `💰 *Sous-total :* ${formatPrice(subtotal, settings.currency, settings.eurToFcfaRate)}\n`;
  if (deliveryFee > 0) {
    message += `🚚 *Frais de livraison :* ${formatPrice(deliveryFee, settings.currency, settings.eurToFcfaRate)}\n`;
  } else {
    message += `🚚 *Livraison :* OFFERTE ✨\n`;
  }
  message += `⭐ *TOTAL À PAYER : ${formatPrice(total, settings.currency, settings.eurToFcfaRate)}*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;

  if (notes && notes.trim().length > 0) {
    message += `💬 *Note :* ${notes.trim()}\n`;
  }

  message += `\nMerci beaucoup ${settings.storeName} ! J'ai hâte de recevoir mes bonbons ! 😋🎉`;

  // Clean WhatsApp number: remove spaces, plus, hyphens
  const cleanNumber = (settings.whatsappNumber || '2250779323716').replace(/[^0-9]/g, '');

  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${cleanNumber}?text=${encoded}`;

  return { url, formattedMessage: message };
}

/**
 * Formats a phone number for display (e.g. +225 07 79 32 37 16)
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('225') && digits.length === 13) {
    return `+225 ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)} ${digits.slice(11, 13)}`;
  }
  if (digits.length === 10) {
    return `+225 ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  return phone.startsWith('+') ? phone : `+${phone}`;
}
