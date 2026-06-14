// A friendly native-language greeting keyed by country (ISO-2 code).
// Falls back to "Hello" for anything not mapped. Kept warm and simple.
const GREETINGS: Record<string, string> = {
  IN: 'Namaste', NP: 'Namaste', LK: 'Ayubowan', BD: 'Salaam', PK: 'Salaam',
  CN: 'Nǐ hǎo', TW: 'Nǐ hǎo', HK: 'Nei hou',
  TZ: 'Mambo', KE: 'Habari', UG: 'Habari', RW: 'Muraho',
  NG: 'Sannu', GH: 'Akwaaba', ET: 'Selam', ZA: 'Sawubona', ZW: 'Mhoro', CM: 'Mbolo',
  EG: 'Salaam', SA: 'Salaam', AE: 'Salaam', IR: 'Salaam', IQ: 'Salaam', JO: 'Salaam',
  TR: 'Merhaba', PH: 'Kumusta', KR: 'Annyeong', VN: 'Xin chào', TH: 'Sawasdee',
  ID: 'Halo', MY: 'Selamat', JP: 'Konnichiwa',
  BR: 'Olá', PT: 'Olá', MX: 'Hola', ES: 'Hola', CO: 'Hola', AR: 'Hola', PE: 'Hola',
  FR: 'Bonjour', DE: 'Hallo', IT: 'Ciao', RU: 'Privet', UA: 'Pryvit', GR: 'Yassou',
}

export function greetingFor(country?: string | null): string {
  if (!country) return 'Hello'
  return GREETINGS[country.trim().toUpperCase()] ?? 'Hello'
}
