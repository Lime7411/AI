require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function formatToHTML(text) {
  return text
    .replace(/^###\s*(.*?)$/gm, '<h2>$1</h2>')
    .replace(/^##\s*(.*?)$/gm, '<h3>$1</h3>')
    .replace(/^\*\*(.*?)\*\*$/gm, '<strong>$1</strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\s*\d+\..*$/gm, match => `<li>${match.trim()}</li>`) 
    .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
    .replace(/(?:<li>.*?<\/li>\n?)+/g, match => `<ul>${match}</ul>') 
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

app.post('/generate-program', async (req, res) => {
  const {
    name,
    age,
    gender,
    fitnessLevel,
    trainingFrequency,
    trainingLocation,
    goals,
    specificGoals
  } = req.body;

  // Build the prompt based on the new form structure
  let prompt = `Veiki kaip patyręs sporto treneris. Sukurk individualią treniruočių programą remiantis šia informacija:\n\n`;

  if (name) prompt += `Vardas: ${name}\n`;
  if (age) prompt += `Amžius: ${age}\n`;
  if (gender) prompt += `Lytis: ${gender}\n`;
  if (fitnessLevel) prompt += `Fitneso lygis: ${fitnessLevel}\n`;
  if (trainingFrequency) prompt += `Treniruočių dažnis: ${trainingFrequency} kartai per savaitę\n`;
  if (trainingLocation) prompt += `Treniruotės vieta: ${trainingLocation}\n`;
  if (goals) prompt += `Tikslai: ${goals}\n`;
  if (specificGoals) prompt += `Specifiniai tikslai ar problemos: ${specificGoals}\n`;

  prompt += `
Programoje:
- Sukurk treniruočių planą ${trainingFrequency} dienoms per savaitę.
- Nurodyk, kokias kūno dalis treniruoti kiekvieną dieną.
- Pateik bent 5 pratimus kiekvienai treniruotei (daugiau pažengusiems).
- Kiekvienam pratimui parašyk kiek serijų ir pakartojimų arba laiką.
- Kiekvienam pratimui pridėk žingsnis po žingsnio instrukciją (kaip teisingai atlikti), suprantamą pradedančiajam.
- Naudok taisyklingą lietuvių kalbą – nevartok netaisyklingų skolinių kaip "dumbbel", "bencho" ir pan.
- Venk tiesioginio vertimo iš anglų kalbos – programa turi būti parašyta lietuviškai natūraliai.
- Turinys turi būti aiškus, struktūrizuotas ir lengvai skaitomas.
- Pridėk bendrų rekomendacijų kiekvienai dienai ir, jei tinka, individualių patarimų pagal naudotojo informaciją.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const formattedHTML = formatToHTML(completion.choices[0].message.content);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ result: formattedHTML });
  } catch (err) {
    console.error('❌ OpenAI API error:', err);
    res.status(500).json({ error: 'Nepavyko sugeneruoti programos.' });
  }
});

app.listen(3000, () => {
  console.log('✅ Serveris paleistas: http://localhost:3000');
});
