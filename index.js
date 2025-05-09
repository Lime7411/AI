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
    .replace(/(?:<li>.*?<\/li>\n?)+/g, match => `<ul>${match}</ul>`)
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

  const introPrompt = `Veiki kaip patyręs sporto treneris. Sukurk ${trainingFrequency} dienų individualią treniruočių programą remiantis šia informacija:\n\n`;
  const basePrompt = `
  Vardas: ${name || "Nenurodytas"}
  Amžius: ${age || "Nenurodytas"}
  Lytis: ${gender || "Nenurodyta"}
  Fitneso lygis: ${fitnessLevel}
  Treniruotės vieta: ${trainingLocation}
  Tikslai: ${goals}
  Specifiniai tikslai: ${specificGoals}
  
  Programoje turi būti:
  - Kiekvienai dienai konkretūs pratimai su serijų, pakartojimų ar laiko skaičiais.
  - Kiekvienam pratimui trumpa instrukcija, kaip jį atlikti taisyklingai.
  - Jei tinka, pridėk individualių patarimų pagal pateiktą informaciją.
  - Venk tiesioginio vertimo iš anglų kalbos – tekstas turi būti natūralus lietuvių kalba.
  - Būk aiškus, struktūrizuotas ir suprantamas pradedantiesiems.
  `;

  try {
    let fullProgram = "";

    for (let day = 1; day <= trainingFrequency; day++) {
      const dayPrompt = `${introPrompt}${basePrompt}\nDiena ${day}:\n`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: dayPrompt }],
      });

      const dayResult = completion.choices[0].message.content;
      fullProgram += `<h3>Diena ${day}</h3>\n${formatToHTML(dayResult)}<br><br>`;
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ result: fullProgram });
  } catch (err) {
    console.error('❌ OpenAI API error:', err);
    res.status(500).json({ error: 'Nepavyko sugeneruoti programos.' });
  }
});

app.listen(3000, () => {
  console.log('✅ Serveris paleistas: http://localhost:3000');
});
