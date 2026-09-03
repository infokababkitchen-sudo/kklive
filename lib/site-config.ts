/**
 * Everything search engines, AI answer engines and Google Business need.
 *
 * FILL THESE IN. The values marked TODO are placeholders and will actively
 * hurt you if they go live: a wrong address or phone number gets your
 * listing flagged, and a wrong siteUrl breaks every canonical link.
 */
export const site = {
  // TODO: your real domain, no trailing slash
  url: 'https://kababkitchen.in',

  name: 'Kabab Kitchen',
  legalName: 'Kabab Kitchen',
  tagline: 'Freshly grilled kababs, momos and North Indian food',

  description:
    'Kabab Kitchen serves freshly grilled seekh kababs, kurkure momos, soya chaap and North Indian main course in Ghaziabad. Order on WhatsApp for delivery in 35-40 minutes.',

  // ---- contact and location (this is what local search uses) ----
  // TODO: replace with your real numbers
  phone: '+91 9266321191',
  whatsapp: '919266321191',

  address: {
    // TODO: your real street address
    street: 'B-Block , Oxy homez society',
    locality: 'Ghaziabad',
    region: 'Uttar Pradesh',
    postalCode: '201001',
    country: 'IN',
  },

  // TODO: exact coordinates. Open Google Maps, right-click your shop,
  // click the lat/long that appears, and paste them here.
  geo: { latitude: 28.6692, longitude: 77.4538 },

  // Areas you actually deliver to. Search engines use this for "near me".
  serviceAreas: ['Ghaziabad', 'Indirapuram', 'Vasundhara', 'Vaishali', 'Kaushambi'],

  cuisines: ['North Indian', 'Mughlai', 'Kebab', 'Chinese', 'Momos'],
  priceRange: '₹₹',

  // 24h format, per weekday
  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '12:00', closes: '16:00' },
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '19:00', closes: '03:00' },
  ],

  // TODO: add the ones you have, delete the rest
  social: [
    'https://www.instagram.com/thekababkitchen',
    // 'https://www.facebook.com/yourpage',
    // 'https://g.page/your-google-business-profile',
  ],

  // TODO: paste your GA4 id, e.g. G-XXXXXXXXXX. Leave empty to disable.
  gaId: 'G-393ZR7RJ0L',
}

/**
 * Answer-engine questions. AI assistants and Google's answer boxes pull from
 * these, so write them the way a customer would actually ask.
 */
export const faqs = [
  {
    q: 'What are Kabab Kitchen’s timings?',
    a: 'Kabab Kitchen is open every day for lunch from 12:00 PM to 4:00 PM and for dinner from 7:00 PM to 03:00 AM.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Most orders are delivered in 35 to 40 minutes. Delivery is free on orders above ₹299.',
  },
  {
    q: 'How do I order from Kabab Kitchen?',
    a: 'Pick your dishes on the website, add any extras or a cooking request, then tap Checkout. The order is sent to the kitchen on WhatsApp and confirmed there.',
  },
  {
    q: 'What is the difference between a dry kabab and a kabab roll?',
    a: 'A dry portion has two seekhs served on their own. A roll has one seekh wrapped with stuffed onion and masala.',
  },
  {
    q: 'Does Kabab Kitchen have vegetarian options?',
    a: 'Yes. Veg kababs, paneer and veg momos, soya chaap, paneer main course dishes and pure-veg thalis are all available, and the menu can be filtered to show only vegetarian dishes.',
  },
  {
    q: 'Which areas does Kabab Kitchen deliver to?',
    a: 'Delivery covers Ghaziabad and nearby areas including Indirapuram, Vasundhara, Vaishali and Kaushambi.',
  },
]
