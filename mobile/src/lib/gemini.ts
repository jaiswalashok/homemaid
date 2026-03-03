const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function parseReceiptImage(base64Image: string, mimeType: string) {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Analyze this receipt image and extract the following information in JSON format:
{
  "vendor": "short vendor name",
  "vendorFullName": "full vendor name",
  "type": "one of: Grocery, Restaurant, Shopping, Transport, Entertainment, Utilities, Healthcare, Other",
  "amount": total amount as number,
  "emoji": "appropriate emoji for the type",
  "discount": discount amount as number (0 if none),
  "displayDate": "formatted date like '25th Jan'",
  "date": "YYYY-MM-DD format",
  "address": "store address",
  "paymentMethod": "Cash, Card, UPI, or Bank Transfer",
  "items": [{"name": "item name", "price": number}]
}
Only return valid JSON, no markdown or extra text.`
            },
            {
              inlineData: {
                mimeType,
                data: base64Image
              }
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) throw new Error('No response from Gemini');
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to parse receipt');
  }
}
