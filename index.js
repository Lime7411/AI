require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Exercise name translations
const exerciseTranslations = {
  'Deadlift': 'Mirties trauka',
  'Bench press': 'Štangos spaudimas',
  'Squat': 'Pritūpimai',
  'Pull-up': 'Prisitraukimai',
  'Push-up': 'Atsispaudimai',
  'Overhead press': 'Spaudimas virš galvos',
  'Bicep curl': 'Bicepso lenkimas',
  'Tricep extension': 'Tricepso tiesimas',
  'Lat pulldown': 'Latų trauka',
  'Leg press': 'Kojų spaudimas treniruoklyje',
  'Lunges': 'Ėjimas su štanga',
  'Shoulder press': 'Pečių spaudimas',
  'Row': 'Trauka',
  'Plank': 'Lenta',
  'Sit-up': 'Atsilenkimai',
  'Crunch': 'Pilvo raumenų susitraukimai'
};

function translateExercises(text) {
  let translated = text;
  for (const [english, lithuanian] of Object.entries(exerciseTranslations)) {
    const regex = new RegExp(english, 'gi');
    translated = translated.replace(regex, lithuanian);
  }
  return translated;
}

function formatToHTML(text) {
  return text
    .replace(/^###\s*(.*?)$/gm, '<h2>$1</h2>')
    .replace(/^##\s*(.*?)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\s*\d+\..*$/gm, match => `<li>${match.trim()}</li>')
    .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
    .replace(/(?:<li>.*?<\/li>\n?)+/g, match => `<ul>${match}</ul>`) 
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

app.post('/generate-program', async (req, res) => {
  const { name, age, gender, fitnessLevel, trainingFrequency, trainingLocation, goals, specificGoals } = req.body;

  const prompt = `Veiki kaip patyręs sporto treneris. Sukurk ${trainingFrequency} dienų treniruočių programą remiantis šia informacija:

- Vardas: ${name || 'Nežinomas'}
- Amžius: ${age}
- Lytis: ${gender}
- Fitneso lygis: ${fitnessLevel}
- Treniruočių dažnis: ${trainingFrequency} dienos per savaitę
- Treniruotės vieta: ${trainingLocation}
- Tikslai: ${goals}
- Specifiniai tikslai ar problemos: ${specificGoals}

Programoje:
- Nurodyk, kokias kūno dalis treniruoti kiekvieną dieną.
- Pateik konkrečius pratimus.
- Kiekvienam pratimui parašyk kiek serijų ir pakartojimų arba laiką.
- Kiekvienam pratimui pridėk žingsnis po žingsnio instrukciją (kaip teisingai atlikti), suprantamą pradedančiajam.
- Naudok taisyklingą lietuvių kalbą – nevartok netaisyklingų skolinių kaip 'dumbbel', 'bencho' ir pan.
- Venk tiesioginio vertimo iš anglų kalbos – programa turi būti parašyta lietuviškai natūraliai.
- Turinys turi būti aiškus, struktūrizuotas ir lengvai skaitomas.
- Pridėk bendrų rekomendacijų kiekvienai dienai ir, jei tinka, individualių patarimų pagal naudotojo informaciją.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    let formattedHTML = formatToHTML(completion.choices[0].message.content);
    formattedHTML = translateExercises(formattedHTML);  // Apply exercise name translation
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
