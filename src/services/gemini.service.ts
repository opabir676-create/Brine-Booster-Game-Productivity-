import { Injectable, inject, signal, effect } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse, Type, Chat } from '@google/genai';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private settingsService = inject(SettingsService);
  private genAI = signal<GoogleGenAI | null>(null);

  constructor() {
    effect(() => {
      const key = this.settingsService.apiKey();
      if (key) {
        // Sanitize the key to remove any non-ASCII characters that might have
        // been accidentally copied. Google API keys are ASCII. This prevents
        // the "String contains non ISO-8859-1 code point" error in fetch headers.
        const sanitizedKey = key.replace(/[^\x00-\x7F]/g, "").trim();

        try {
          // An empty key will be caught by the constructor or the validation call.
          const aiInstance = new GoogleGenAI({ apiKey: sanitizedKey });
          this.genAI.set(aiInstance);
          this.validateApiKey();
        } catch (error) {
          console.error("Failed to initialize GoogleGenAI:", error);
          this.genAI.set(null);
          this.settingsService.apiKeyValidationState.set('invalid');
        }
      } else {
        this.genAI.set(null);
        this.settingsService.apiKeyValidationState.set('idle');
      }
    });
  }

  getAi(): GoogleGenAI | null {
    return this.genAI();
  }

  async validateApiKey(): Promise<void> {
    const ai = this.genAI();
    if (!ai) {
      this.settingsService.apiKeyValidationState.set('invalid');
      return;
    }

    this.settingsService.apiKeyValidationState.set('validating');
    try {
      // A simple, low-cost call to check if the key is valid.
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'hello',
        config: {
            maxOutputTokens: 1,
            thinkingConfig: { thinkingBudget: 0 }
        }
      });
      if (response.text) {
        this.settingsService.apiKeyValidationState.set('valid');
      } else {
        throw new Error('Empty response');
      }
    } catch (error) {
      console.error('API Key validation failed:', error);
      this.settingsService.apiKeyValidationState.set('invalid');
    }
  }

  createChat(systemInstruction: string): Chat | null {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      console.error('Cannot create chat. API key is not valid.');
      return null;
    }

    const chat: Chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });
    return chat;
  }

  async generateQuizSet(topic: string, count: number): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.resolve('API key is not valid. Please set a valid key in settings.');
    }
    const language = this.settingsService.language();

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a set of ${count} multiple-choice quiz questions about ${topic}. The answer for each question must be one of the options. All text (questions, options, answers) must be in ${language}.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING }
                  },
                  required: ['question', 'options', 'answer']
                }
              }
            }
          }
        }
      });
      return response.text;
    } catch (error) {
      console.error('Error generating quiz set:', error);
      return 'Could not generate quiz. Check console for details.';
    }
  }
  
  async generateIdeas(topic: string, count: number): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid. Please set a valid key in settings.');
    }
    const language = this.settingsService.language();

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a list of ${count} creative and distinct ideas related to the topic: "${topic}". The ideas must be in ${language}.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ideas: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `A list of ${count} creative ideas.`
              }
            },
            required: ['ideas']
          }
        }
      });
      return response.text;
    } catch (error) {
      console.error('Error generating ideas:', error);
      throw new Error('Could not generate ideas. Check console for details.');
    }
  }

  async generateRiddleSet(topic: string, count: number, difficulty: string): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid. Please set a valid key in settings.');
    }
    const language = this.settingsService.language();
    const topicPrompt = topic ? `about the topic "${topic}"` : "on a random, general knowledge topic";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a set of ${count} concise riddles suitable for a game, ${topicPrompt}. The difficulty should be ${difficulty}. The riddles should not be too obscure or culturally specific. All text (riddles and answers) must be in ${language}.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    riddles: {
                        type: Type.ARRAY,
                        items: {
                           type: Type.OBJECT,
                           properties: {
                              riddle: { type: Type.STRING, description: "The text of the riddle." },
                              answer: { type: Type.STRING, description: "A common, simple answer to the riddle." }
                           },
                           required: ['riddle', 'answer']
                        }
                    }
                  }
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error generating riddle set:', error);
        throw new Error('Could not generate riddles. Check console for details.');
    }
  }

  async checkRiddleAnswer(riddle: string, answer: string): Promise<boolean> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
        return Promise.resolve(false);
    }
    const language = this.settingsService.language();

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Riddle: "${riddle}". Player's answer: "${answer}". The language of the riddle is ${language}. Is the player's answer a correct or very close answer to the riddle? Consider synonyms and alternate phrasings in ${language}. Please respond with only the word "YES" or "NO".`,
            config: {
                maxOutputTokens: 5,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });
        return response.text.trim().toUpperCase().includes('YES');
    } catch (error) {
        console.error('Error checking answer:', error);
        return false;
    }
  }

  async generateLogicPuzzleSet(count: number, difficulty: string): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid. Please set a valid key in settings.');
    }
    const language = this.settingsService.language();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a set of ${count} logic puzzles for a brain-training game with a difficulty of '${difficulty}'. The puzzles must be self-contained and suitable for all audiences. The puzzles should be varied, including types like number/letter sequence completion, pattern recognition, spatial reasoning, or simple deductive reasoning puzzles. It is MANDATORY that the 'puzzle_description' field contains the full puzzle context, including any sequences (e.g., "2, 4, 6, 8, ..."). The 'question' field must contain the specific question to be asked (e.g., "What is the next number?"). Both 'puzzle_description' and 'question' must not be empty. All text must be in ${language}.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    puzzles: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                            puzzle_description: { type: Type.STRING, description: "A short, engaging description of the puzzle scenario or pattern. CRITICAL: This must include the actual puzzle data, for example, the number sequence '2, 4, 6, 8'."},
                            question: { type: Type.STRING, description: "The question to be asked to the user, like 'What comes next?' or 'Which number fits?'. This field is mandatory and must not be empty." },
                            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 4 possible string answers." },
                            correct_answer: { type: Type.STRING, description: "The single correct answer, which must be one of the provided options." },
                            explanation: { type: Type.STRING, description: "A brief and clear explanation of the logic behind the correct answer."}
                        },
                        required: ['puzzle_description', 'question', 'options', 'correct_answer', 'explanation']
                      }
                    }
                  }
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error generating logic puzzle set:', error);
        throw new Error('Could not generate puzzles. Check console for details.');
    }
  }

  async generateHint(context: string): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid.');
    }
    const language = this.settingsService.language();

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the following riddle or puzzle: "${context}". Provide a single, short hint to help the user solve it. Do not reveal the answer directly. The hint must be in ${language}.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hint: { type: Type.STRING, description: "A helpful clue." }
                    },
                    required: ['hint']
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error generating hint:', error);
        throw new Error('Could not generate a hint.');
    }
  }

  async generateQuizHint(question: string, options: string[], answer: string): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid.');
    }
    const language = this.settingsService.language();
    const incorrectOptions = options.filter(o => o !== answer);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `For the quiz question "${question}", identify one of these options as incorrect: ${incorrectOptions.join(', ')}. The hint must be in ${language}.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hint: { type: Type.STRING, description: "A hint stating one incorrect option, e.g., 'The answer is not [incorrect option].'" }
                    },
                    required: ['hint']
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error generating quiz hint:', error);
        throw new Error('Could not generate a hint.');
    }
  }

  async generateRandomTopic(): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid.');
    }
    const language = this.settingsService.language();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a single, interesting, general-knowledge topic suitable for a quiz or riddle game. The topic should be something with enough substance for multiple questions (e.g., "Ancient Rome", "The Solar System", "Famous Inventors"). The response must be in ${language}.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING, description: "A single topic name." }
                    },
                    required: ['topic']
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error generating random topic:', error);
        throw new Error('Could not generate a random topic.');
    }
  }

  async generateGoalPlan(goal: string): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid. Please set a valid key in settings.');
    }
    const language = this.settingsService.language();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Break down the following high-level goal into a series of smaller, actionable steps: "${goal}". Provide a title for each step, a brief description, and a suggested time frame (e.g., '1-2 hours', 'A weekend', 'First week'). All text must be in ${language}.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        plan: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    step: { type: Type.NUMBER, description: "The step number." },
                                    title: { type: Type.STRING, description: "A concise title for the step." },
                                    description: { type: Type.STRING, description: "A one or two-sentence description of the task." },
                                    timeframe: { type: Type.STRING, description: "An estimated time to complete the step." }
                                },
                                required: ['step', 'title', 'description', 'timeframe']
                            }
                        }
                    }
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error generating goal plan:', error);
        throw new Error('Could not generate the plan. Check console for details.');
    }
  }

  async summarizeMeeting(transcript: string): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid. Please set a valid key in settings.');
    }
    const language = this.settingsService.language();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following meeting transcript or notes and provide a concise summary, a list of key decisions made, and a list of action items with their assigned owners (if mentioned, otherwise use 'Unassigned'). Transcript: "${transcript}". All text must be in ${language}.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "A brief summary of the meeting's main points." },
                        keyDecisions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of important decisions that were finalized." },
                        actionItems: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    owner: { type: Type.STRING, description: "The person or team responsible for the action item." },
                                    task: { type: Type.STRING, description: "The specific task to be completed." }
                                },
                                required: ['owner', 'task']
                            }
                        }
                    }
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error summarizing meeting:', error);
        throw new Error('Could not summarize the meeting. Check console for details.');
    }
  }

  async generateGameInstructions(gameName: string, gameDescription: string): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid. Please set a valid key in settings.');
    }
    const language = this.settingsService.language();

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert game guide who explains rules in a very simple, clear, and friendly way, as if explaining to a 10-year-old. For the game named '${gameName}' which is about '${gameDescription}', generate a "How to Play" guide. The entire response must be in the ${language} language. Follow these rules very strictly:
1. Use simple, everyday language. Avoid complex terms.
2. For each step in the instructions, you MUST provide a concrete, easy-to-understand example in the 'example' field. This is not optional.
3. Provide a few helpful 'Pro Tips' at the end.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: `A catchy title for the instructions, like 'How to Play ${gameName}'.`,
              },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    instruction: {
                      type: Type.STRING,
                      description: 'A single, simply worded step of the instructions.',
                    },
                    example: {
                      type: Type.STRING,
                      description: `A mandatory, simple, and clear example demonstrating the instruction. For example, if the instruction is "Click the odd one out," the example could be "If you see three squares and one circle, click the circle."`,
                    },
                  },
                  required: ['instruction', 'example'],
                },
              },
              tips: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                  description: 'A helpful "Pro Tip" for the player.',
                },
              },
            },
            required: ['title', 'steps', 'tips'],
          },
        },
      });
      return response.text;
    } catch (error) {
      console.error('Error generating game instructions:', error);
      throw new Error('Could not generate instructions. Check console for details.');
    }
  }

  async generateScrambledWordSet(count: number, difficulty: string): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid. Please set a valid key in settings.');
    }
    const language = this.settingsService.language();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a set of ${count} ${language} words for a word scramble game with a difficulty of '${difficulty}'. For each word, provide the original word, a completely scrambled version of it (an anagram), and a short, simple hint. The difficulty should influence word length and complexity: Easy (4-5 letters, common), Medium (6-7 letters), Hard (8+ letters, less common).`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    words: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          word: { type: Type.STRING, description: "The original, unscrambled word." },
                          scrambled: { type: Type.STRING, description: "An anagram of the original word." },
                          hint: { type: Type.STRING, description: "A short hint for the word." }
                        },
                        required: ['word', 'scrambled', 'hint']
                      }
                    }
                  }
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error generating scrambled word set:', error);
        throw new Error('Could not generate words. Check console for details.');
    }
  }

  async generateImageForPromptGame(prompt: string): Promise<{ imageUrl: string }> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid. Please set a valid key in settings.');
    }
    try {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        return { imageUrl };
      } else {
        throw new Error('AI did not return an image.');
      }
    } catch (error) {
      console.error('Error generating image for game:', error);
      throw new Error('Could not generate the image. Check console for details.');
    }
  }

  async generateImagePrompt(): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid. Please set a valid key in settings.');
    }
    const language = this.settingsService.language();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a single, creative, and detailed image prompt for an AI image generator. The prompt should describe a visually interesting scene. Be specific about the subject, setting, style, and mood. The prompt must be in ${language}.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompt: { type: Type.STRING, description: 'A detailed prompt for an image generator.' }
            },
            required: ['prompt']
          }
        }
      });
      const data = JSON.parse(response.text);
      return data.prompt || 'A cat wearing a tiny hat.';
    } catch (error) {
      console.error('Error generating image prompt:', error);
      throw new Error('Could not generate image prompt.');
    }
  }

  async evaluatePromptSimilarity(originalPrompt: string, userPrompt: string): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid. Please set a valid key in settings.');
    }
    const language = this.settingsService.language();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Original prompt: "${originalPrompt}". User's attempt: "${userPrompt}". Compare the user's attempt to the original prompt for an AI image generator. How well does it capture the key elements (subject, action, style, details)? Provide a similarity score from 0 to 100 and brief, constructive feedback on what was good and what could be improved. The feedback must be in ${language}.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              similarityScore: { type: Type.NUMBER, description: 'A similarity score between 0 and 100.' },
              feedback: { type: Type.STRING, description: 'Constructive feedback for the user.' }
            },
            required: ['similarityScore', 'feedback']
          }
        }
      });
      return response.text;
    } catch (error) {
      console.error('Error evaluating prompt similarity:', error);
      throw new Error('Could not evaluate prompt similarity.');
    }
  }

  async generateTwoTruthsAndALie(topic: string, count: number): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid. Please set a valid key in settings.');
    }
    const language = this.settingsService.language();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate ${count} sets of "Two Truths and One Lie" about the topic: "${topic}". Each set must contain exactly two true statements and one false statement. The statements should be interesting and not easily guessable. It is critical that for each set, exactly one statement has 'is_lie' set to true, and the other two have it set to false. All text must be in ${language}.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    statements: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          statement: { type: Type.STRING, description: "A statement that is either true or false." },
                          is_lie: { type: Type.BOOLEAN, description: "True if the statement is a lie, false if it is true." }
                        },
                        required: ['statement', 'is_lie']
                      }
                    }
                  },
                  required: ['statements']
                }
              }
            },
            required: ['sets']
          }
        }
      });
      return response.text;
    } catch (error) {
      console.error('Error generating two truths and a lie:', error);
      throw new Error('Could not generate the statements. Check console for details.');
    }
  }

  async translateTexts(texts: {key: string, text: string}[], language: string): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid. Please set a valid key in settings.');
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate the 'text' value in the following JSON array of objects into ${language}. Maintain the original 'key' for each object. The original text is in English. Respond only with the translated JSON object. Input: ${JSON.stringify(texts)}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        translations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    key: { type: Type.STRING },
                                    translated_text: { type: Type.STRING }
                                },
                                required: ['key', 'translated_text']
                            }
                        }
                    },
                    required: ['translations']
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error translating texts:', error);
        throw new Error('Could not translate texts.');
    }
  }

  async generateSpotTheDifferenceGame(difficulty: string): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid.');
    }
    const language = this.settingsService.language();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          1. Create a detailed, high-quality image prompt for a whimsical and busy scene. This is prompt1.
          2. Based on prompt1, create prompt2 by making exactly 5 subtle but findable changes. For example, change an object's color, add a small item, or remove something.
          3. List the 5 changes you made as an array of strings. The descriptions must be in ${language}.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prompt1: { type: Type.STRING, description: "The original image prompt." },
              prompt2: { type: Type.STRING, description: "The modified image prompt with 5 changes." },
              differences: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of exactly 5 strings describing the changes." }
            },
            required: ['prompt1', 'prompt2', 'differences']
          }
        }
      });
      return response.text;
    } catch(e) {
      console.error('Error generating spot the difference game:', e);
      throw new Error('Could not generate the game data.');
    }
  }

  async generateMoralDilemma(count: number): Promise<string> {
    const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid.');
    }
    const language = this.settingsService.language();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a set of ${count} family-friendly moral dilemmas. Each dilemma must have exactly 3 distinct, reasonable choices. The dilemmas should be thought-provoking but not overly complex. All text must be in ${language}.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              dilemmas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dilemma: { type: Type.STRING, description: "The text of the moral dilemma." },
                    options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of exactly 3 choices." }
                  },
                  required: ['dilemma', 'options']
                }
              }
            },
            required: ['dilemmas']
          }
        }
      });
      return response.text;
    } catch(e) {
      console.error('Error generating moral dilemmas:', e);
      throw new Error('Could not generate dilemmas.');
    }
  }

  async evaluateMoralChoice(dilemma: string, choice: string): Promise<string> {
     const ai = this.genAI();
    if (this.settingsService.apiKeyValidationState() !== 'valid' || !ai) {
      return Promise.reject('API key is not valid.');
    }
    const language = this.settingsService.language();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `A user was presented with this dilemma: "${dilemma}". They chose the option: "${choice}". Provide a brief, thoughtful, and neutral analysis of this choice. You can mention a relevant philosophical concept (like utilitarianism, deontology, etc.) if it fits, but keep it simple. The entire analysis must be in ${language}.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING, description: "A thoughtful analysis of the user's choice." }
            },
            required: ['analysis']
          }
        }
      });
      return response.text;
    } catch(e) {
      console.error('Error evaluating moral choice:', e);
      throw new Error('Could not evaluate choice.');
    }
  }
}