require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ✅ Properly initialize OpenAI (latest SDK structure)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Handle the AI-based program generation with language support
app.post('/generate-program', async (req, res) => {
  const { goal, level, age, gender, lang } = req.body;

  const isLt = lang === 'lt';

  // Translate gender, goal, level, and age to English if needed
  const translations = {
    gender: { Vyras: 'man', Moteris: 'woman' },
    goal: {
      'Numesti svorio': 'Lose weight',
      'Užsiauginti raumenų': 'Build muscle',
      'Tapti stipresniu': 'Get stronger',
      'Pagerinti ištvermę': 'Improve endurance'
    },
    level: {
      Pradedantysis: 'Beginner',
      Vidutinis: 'Intermediate',
      'Pažengės': 'Advanced'
    },
    age: {
      '<18': '<18',
      '18–35': '18-35',
      '35–50': '35-50',
      '50+': '50+'
    }
  };

  const genderTranslated = isLt ? gender : translations.gender[gender];
  const goalTranslated = isLt ? goal : translations.goal[goal];
  const levelTranslated = isLt ? level : translations.level[level];
  const ageTranslated = isLt ? age : translations.age[age];

  const prompt = isLt
    ? `Sukurk 4 dienų treniruočių programą ${gender === 'Vyras' ? 'vyrui' : 'moteriai'}, kurio amžius yra ${age}, tikslas yra "${goal}" ir lygis yra "${level}". Įtrauk pratimus kiekvienai dienai, nurodyk kuri kūno dalis treniruojama, ir pateik rekomendacijas.`
    : `Create a 4-day workout plan for a ${genderTranslated}, age group ${ageTranslated}, goal is "${goalTranslated}" and fitness level is "${levelTranslated}". Include exercises per day, targeted muscle group, and recommendations.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ result: completion.choices[0].message.content });
  } catch (err) {
    console.error('❌ OpenAI API error:', err.response?.data || err.message || err);
    res.status(500).json({ error: isLt ? 'Nepavyko sugeneruoti programos.' : 'Failed to generate program.' });
  }
});

// ✅ Launch the server
app.listen(3000, () => {
  console.log('✅ Serveris paleistas: http://localhost:3000');
});

