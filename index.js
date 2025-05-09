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
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\s*\d+\.\s*(.*)$/gm, '<li>$1</li>')
    .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
    .replace(/(?:<li>.*?<\/li>\n?)+/g, match => `<ul>${match}</ul>`) 
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

app.post('/generate-program', async (req, res) => {
  const { name, age, gender, fitnessLevel, goals, specificGoals } = req.body;

  const exerciseCount = fitnessLevel === 'Pažengęs' ? 6 : fitnessLevel === 'Vidutinis' ? 5 : 4;

  const prompt = `Veiki kaip patyręs sporto treneris. Sukurk 7 dienų individualią treniruočių programą remiantis šia informacija:

- Vardas: ${name || 'Nenurodytas'}
- Amžius: ${age || 'Nenurodytas'}
- Lytis: ${gender || 'Nenurodyta'}
- Fitneso lygis: ${fitnessLevel || 'Nenurodytas'}
- Tikslai: ${goals || 'Nenurodyti'}
- Specifiniai tikslai ar problemos: ${specificGoals || 'Nenurodyta'}

Programoje:
- Sukurk 7 dienų treniruočių planą, kuriame kiekviena diena turi bent ${exerciseCount} pratimų.
- Aiškiai nurodyk, kokias kūno dalis treniruoti kiekvieną dieną.
- Pateik konkrečius pratimus su kiekvienai dienai skirtingomis kūno dalimis.
- Kiekvienam pratimui parašyk kiek serijų ir pakartojimų arba laiką.
- Pridėk žingsnis po žingsnio instrukcijas, kad pradedantieji suprastų, kaip atlikti pratimus teisingai.
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
