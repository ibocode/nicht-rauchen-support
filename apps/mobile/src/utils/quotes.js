export const motivationQuotes = [
  // Identität & Mindset
  "Du bist kein Raucher, der verzichtet. Du bist ein Nichtraucher, der frei ist.",
  "Entscheide dich heute erneut für deine Freiheit.",
  "Stärke entsteht, wenn du 'Nein' sagst, obwohl du 'Ja' sagen willst.",
  "Dein Wille ist stärker als jedes Verlangen.",
  "Sei stolz auf den Weg, den du bereits gegangen bist.",
  "Investiere in dein zukünftiges Ich.",
  
  // Fakten & Körper
  "Dein Blutdruck normalisiert sich weiter.",
  "Deine Lunge beginnt sich zu reinigen.",
  "Denk an das Geld, das du heute gespart hast.",
  "Dein Herzinfarkt-Risiko sinkt mit jeder Stunde.",
  "Jeder Tag ohne Rauch schenkt dir Lebenszeit zurück.",
  "Deine Haut wird besser durchblutet und sieht frischer aus.",
  
  // Kurz & Knackig
  "Bleib im Fokus.",
  "Atme tief durch. Du bist frei.",
  "Lass dich nicht vom Weg abbringen.",
  "Du hast die Kontrolle.",
  "Heute ist ein guter Tag.",
  
  // Tough Love
  "Eine Zigarette löst kein Problem. Sie schafft nur ein neues.",
  "Willst du wirklich wieder bei Tag 0 anfangen?",
  "Verlangen dauert nur wenige Minuten. Stolz hält ewig.",
  "Lass dich nicht von einer alten Gewohnheit austricksen."
];

export const getRandomQuote = () => {
  return motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)];
};

