require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/generate-program', async (req, res) => {
  const { message } = req.body;

  const prompt = `Veiki kaip patyręs sporto treneris. Sukurk 7 dienų individualią treniruočių programą remiantis šia informacija:

${message}

Programoje:
- Nurodyk, kokias kūno dalis treniruoti kiekvieną dieną.
- Pateik konkrečius pratimus.
- Kiekvienam pratimui parašyk kiek serijų ir pakartojimų arba laiką.
- Pridėk trumpą aprašymą / instrukciją, kaip teisingai atlikti kiekvieną pratimą.
- Naudok aiškią ir taisyklingą lietuvių kalbą – venk netaisyklingų skolinių kaip "dumbbel" ar "bencho".
- Programos turinys turi būti struktūrizuotas ir lengvai suprantamas, tarsi paruoštas pradedančiajam.
- Pridėk bendrų rekomendacijų kiekvienai dienai ir (jei tinka) individualių patarimų pagal naudotojo informaciją.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ result: completion.choices[0].message.content });
  } catch (err) {
    console.error('❌ OpenAI API error:', err);
    res.status(500).json({ error: 'Nepavyko sugeneruoti programos.' });
  }
});

app.listen(3000, () => {
  console.log('✅ Serveris paleistas: http://localhost:3000');
});
