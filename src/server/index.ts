import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Image analysis endpoint
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { base64Input } = req.body;

    if (!base64Input) {
      return res.status(400).json({ error: 'No base64 data provided' });
    }

    const base64Data = base64Input.replace(/^data:image\/\w+;base64,/, '');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: 'Analyze this leetcode problem. Respond with your thoughts about the problem and then provide a detailed solution. Format your response with "Thoughts:" followed by your analysis, then "Solution:" followed by the detailed solution.' 
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
      response_format: { 
        type: "json_object",
        schema: {
          type: "object",
          properties: {
            thoughts: {
              type: "string",
              description: "Analysis and thoughts about the problem"
            },
            solution: {
              type: "string",
              description: "Detailed solution to the problem"
            }
          },
          required: ["thoughts", "solution"],
          additionalProperties: false
        }
      }
    });

    const response = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(response || '{}');

    return res.json({
      analysis: `${parsedResponse.thoughts}\n\n${parsedResponse.solution}`
    });
  } catch (error: unknown) {
    console.error('Error analyzing image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
