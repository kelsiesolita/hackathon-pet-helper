const API_KEY = 'YOUR_KEY_HERE';
const DOG_API_KEY = 'YOUR_KEY_HERE';

const BASE_URL =
  'https://app-litellmsn66ka.azurewebsites.net/v1/chat/completions';

type ToolCall = {
  id: string;
  function: {
    name: string;
    arguments?: string;
  };
};

type MessageType = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
};

/**
 * Dog API Tool
 */
const getDogBreeds = async (search?: string) => {
  const response = await fetch('https://api.thedogapi.com/v1/breeds', {
    headers: {
      'x-api-key': DOG_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Dog API failed: ${response.status}`);
  }

  const breeds = await response.json();

  // Optional filtering
  if (search) {
    return breeds.filter((breed: any) =>
      breed.name.toLowerCase().includes(search.toLowerCase()),
    );
  }

  return breeds;
};

/**
 * Tools exposed to the LLM
 */
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_dog_breeds',
      description:
        'Get dog breed information from TheDogAPI. Optionally search for a breed by name.',
      parameters: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Optional breed name search term',
          },
        },
        required: [],
      },
    },
  },
];

/**
 * Generic LLM request helper
 */
const callLLM = async (messages: MessageType[]) => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
      messages,
      tools,
      tool_choice: 'auto',
    }),
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(`LLM request failed: ${response.status}\n${text}`);
  }

  return response.json();
};

/**
 * Main agent loop
 */
const runAgent = async (userInput: string) => {
  console.log(`User:\n${userInput}\n`);

  const messages: MessageType[] = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant. Use tools when useful.',
    },
    {
      role: 'user',
      content: userInput,
    },
  ];

  // Initial model call
  const initialResponse = await callLLM(messages);

  const assistantMessage = initialResponse.choices[0].message;

  messages.push(assistantMessage);

  // Handle tool calls
  if (assistantMessage.tool_calls) {
    for (const toolCall of assistantMessage.tool_calls) {
      const functionName = toolCall.function.name;

      const args = toolCall.function.arguments
        ? JSON.parse(toolCall.function.arguments)
        : {};

      let toolResult;

      switch (functionName) {
        case 'get_dog_breeds':
          toolResult = await getDogBreeds(args.search);
          break;

        default:
          throw new Error(`Unknown tool: ${functionName}`);
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }

    // Final model call with tool results
    const finalResponse = await callLLM(messages);

    return finalResponse.choices[0].message.content;
  }

  return assistantMessage.content;
};

/**
 * Entry point
 */
const main = async () => {
  try {
    const response = await runAgent(
      'Tell me about huskies and recommend a family-friendly dog breed.',
    );

    console.log('');
    console.log(`Assistant:\n${response}\n`);
  } catch (error) {
    console.error(error);
  }
};

main();
