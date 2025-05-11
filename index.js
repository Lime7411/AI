require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Exercise data (names, videos, descriptions)
const exerciseData = {
  'Deadlift': { name: 'Mirties trauka', videos: ['https://i.imgur.com/8SfwCbp.gif'], description: 'Stand with feet shoulder-width apart...' },
  'Bench press': { name: 'Štangos spaudimas', videos: ['https://i.imgur.com/ASdkTBP.jpeg'], description: 'Lie flat on a bench...' },
  'Squat': { name: 'Pritūpimai', videos: ['https://i.imgur.com/ASdkTBP.jpeg'], description: 'Stand with feet shoulder-width apart...' },
  'Pull-up': { name: 'Prisitraukimai', videos: ['https://i.imgur.com/ASdkTBP.jpeg'], description: 'Grab the bar with palms facing away...' },
  'Push-up': { name: 'Atsispaudimai', videos: ['https://i.imgur.com/ASdkTBP.jpeg'], description: 'Start in a plank position...' },
  'Bicep curl': { name: 'Bicepso lenkimas', videos: ['https://i.imgur.com/ASdkTBP.jpeg'], description: 'Stand tall with dumbbells in your hands...' },
  'Running': { name: 'Bėgimas', videos: ['https://i.imgur.com/ASdkTBP.jpeg'], description: 'Jog or run at a steady pace...' },
  'Jump Rope': { name: 'Šokdynė', videos: ['https://i.imgur.com/ASdkTBP.jpeg'], description: 'Jump continuously while spinning the rope...' },
  'Cycling': { name: 'Dviračio mynimas', videos: ['https://i.imgur.com/ASdkTBP.jpeg'], description: 'Ride a bike or use a stationary cycle...' }
};

const gymExercises = [
  'Deadlift', 'Bench press', 'Lat pulldown', 'Leg press', 'Tricep extension', 'Chest fly',
  'Leg curl', 'Leg extension', 'Shoulder press', 'Hamstring curl', 'Face pull',
  'Chest press', 'Front squat', 'Dips'
];

const homeExercises = [
  'Squat', 'Pull-up', 'Push-up', 'Bicep curl', 'Lunges', 'Plank', 'Sit-up',
  'Crunch', 'Russian twist', 'Calf raise', 'Leg raises', 'Tricep dip', 'Row'
];

const cardioExercises = ['Running', 'Jump Rope', 'Cycling'];

// Combine all exercises for easy translation and filtering
const allExercises = [...new Set([...gymExercises, ...homeExercises, ...cardioExercises])];

// Translate exercise names
function translateExercises(text) {
  let translated = text;
  for (const [english, data] of Object.entries(exerciseData)) {
    const regex = new RegExp(english, 'gi');
    translated = translated.replace(regex, data.name);
  }
  return translated;
}

// Generate the exercise modal data
app.get('/exercises', (req, res) => {
  const exercises = {};
  allExercises.forEach(exercise => {
    exercises[exercise] = exerciseData[exercise] || { name: exercise, videos: [], description: 'Aprašymas nėra prieinamas.' };
  });
  res.json(exercises);
});

// Generate the workout program
app.post('/generate-program', async (req, res) => {
  const { name, age, gender, fitnessLevel, trainingFrequency, trainingLocation, goals, specificGoals } = req.body;

  // Determine base exercise list
  let exerciseList = trainingLocation.toLowerCase() === 'namuose' ? homeExercises : gymExercises;

  // Add cardio for weight loss
  if (goals.toLowerCase().includes('prarasti svorį')) {
    exerciseList = exerciseList.concat(cardioExercises);
  }

  // Translate the final exercise list
  const translatedExercises = exerciseList.map(ex => exerciseData[ex]?.name || ex).join(', ');

  const prompt = `
  Veiki kaip patyręs sporto treneris. Sukurk ${trainingFrequency} dienų treniruočių programą remiantis šia informacija (naudok tik šiuos pratimus: ${translatedExercises}):

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
  - Pateik konkrečius pratimus su serijomis ir pakartojimais arba laiku.
  - Jei tikslas yra prarasti svorį, įtrauk širdies ir kraujagyslių pratimus, kaip bėgimas, šokdynė arba dviračio mynimas, bent 2-3 kartus per savaitę.
  - Nenaudok pratimų aprašymų ar instrukcijų, nes jos jau yra pratimų bibliotekoje.
  - Naudok taisyklingą lietuvių kalbą – nevartok netaisyklingų skolinių kaip 'dumbbel', 'bencho' ir pan.
  - Venk tiesioginio vertimo iš anglų kalbos – programa turi būti parašyta lietuviškai natūraliai.
  - Turinys turi būti aiškus, struktūrizuotas ir lengvai skaitomas.
  - Pridėk bendrų rekomendacijų kiekvienai dienai ir, jei tinka, individualių patarimų pagal naudotojo informaciją.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    let formattedHTML = completion.choices[0].message.content;
    formattedHTML = translateExercises(formattedHTML);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ result: formattedHTML });
  } catch (err) {
    console.error('❌ OpenAI API error:', err);
    res.status(500).json({ error: 'Nepavyko sugeneruoti programos.' });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('✅ Serveris paleistas: http://localhost:3000');
});
