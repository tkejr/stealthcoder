import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

dotenv.config();

const openai = new OpenAI();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const LeetCodeAnalysis = z.object({
  thoughts: z
    .array(z.string())
    .describe(
      'Array of thoughts about solving this problem, each thought should be in first person like "I start by sorting the array" or "I use a hashmap to store the frequency of each number" Don\'t include basic thoughst they should be about the problem and the solution and very crisp about time complexity space complexity , think aboyut I will use this to answer to google engineers',
    ),
  solution: z
    .string()
    .describe(
      'Detailed solution to the problem in the language you see in the image, do not include any other text just the code. Make sure to add comments to the code to explain the logic. Make sure to follow the same language as the image and code function header and clas sheader if present shoudl be exactly same dont deviate form that',
    ),
  language: z
    .string()
    .describe(
      'The language of the code in the image it should be like "python", "cpp", "java", "javascript", etc.',
    ),
});

// Image analysis endpoint
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { base64Input } = req.body;

    if (!base64Input) {
      return res.status(400).json({ error: 'No base64 data provided' });
    }

    const base64Data = base64Input.replace(/^data:image\/\w+;base64,/, '');

    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this leetcode problem. Respond with your thoughts about the problem and then provide a detailed solution in exact code. YOu cannot be wrong think about all edge cases and think about all possible solutions and provide me the best solution',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      response_format: zodResponseFormat(LeetCodeAnalysis, 'leetcode_analysis'),
    });

    if (!completion) {
      throw new Error('Failed to get completion');
    }

    const { parsed } = completion.choices[0].message;
    if (!parsed) {
      throw new Error('Failed to parse response');
    }

    return res.json(parsed);
  } catch (error: unknown) {
    console.error('Error analyzing image:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', errorMessage);
    return res.status(500).json({
      error: 'Error analyzing image',
      details: errorMessage,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
